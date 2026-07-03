export function typeParametersToTypeScript(node, { safeIdentifier, toTypeScriptType }) {
  const records = node.typeParameters?.length ? node.typeParameters : node.parameters?.map((name) => ({ name }));
  if (!records?.length) return '';
  return `<${records.map((parameter) => typeParameterToTypeScript(parameter, { safeIdentifier, toTypeScriptType })).join(', ')}>`;
}

function typeParameterToTypeScript(parameter, { safeIdentifier, toTypeScriptType }) {
  const constraint = parameter.constraint ? ` extends ${toTypeScriptType(parameter.constraint)}` : '';
  const defaultType = parameter.default ? ` = ${toTypeScriptType(parameter.default)}` : '';
  return `${safeIdentifier(parameter.name)}${constraint}${defaultType}`;
}
