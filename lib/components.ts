import { defineComponent, h, inject, provide, ref, Suspense } from "vue";
import type { Component } from "vue";
import type { ControlsConfig } from "./types";
import {
  useCn,
  useStreamdownContext,
  IS_BLOCK_CODE_KEY,
  useIsBlockIncomplete,
  useCustomRenderer,
  useMermaidPlugin,
} from "../composables/index";
import CodeBlock from "./code-block/CodeBlock.vue";
import CodeBlockCopyButton from "./code-block/CodeBlockCopyButton.vue";
import CodeBlockDownloadButton from "./code-block/CodeBlockDownloadButton.vue";
import CodeBlockSkeleton from "./code-block/CodeBlockSkeleton.vue";
import ImageComponent from "./ImageComponent.vue";
import LinkSafetyModal from "./LinkSafetyModal.vue";
import MermaidDownloadDropdown from "./mermaid/MermaidDownloadDropdown.vue";
import MermaidFullscreenButton from "./mermaid/MermaidFullscreenButton.vue";
import Table from "./table/Table.vue";
import type { Options, ExtraProps } from "./markdown";
import { defineAsyncComponent } from "vue";

const START_LINE_PATTERN = /startLine=(\d+)/;
const NO_LINE_NUMBERS_PATTERN = /\bnoLineNumbers\b/;
const LANGUAGE_REGEX = /language-([^\s]+)/;

const MermaidAsync = defineAsyncComponent({
  loader: () => import("./mermaid/Mermaid.vue"),
  loadingComponent: CodeBlockSkeleton,
});

const shouldShowControls = (config: ControlsConfig, type: "table" | "code" | "mermaid") => {
  if (typeof config === "boolean") return config;
  return config[type] !== false;
};

const shouldShowTableControl = (config: ControlsConfig, controlType: "copy" | "download" | "fullscreen"): boolean => {
  if (typeof config === "boolean") return config;
  const tableConfig = config.table;
  if (tableConfig === false) return false;
  if (tableConfig === true || tableConfig === undefined) return true;
  return (tableConfig as Record<string, unknown>)[controlType] !== false;
};

const shouldShowCodeControl = (config: ControlsConfig, controlType: "copy" | "download"): boolean => {
  if (typeof config === "boolean") return config;
  const codeConfig = config.code;
  if (codeConfig === false) return false;
  if (codeConfig === true || codeConfig === undefined) return true;
  return (codeConfig as Record<string, unknown>)[controlType] !== false;
};

const shouldShowMermaidControl = (config: ControlsConfig, controlType: "download" | "copy" | "fullscreen" | "panZoom"): boolean => {
  if (typeof config === "boolean") return config;
  const mermaidConfig = config.mermaid;
  if (mermaidConfig === false) return false;
  if (mermaidConfig === true || mermaidConfig === undefined) return true;
  return (mermaidConfig as Record<string, unknown>)[controlType] !== false;
};

// ─── simple block elements ───────────────────────────────────────────────────

const MarkdownOl = defineComponent({
  name: "MarkdownOl",
  props: ["class", "node"],
  setup(props, { slots, attrs }) {
    const cn = useCn();
    return () => h("ol", { class: cn("list-inside list-decimal whitespace-normal [li_&]:pl-6", props.class), "data-streamdown": "ordered-list", ...attrs }, slots.default?.());
  },
});

const MarkdownUl = defineComponent({
  name: "MarkdownUl",
  props: ["class", "node"],
  setup(props, { slots, attrs }) {
    const cn = useCn();
    return () => h("ul", { class: cn("list-inside list-disc whitespace-normal [li_&]:pl-6", props.class), "data-streamdown": "unordered-list", ...attrs }, slots.default?.());
  },
});

const MarkdownLi = defineComponent({
  name: "MarkdownLi",
  props: ["class", "node"],
  setup(props, { slots, attrs }) {
    const cn = useCn();
    return () => h("li", { class: cn("py-1 [&>p]:inline", props.class), "data-streamdown": "list-item", ...attrs }, slots.default?.());
  },
});

