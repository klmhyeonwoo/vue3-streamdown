<script setup lang="ts">
import { computed, onBeforeUpdate, provide } from "vue";
import { Markdown } from "./lib/markdown";
import { BLOCK_INCOMPLETE_KEY } from "./composables/index";
import { normalizeHtmlIndentation } from "./lib/utils";
import type { AnimatePlugin } from "./lib/animate";
import type { Options } from "./lib/markdown";

const props = defineProps<{
  content: string;
  isIncomplete: boolean;
  shouldNormalizeHtmlIndentation: boolean;
  dir?: "ltr" | "rtl";
  animatePlugin?: AnimatePlugin | null;
  components?: Options["components"];
  rehypePlugins?: Options["rehypePlugins"];
  remarkPlugins?: Options["remarkPlugins"];
}>();

provide(BLOCK_INCOMPLETE_KEY, computed(() => props.isIncomplete));

// Mirror React's render-body side effect: capture the previous render's char
// count before each update so the animate plugin can compute diffs.
onBeforeUpdate(() => {
  if (props.animatePlugin) {
    const prevCount = props.animatePlugin.getLastRenderCharCount();
    props.animatePlugin.setPrevContentLength(prevCount);
  }
});

const normalizedContent = computed(() => {
  if (props.shouldNormalizeHtmlIndentation) {
    return normalizeHtmlIndentation(props.content);
  }
  return props.content;
});
</script>

<template>
  <div v-if="dir" :dir="dir" style="display: contents">
    <Markdown
      :components="components"
      :rehypePlugins="rehypePlugins"
      :remarkPlugins="remarkPlugins"
    >{{ normalizedContent }}</Markdown>
  </div>
  <Markdown
    v-else
    :components="components"
    :rehypePlugins="rehypePlugins"
    :remarkPlugins="remarkPlugins"
  >{{ normalizedContent }}</Markdown>
</template>
