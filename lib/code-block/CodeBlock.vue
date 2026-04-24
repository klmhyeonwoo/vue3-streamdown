<script setup lang="ts">
import { computed, defineAsyncComponent, provide } from "vue";
import type { HighlightResult } from "../plugin-types";
import { useCn, CODE_BLOCK_KEY } from "../../composables/index";
import CodeBlockContainer from "./CodeBlockContainer.vue";
import CodeBlockHeader from "./CodeBlockHeader.vue";
import CodeBlockBody from "./CodeBlockBody.vue";
import CodeBlockSkeleton from "./CodeBlockSkeleton.vue";

const HighlightedCodeBlockBody = defineAsyncComponent({
  loader: () => import("./HighlightedCodeBlockBody.vue"),
  loadingComponent: CodeBlockSkeleton,
});

const props = withDefaults(defineProps<{
  code: string;
  language: string;
  isIncomplete?: boolean;
  startLine?: number;
  lineNumbers?: boolean;
  class?: string;
}>(), {
  isIncomplete: false,
});

const cn = useCn();

// provide code to children (copy/download buttons)
provide(CODE_BLOCK_KEY, { code: computed(() => props.code) });

const trimTrailingNewlines = (str: string): string => {
  let end = str.length;
  while (end > 0 && str[end - 1] === "\n") end--;
  return str.slice(0, end);
};

const trimmedCode = computed(() => trimTrailingNewlines(props.code));

const raw = computed<HighlightResult>(() => ({
  bg: "transparent",
  fg: "inherit",
  tokens: trimmedCode.value.split("\n").map((line) => [
    { content: line, color: "inherit", bgColor: "transparent", htmlStyle: {}, offset: 0 },
  ]),
}));
</script>

<template>
  <CodeBlockContainer :language="language" :isIncomplete="isIncomplete">
    <CodeBlockHeader :language="language" />
    <div
      v-if="$slots.default"
      :class="cn('pointer-events-none sticky top-2 z-10 -mt-10 flex h-8 items-center justify-end')"
    >
      <div
        :class="cn('pointer-events-auto flex shrink-0 items-center gap-2 rounded-md border border-sidebar bg-sidebar/80 px-1.5 py-1 supports-[backdrop-filter]:bg-sidebar/70 supports-[backdrop-filter]:backdrop-blur')"
        data-streamdown="code-block-actions"
      >
        <slot />
      </div>
    </div>
    <Suspense>
      <template #default>
        <HighlightedCodeBlockBody
          :class="$props.class"
          :code="trimmedCode"
          :language="language"
          :lineNumbers="lineNumbers"
          :raw="raw"
          :startLine="startLine"
        />
      </template>
      <template #fallback>
        <CodeBlockBody
          :class="$props.class"
          :language="language"
          :lineNumbers="lineNumbers"
          :result="raw"
          :startLine="startLine"
        />
      </template>
    </Suspense>
  </CodeBlockContainer>
</template>
