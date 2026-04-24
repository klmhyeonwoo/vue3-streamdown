<script setup lang="ts">
import { computed, provide, watch, ref } from "vue";
import type { MermaidConfig } from "mermaid";
import { harden } from "rehype-harden";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remend from "remend";
import type { RemendOptions } from "remend";
import type { Pluggable } from "unified";

import { type AnimateOptions, createAnimatePlugin } from "./lib/animate";
import { components as defaultComponents } from "./lib/components";
import { detectTextDirection } from "./lib/detect-direction";
import type { IconMap } from "./composables/index";
import { hasIncompleteCodeFence, hasTable } from "./lib/incomplete-code-utils";
import { Markdown, type Options, type ExtraProps } from "./lib/markdown";
import { parseMarkdownIntoBlocks } from "./lib/parse-blocks";
import type { PluginConfig, ThemeInput } from "./lib/plugin-types";
import { preprocessCustomTags } from "./lib/preprocess-custom-tags";
import { preprocessLiteralTagContent } from "./lib/preprocess-literal-tag-content";
import { rehypeLiteralTagContent } from "./lib/rehype/literal-tag-content";
import { remarkCodeMeta } from "./lib/remark/code-meta";
import { defaultTranslations, type StreamdownTranslations } from "./lib/translations";
import { createCn } from "./lib/utils";
import {
  STREAMDOWN_CONTEXT_KEY,
  TRANSLATIONS_KEY,
  ICONS_KEY,
  CN_KEY,
  PLUGINS_KEY,
  defaultIcons,
} from "./composables/index";
import type { ControlsConfig, LinkSafetyConfig, MermaidOptions, StreamdownContextType } from "./lib/types";
import Block from "./Block.vue";

// ─── types re-used from index ─────────────────────────────────────────────────

type StreamdownMode = "static" | "streaming";

const carets = {
  block: " ▋",
  circle: " ●",
} as const;

// ─── props ───────────────────────────────────────────────────────────────────

const props = withDefaults(defineProps<{
  modelValue?: string;         // main markdown content (alt to slot)
  mode?: StreamdownMode;
  dir?: "auto" | "ltr" | "rtl";
  parseIncompleteMarkdown?: boolean;
  normalizeHtmlIndentation?: boolean;
  components?: Options["components"];
  rehypePlugins?: Pluggable[];
  remarkPlugins?: Pluggable[];
  class?: string;
  shikiTheme?: [ThemeInput, ThemeInput];
  mermaid?: MermaidOptions;
  controls?: ControlsConfig;
  isAnimating?: boolean;
  animated?: boolean | AnimateOptions;
  caret?: keyof typeof carets;
  plugins?: PluginConfig;
  remend?: RemendOptions;
  linkSafety?: LinkSafetyConfig;
  allowedTags?: Record<string, string[]>;
  literalTagContent?: string[];
  translations?: Partial<StreamdownTranslations>;
  icons?: Partial<IconMap>;
  prefix?: string;
  lineNumbers?: boolean;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
}>(), {
  mode: "streaming",
  parseIncompleteMarkdown: true,
  normalizeHtmlIndentation: false,
  controls: true,
  isAnimating: false,
  lineNumbers: true,
  linkSafety: () => ({ enabled: true }),
  shikiTheme: () => ["github-light", "github-dark"] as [ThemeInput, ThemeInput],
});

// ─── slot content ────────────────────────────────────────────────────────────

const slots = defineSlots<{ default?: () => unknown }>();

// Get markdown content from slot text or modelValue prop
// Note: In Vue, we'll use modelValue prop since slots aren't text nodes
const markdownInput = computed(() => props.modelValue ?? "");

// ─── defaults ─────────────────────────────────────────────────────────────────

const defaultSanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href ?? []), "tel"],
  },
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "metastring"],
  },
};

const defaultRehypePlugins: Pluggable[] = [
  rehypeRaw,
  [rehypeSanitize, defaultSanitizeSchema],
  [harden, { allowedImagePrefixes: ["*"], allowedLinkPrefixes: ["*"], allowedProtocols: ["*"], defaultOrigin: undefined, allowDataImages: true }],
];

const defaultRemarkPlugins: Pluggable[] = [
  [remarkGfm, {}],
  remarkCodeMeta,
];

// ─── cn (prefix) ──────────────────────────────────────────────────────────────

const prefixedCn = computed(() => createCn(props.prefix));
provide(CN_KEY, prefixedCn);

// ─── translations ─────────────────────────────────────────────────────────────

const translationsValue = computed(() => ({ ...defaultTranslations, ...props.translations }));
provide(TRANSLATIONS_KEY, translationsValue);

// ─── icons ────────────────────────────────────────────────────────────────────

const iconsValue = computed(() => ({ ...defaultIcons, ...props.icons }));
provide(ICONS_KEY, iconsValue);

// ─── plugins ──────────────────────────────────────────────────────────────────

provide(PLUGINS_KEY, computed(() => props.plugins ?? null));

// ─── streamdown context ───────────────────────────────────────────────────────

const contextValue = computed<StreamdownContextType>(() => ({
  shikiTheme: props.plugins?.code?.getThemes() ?? props.shikiTheme,
  controls: props.controls,
  isAnimating: props.isAnimating,
  lineNumbers: props.lineNumbers,
  mode: props.mode,
  mermaid: props.mermaid,
  linkSafety: props.linkSafety,
}));
provide(STREAMDOWN_CONTEXT_KEY, contextValue);

// ─── animation callbacks ──────────────────────────────────────────────────────

const prevIsAnimating = ref<boolean | null>(null);

