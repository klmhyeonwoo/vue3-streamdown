import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ["index.ts", "lib/**/*.ts", "lib/**/*.vue", "composables/**/*.ts", "hooks/**/*.ts", "Block.vue", "Streamdown.vue"],
      outDir: "dist",
      tsconfigPath: "./tsconfig.json",
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "index.ts"),
      name: "VueStreamdown",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      // Externalize deps that shouldn't be bundled
      external: [
        "vue",
        "mermaid",
        "shiki",
        /^shiki\//,
      ],
      output: {
        globals: {
          vue: "Vue",
        },
      },
    },
    minify: true,
    sourcemap: false,
  },
});
