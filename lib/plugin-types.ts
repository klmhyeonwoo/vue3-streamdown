import type { MermaidConfig } from "mermaid";
import type { Component } from "vue";
import type {
  BundledLanguage,
  BundledTheme,
  ThemeRegistrationAny,
} from "shiki";
import type { Pluggable } from "unified";

export type ThemeInput = BundledTheme | ThemeRegistrationAny;

export interface HighlightToken {
  bgColor?: string;
  color?: string;
  content: string;
  htmlAttrs?: Record<string, string>;
  htmlStyle?: Record<string, string>;
  offset?: number;
}

export interface HighlightResult {
  bg?: string;
  fg?: string;
  rootStyle?: string | false;
  tokens: HighlightToken[][];
}

export interface HighlightOptions {
  code: string;
  language: BundledLanguage;
  themes: [ThemeInput, ThemeInput];
}

export interface CodeHighlighterPlugin {
  getSupportedLanguages: () => BundledLanguage[];
  getThemes: () => [ThemeInput, ThemeInput];
  highlight: (
    options: HighlightOptions,
    callback?: (result: HighlightResult) => void
  ) => HighlightResult | null;
  name: "shiki";
  supportsLanguage: (language: BundledLanguage) => boolean;
  type: "code-highlighter";
}

export interface MermaidInstance {
  initialize: (config: MermaidConfig) => void;
  render: (id: string, source: string) => Promise<{ svg: string }>;
}

export interface DiagramPlugin {
  getMermaid: (config?: MermaidConfig) => MermaidInstance;
  language: string;
  name: "mermaid";
  type: "diagram";
}

export interface MathPlugin {
  getStyles?: () => string;
  name: "katex";
  rehypePlugin: Pluggable;
  remarkPlugin: Pluggable;
  type: "math";
}

export interface CjkPlugin {
  name: "cjk";
  remarkPlugins: Pluggable[];
  remarkPluginsAfter: Pluggable[];
  remarkPluginsBefore: Pluggable[];
  type: "cjk";
}

export type StreamdownPlugin =
  | CodeHighlighterPlugin
  | DiagramPlugin
  | MathPlugin
  | CjkPlugin;

export interface CustomRendererProps {
  code: string;
  isIncomplete: boolean;
  language: string;
  meta?: string;
}

export interface CustomRenderer {
  component: Component<CustomRendererProps>;
  language: string | string[];
}

export interface PluginConfig {
  cjk?: CjkPlugin;
  code?: CodeHighlighterPlugin;
  math?: MathPlugin;
  mermaid?: DiagramPlugin;
  renderers?: CustomRenderer[];
}
