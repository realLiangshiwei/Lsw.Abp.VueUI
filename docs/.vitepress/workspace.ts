import ts from 'typescript';

/** VitePress's older Vite parser does not accept every TypeScript 6 source expression. */
export const workspaceTypeScript = {
  name: 'docs-workspace-typescript',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!id.includes('/packages/') || !id.endsWith('.ts') || id.endsWith('.d.ts')) return;
    const result = ts.transpileModule(code, {
      fileName: id,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        sourceMap: true,
        inlineSources: true,
        verbatimModuleSyntax: true,
      },
    });
    return { code: result.outputText, map: result.sourceMapText };
  },
};
