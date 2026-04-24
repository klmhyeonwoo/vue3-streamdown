<script setup lang="ts">
import { useCn } from "../../composables/index";

defineProps<{ language: string }>();
const cn = useCn();
</script>

<template>
  <div
    :class="cn('flex h-8 items-center text-muted-foreground text-xs')"
    :data-language="language"
    data-streamdown="code-block-header"
  >
    <span :class="cn('ml-1 font-mono lowercase')">{{ language }}</span>
  </div>
</template>
