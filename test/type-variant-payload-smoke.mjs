import assert from 'node:assert/strict';
import { createDocument, typeNode } from '@shapeshift-labs/frontier-lang-kernel';
import { emitTypeScript, toTypeScriptAst } from '../dist/index.js';

const doc = createDocument({ id: 'variant_payloads', name: 'VariantPayloads', nodes: [
  typeNode({ id: 'type_load_state', name: 'LoadState', variants: [
    { id: 'variant_loading', name: 'Loading' },
    { id: 'variant_ready', name: 'Ready', fields: [
      { id: 'variant_ready_value', name: 'value', type: 'Text' },
      { id: 'variant_ready_stale', name: 'stale', type: 'Boolean', optional: true }
    ] },
    { id: 'variant_failed', name: 'Failed', fields: [{ id: 'variant_failed_message', name: 'message', type: 'Text' }] }
  ] })
] });

const ast = toTypeScriptAst(doc);
const out = emitTypeScript(doc);
const typeAlias = ast.declarations.find((declaration) => declaration.kind === 'typeAlias' && declaration.name === 'LoadState');
assert.equal(typeAlias.sourceRef.semanticNodeId, 'type_load_state');
assert.match(out, /export type LoadState = \{ kind: "Loading" \} \| \{ kind: "Ready" \} & \{ value: string; stale\?: boolean \} \| \{ kind: "Failed" \} & \{ message: string \};/);
