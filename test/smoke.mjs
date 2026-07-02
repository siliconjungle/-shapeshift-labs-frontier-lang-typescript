import assert from 'node:assert/strict';
import { actionNode, capabilityNode, createDocument, entityNode, externNode, latticeNode, stateNode, typeNode, viewNode } from '@shapeshift-labs/frontier-lang-kernel';
import { emitTypeScript, emitTypeScriptWithSourceMap, renderTypeScriptAst, renderTypeScriptAstWithSourceMap, toTypeScriptAst } from '../dist/index.js';
const doc = createDocument({ id: 'mod_todo', name: 'TodoApp', nodes: [
  typeNode({ id: 'type_input', name: 'TodoInput', fields: [
    { id: 'input_title', name: 'title', type: 'Text' },
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
  stateNode({ id: 'state_todo', name: 'TodoDb', collections: [{ id: 'todos', name: 'todos', type: { kind: 'map', key: 'Text', value: 'Todo' } }] }),
  viewNode({ id: 'view_todo_list', name: 'TodoList', reads: ['TodoDb.todos'], dispatches: ['action_add'], props: [{ id: 'view_prop_disabled', name: 'disabled', type: 'Boolean' }], events: [{ id: 'view_event_save', name: 'save', action: 'action_add' }], renders: [{ id: 'render_save_button', kind: 'element', tagName: 'Button', identityKey: 'save', text: 'Save', props: [{ name: 'disabled', expression: 'disabled' }], events: [{ name: 'press', action: 'save' }] }] }),
  externNode({ id: 'extern_persist', name: 'persistTodo', language: 'typescript', symbol: 'persistTodo', signature: { input: 'TodoInput', returns: 'Patch' } }),
  actionNode({ id: 'action_add', name: 'addTodo', input: 'TodoInput', returns: 'Patch' })
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
assert.ok(ast.declarations.some((declaration) => declaration.kind === 'viewDescriptor' && declaration.name === 'TodoListView'));
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
assert.match(out, /tags\\?: ReadonlySet<string>/);
assert.match(out, /export const TagSetLattice/);
assert.match(out, /export const HttpRequestCapability/);
assert.match(out, /export const TodoListView/);
assert.match(out, /"tagName": "Button"/);
assert.match(out, /http\.request/);
assert.match(out, /createCrdtOrSetLattice/);
assert.match(out, /export interface Todo/);
assert.match(out, /export interface TodoDbState/);
assert.match(out, /ReadonlyMap<string, Todo>/);
assert.match(out, /export declare function persistTodo\(input: TodoInput\): FrontierPatchOperation\[\]/);
assert.match(out, /export function addTodo/);
