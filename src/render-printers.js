import { renderPropValue } from './render-descriptors.js';

export function renderRuntimeTypes(push) {
  push('export type FrontierPatchOperation =', "  | { op: 'set'; path: string; value: unknown }", "  | { op: 'remove'; path: string }", "  | { op: 'insert'; path: string; value: unknown }", "  | { op: 'merge'; path: string; value: unknown };", '');
  push('export interface FrontierLatticeDescriptor {', '  readonly name: string;', '  readonly carrier: string;', '  readonly laws: readonly string[];', '  readonly frontierCrdt?: { readonly packageName?: string; readonly exportName: string; readonly lawChecker?: string };', '}', '');
  push('export interface FrontierCapabilityDescriptor {', '  readonly capability: string;', '  readonly category?: string;', '  readonly input?: string;', '  readonly returns?: string;', '  readonly effects: readonly string[];', '  readonly resources: readonly string[];', '  readonly adapters: readonly unknown[];', '  readonly unsupportedTargets: readonly unknown[];', '}', '');
  push('export interface FrontierViewDescriptor {', '  readonly name: string;', '  readonly reads: readonly string[];', '  readonly dispatches: readonly string[];', '  readonly props: readonly unknown[];', '  readonly events: readonly unknown[];', '  readonly renders: readonly unknown[];', '}', '');
  push('export interface FrontierRenderEventBinding {', '  readonly action: string;', '}', '');
  push('export interface FrontierRenderNode {', '  readonly id?: string;', '  readonly kind?: string;', '  readonly tagName: string;', '  readonly key?: string;', '  readonly text?: string;', '  readonly props: Readonly<Record<string, unknown>>;', '  readonly events: Readonly<Record<string, FrontierRenderEventBinding>>;', '}', '');
  push('export interface FrontierStateDescriptor {', '  readonly name: string;', '  readonly collections: readonly unknown[];', '}', '');
  push('export interface FrontierEffectDescriptor {', '  readonly name: string;', '  readonly capability: string;', '  readonly input?: string;', '  readonly returns?: string;', '  readonly resources: readonly string[];', '  readonly semantics?: unknown;', '}', '');
  push('export interface FrontierEffectContext {', '  readonly effect: string;', '  readonly resources: readonly string[];', '  readonly semantics?: unknown;', '}', '');
  push('export interface FrontierEffectEnvironment {', '  readonly invoke: (capability: string, input: unknown, context: FrontierEffectContext) => unknown | Promise<unknown>;', '}', '');
  push('export interface FrontierActionDescriptor {', '  readonly name: string;', '  readonly input?: string;', '  readonly returns?: string;', '  readonly reads: readonly string[];', '  readonly writes: readonly string[];', '  readonly uses: readonly string[];', '  readonly throws: readonly string[];', '  readonly body: readonly unknown[];', '}', '');
  push('export interface FrontierExternDescriptor {', '  readonly name: string;', '  readonly language: string;', '  readonly symbol: string;', '  readonly capability?: string;', '  readonly input?: string;', '  readonly returns?: string;', '  readonly effects: readonly string[];', '  readonly resources: readonly string[];', '  readonly target?: unknown;', '}', '');
  push('export interface FrontierMigrationDescriptor {', '  readonly name: string;', '  readonly fromVersion: string;', '  readonly toVersion: string;', '  readonly changes: readonly unknown[];', '  readonly invariants: readonly string[];', '}', '');
  push('export interface FrontierTargetDescriptor {', '  readonly name: string;', '  readonly target: unknown;', '}', '');
  push('export interface FrontierNativeSourceDescriptor {', '  readonly name: string;', '  readonly language: string;', '  readonly parser?: string;', '  readonly parserVersion?: string;', '  readonly sourcePath?: string;', '  readonly sourceHash?: string;', '  readonly symbol?: string;', '  readonly ast?: unknown;', '  readonly frontierNodeIds: readonly string[];', '  readonly losses: readonly unknown[];', '  readonly target?: unknown;', '}', '');
}

export function renderViewRenderFunctionDeclaration(declaration, push, { safeIdentifier }) {
  push(`export function ${declaration.name}(props: ${declaration.propsType}): readonly FrontierRenderNode[] {`);
  push('  return [');
  for (const render of declaration.renders) {
    push('    {');
    if (render.id) push(`      id: ${JSON.stringify(render.id)},`);
    if (render.kind) push(`      kind: ${JSON.stringify(render.kind)},`);
    push(`      tagName: ${JSON.stringify(render.tagName)},`);
    if (render.key) push(`      key: ${JSON.stringify(render.key)},`);
    if (render.text !== undefined) push(`      text: ${JSON.stringify(render.text)},`);
    push('      props: {');
    for (const prop of render.props ?? []) push(`        ${safeIdentifier(prop.name)}: ${renderPropValue(prop, { safeIdentifier })},`);
    push('      },');
    push('      events: {');
    for (const event of render.events ?? []) push(`        ${safeIdentifier(event.name)}: { action: ${JSON.stringify(event.action)} },`);
    push('      }');
    push('    },');
  }
  push('  ];', '}', '');
}
