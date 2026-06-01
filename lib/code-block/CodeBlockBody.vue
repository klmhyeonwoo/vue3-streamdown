<script setup lang="ts">
import { computed } from "vue";
import type { HighlightResult } from "../plugin-types";
import { useCn } from "../../composables/index";
import { cn as baseCn } from "../utils";

const props = withDefaults(defineProps<{
  result: HighlightResult;
  language: string;
  startLine?: number;
  lineNumbers?: boolean;
  class?: string;
}>(), {
  lineNumbers: true,
});

const cn = useCn();

const parseRootStyle = (rootStyle: string): Record<string, string> => {
  const style: Record<string, string> = {};
  for (const decl of rootStyle.split(";")) {
    const idx = decl.indexOf(":");
    if (idx > 0) {
      const prop = decl.slice(0, idx).trim();
      const val = decl.slice(idx + 1).trim();
      if (prop && val) {
        style[prop] = val;
      }
    }
  }
  return style;
};

const preStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.result.bg) style["--sdm-bg"] = props.result.bg;
  if (props.result.fg) style["--sdm-fg"] = props.result.fg;
  if (props.result.rootStyle) Object.assign(style, parseRootStyle(props.result.rootStyle));
  return style;
});

const codeStyle = computed(() => {
  if (props.lineNumbers && props.startLine && props.startLine > 1) {
    return { counterReset: `line ${props.startLine - 1}` };
  }
  return undefined;
});

const isEmptyRow = (row: HighlightResult["tokens"][number]) =>
  row.length === 0 || (row.length === 1 && row[0].content === "");

const getTokenStyle = (token: HighlightResult["tokens"][number][number]) => {
  const tokenStyle: Record<string, string> = {};
  if (token.color) tokenStyle["--sdm-c"] = token.color;
  if (token.bgColor) tokenStyle["--sdm-tbg"] = token.bgColor;
  if (token.htmlStyle) {
    for (const [key, value] of Object.entries(token.htmlStyle)) {
      if (key === "color") tokenStyle["--sdm-c"] = value as string;
      else if (key === "background-color") tokenStyle["--sdm-tbg"] = value as string;
      else tokenStyle[key] = value as string;
    }
  }
  return tokenStyle;
};

const tokenHasBg = (token: HighlightResult["tokens"][number][number]) => {
  if (token.bgColor) return true;
  if (token.htmlStyle && "background-color" in token.htmlStyle) return true;
  return false;
};
</script>

<template>
  <div
    :class="cn($props.class, 'overflow-x-auto rounded-md border border-border bg-background p-4 text-sm')"
    :data-language="language"
    data-streamdown="code-block-body"
  ><pre
      :class="cn($props.class, 'bg-[var(--sdm-bg,inherit)]', 'dark:bg-[var(--shiki-dark-bg,var(--sdm-bg,inherit))]')"
      :style="preStyle"
    ><code
        :class="lineNumbers ? 'sdm-line-numbers' : undefined"
        :style="codeStyle"
      ><span
          v-for="(row, index) in result.tokens"
          :key="index"
          :class="lineNumbers ? 'sdm-line' : undefined"
        ><template v-if="isEmptyRow(row)"></template><template v-else><span
              v-for="(token, tokenIndex) in row"
              :key="tokenIndex"
              :class="cn(
                'text-[var(--sdm-c,inherit)]',
                'dark:text-[var(--shiki-dark,var(--sdm-c,inherit))]',
                tokenHasBg(token) ? 'bg-[var(--sdm-tbg)]' : '',
                tokenHasBg(token) ? 'dark:bg-[var(--shiki-dark-bg,var(--sdm-tbg))]' : ''
              )"
              :style="getTokenStyle(token)"
              v-bind="token.htmlAttrs"
            >{{ token.content }}</span></template>
</span></code></pre></div>
</template>

<style scoped>
.sdm-line-numbers {
  counter-reset: line;
}

.sdm-line {
  display: block;
  counter-increment: line;
  line-height: 1.5;
}

.sdm-line::before {
  content: counter(line);
  display: inline-block;
  min-width: 1.5rem;
  margin-right: 1rem;
  font-size: 0.8em;
  text-align: right;
  opacity: 0.4;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  user-select: none;
}
</style>
