import { computed, inject, provide, type ComputedRef, type Ref } from "vue";
import type { Component } from "vue";
import type { PluginConfig } from "../lib/plugin-types";
import type { AnimatePlugin } from "../lib/animate";
import type { ThemeInput } from "../lib/plugin-types";
import type { ControlsConfig, LinkSafetyConfig, MermaidOptions, StreamdownContextType } from "../lib/types";
import type { CnFunction } from "../lib/utils";
import { cn as defaultCn } from "../lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Symbol keys
// ─────────────────────────────────────────────────────────────────────────────

export const TRANSLATIONS_KEY = Symbol("streamdown:translations");
export const ICONS_KEY = Symbol("streamdown:icons");
export const CN_KEY = Symbol("streamdown:cn");
export const PLUGINS_KEY = Symbol("streamdown:plugins");
export const BLOCK_INCOMPLETE_KEY = Symbol("streamdown:blockIncomplete");
export const IS_BLOCK_CODE_KEY = Symbol("streamdown:isBlockCode");
export const CODE_BLOCK_KEY = Symbol("streamdown:codeBlock");
export const ANIMATE_KEY = Symbol("streamdown:animate");
export const STREAMDOWN_CONTEXT_KEY = Symbol("streamdown:context");

// ─────────────────────────────────────────────────────────────────────────────
// StreamdownContext
// ─────────────────────────────────────────────────────────────────────────────

const defaultStreamdownContext: StreamdownContextType = {
  shikiTheme: ["github-light", "github-dark"],
  controls: true,
  isAnimating: false,
  lineNumbers: true,
  mode: "streaming",
  mermaid: undefined,
  linkSafety: { enabled: true },
};

