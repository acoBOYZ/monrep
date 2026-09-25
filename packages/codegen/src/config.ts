export type CodegenConfig = {
  /** Optional display/filter name. Default: package directory basename. */
  name?: string;
  /** Hand-written `createDoModule("…")` files (config-relative). */
  doDir: string;
  /** Generated `*.gen.ts` dump (config-relative). Fixed filenames live inside. */
  outDir: string;
};

export function defineConfig(config: CodegenConfig): CodegenConfig {
  return config;
}
