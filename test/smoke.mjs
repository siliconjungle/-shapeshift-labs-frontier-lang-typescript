import assert from 'node:assert/strict';
import { actionNode, capabilityNode, createDocument, effectNode, entityNode, externNode, latticeNode, migrationNode, nativeSourceNode, stateNode, targetNode, typeNode, viewNode } from '@shapeshift-labs/frontier-lang-kernel';
import { emitTypeScript, emitTypeScriptWithSourceMap, renderTypeScriptAst, renderTypeScriptAstWithSourceMap, toTypeScriptAst } from '../dist/index.js';
const ref = (name, scope, path) => ({ kind: 'ref', name, scope, path });
const literal = (value) => ({ kind: 'literal', value });
const doc = createDocument({ id: 'mod_todo', name: 'TodoApp', nodes: [
  typeNode({ id: 'type_input', name: 'TodoInput', fields: [
    { id: 'input_title', name: 'title', type: 'Text' },
    { id: 'input_count', name: 'count', type: 'Number' },
    { id: 'input_enabled', name: 'enabled', type: 'Boolean' },
    { id: 'input_tags', name: 'tags', type: { kind: 'set', item: 'Text' }, optional: true }
  ] }),
  latticeNode({ id: 'lat_tags', name: 'TagSet', carrier: 'Set<Text>', laws: ['semilattice', 'commutative'], frontierCrdt: { packageName: '@shapeshift-labs/frontier-crdt', exportName: 'createCrdtOrSetLattice' } }),
  entityNode({ id: 'ent_todo', name: 'Todo', fields: [
    { id: 'field_title', name: 'title', type: 'Text' },
    { id: 'field_tags', name: 'tags', type: { kind: 'set', item: 'Text' } }
  ] }),
  capabilityNode({ id: 'cap_http', name: 'HttpRequest', capability: 'http.request', category: 'network', input: 'Json', returns: 'Json', adapters: [
    { target: { language: 'typescript', platform: 'node', packageName: 'undici' }, symbol: 'fetch', kind: 'library' }
  ] }),
  effectNode({ id: 'effect_persist', name: 'PersistTodo', capability: 'storage.write', input: 'TodoInput', returns: 'Json', resources: ['TodoDb.todos'] }),
  stateNode({ id: 'state_todo', name: 'TodoDb', collections: [{ id: 'todos', name: 'todos', type: { kind: 'map', key: 'Text', value: 'Todo' } }] }),
  viewNode({ id: 'view_todo_list', name: 'TodoList', reads: ['TodoDb.todos'], dispatches: ['action_add'], props: [{ id: 'view_prop_disabled', name: 'disabled', type: 'Boolean' }], events: [{ id: 'view_event_save', name: 'save', action: 'action_add' }], renders: [{
    id: 'render_stack',
    kind: 'element',
    tagName: 'Stack',
    children: ['render_save_button', 'render_status_chip']
  }, {
    id: 'render_save_button',
    kind: 'element',
    tagName: 'Button',
    identityKey: 'save',
    text: 'Save',
    props: [{ name: 'disabled', expression: 'disabled' }],
    events: [{ name: 'press', action: 'save' }]
  }, {
    id: 'render_status_chip',
    kind: 'component',
    component: 'StatusChip',
    identityKey: 'status',
    props: [{ name: 'tone', value: 'ready' }]
  }] }),
  migrationNode({ id: 'migration_todo_v1_v2', name: 'TodoV1ToV2', fromVersion: '1', toVersion: '2', changes: [{ id: 'change_add_title', kind: 'addField', target: 'Todo.title' }], invariants: ['title_present'] }),
  targetNode({ id: 'target_ts', name: 'typescript', target: { language: 'typescript', emitPath: 'todo.ts', moduleFormat: 'esm' } }),
  nativeSourceNode({ id: 'native_todo_ts', name: 'TodoTs', language: 'typescript', parser: 'typescript', sourcePath: 'todo.ts', sourceHash: 'sha256:todo', symbol: 'Todo', frontierNodeIds: ['ent_todo', 'action_add'], losses: [{ id: 'loss_decorator', kind: 'unsupportedSyntax', message: 'decorator retained in native source', severity: 'warning' }] }),
  externNode({ id: 'extern_persist', name: 'persistTodo', language: 'typescript', symbol: 'persistTodo', signature: { input: 'TodoInput', returns: 'Patch' } }),
  actionNode({ id: 'action_add', name: 'addTodo', input: 'TodoInput', returns: 'Patch', body: [
    { kind: 'let', id: 'bind_normalized_title', name: 'normalizedTitle', value: { expression: 'input.title', expressionAst: ref('input.title', 'input', ['title']) } },
    { kind: 'let', id: 'bind_can_write', name: 'canWrite', value: { expression: 'input.enabled == true', expressionAst: { kind: 'binary', op: '==', left: ref('input.enabled', 'input', ['enabled']), right: literal(true) } } },
    { kind: 'let', id: 'bind_next_count', name: 'nextCount', valueType: 'Number', value: { expression: 'input.count + 1', expressionAst: { kind: 'binary', op: '+', left: ref('input.count', 'input', ['count']), right: literal(1) }, valueType: 'Number' } },
    { kind: 'patch', op: 'set', id: 'patch_title', name: 'title', path: '/todos/title', value: { expression: 'normalizedTitle', expressionAst: ref('normalizedTitle', 'local', ['normalizedTitle']) } },
    { kind: 'patch', op: 'set', id: 'patch_count', name: 'count', path: '/todos/count', valueType: 'Number', value: { expression: 'nextCount', expressionAst: ref('nextCount', 'local', ['nextCount']), valueType: 'Number' } },
    { kind: 'if', id: 'guard_enabled', name: 'enabled', condition: { expression: 'canWrite && input.enabled', expressionAst: { kind: 'logical', op: '&&', left: ref('canWrite', 'local', ['canWrite']), right: ref('input.enabled', 'input', ['enabled']) } }, body: [
      { kind: 'let', id: 'bind_status_text', name: 'statusText', value: { value: 'ready' } },
      { kind: 'patch', op: 'set', id: 'patch_status', name: 'status', path: '/todos/status', value: { expression: 'statusText', expressionAst: ref('statusText', 'local', ['statusText']) } },
      { kind: 'callEffect', id: 'call_guarded_storage', name: 'guardedPersist', capability: 'storage.write', input: { expression: 'normalizedTitle', expressionAst: ref('normalizedTitle', 'local', ['normalizedTitle']) } }
    ] },
    { kind: 'patch', op: 'insert', id: 'patch_insert', name: 'item', path: '/todos', value: { expression: 'input', expressionAst: ref('input', 'input', []) } },
    { kind: 'patch', op: 'remove', id: 'patch_remove', name: 'oldTitle', path: '/todos/oldTitle' },
    { kind: 'callEffect', id: 'call_storage', name: 'persist', capability: 'storage.write', input: { expression: 'input', expressionAst: ref('input', 'input', []) } },
    { kind: 'return', id: 'return_patches', value: { expression: 'patches', expressionAst: ref('patches', 'patches', []) } }
  ] })
] });
const out = emitTypeScript(doc);
const ast = toTypeScriptAst(doc);
const rendered = renderTypeScriptAstWithSourceMap(ast, {
  sourceMapId: 'map_todo_ts',
  sourcePath: 'todo.frontier',
  targetPath: 'todo.ts',
  semanticIndexId: 'semantic_index_todo',
  sourceSpansBySemanticNodeId: {
    ent_todo: { path: 'todo.frontier', startLine: 10, startColumn: 1, endLine: 13, endColumn: 2 }
  },
  semanticSymbolIdsBySemanticNodeId: {
    ent_todo: 'symbol_todo'
  },
  semanticOccurrenceIdsBySemanticNodeId: {
    ent_todo: 'occurrence_todo'
  },
  lossIdsBySemanticNodeId: {
    ent_todo: ['loss_estimated_span']
  },
  evidence: [{ id: 'evidence_projection', kind: 'projection', summary: 'smoke projection evidence' }]
});
const emitted = emitTypeScriptWithSourceMap(doc, { targetPath: 'todo.ts' });
assert.equal(ast.kind, 'typescript.module');
assert.ok(ast.declarations.some((declaration) => declaration.kind === 'interface' && declaration.name === 'Todo'));
assert.ok(ast.declarations.some((declaration) => declaration.kind === 'capabilityDescriptor' && declaration.name === 'HttpRequestCapability'));
assert.ok(ast.declarations.some((declaration) => declaration.kind === 'effectDescriptor' && declaration.name === 'PersistTodoEffect'));
assert.ok(ast.declarations.some((declaration) => declaration.kind === 'effectRunnerFunction' && declaration.name === 'runPersistTodoEffect'));
assert.ok(ast.declarations.some((declaration) => declaration.kind === 'actionDescriptor' && declaration.name === 'addTodoAction'));
assert.ok(ast.declarations.some((declaration) => declaration.kind === 'externDescriptor' && declaration.name === 'persistTodoExtern'));
assert.ok(ast.declarations.some((declaration) => declaration.kind === 'stateDescriptor' && declaration.name === 'TodoDbStateDescriptor'));
assert.ok(ast.declarations.some((declaration) => declaration.kind === 'viewDescriptor' && declaration.name === 'TodoListView'));
assert.ok(ast.declarations.some((declaration) => declaration.kind === 'viewRenderFunction' && declaration.name === 'renderTodoListView'));
const todoRenderDeclaration = ast.declarations.find((declaration) => declaration.kind === 'viewRenderFunction' && declaration.name === 'renderTodoListView');
assert.deepEqual(todoRenderDeclaration.renders[0].children, ['render_save_button', 'render_status_chip']);
assert.equal(todoRenderDeclaration.renders[2].component, 'StatusChip');
assert.ok(ast.declarations.some((declaration) => declaration.kind === 'migrationDescriptor' && declaration.name === 'TodoV1ToV2Migration'));
assert.ok(ast.declarations.some((declaration) => declaration.kind === 'targetDescriptor' && declaration.name === 'typescriptTarget'));
assert.ok(ast.declarations.some((declaration) => declaration.kind === 'nativeSourceDescriptor' && declaration.name === 'TodoTsNativeSource'));
assert.equal(ast.declarations.find((declaration) => declaration.kind === 'interface' && declaration.name === 'Todo').sourceRef.semanticNodeId, 'ent_todo');
assert.equal(renderTypeScriptAst(ast), out);
assert.equal(rendered.code, out);
assert.equal(emitted.code, out);
assert.equal(emitted.ast.kind, 'typescript.module');
assert.equal(rendered.sourceMap.kind, 'frontier.lang.sourceMap');
assert.equal(rendered.sourceMap.id, 'map_todo_ts');
assert.equal(rendered.sourceMap.target.language, 'typescript');
assert.equal(rendered.sourceMap.targetPath, 'todo.ts');
assert.equal(rendered.sourceMap.semanticIndexId, 'semantic_index_todo');
assert.equal(rendered.sourceMap.metadata.precision, 'declaration');
assert.equal(rendered.sourceMap.evidence[0].id, 'evidence_projection');
const todoMapping = rendered.sourceMap.mappings.find((mapping) => mapping.semanticNodeId === 'ent_todo');
assert.equal(todoMapping.generatedName, 'Todo');
assert.equal(todoMapping.precision, 'declaration');
assert.equal(todoMapping.generatedSpan.targetPath, 'todo.ts');
assert.equal(todoMapping.generatedSpan.startLine > 0, true);
assert.equal(todoMapping.generatedSpan.endLine >= todoMapping.generatedSpan.startLine, true);
assert.equal(todoMapping.sourceSpan.path, 'todo.frontier');
assert.equal(todoMapping.semanticSymbolId, 'symbol_todo');
assert.equal(todoMapping.semanticOccurrenceId, 'occurrence_todo');
assert.deepEqual(todoMapping.lossIds, ['loss_estimated_span']);
assert.deepEqual(todoMapping.evidenceIds, ['evidence_projection']);
assert.deepEqual(todoMapping.metadata.regionIds, ['field_title', 'field_tags']);
assert.match(out, /export interface TodoInput/);
assert.match(out, /count: number/);
assert.match(out, /enabled: boolean/);
assert.match(out, /tags\\?: ReadonlySet<string>/);
assert.match(out, /export const TagSetLattice/);
assert.match(out, /export const HttpRequestCapability/);
assert.match(out, /export const PersistTodoEffect/);
assert.match(out, /export interface FrontierEffectEnvironment/);
assert.match(out, /export async function runPersistTodoEffect\(input: TodoInput, env: FrontierEffectEnvironment\): Promise<unknown>/);
assert.match(out, /env\.invoke\("storage\.write", input/);
assert.match(out, /resources: \["TodoDb\.todos"\]/);
assert.match(out, /export const addTodoAction/);
assert.match(out, /export const persistTodoExtern/);
assert.match(out, /export const TodoDbStateDescriptor/);
assert.match(out, /export const TodoListView/);
assert.match(out, /export interface FrontierRenderNode/);
assert.match(out, /readonly tagName\?: string/);
assert.match(out, /readonly component\?: string/);
assert.match(out, /readonly children: readonly string\[\]/);
assert.match(out, /export function renderTodoListView\(props: \{ readonly disabled: boolean \}\): readonly FrontierRenderNode\[\]/);
assert.match(out, /children: \["render_save_button","render_status_chip"\]/);
assert.match(out, /tagName: "Button"/);
assert.match(out, /component: "StatusChip"/);
assert.match(out, /key: "save"/);
assert.match(out, /key: "status"/);
assert.match(out, /disabled: props\.disabled/);
assert.match(out, /tone: "ready"/);
assert.match(out, /press: \{ action: "save" \}/);
assert.match(out, /export const TodoV1ToV2Migration/);
assert.match(out, /export const typescriptTarget/);
assert.match(out, /export const TodoTsNativeSource/);
assert.match(out, /"tagName": "Button"/);
assert.match(out, /http\.request/);
assert.match(out, /storage\.write/);
assert.match(out, /createCrdtOrSetLattice/);
assert.match(out, /export interface Todo/);
assert.match(out, /export interface TodoDbState/);
assert.match(out, /ReadonlyMap<string, Todo>/);
assert.match(out, /export declare function persistTodo\(input: TodoInput\): FrontierPatchOperation\[\]/);
assert.match(out, /export function addTodo/);
assert.match(out, /const patches: FrontierPatchOperation\[\] = \[\];/);
assert.match(out, /const normalizedTitle = input\.title;/);
assert.match(out, /const canWrite = \(input\.enabled === true\);/);
assert.match(out, /const nextCount = \(input\.count \+ 1\);/);
assert.match(out, /patches\.push\(\{ op: "set", path: "\/todos\/title", value: normalizedTitle \}\);/);
assert.match(out, /patches\.push\(\{ op: "set", path: "\/todos\/count", value: nextCount \}\);/);
assert.match(out, /if \(canWrite && input\.enabled\) \{\n    const statusText = "ready";\n    patches\.push\(\{ op: "set", path: "\/todos\/status", value: statusText \}\);\n    const invoke_call_guarded_storage = env\["storage\.write"\] as \(\(input: unknown\) => unknown\) \| undefined;\n    void invoke_call_guarded_storage\?\.\(normalizedTitle\);\n  \}/);
assert.match(out, /patches\.push\(\{ op: "insert", path: "\/todos", value: input \}\);/);
assert.match(out, /patches\.push\(\{ op: 'remove', path: "\/todos\/oldTitle" \}\);/);
assert.match(out, /const invoke_call_storage = env\["storage\.write"\] as \(\(input: unknown\) => unknown\) \| undefined;/);
assert.match(out, /void invoke_call_storage\?\.\(input\);/);
assert.match(out, /return patches as FrontierPatchOperation\[\];/);

const unsupportedExpressionDoc = createDocument({ id: 'bad', name: 'Bad', nodes: [
  actionNode({ id: 'action_bad', name: 'badAction', returns: 'Patch', body: [
    { kind: 'let', id: 'bad_operator', name: 'badOperator', value: { expressionAst: { kind: 'binary', op: '+', left: literal(1), right: literal(2) } } }
  ] })
] });
assert.throws(() => emitTypeScript(unsupportedExpressionDoc), /Unsupported Frontier action expression operator/);
const unsupportedRefDoc = createDocument({ id: 'bad_ref', name: 'BadRef', nodes: [
  actionNode({ id: 'action_bad_ref', name: 'badRefAction', returns: 'Patch', body: [
    { kind: 'let', id: 'bad_ref', name: 'badRef', value: { expressionAst: ref('env.secret', 'env', ['secret']) } }
  ] })
] });
assert.throws(() => emitTypeScript(unsupportedRefDoc), /Unsupported Frontier action expression ref/);