export const useStreamdownContext = () => {
  const ctx = inject<ComputedRef<StreamdownContextType>>(
    STREAMDOWN_CONTEXT_KEY,
    computed(() => defaultStreamdownContext)
  );
  return {
    shikiTheme: computed(() => ctx.value.shikiTheme) as ComputedRef<[ThemeInput, ThemeInput]>,
    controls: computed(() => ctx.value.controls) as ComputedRef<ControlsConfig>,
    isAnimating: computed(() => ctx.value.isAnimating) as ComputedRef<boolean>,
    lineNumbers: computed(() => ctx.value.lineNumbers) as ComputedRef<boolean>,
    mode: computed(() => ctx.value.mode) as ComputedRef<"static" | "streaming">,
    mermaid: computed(() => ctx.value.mermaid) as ComputedRef<MermaidOptions | undefined>,
    linkSafety: computed(() => ctx.value.linkSafety) as ComputedRef<LinkSafetyConfig | undefined>,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Translations
// ─────────────────────────────────────────────────────────────────────────────

export interface StreamdownTranslations {
  close: string;
  copied: string;
  copyCode: string;
  copyLink: string;
  copyTable: string;
  copyTableAsCsv: string;
  copyTableAsMarkdown: string;
  copyTableAsTsv: string;
  downloadDiagram: string;
  downloadDiagramAsMmd: string;
  downloadDiagramAsPng: string;
  downloadDiagramAsSvg: string;
  downloadFile: string;
  downloadImage: string;
  downloadTable: string;
  downloadTableAsCsv: string;
  downloadTableAsMarkdown: string;
  exitFullscreen: string;
  externalLinkWarning: string;
  imageNotAvailable: string;
  mermaidFormatMmd: string;
  mermaidFormatPng: string;
  mermaidFormatSvg: string;
  openExternalLink: string;
  openLink: string;
  tableFormatCsv: string;
  tableFormatMarkdown: string;
  tableFormatTsv: string;
  viewFullscreen: string;
}

export const defaultTranslations: StreamdownTranslations = {
  copyCode: "Copy Code",
  downloadFile: "Download file",
  downloadDiagram: "Download diagram",
  downloadDiagramAsSvg: "Download diagram as SVG",
  downloadDiagramAsPng: "Download diagram as PNG",
  downloadDiagramAsMmd: "Download diagram as MMD",
  viewFullscreen: "View fullscreen",
  exitFullscreen: "Exit fullscreen",
  mermaidFormatSvg: "SVG",
  mermaidFormatPng: "PNG",
  mermaidFormatMmd: "MMD",
  copyTable: "Copy table",
  copyTableAsMarkdown: "Copy table as Markdown",
  copyTableAsCsv: "Copy table as CSV",
  copyTableAsTsv: "Copy table as TSV",
  downloadTable: "Download table",
  downloadTableAsCsv: "Download table as CSV",
  downloadTableAsMarkdown: "Download table as Markdown",
  tableFormatMarkdown: "Markdown",
  tableFormatCsv: "CSV",
  tableFormatTsv: "TSV",
  imageNotAvailable: "Image not available",
  downloadImage: "Download image",
  openExternalLink: "Open external link?",
  externalLinkWarning: "You're about to visit an external website.",
  close: "Close",
  copyLink: "Copy link",
  copied: "Copied",
  openLink: "Open link",
};

export const useTranslations = (): StreamdownTranslations => {
  const t = inject<ComputedRef<StreamdownTranslations>>(TRANSLATIONS_KEY);
  return t?.value ?? defaultTranslations;
};

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

export type IconComponent = Component<{ size?: number; class?: string; height?: number; width?: number }>;

export interface IconMap {
  CheckIcon: IconComponent;
  CopyIcon: IconComponent;
  DownloadIcon: IconComponent;
  ExternalLinkIcon: IconComponent;
  Loader2Icon: IconComponent;
  Maximize2Icon: IconComponent;
  RotateCcwIcon: IconComponent;
  XIcon: IconComponent;
  ZoomInIcon: IconComponent;
  ZoomOutIcon: IconComponent;
}

// Simple SVG icon components as defaults
const svgIcon = (path: string, viewBox = "0 0 24 24") =>
  ({
    props: ["size", "class", "height", "width"],
    render() {
      const size = (this as { size?: number }).size ?? 24;
      return {
        type: "svg",
        props: {
          xmlns: "http://www.w3.org/2000/svg",
          width: (this as { width?: number }).width ?? size,
          height: (this as { height?: number }).height ?? size,
          viewBox,
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          class: (this as { class?: string }).class,
          innerHTML: path,
        },
      };
    },
  }) as unknown as IconComponent;

export const defaultIcons: IconMap = {
  CheckIcon: svgIcon('<polyline points="20 6 9 17 4 12"/>'),
  CopyIcon: svgIcon('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
  DownloadIcon: svgIcon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>'),
  ExternalLinkIcon: svgIcon('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
  Loader2Icon: svgIcon('<path d="M21 12a9 9 0 1 1-6.219-8.56"/>'),
  Maximize2Icon: svgIcon('<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/>'),
  RotateCcwIcon: svgIcon('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),
  XIcon: svgIcon('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  ZoomInIcon: svgIcon('<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/>'),
  ZoomOutIcon: svgIcon('<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/>'),
};

export const useIcons = (): IconMap => {
  const icons = inject<ComputedRef<IconMap>>(ICONS_KEY);
  return icons?.value ?? defaultIcons;
};

// ─────────────────────────────────────────────────────────────────────────────
// cn (prefix-aware)
// ─────────────────────────────────────────────────────────────────────────────

export const useCn = (): CnFunction => {
  const cnRef = inject<ComputedRef<CnFunction>>(CN_KEY);
  return cnRef?.value ?? defaultCn;
};

// ─────────────────────────────────────────────────────────────────────────────
// Plugins
// ─────────────────────────────────────────────────────────────────────────────

export const usePlugins = (): ComputedRef<PluginConfig | null> => {
  return inject<ComputedRef<PluginConfig | null>>(PLUGINS_KEY, computed(() => null));
};

export const useCodePlugin = (): ComputedRef<PluginConfig["code"] | null> => {
  const plugins = usePlugins();
  return computed(() => plugins.value?.code ?? null);
};

export const useMermaidPlugin = (): ComputedRef<PluginConfig["mermaid"] | null> => {
  const plugins = usePlugins();
  return computed(() => plugins.value?.mermaid ?? null);
};

export const useCustomRenderer = (
  getLanguage: string | (() => string)
): ComputedRef<NonNullable<PluginConfig["renderers"]>[number] | null> => {
  const plugins = usePlugins();
  return computed(() => {
    const lang = typeof getLanguage === "function" ? getLanguage() : getLanguage;
    const renderers = plugins.value?.renderers;
    if (!renderers || !lang) return null;
    return renderers.find((r) =>
      Array.isArray(r.language) ? r.language.includes(lang) : r.language === lang
    ) ?? null;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Block incomplete (provided by Block.vue per block)
// ─────────────────────────────────────────────────────────────────────────────

export const useIsBlockIncomplete = (): ComputedRef<boolean> => {
  return inject<ComputedRef<boolean>>(BLOCK_INCOMPLETE_KEY, computed(() => false));
};

// Keep old name for compatibility
export const useIsCodeFenceIncomplete = useIsBlockIncomplete;

// ─────────────────────────────────────────────────────────────────────────────
// isBlockCode (pre provides → code injects)
// ─────────────────────────────────────────────────────────────────────────────

export const useIsBlockCode = (): boolean =>
  inject(IS_BLOCK_CODE_KEY, false);

// ─────────────────────────────────────────────────────────────────────────────
// CodeBlock context (code string for copy/download)
// ─────────────────────────────────────────────────────────────────────────────

export interface CodeBlockCtx {
  code: ComputedRef<string>;
}

export const useCodeBlock = (): CodeBlockCtx =>
  inject<CodeBlockCtx>(CODE_BLOCK_KEY, { code: computed(() => "") });

// ─────────────────────────────────────────────────────────────────────────────
// Animate plugin
// ─────────────────────────────────────────────────────────────────────────────

export const useAnimate = (): AnimatePlugin | null =>
  inject(ANIMATE_KEY, null);
