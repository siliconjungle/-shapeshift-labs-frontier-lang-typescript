import { performance } from 'node:perf_hooks';
import { createDocument, entityNode } from '@shapeshift-labs/frontier-lang-kernel';
import { emitTypeScript } from '../dist/index.js';

const entities = Array.from({ length: 200 }, (_, index) => entityNode({ id: `entity_${index}`, name: `Entity${index}`, fields: [
  { id: `field_title_${index}`, name: 'title', type: 'Text' },
  { id: `field_count_${index}`, name: 'count', type: 'Int' }
] }));
const document = createDocument({ id: 'doc_bench', name: 'Bench', nodes: entities });
const start = performance.now();
let out = '';
for (let index = 0; index < 250; index += 1) out = emitTypeScript(document);
const durationMs = performance.now() - start;
console.log(JSON.stringify({ emits: 250, bytes: out.length, durationMs: Math.round(durationMs * 100) / 100 }, null, 2));