const MarkdownHr = defineComponent({
  name: "MarkdownHr",
  props: ["class", "node"],
  setup(props, { attrs }) {
    const cn = useCn();
    return () => h("hr", { class: cn("my-6 border-border", props.class), "data-streamdown": "horizontal-rule", ...attrs });
  },
});

const MarkdownStrong = defineComponent({
  name: "MarkdownStrong",
  props: ["class", "node"],
  setup(props, { slots, attrs }) {
    const cn = useCn();
    return () => h("span", { class: cn("font-semibold", props.class), "data-streamdown": "strong", ...attrs }, slots.default?.());
  },
});

const MarkdownH1 = defineComponent({ name: "MarkdownH1", props: ["class", "node"], setup(props, { slots, attrs }) { const cn = useCn(); return () => h("h1", { class: cn("mt-6 mb-2 font-semibold text-3xl", props.class), "data-streamdown": "heading-1", ...attrs }, slots.default?.()); } });
const MarkdownH2 = defineComponent({ name: "MarkdownH2", props: ["class", "node"], setup(props, { slots, attrs }) { const cn = useCn(); return () => h("h2", { class: cn("mt-6 mb-2 font-semibold text-2xl", props.class), "data-streamdown": "heading-2", ...attrs }, slots.default?.()); } });
const MarkdownH3 = defineComponent({ name: "MarkdownH3", props: ["class", "node"], setup(props, { slots, attrs }) { const cn = useCn(); return () => h("h3", { class: cn("mt-6 mb-2 font-semibold text-xl", props.class), "data-streamdown": "heading-3", ...attrs }, slots.default?.()); } });
const MarkdownH4 = defineComponent({ name: "MarkdownH4", props: ["class", "node"], setup(props, { slots, attrs }) { const cn = useCn(); return () => h("h4", { class: cn("mt-6 mb-2 font-semibold text-lg", props.class), "data-streamdown": "heading-4", ...attrs }, slots.default?.()); } });
const MarkdownH5 = defineComponent({ name: "MarkdownH5", props: ["class", "node"], setup(props, { slots, attrs }) { const cn = useCn(); return () => h("h5", { class: cn("mt-6 mb-2 font-semibold text-base", props.class), "data-streamdown": "heading-5", ...attrs }, slots.default?.()); } });
const MarkdownH6 = defineComponent({ name: "MarkdownH6", props: ["class", "node"], setup(props, { slots, attrs }) { const cn = useCn(); return () => h("h6", { class: cn("mt-6 mb-2 font-semibold text-sm", props.class), "data-streamdown": "heading-6", ...attrs }, slots.default?.()); } });

const MarkdownBlockquote = defineComponent({
  name: "MarkdownBlockquote",
  props: ["class", "node"],
  setup(props, { slots, attrs }) {
    const cn = useCn();
    return () => h("blockquote", { class: cn("my-4 border-muted-foreground/30 border-l-4 pl-4 text-muted-foreground italic", props.class), "data-streamdown": "blockquote", ...attrs }, slots.default?.());
  },
});

const MarkdownSup = defineComponent({
  name: "MarkdownSup",
  props: ["class", "node"],
  setup(props, { slots, attrs }) {
    const cn = useCn();
    return () => h("sup", { class: cn("text-sm", props.class), "data-streamdown": "superscript", ...attrs }, slots.default?.());
  },
});

const MarkdownSub = defineComponent({
  name: "MarkdownSub",
  props: ["class", "node"],
  setup(props, { slots, attrs }) {
    const cn = useCn();
    return () => h("sub", { class: cn("text-sm", props.class), "data-streamdown": "subscript", ...attrs }, slots.default?.());
  },
});

// ─── table ───────────────────────────────────────────────────────────────────

