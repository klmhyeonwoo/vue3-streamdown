<script setup lang="ts">
import { useCn } from "../../composables/index";

defineProps<{
  language: string;
  isIncomplete?: boolean;
  class?: string;
}>();
const cn = useCn();
</script>

<template>
  <div
    :class="cn('my-4 flex w-full flex-col gap-2 rounded-xl border border-border bg-sidebar p-2', $props.class)"
    :data-incomplete="isIncomplete || undefined"
    :data-language="language"
    data-streamdown="code-block"
    :style="{ contentVisibility: 'auto', containIntrinsicSize: 'auto 200px' }"
  >
    <slot />
  </div>
</template>
