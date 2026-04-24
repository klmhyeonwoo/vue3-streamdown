// ─── Public API for vue-streamdown ────────────────────────────────────────────

// Components
export { default as Streamdown } from "./Streamdown.vue";
export { default as Block } from "./Block.vue";

// Code block components
export { default as CodeBlock } from "./lib/code-block/CodeBlock.vue";
export { default as CodeBlockContainer } from "./lib/code-block/CodeBlockContainer.vue";
export { default as CodeBlockHeader } from "./lib/code-block/CodeBlockHeader.vue";
export { default as CodeBlockBody } from "./lib/code-block/CodeBlockBody.vue";
export { default as CodeBlockSkeleton } from "./lib/code-block/CodeBlockSkeleton.vue";
export { default as CodeBlockCopyButton } from "./lib/code-block/CodeBlockCopyButton.vue";
export { default as CodeBlockDownloadButton } from "./lib/code-block/CodeBlockDownloadButton.vue";

// Table components
export { default as Table } from "./lib/table/Table.vue";
export { default as TableCopyDropdown } from "./lib/table/TableCopyDropdown.vue";
export { default as TableDownloadDropdown } from "./lib/table/TableDownloadDropdown.vue";
export { default as TableFullscreenButton } from "./lib/table/TableFullscreenButton.vue";

// Mermaid components
export { default as Mermaid } from "./lib/mermaid/Mermaid.vue";
export { default as MermaidDownloadDropdown } from "./lib/mermaid/MermaidDownloadDropdown.vue";
export { default as MermaidFullscreenButton } from "./lib/mermaid/MermaidFullscreenButton.vue";

// Core types (from lib/types.ts — no circular reference)
export type {
  ControlsConfig,
  LinkSafetyConfig,
  LinkSafetyModalProps,
  MermaidErrorComponentProps,
  MermaidOptions,
  AllowedTags,
  StreamdownContextType,
} from "./lib/types";

// Plugin types
export type {
  CjkPlugin,
  CodeHighlighterPlugin,
  CustomRenderer,
  CustomRendererProps,
  DiagramPlugin,
  HighlightOptions,
  MathPlugin,
  PluginConfig,
  ThemeInput,
} from "./lib/plugin-types";

// Animate
export type { AnimateOptions } from "./lib/animate";
export { createAnimatePlugin } from "./lib/animate";

// Translations
export type { StreamdownTranslations } from "./composables/index";
export { defaultTranslations } from "./composables/index";

// Icons
export type { IconMap, IconComponent } from "./composables/index";
export { defaultIcons } from "./composables/index";

// Composables (for custom child components)
export {
  useStreamdownContext,
  useTranslations,
  useIcons,
  useCn,
  usePlugins,
  useCodePlugin,
  useMermaidPlugin,
  useCustomRenderer,
  useIsBlockIncomplete,
  useIsCodeFenceIncomplete,
  useIsBlockCode,
  useCodeBlock,
  useAnimate,
  STREAMDOWN_CONTEXT_KEY,
  TRANSLATIONS_KEY,
  ICONS_KEY,
  CN_KEY,
  PLUGINS_KEY,
  BLOCK_INCOMPLETE_KEY,
  IS_BLOCK_CODE_KEY,
  CODE_BLOCK_KEY,
  ANIMATE_KEY,
} from "./composables/index";

// Markdown processing
export { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
export { detectTextDirection } from "./lib/detect-direction";
export { normalizeHtmlIndentation } from "./lib/utils";

// Re-export shiki types for convenience
export type {
  BundledLanguage,
  BundledTheme,
  ThemeRegistrationAny,
} from "shiki";
