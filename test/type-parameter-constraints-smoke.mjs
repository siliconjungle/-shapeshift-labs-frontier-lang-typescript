import assert from 'node:assert/strict';
import { createDocument, typeNode } from '@shapeshift-labs/frontier-lang-kernel';
import { emitTypeScript } from '../dist/index.js';

const document = createDocument({ id: 'doc', name: 'Doc', nodes: [
  typeNode({
    id: 'type_box',
    name: 'Box',
    parameters: ['T'],
    typeParameters: [{ name: 'T', constraint: 'Json', default: 'Json' }],
    fields: [{ id: 'field_value', name: 'value', type: 'T' }]
  }),
  typeNode({
    id: 'type_result',
    name: 'Result',
    parameters: ['T', 'E'],
    typeParameters: [
      { name: 'T', constraint: 'Json' },
      { name: 'E', default: 'Json' }
    ],
    variants: [
      { id: 'variant_ok', name: 'Ok', fields: [{ id: 'variant_ok_value', name: 'value', type: 'T' }] },
      { id: 'variant_err', name: 'Err', fields: [{ id: 'variant_err_error', name: 'error', type: 'E' }] }
    ]
  })
] });

const output = emitTypeScript(document);
assert.match(output, /export interface Box<T extends unknown = unknown> \{\n  value: T;\n\}/);
assert.match(output, /export type Result<T extends unknown, E = unknown> = \{ kind: "Ok" \} & \{ value: T \} \| \{ kind: "Err" \} & \{ error: E \};/);
