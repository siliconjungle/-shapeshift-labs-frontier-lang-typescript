export function renderActionBodyStatements(declaration, { safeIdentifier }) {
  const body = declaration.body ?? [];
  if (!body.length) return ['void state;', 'void input;', 'void env;', `return [] as ${declaration.returnType};`];
  const statements = ['void state;', 'const patches: FrontierPatchOperation[] = [];'];
  statements.push(...renderActionBodyRecords(body, { safeIdentifier, returnType: declaration.returnType, locals: new Map() }));
  if (!containsTopLevelReturn(body)) statements.push(`return patches as ${declaration.returnType};`);
  return statements;
}

function renderActionBodyRecords(body, { safeIdentifier, returnType, locals }) {
  const statements = [];
  for (const record of body) {
    if (record.kind === 'let') {
      const local = safeIdentifier(record.name ?? record.id ?? 'binding');
      statements.push(`const ${local} = ${actionValueExpression(record.value, { safeIdentifier, locals })};`);
      locals.set(record.name, local);
      continue;
    }
    if (record.kind === 'patch' && (record.op === 'set' || record.op === 'insert' || record.op === 'merge')) {
      statements.push(`patches.push({ op: ${JSON.stringify(record.op)}, path: ${JSON.stringify(record.path ?? '')}, value: ${actionValueExpression(record.value, { safeIdentifier, locals })} });`);
      continue;
    }
    if (record.kind === 'patch' && record.op === 'remove') {
      statements.push(`patches.push({ op: 'remove', path: ${JSON.stringify(record.path ?? '')} });`);
      continue;
    }
    if (record.kind === 'callEffect') {
      const local = safeIdentifier(`invoke_${record.id ?? record.name ?? 'effect'}`);
      statements.push(`const ${local} = env[${JSON.stringify(record.capability ?? record.name ?? '')}] as ((input: unknown) => unknown) | undefined;`);
      statements.push(`void ${local}?.(${actionValueExpression(record.input, { safeIdentifier, locals })});`);
      continue;
    }
    if (record.kind === 'if') {
      statements.push(`if (${actionConditionExpression(record.condition, { safeIdentifier, locals })}) {`);
      for (const statement of renderActionBodyRecords(record.body ?? [], { safeIdentifier, returnType, locals: new Map(locals) })) statements.push(`  ${statement}`);
      statements.push('}');
      continue;
    }
    if (record.kind === 'return') {
      statements.push(`return ${actionValueExpression(record.value, { safeIdentifier, locals })} as ${returnType};`);
    }
  }
  return statements;
}

function actionValueExpression(value, context = {}) {
  const ast = actionExpressionAst(value);
  if (ast) return structuredActionExpression(ast, { ...context, expressionContext: 'value' });
  if (value && Object.prototype.hasOwnProperty.call(value, 'value')) return JSON.stringify(value.value);
  const expression = String(value?.expression ?? '').trim();
  const local = localExpression(expression, context);
  if (local) return local;
  if (/^(input|state|patches|env)(?:\.[A-Za-z_$][\w$]*)*$/.test(expression)) return expression;
  if (/^(true|false|null|-?\d+(?:\.\d+)?)$/.test(expression)) return expression;
  return JSON.stringify(expression);
}

function actionConditionExpression(value, context = {}) {
  const ast = actionExpressionAst(value);
  if (ast) return structuredActionExpression(ast, { ...context, expressionContext: 'condition' });
  if (value && Object.prototype.hasOwnProperty.call(value, 'value')) {
    if (typeof value.value === 'boolean') return JSON.stringify(value.value);
    return `Boolean(${JSON.stringify(value.value)})`;
  }
  const expression = String(value?.expression ?? '').trim();
  const local = localExpression(expression, context);
  if (local) return local;
  if (/^(input|state|patches|env)(?:\.[A-Za-z_$][\w$]*)*$/.test(expression)) return expression;
  if (/^(true|false|-?\d+(?:\.\d+)?)$/.test(expression)) return expression;
  return `((): never => { throw new Error(${JSON.stringify(`Unsupported Frontier action condition expression: ${expression}`)}); })()`;
}

function actionExpressionAst(value) {
  if (value?.expressionAst && typeof value.expressionAst === 'object') return value.expressionAst;
  if (value?.kind && typeof value.kind === 'string') return value;
  return undefined;
}

