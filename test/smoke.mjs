import assert from 'node:assert/strict';
import { createDocument, entityNode, actionNode } from '@shapeshift-labs/frontier-lang-kernel';
import { emitTypeScript } from '../dist/index.js';
const doc = createDocument({ id: 'mod_todo', name: 'TodoApp', nodes: [entityNode({ id: 'ent_todo', name: 'Todo', fields: [{ id: 'field_title', name: 'title', type: 'Text' }] }), actionNode({ id: 'action_add', name: 'addTodo', input: '{ title: Text }', returns: 'Patch' })] });
const out = emitTypeScript(doc);
assert.match(out, /export interface Todo/);
assert.match(out, /export function addTodo/);
