import type { FrontierLangDocument } from '@shapeshift-labs/frontier-lang-kernel';
export interface EmitTypeScriptOptions { readonly banner?: string; readonly includeRuntimeTypes?: boolean; }
export declare function emitTypeScript(document: FrontierLangDocument, options?: EmitTypeScriptOptions): string;
