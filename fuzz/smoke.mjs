import assert from 'node:assert/strict';
import { createDocument, entityNode, latticeNode, typeNode } from '@shapeshift-labs/frontier-lang-kernel';
import { emitTypeScript } from '../dist/index.js';

for (let index = 0; index < 100; index += 1) {
  const document = createDocument({ id: `doc_${index}`, name: `Doc${index}`, nodes: [
    typeNode({ id: `type_${index}`, name: `Input${index}`, fields: [{ id: `field_${index}`, name: 'title', type: 'Text' }] }),
    latticeNode({ id: `lat_${index}`, name: `TagSet${index}`, carrier: 'Set<Text>', laws: ['semilattice', 'commutative'] }),
    entityNode({ id: `entity_${index}`, name: `Entity${index}`, fields: [
      { id: `field_title_${index}`, name: 'title', type: 'Text' },
      { id: `field_tags_${index}`, name: 'tags', type: { kind: 'set', item: 'Text' } }
    ] })
  ] });
  const out = emitTypeScript(document);
  assert.match(out, new RegExp(`export interface Entity${index}`));
  assert.match(out, new RegExp(`export interface Input${index}`));
  assert.match(out, new RegExp(`export const TagSet${index}Lattice`));
}
