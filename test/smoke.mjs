import assert from 'node:assert/strict';
import { actionNode, capabilityNode, createDocument, entityNode, externNode, latticeNode, stateNode, typeNode } from '@shapeshift-labs/frontier-lang-kernel';
import { emitTypeScript, renderTypeScriptAst, toTypeScriptAst } from '../dist/index.js';
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
  externNode({ id: 'extern_persist', name: 'persistTodo', language: 'typescript', symbol: 'persistTodo', signature: { input: 'TodoInput', returns: 'Patch' } }),
  actionNode({ id: 'action_add', name: 'addTodo', input: 'TodoInput', returns: 'Patch' })
] });
const out = emitTypeScript(doc);
const ast = toTypeScriptAst(doc);
assert.equal(ast.kind, 'typescript.module');
assert.ok(ast.declarations.some((declaration) => declaration.kind === 'interface' && declaration.name === 'Todo'));
assert.ok(ast.declarations.some((declaration) => declaration.kind === 'capabilityDescriptor' && declaration.name === 'HttpRequestCapability'));
assert.equal(ast.declarations.find((declaration) => declaration.kind === 'interface' && declaration.name === 'Todo').sourceRef.semanticNodeId, 'ent_todo');
assert.equal(renderTypeScriptAst(ast), out);
assert.match(out, /export interface TodoInput/);
assert.match(out, /tags\\?: ReadonlySet<string>/);
assert.match(out, /export const TagSetLattice/);
assert.match(out, /export const HttpRequestCapability/);
assert.match(out, /http\.request/);
assert.match(out, /createCrdtOrSetLattice/);
assert.match(out, /export interface Todo/);
assert.match(out, /export interface TodoDbState/);
assert.match(out, /ReadonlyMap<string, Todo>/);
assert.match(out, /export declare function persistTodo\(input: TodoInput\): FrontierPatchOperation\[\]/);
assert.match(out, /export function addTodo/);