const MarkdownTable = defineComponent({
  name: "MarkdownTable",
  props: ["class", "node"],
  setup(props, { slots, attrs }) {
    const { controls: controlsConfig } = useStreamdownContext();
    return () => {
      const cfg = controlsConfig.value;
      return h(Table as Component, {
        class: props.class,
        showControls: shouldShowControls(cfg, "table"),
        showCopy: shouldShowTableControl(cfg, "copy"),
        showDownload: shouldShowTableControl(cfg, "download"),
        showFullscreen: shouldShowTableControl(cfg, "fullscreen"),
        ...attrs,
      }, slots);
    };
  },
});

const MarkdownThead = defineComponent({ name: "MarkdownThead", props: ["class", "node"], setup(props, { slots, attrs }) { const cn = useCn(); return () => h("thead", { class: cn("bg-muted/80", props.class), "data-streamdown": "table-header", ...attrs }, slots.default?.()); } });
const MarkdownTbody = defineComponent({ name: "MarkdownTbody", props: ["class", "node"], setup(props, { slots, attrs }) { const cn = useCn(); return () => h("tbody", { class: cn("divide-y divide-border", props.class), "data-streamdown": "table-body", ...attrs }, slots.default?.()); } });
const MarkdownTr = defineComponent({ name: "MarkdownTr", props: ["class", "node"], setup(props, { slots, attrs }) { const cn = useCn(); return () => h("tr", { class: cn("border-border", props.class), "data-streamdown": "table-row", ...attrs }, slots.default?.()); } });
const MarkdownTh = defineComponent({ name: "MarkdownTh", props: ["class", "node"], setup(props, { slots, attrs }) { const cn = useCn(); return () => h("th", { class: cn("whitespace-nowrap px-4 py-2 text-left font-semibold text-sm", props.class), "data-streamdown": "table-header-cell", ...attrs }, slots.default?.()); } });
const MarkdownTd = defineComponent({ name: "MarkdownTd", props: ["class", "node"], setup(props, { slots, attrs }) { const cn = useCn(); return () => h("td", { class: cn("px-4 py-2 text-sm", props.class), "data-streamdown": "table-cell", ...attrs }, slots.default?.()); } });

// ─── link ────────────────────────────────────────────────────────────────────

const MarkdownA = defineComponent({
  name: "MarkdownA",
  props: ["class", "node", "href"],
  setup(props, { slots, attrs }) {
    const cn = useCn();
    const { linkSafety } = useStreamdownContext();
    const isModalOpen = ref(false);
    const isIncomplete = () => props.href === "streamdown:incomplete-link";

    const handleClick = async (e: MouseEvent) => {
      const ls = linkSafety.value;
      if (!(ls?.enabled && props.href) || isIncomplete()) return;
      e.preventDefault();
      if (ls.onLinkCheck) {
        const allowed = await ls.onLinkCheck(props.href);
        if (allowed) { window.open(props.href, "_blank", "noreferrer"); return; }
      }
      isModalOpen.value = true;
    };
    const handleConfirm = () => { if (props.href) window.open(props.href, "_blank", "noreferrer"); };
    const handleClose = () => { isModalOpen.value = false; };

    return () => {
      const ls = linkSafety.value;
      if (ls?.enabled && props.href) {
        const modalProps = { url: props.href ?? "", isOpen: isModalOpen.value, onClose: handleClose, onConfirm: handleConfirm };
        const modal = ls.renderModal
          ? h(ls.renderModal as Component, modalProps)
          : h(LinkSafetyModal as Component, modalProps);
        return h("span", {}, [
          h("button", {
            class: cn("wrap-anywhere appearance-none text-left font-medium text-primary underline", props.class),
            "data-incomplete": isIncomplete(),
            "data-streamdown": "link",
            onClick: handleClick,
            type: "button",
          }, slots.default?.()),
          modal,
        ]);
      }
      return h("a", {
        class: cn("wrap-anywhere font-medium text-primary underline", props.class),
        "data-incomplete": isIncomplete(),
        "data-streamdown": "link",
        href: props.href,
        rel: "noreferrer",
        target: "_blank",
        ...attrs,
      }, slots.default?.());
    };
  },
});