watch(() => props.isAnimating, (cur) => {
  if (props.mode === "static") return;
  const prev = prevIsAnimating.value;
  prevIsAnimating.value = cur;
  if (prev === null) { if (cur) props.onAnimationStart?.(); return; }
  if (cur && !prev) props.onAnimationStart?.();
  else if (!cur && prev) props.onAnimationEnd?.();
}, { immediate: true });

// ─── animate plugin ───────────────────────────────────────────────────────────

const animatePlugin = computed(() => {
  if (!props.animated) return null;
  if (props.animated === true) return createAnimatePlugin();
  return createAnimatePlugin(props.animated as AnimateOptions);
});

// ─── allowed tags ─────────────────────────────────────────────────────────────

const allowedTagNames = computed(() => props.allowedTags ? Object.keys(props.allowedTags) : []);

// ─── processed content ────────────────────────────────────────────────────────

const processedContent = computed(() => {
  const input = markdownInput.value;
  if (typeof input !== "string") return "";

  let result = props.mode === "streaming" && props.parseIncompleteMarkdown
    ? remend(input, props.remend)
    : input;

  if (props.literalTagContent && props.literalTagContent.length > 0) {
    result = preprocessLiteralTagContent(result, props.literalTagContent);
  }
  if (allowedTagNames.value.length > 0) {
    result = preprocessCustomTags(result, allowedTagNames.value);
  }
  return result;
});

// ─── merged plugins ───────────────────────────────────────────────────────────

const mergedRemarkPlugins = computed<Pluggable[]>(() => {
  const p = props.plugins;
  let result: Pluggable[] = [];
  if (p?.cjk) result = [...result, ...p.cjk.remarkPluginsBefore];
  result = [...result, ...(props.remarkPlugins ?? defaultRemarkPlugins)];
  if (p?.cjk) result = [...result, ...p.cjk.remarkPluginsAfter];
  if (p?.math) result = [...result, p.math.remarkPlugin];
  return result;
});

const mergedRehypePlugins = computed<Pluggable[]>(() => {
  const base = props.rehypePlugins ?? defaultRehypePlugins;
  let result = base;

  if (props.allowedTags && Object.keys(props.allowedTags).length > 0 && base === defaultRehypePlugins) {
    const extendedSchema = {
      ...defaultSanitizeSchema,
      tagNames: [...(defaultSanitizeSchema.tagNames ?? []), ...Object.keys(props.allowedTags)],
      attributes: { ...defaultSanitizeSchema.attributes, ...props.allowedTags },
    };
    result = [rehypeRaw, [rehypeSanitize, extendedSchema], defaultRehypePlugins[2]];
  }

  if (props.literalTagContent && props.literalTagContent.length > 0) {
    result = [...result, [rehypeLiteralTagContent, props.literalTagContent]];
  }
  if (props.plugins?.math) result = [...result, props.plugins.math.rehypePlugin];
  if (animatePlugin.value && props.isAnimating) result = [...result, animatePlugin.value.rehypePlugin];

  return result;
});

// ─── merged components ────────────────────────────────────────────────────────

const mergedComponents = computed(() => {
  const { inlineCode, ...userComponents } = (props.components ?? {}) as Record<string, unknown> & { inlineCode?: unknown };
  return { ...defaultComponents, ...userComponents } as Options["components"];
});

// ─── blocks (streaming mode) ──────────────────────────────────────────────────

const blocks = computed(() => parseMarkdownIntoBlocks(processedContent.value));

const blockDirections = computed(() =>
  props.dir === "auto" ? blocks.value.map(detectTextDirection) : undefined
);

const shouldHideCaret = computed(() => {
  if (!props.isAnimating || blocks.value.length === 0) return false;
  const last = blocks.value.at(-1) as string;
  return hasIncompleteCodeFence(last) || hasTable(last);
});

const caretStyle = computed(() =>
  props.caret && props.isAnimating && !shouldHideCaret.value
    ? { "--streamdown-caret": `"${carets[props.caret]}"` }
    : undefined
);

const wrapperClass = computed(() => {
  const cn = prefixedCn.value;
  const base = "space-y-4 whitespace-normal [&>*:first-child]:mt-0 [&>*:last-child]:mb-0";
  const caretClass = props.caret && !shouldHideCaret.value
    ? "[&>*:last-child]:after:inline [&>*:last-child]:after:align-baseline [&>*:last-child]:after:content-[var(--streamdown-caret)]"
    : undefined;
  return cn(base, caretClass, props.class);
});
</script>

<template>
  <!-- STATIC mode -->
  <div
    v-if="mode === 'static'"
    :class="prefixedCn('space-y-4 whitespace-normal [&>*:first-child]:mt-0 [&>*:last-child]:mb-0', $props.class)"
    :dir="dir === 'auto' ? detectTextDirection(processedContent) : dir"
  >
    <Markdown
      :components="mergedComponents"
      :rehypePlugins="mergedRehypePlugins"
      :remarkPlugins="mergedRemarkPlugins"
    >{{ processedContent }}</Markdown>
  </div>

  <!-- STREAMING mode -->
  <div
    v-else
    :class="wrapperClass"
    :style="caretStyle"
  >
    <span v-if="blocks.length === 0 && caret && isAnimating" />
    <Block
      v-for="(block, index) in blocks"
      :key="`block-${index}`"
      :content="block"
      :isIncomplete="isAnimating && index === blocks.length - 1 && hasIncompleteCodeFence(block)"
      :shouldNormalizeHtmlIndentation="normalizeHtmlIndentation"
      :dir="blockDirections?.[index] ?? (dir !== 'auto' ? dir : undefined)"
      :animatePlugin="animatePlugin"
      :components="mergedComponents"
      :rehypePlugins="mergedRehypePlugins"
      :remarkPlugins="mergedRemarkPlugins"
    />
  </div>
</template>
