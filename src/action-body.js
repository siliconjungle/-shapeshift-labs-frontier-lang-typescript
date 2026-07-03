export function renderActionBodyStatements(declaration, { safeIdentifier }) {
  const body = declaration.body ?? [];
  if (!body.length) return ['void state;', 'void input;', 'void env;', `return [] as ${declaration.returnType};`];
  const statements = ['void state;', 'const patches: FrontierPatchOperation[] = [];'];
  statements.push(...renderActionBodyRecords(body, { safeIdentifier, returnType: declaration.returnType }));
  if (!containsTopLevelReturn(body)) statements.push(`return patches as ${declaration.returnType};`);
  return statements;
}

function renderActionBodyRecords(body, { safeIdentifier, returnType }) {
  const statements = [];
  for (const record of body) {
    if (record.kind === 'patch' && (record.op === 'set' || record.op === 'insert' || record.op === 'merge')) {
      statements.push(`patches.push({ op: ${JSON.stringify(record.op)}, path: ${JSON.stringify(record.path ?? '')}, value: ${actionValueExpression(record.value)} });`);
      continue;
    }
    if (record.kind === 'patch' && record.op === 'remove') {
      statements.push(`patches.push({ op: 'remove', path: ${JSON.stringify(record.path ?? '')} });`);
      continue;
    }
    if (record.kind === 'callEffect') {
      const local = safeIdentifier(`invoke_${record.id ?? record.name ?? 'effect'}`);
      statements.push(`const ${local} = env[${JSON.stringify(record.capability ?? record.name ?? '')}] as ((input: unknown) => unknown) | undefined;`);
      statements.push(`void ${local}?.(${actionValueExpression(record.input)});`);
      continue;
    }
    if (record.kind === 'if') {
      statements.push(`if (${actionConditionExpression(record.condition)}) {`);
      for (const statement of renderActionBodyRecords(record.body ?? [], { safeIdentifier, returnType })) statements.push(`  ${statement}`);
      statements.push('}');
      continue;
    }
    if (record.kind === 'return') {
      statements.push(`return ${actionValueExpression(record.value)} as ${returnType};`);
    }
  }
  return statements;
}

function actionValueExpression(value) {
  if (value && Object.prototype.hasOwnProperty.call(value, 'value')) return JSON.stringify(value.value);
  const expression = String(value?.expression ?? '').trim();
  if (/^(input|state|patches|env)(?:\.[A-Za-z_$][\w$]*)*$/.test(expression)) return expression;
  if (/^(true|false|null|-?\d+(?:\.\d+)?)$/.test(expression)) return expression;
  return JSON.stringify(expression);
}

function actionConditionExpression(value) {
  if (value && Object.prototype.hasOwnProperty.call(value, 'value')) {
    if (typeof value.value === 'boolean') return JSON.stringify(value.value);
    return `Boolean(${JSON.stringify(value.value)})`;
  }
  const expression = String(value?.expression ?? '').trim();
  if (/^(input|state|patches|env)(?:\.[A-Za-z_$][\w$]*)*$/.test(expression)) return expression;
  if (/^(true|false|-?\d+(?:\.\d+)?)$/.test(expression)) return expression;
  return `((): never => { throw new Error(${JSON.stringify(`Unsupported Frontier action condition expression: ${expression}`)}); })()`;
}

function containsTopLevelReturn(body) {
  return body.some((record) => record.kind === 'return');
}