// ─── pre (provides IS_BLOCK_CODE_KEY) ────────────────────────────────────────

const MarkdownPre = defineComponent({
  name: "MarkdownPre",
  props: ["node"],
  setup(_, { slots }) {
    provide(IS_BLOCK_CODE_KEY, true);
    return () => slots.default?.();
  },
});

// ─── code ─────────────────────────────────────────────────────────────────────

const MarkdownCode = defineComponent({
  name: "MarkdownCode",
  props: ["class", "node"],
  setup(props, { slots, attrs }) {
    const cn = useCn();
    const isBlock = inject(IS_BLOCK_CODE_KEY, false);
    const { mermaid: mermaidContext, controls: controlsConfig, lineNumbers: contextLineNumbers } = useStreamdownContext();
    const mermaidPlugin = useMermaidPlugin();
    const isBlockIncomplete = useIsBlockIncomplete();
    const customRenderer = useCustomRenderer(() => {
      const match = props.class?.match(LANGUAGE_REGEX);
      return match?.at(1) ?? "";
    });

    return () => {
      if (!isBlock) {
        return h("code", {
          class: cn("rounded bg-muted px-1.5 py-0.5 font-mono text-sm", props.class),
          "data-streamdown": "inline-code",
          ...attrs,
        }, slots.default?.());
      }

      const match = props.class?.match(LANGUAGE_REGEX);
      const language = match?.at(1) ?? "";
      const metastring = String((props.node as ExtraProps["node"])?.properties?.metastring ?? "");
      const startLineMatch = metastring ? metastring.match(START_LINE_PATTERN) : null;
      const parsedStartLine = startLineMatch ? Number.parseInt(startLineMatch[1], 10) : undefined;
      const startLine = parsedStartLine !== undefined && parsedStartLine >= 1 ? parsedStartLine : undefined;
      const metaNoLineNumbers = metastring ? NO_LINE_NUMBERS_PATTERN.test(metastring) : false;
      const showLineNumbers = !metaNoLineNumbers && contextLineNumbers.value !== false;

      // Extract code string from slot children
      let code = "";
      const defaultSlot = slots.default?.();
      if (defaultSlot) {
        for (const vnode of defaultSlot) {
          if (typeof vnode.children === "string") { code = vnode.children; break; }
          if (typeof vnode === "string") { code = vnode as unknown as string; break; }
        }
      }

      // Custom renderer
      if (customRenderer.value) {
        const CustomComponent = customRenderer.value.component as Component;
        return h(CustomComponent, { code, isIncomplete: isBlockIncomplete.value, language, meta: metastring });
      }

      // Mermaid
      if (language === "mermaid" && mermaidPlugin.value) {
        const cfg = controlsConfig.value;
        const showMermaidControls = shouldShowControls(cfg, "mermaid");
        const showDownload = shouldShowMermaidControl(cfg, "download");
        const showCopy = shouldShowMermaidControl(cfg, "copy");
        const showFullscreen = shouldShowMermaidControl(cfg, "fullscreen");
        const showPanZoom = shouldShowMermaidControl(cfg, "panZoom");
        const showAny = showMermaidControls && (showDownload || showCopy || showFullscreen);

        return h(Suspense, {}, {
          default: () => h("div", {
            class: cn("group relative my-4 flex w-full flex-col gap-2 rounded-xl border border-border bg-sidebar p-2"),
            "data-streamdown": "mermaid-block",
          }, [
            h("div", { class: cn("flex h-8 items-center text-muted-foreground text-xs") }, [
              h("span", { class: cn("ml-1 font-mono lowercase") }, "mermaid"),
            ]),
            showAny ? h("div", { class: cn("pointer-events-none sticky top-2 z-10 -mt-10 flex h-8 items-center justify-end") }, [
              h("div", { class: cn("pointer-events-auto flex shrink-0 items-center gap-2 rounded-md border border-sidebar bg-sidebar/80 px-1.5 py-1 supports-[backdrop-filter]:bg-sidebar/70 supports-[backdrop-filter]:backdrop-blur"), "data-streamdown": "mermaid-block-actions" }, [
                showDownload ? h(MermaidDownloadDropdown as Component, { chart: code, config: mermaidContext.value?.config }) : null,
                showCopy ? h(CodeBlockCopyButton as Component, { code }) : null,
                showFullscreen ? h(MermaidFullscreenButton as Component, { chart: code, config: mermaidContext.value?.config }) : null,
              ]),
            ]) : null,
            h("div", { class: cn("rounded-md border border-border bg-background") }, [
              h(MermaidAsync as Component, { chart: code, config: mermaidContext.value?.config, showControls: showPanZoom }),
            ]),
          ]),
          fallback: () => h(CodeBlockSkeleton as Component),
        });
      }

      // Regular code block
      const cfg = controlsConfig.value;
      const showCodeControls = shouldShowControls(cfg, "code");
      const showDownload = shouldShowCodeControl(cfg, "download");
      const showCopy = shouldShowCodeControl(cfg, "copy");

      return h(CodeBlock as Component, {
        class: props.class,
        code,
        isIncomplete: isBlockIncomplete.value,
        language,
        lineNumbers: showLineNumbers,
        startLine,
      }, showCodeControls ? {
        default: () => [
          showDownload ? h(CodeBlockDownloadButton as Component, { code, language }) : null,
          showCopy ? h(CodeBlockCopyButton as Component) : null,
        ],
      } : {});
    };
  },
});

