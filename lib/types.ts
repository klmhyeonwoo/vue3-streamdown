/**
 * Core type definitions for vue-streamdown.
 * Kept in a separate file to prevent circular import issues between
 * index.ts (public exports), Streamdown.vue, Block.vue, and composables/.
 */

import type { Component } from "vue";
import type { ThemeInput } from "./plugin-types";

// ─── Controls ────────────────────────────────────────────────────────────────

export type ControlsConfig =
  | boolean
  | {
      table?:
        | boolean
        | {
            copy?: boolean;
            download?: boolean;
            fullscreen?: boolean;
          };
      code?:
        | boolean
        | {
            copy?: boolean;
            download?: boolean;
          };
      mermaid?:
        | boolean
        | {
            download?: boolean;
            copy?: boolean;
            fullscreen?: boolean;
            panZoom?: boolean;
          };
    };

// ─── Link safety ──────────────────────────────────────────────────────────────

export interface LinkSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  url: string;
}

export interface LinkSafetyConfig {
  enabled: boolean;
  onLinkCheck?: (url: string) => Promise<boolean> | boolean;
  /** Vue component to render a custom modal. Receives LinkSafetyModalProps as props. */
  renderModal?: Component<LinkSafetyModalProps>;
}

// ─── Mermaid ──────────────────────────────────────────────────────────────────

export interface MermaidErrorComponentProps {
  chart: string;
  error: string;
  retry: () => void;
}

export interface MermaidOptions {
  config?: import("mermaid").MermaidConfig;
  errorComponent?: Component<MermaidErrorComponentProps>;
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export type AllowedTags = Record<string, string[]>;

// ─── Streamdown context (shared across child components via provide/inject) ───

export interface StreamdownContextType {
  shikiTheme: [ThemeInput, ThemeInput];
  controls: ControlsConfig;
  isAnimating: boolean;
  lineNumbers: boolean;
  mode: "static" | "streaming";
  mermaid?: MermaidOptions;
  linkSafety?: LinkSafetyConfig;
}
