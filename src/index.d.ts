import type { FrontierLangDocument } from '@shapeshift-labs/frontier-lang-kernel';
export interface EmitTypeScriptOptions { readonly banner?: string; readonly includeRuntimeTypes?: boolean; }
export interface TypeScriptSourceRef {
  readonly semanticNodeId: string;
  readonly semanticNodeKind?: string;
  readonly semanticNodeName?: string;
  readonly regionIds?: readonly string[];
}
export type TypeScriptAstDeclaration =
  | { readonly kind: 'runtimeTypes' }
  | { readonly kind: 'typeAlias'; readonly name: string; readonly parameters: string; readonly type: string; readonly sourceRef?: TypeScriptSourceRef }
  | { readonly kind: 'interface'; readonly name: string; readonly parameters?: string; readonly fields: readonly { readonly name: string; readonly type: string; readonly optional?: boolean }[]; readonly sourceRef?: TypeScriptSourceRef }
  | { readonly kind: 'latticeDescriptor'; readonly name: string; readonly value: { readonly name: string; readonly carrier: string; readonly laws: readonly string[]; readonly frontierCrdt?: unknown }; readonly sourceRef?: TypeScriptSourceRef }
  | { readonly kind: 'capabilityDescriptor'; readonly name: string; readonly value: { readonly capability: string; readonly category?: string; readonly input?: string; readonly returns?: string; readonly effects: readonly string[]; readonly resources: readonly string[]; readonly adapters: readonly unknown[]; readonly unsupportedTargets: readonly unknown[] }; readonly sourceRef?: TypeScriptSourceRef }
  | { readonly kind: 'externFunction'; readonly name: string; readonly inputType: string; readonly returnType: string; readonly sourceRef?: TypeScriptSourceRef }
  | { readonly kind: 'actionFunction'; readonly name: string; readonly inputType: string; readonly returnType: string; readonly sourceRef?: TypeScriptSourceRef };
export interface TypeScriptAstModule { readonly kind: 'typescript.module'; readonly banner: string; readonly declarations: readonly TypeScriptAstDeclaration[]; }
export declare function toTypeScriptAst(document: FrontierLangDocument, options?: EmitTypeScriptOptions): TypeScriptAstModule;
export declare function renderTypeScriptAst(ast: TypeScriptAstModule): string;
export declare function emitTypeScript(document: FrontierLangDocument, options?: EmitTypeScriptOptions): string;
