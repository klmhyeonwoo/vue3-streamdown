<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import { useIcons, useCn, useTranslations, useStreamdownContext, useCodeBlock } from "../../composables/index";

const props = withDefaults(defineProps<{
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
  code?: string;
  class?: string;
}>(), {
  timeout: 2000,
});

const cn = useCn();
const icons = useIcons();
const t = useTranslations();
const { isAnimating } = useStreamdownContext();
const { code: contextCode } = useCodeBlock();

const isCopied = ref(false);
let timeoutId = 0;

const copyToClipboard = async () => {
  if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
    props.onError?.(new Error("Clipboard API not available"));
    return;
  }
  const code = props.code ?? contextCode.value;
  try {
    if (!isCopied.value) {
      await navigator.clipboard.writeText(code);
      isCopied.value = true;
      props.onCopy?.();
      timeoutId = window.setTimeout(() => { isCopied.value = false; }, props.timeout);
    }
  } catch (error) {
    props.onError?.(error as Error);
  }
};

onUnmounted(() => { window.clearTimeout(timeoutId); });
</script>

<template>
  <button
    :class="cn('cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50', $props.class)"
    data-streamdown="code-block-copy-button"
    :disabled="isAnimating"
    @click="copyToClipboard"
    :title="t.copyCode"
    type="button"
  >
    <slot>
      <component :is="isCopied ? icons.CheckIcon : icons.CopyIcon" :size="14" />
    </slot>
  </button>
</template>
