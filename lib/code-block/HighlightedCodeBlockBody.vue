<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import type { BundledLanguage } from "shiki";
import type { HighlightResult } from "../plugin-types";
import { useStreamdownContext, useCodePlugin } from "../../composables/index";
import CodeBlockBody from "./CodeBlockBody.vue";

const props = defineProps<{
  code: string;
  language: string;
  raw: HighlightResult;
  startLine?: number;
  lineNumbers?: boolean;
  class?: string;
}>();

const { shikiTheme } = useStreamdownContext();
const codePlugin = useCodePlugin();
const result = ref<HighlightResult>(props.raw);

let cleanup: (() => void) | undefined;

const runHighlight = () => {
  cleanup?.();
  if (!codePlugin.value) {
    result.value = props.raw;
    return;
  }
  const cachedResult = codePlugin.value.highlight(
    {
      code: props.code,
      language: props.language as BundledLanguage,
      themes: shikiTheme.value,
    },
    (highlightedResult) => {
      result.value = highlightedResult;
    }
  );
  if (cachedResult) result.value = cachedResult;
};

watch([() => props.code, () => props.language, shikiTheme, codePlugin], runHighlight, { immediate: true });

onUnmounted(() => cleanup?.());
</script>

<template>
  <CodeBlockBody
    :class="$props.class"
    :language="language"
    :lineNumbers="lineNumbers"
    :result="result"
    :startLine="startLine"
  />
</template>