function structuredActionExpression(node, context = {}) {
  if (!node || typeof node !== 'object') throw new Error('Unsupported Frontier action expression');
  if (node.kind === 'literal') return structuredLiteralExpression(node.value, context);
  if (node.kind === 'ref') return structuredRefExpression(node, context);
  if (node.kind === 'unary' && node.op === '!') return `!${parenthesizeExpression(structuredActionExpression(node.argument, { ...context, expressionContext: 'condition' }), node.argument)}`;
  if (node.kind === 'logical' && (node.op === '&&' || node.op === '||')) {
    return `${parenthesizeExpression(structuredActionExpression(node.left, { ...context, expressionContext: 'condition' }), node.left)} ${node.op} ${parenthesizeExpression(structuredActionExpression(node.right, { ...context, expressionContext: 'condition' }), node.right)}`;
  }
  if (node.kind === 'binary') {
    const op = targetComparisonOperator(node.op);
    if (isOrderedComparison(node.op) && !isNumericComparison(node)) throw new Error(`Unsupported Frontier action expression operator: ${node.op}`);
    return `(${structuredActionExpression(node.left, { ...context, expressionContext: 'value' })} ${op} ${structuredActionExpression(node.right, { ...context, expressionContext: 'value' })})`;
  }
  throw new Error(`Unsupported Frontier action expression: ${node.kind ?? 'unknown'}`);
}

function structuredLiteralExpression(value, { expressionContext } = {}) {
  if (expressionContext === 'condition' && typeof value !== 'boolean') throw new Error(`Unsupported Frontier action condition literal: ${String(value)}`);
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Unsupported Frontier action expression literal');
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return JSON.stringify(value);
  throw new Error('Unsupported Frontier action expression literal');
}

function structuredRefExpression(node, { locals } = {}) {
  const name = String(node.name ?? '').trim();
  const hasExplicitPath = Array.isArray(node.path);
  const rawParts = hasExplicitPath ? node.path.map(String) : name.split('.').filter(Boolean);
  const scope = node.scope ?? (rawParts[0] === 'input' || rawParts[0] === 'state' || rawParts[0] === 'patches' ? rawParts[0] : 'local');
  const parts = hasExplicitPath || node.scope || scope === 'local' ? rawParts : rawParts.slice(1);
  if (scope === 'local') {
    const [root, ...rest] = parts;
    if (!root || !locals?.has(root)) throw new Error(`Unsupported Frontier action expression ref: ${name || root || 'local'}`);
    return `${locals.get(root)}${propertyPath(rest)}`;
  }
  if (scope === 'input' || scope === 'state' || scope === 'patches') return `${scope}${propertyPath(parts)}`;
  throw new Error(`Unsupported Frontier action expression ref: ${name || scope}`);
}

function targetComparisonOperator(op) {
  if (op === '==') return '===';
  if (op === '!=') return '!==';
  if (op === '>' || op === '>=' || op === '<' || op === '<=') return op;
  throw new Error(`Unsupported Frontier action expression operator: ${op}`);
}

function isOrderedComparison(op) {
  return op === '>' || op === '>=' || op === '<' || op === '<=';
}

function isNumericComparison(node) {
  return node.left?.kind === 'literal' && typeof node.left.value === 'number' && node.right?.kind === 'literal' && typeof node.right.value === 'number';
}

function parenthesizeExpression(expression, node) {
  return node?.kind === 'binary' || node?.kind === 'logical' ? `(${expression})` : expression;
}

function propertyPath(parts) {
  return parts.map((part) => {
    if (!/^[A-Za-z_$][\w$]*$/.test(part)) throw new Error(`Unsupported Frontier action expression ref: ${part}`);
    return `.${part}`;
  }).join('');
}

function localExpression(expression, { locals } = {}) {
  const match = /^([A-Za-z_$][\w$-]*)(\.[A-Za-z_$][\w$]*)*$/.exec(expression);
  if (!match || !locals?.has(match[1])) return undefined;
  return `${locals.get(match[1])}${expression.slice(match[1].length)}`;
}

function containsTopLevelReturn(body) {
  return body.some((record) => record.kind === 'return');
}
