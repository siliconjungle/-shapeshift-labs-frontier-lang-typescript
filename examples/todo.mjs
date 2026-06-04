import { createDocument, entityNode } from '@shapeshift-labs/frontier-lang-kernel';
import { emitTypeScript } from '../dist/index.js';
console.log(emitTypeScript(createDocument({ id: 'mod', name: 'Example', nodes: [entityNode({ id: 'ent', name: 'Todo', fields: [{ id: 'title', name: 'title', type: 'Text' }] })] })));
