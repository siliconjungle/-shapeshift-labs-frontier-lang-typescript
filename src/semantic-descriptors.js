export function semanticDescriptorDeclarations(document, context) {
  const declarations = [];
  for (const node of Object.values(document.nodes)) {
    if (node.kind === 'action') declarations.push(actionDescriptor(node, context));
    if (node.kind === 'effect') declarations.push(effectDescriptor(node, context), effectRunnerFunction(node, context));
    if (node.kind === 'extern') declarations.push(externDescriptor(node, context));
    if (node.kind === 'state') declarations.push(stateDescriptor(node, context));
    if (node.kind === 'migration') declarations.push(migrationDescriptor(node, context));
    if (node.kind === 'target') declarations.push(targetDescriptor(node, context));
    if (node.kind === 'nativeSource') declarations.push(nativeSourceDescriptor(node, context));
  }
  return declarations;
}

export function renderSemanticDescriptorDeclaration(declaration) {
  if (declaration.kind === 'effectRunnerFunction') return renderEffectRunnerFunction(declaration);
  const type = {
    stateDescriptor: 'FrontierStateDescriptor',
    effectDescriptor: 'FrontierEffectDescriptor',
    actionDescriptor: 'FrontierActionDescriptor',
    externDescriptor: 'FrontierExternDescriptor',
    migrationDescriptor: 'FrontierMigrationDescriptor',
    targetDescriptor: 'FrontierTargetDescriptor',
    nativeSourceDescriptor: 'FrontierNativeSourceDescriptor'
  }[declaration.kind];
  return type ? `export const ${declaration.name}: ${type} = ${JSON.stringify(declaration.value, null, 2)};` : undefined;
}

function actionDescriptor(node, { safeIdentifier, toTypeScriptType, sourceRef }) {
  return {
    kind: 'actionDescriptor',
    name: `${safeIdentifier(node.name)}Action`,
    value: {
      name: node.name,
      input: node.input ? toTypeScriptType(node.input) : undefined,
      returns: node.returns ? toTypeScriptType(node.returns) : undefined,
      reads: node.reads ?? [],
      writes: node.writes ?? [],
      uses: node.uses ?? [],
      throws: node.throws ?? [],
      body: node.body ?? []
    },
    sourceRef: sourceRef(node)
  };
}

function effectDescriptor(node, { safeIdentifier, toTypeScriptType, sourceRef }) {
  return {
    kind: 'effectDescriptor',
    name: `${safeIdentifier(node.name)}Effect`,
    value: {
      name: node.name,
      capability: node.capability,
      input: node.input ? toTypeScriptType(node.input) : undefined,
      returns: node.returns ? toTypeScriptType(node.returns) : undefined,
      resources: node.resources ?? [],
      semantics: node.semantics
    },
    sourceRef: sourceRef(node)
  };
}

function effectRunnerFunction(node, { safeIdentifier, toTypeScriptType, sourceRef }) {
  return {
    kind: 'effectRunnerFunction',
    name: `run${safeIdentifier(node.name)}Effect`,
    inputType: node.input ? toTypeScriptType(node.input) : 'unknown',
    returnType: node.returns ? toTypeScriptType(node.returns) : 'unknown',
    value: {
      name: node.name,
      capability: node.capability,
      resources: node.resources ?? [],
      semantics: node.semantics
    },
    sourceRef: sourceRef(node)
  };
}

function renderEffectRunnerFunction(declaration) {
  return [
    `export async function ${declaration.name}(input: ${declaration.inputType}, env: FrontierEffectEnvironment): Promise<${declaration.returnType}> {`,
    `  const result = await env.invoke(${JSON.stringify(declaration.value.capability)}, input, {`,
    `    effect: ${JSON.stringify(declaration.value.name)},`,
    `    resources: ${JSON.stringify(declaration.value.resources)},`,
    `    semantics: ${JSON.stringify(declaration.value.semantics ?? null)}`,
    '  });',
    `  return result as ${declaration.returnType};`,
    '}'
  ].join('\n');
}

function externDescriptor(node, { safeIdentifier, toTypeScriptType, sourceRef }) {
  return {
    kind: 'externDescriptor',
    name: `${safeIdentifier(node.name)}Extern`,
    value: {
      name: node.name,
      language: node.language,
      symbol: node.symbol,
      capability: node.capability,
      input: node.signature?.input ? toTypeScriptType(node.signature.input) : undefined,
      returns: node.signature?.returns ? toTypeScriptType(node.signature.returns) : undefined,
      effects: node.effects ?? [],
      resources: node.resources ?? [],
      target: node.target
    },
    sourceRef: sourceRef(node)
  };
}

function stateDescriptor(node, { safeIdentifier, toTypeScriptType, sourceRef }) {
  return {
    kind: 'stateDescriptor',
    name: `${safeIdentifier(node.name)}StateDescriptor`,
    value: {
      name: node.name,
      collections: node.collections.map((collection) => ({
        id: collection.id,
        name: collection.name,
        type: toTypeScriptType(collection.type),
        merge: collection.merge,
        semantic: collection.semantic,
        metadata: collection.metadata
      }))
    },
    sourceRef: sourceRef(node, { regionIds: node.collections.map((collection) => collection.id) })
  };
}

function migrationDescriptor(node, { safeIdentifier, sourceRef }) {
  return {
    kind: 'migrationDescriptor',
    name: `${safeIdentifier(node.name)}Migration`,
    value: {
      name: node.name,
      fromVersion: node.fromVersion,
      toVersion: node.toVersion,
      changes: node.changes ?? [],
      invariants: node.invariants ?? []
    },
    sourceRef: sourceRef(node)
  };
}

function targetDescriptor(node, { safeIdentifier, sourceRef }) {
  return {
    kind: 'targetDescriptor',
    name: `${safeIdentifier(node.name)}Target`,
    value: { name: node.name, target: node.target },
    sourceRef: sourceRef(node)
  };
}

function nativeSourceDescriptor(node, { safeIdentifier, sourceRef }) {
  return {
    kind: 'nativeSourceDescriptor',
    name: `${safeIdentifier(node.name)}NativeSource`,
    value: {
      name: node.name,
      language: node.language,
      parser: node.parser,
      parserVersion: node.parserVersion,
      sourcePath: node.sourcePath,
      sourceHash: node.sourceHash,
      symbol: node.symbol,
      ast: node.ast,
      frontierNodeIds: node.frontierNodeIds ?? [],
      losses: node.losses ?? [],
      target: node.target
    },
    sourceRef: sourceRef(node, { regionIds: node.frontierNodeIds ?? [] })
  };
}
