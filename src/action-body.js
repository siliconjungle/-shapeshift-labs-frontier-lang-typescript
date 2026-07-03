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
  if (value && Object.prototype.hasOwnProperty.call(value, 'value')) return JSON.stringify(value.value);
  const expression = String(value?.expression ?? '').trim();
  const local = localExpression(expression, context);
  if (local) return local;
  if (/^(input|state|patches|env)(?:\.[A-Za-z_$][\w$]*)*$/.test(expression)) return expression;
  if (/^(true|false|null|-?\d+(?:\.\d+)?)$/.test(expression)) return expression;
  return JSON.stringify(expression);
}

function actionConditionExpression(value, context = {}) {
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

function localExpression(expression, { locals } = {}) {
  const match = /^([A-Za-z_$][\w$-]*)(\.[A-Za-z_$][\w$]*)*$/.exec(expression);
  if (!match || !locals?.has(match[1])) return undefined;
  return `${locals.get(match[1])}${expression.slice(match[1].length)}`;
}

function containsTopLevelReturn(body) {
  return body.some((record) => record.kind === 'return');
}