// ─── img ─────────────────────────────────────────────────────────────────────

const MarkdownImg = defineComponent({
  name: "MarkdownImg",
  props: ["class", "node", "src", "alt"],
  setup(props, { attrs }) {
    return () => h(ImageComponent as Component, { class: props.class, src: props.src, alt: props.alt, node: props.node, ...attrs });
  },
});

// ─── paragraph ───────────────────────────────────────────────────────────────

const MarkdownP = defineComponent({
  name: "MarkdownP",
  props: ["class", "node"],
  setup(props, { slots, attrs }) {
    return () => {
      const children = slots.default?.() ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const valid = children.filter((c) => c != null && (c as any) !== "");
      if (valid.length === 1) {
        const child = valid[0];
        // @ts-ignore - check hast node on vnode props
        const childNode = child?.props?.node;
        const tagName = childNode?.tagName;
        if (tagName === "img" || tagName === "code") return h("span", {}, children);
      }
      return h("p", attrs, children);
    };
  },
});

// ─── section ─────────────────────────────────────────────────────────────────

const MarkdownSection = defineComponent({
  name: "MarkdownSection",
  props: ["class", "node"],
  setup(props, { slots, attrs }) {
    return () => h("section", { class: props.class, ...attrs }, slots.default?.());
  },
});

// ─── export ──────────────────────────────────────────────────────────────────

export const components: Options["components"] = {
  ol: MarkdownOl,
  ul: MarkdownUl,
  li: MarkdownLi,
  hr: MarkdownHr,
  strong: MarkdownStrong,
  a: MarkdownA,
  h1: MarkdownH1,
  h2: MarkdownH2,
  h3: MarkdownH3,
  h4: MarkdownH4,
  h5: MarkdownH5,
  h6: MarkdownH6,
  table: MarkdownTable,
  thead: MarkdownThead,
  tbody: MarkdownTbody,
  tr: MarkdownTr,
  th: MarkdownTh,
  td: MarkdownTd,
  blockquote: MarkdownBlockquote,
  code: MarkdownCode,
  img: MarkdownImg,
  pre: MarkdownPre,
  sup: MarkdownSup,
  sub: MarkdownSub,
  p: MarkdownP,
  section: MarkdownSection,
};
