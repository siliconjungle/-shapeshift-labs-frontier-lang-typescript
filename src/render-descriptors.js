export function viewRenderNodeToAst(node) {
  return {
    id: node.id,
    kind: node.kind,
    tagName: node.tagName,
    component: node.component,
    key: node.identityKey,
    text: node.text,
    children: renderChildIds(node.children),
    props: (node.props ?? []).map((prop) => {
      const value = { name: prop.name };
      if (Object.prototype.hasOwnProperty.call(prop, 'value')) value.value = prop.value;
      if (prop.expression !== undefined) value.expression = prop.expression;
      return value;
    }),
    events: (node.events ?? []).map((event) => ({
      name: event.name,
      action: event.action
    }))
  };
}

function renderChildIds(children = []) {
  return children
    .map((child) => typeof child === 'string' ? child : child?.id)
    .filter((id) => typeof id === 'string' && id.length > 0);
}

export function viewPropsType(props = [], { safeIdentifier, toTypeScriptType }) {
  if (!props.length) return 'Readonly<Record<string, unknown>>';
  return `{ ${props.map((prop) => `readonly ${safeIdentifier(prop.name)}${prop.optional ? '?' : ''}: ${toTypeScriptType(prop.type)}`).join('; ')} }`;
}

export function renderPropValue(prop, { safeIdentifier }) {
  if (Object.prototype.hasOwnProperty.call(prop, 'value')) return JSON.stringify(prop.value);
  const expression = String(prop.expression ?? '').trim();
  if (/^[A-Za-z_$][\w$]*$/.test(expression)) return `props.${safeIdentifier(expression)}`;
  if (/^(true|false|null|-?\d+(?:\.\d+)?)$/.test(expression)) return expression;
  return `props[${JSON.stringify(expression)} as keyof typeof props]`;
}
