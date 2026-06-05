import assert from 'node:assert/strict';
import { createDocument, entityNode, latticeNode, typeNode } from '@shapeshift-labs/frontier-lang-kernel';
import { emitTypeScript, emitTypeScriptWithSourceMap } from '../dist/index.js';

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
  const withSourceMap = emitTypeScriptWithSourceMap(document, { targetPath: `doc_${index}.ts` });
  assert.equal(withSourceMap.code, out);
  assert.equal(withSourceMap.sourceMap.kind, 'frontier.lang.sourceMap');
  assert.ok(withSourceMap.sourceMap.mappings.length >= 3);
  assert.ok(withSourceMap.sourceMap.mappings.every((mapping) => mapping.precision === 'declaration'));
  assert.match(out, new RegExp(`export interface Entity${index}`));
  assert.match(out, new RegExp(`export interface Input${index}`));
  assert.match(out, new RegExp(`export const TagSet${index}Lattice`));
}
