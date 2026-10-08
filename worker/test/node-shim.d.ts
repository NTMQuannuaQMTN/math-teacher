// Tests run under Node (vitest); the worker's tsconfig has only Workers types. The few Node APIs tests use:
declare module "node:fs" {
  export function readFileSync(path: URL | string, encoding: "utf8"): string;
}
interface ImportMeta {
  readonly url: string;
}
