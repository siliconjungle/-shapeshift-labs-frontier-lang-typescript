import type {
  CompileTarget,
  EvidenceRecord,
  FrontierLangDocument,
  JsonObject,
  SemanticId,
  SourceMapGeneratedSpan,
  SourceMapRecord,
  SourceSpan
} from '@shapeshift-labs/frontier-lang-kernel';
export interface EmitTypeScriptOptions { readonly banner?: string; readonly includeRuntimeTypes?: boolean; }
export interface TypeScriptSourceMapOptions extends EmitTypeScriptOptions {
  readonly sourceMapId?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly target?: CompileTarget;
  readonly targetPath?: string;
  readonly targetHash?: string;
  readonly semanticIndexId?: string;
  readonly universalAstId?: string;
  readonly nativeAstId?: string;
  readonly nativeSourceId?: SemanticId;
  readonly semanticSymbolIdsBySemanticNodeId?: Readonly<Record<SemanticId, string>>;
  readonly semanticOccurrenceIdsBySemanticNodeId?: Readonly<Record<SemanticId, string>>;
  readonly sourceSpansBySemanticNodeId?: Readonly<Record<SemanticId, SourceSpan>>;
  readonly lossIdsBySemanticNodeId?: Readonly<Record<SemanticId, readonly string[]>>;
  readonly evidence?: readonly EvidenceRecord[];
  readonly metadata?: JsonObject;
}
export interface TypeScriptSourceRef {
  readonly semanticNodeId: SemanticId;
  readonly semanticNodeKind?: string;
  readonly semanticNodeName?: string;
  readonly regionIds?: readonly string[];
}
export interface TypeScriptGeneratedSourceMapResult {
  readonly code: string;
  readonly sourceMap: SourceMapRecord;
}
export interface TypeScriptDocumentSourceMapResult extends TypeScriptGeneratedSourceMapResult {
  readonly ast: TypeScriptAstModule;
}
export interface TypeScriptGeneratedDeclarationSpan extends SourceMapGeneratedSpan {}
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
export declare function renderTypeScriptAstWithSourceMap(ast: TypeScriptAstModule, options?: TypeScriptSourceMapOptions): TypeScriptGeneratedSourceMapResult;
export declare function emitTypeScript(document: FrontierLangDocument, options?: EmitTypeScriptOptions): string;
export declare function emitTypeScriptWithSourceMap(document: FrontierLangDocument, options?: TypeScriptSourceMapOptions): TypeScriptDocumentSourceMapResult;
