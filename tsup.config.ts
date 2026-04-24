import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  entry: ["index.ts"],
  format: ["esm"],
  minify: true,
  outDir: "dist",
  sourcemap: false,
  external: ["vue"],
  treeshake: true,
  splitting: true,
  platform: "browser",
});
