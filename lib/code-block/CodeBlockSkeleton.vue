<script setup lang="ts">
import { useIcons, useCn } from "../../composables/index";

const { Loader2Icon } = useIcons();
const cn = useCn();
</script>

<template>
  <div :class="cn('w-full divide-y divide-border overflow-hidden rounded-xl border border-border')">
    <div :class="cn('h-[46px] w-full bg-muted/80')" />
    <div :class="cn('flex w-full items-center justify-center p-4')">
      <component :is="Loader2Icon" :class="cn('size-4 animate-spin')" />
    </div>
  </div>
</template>
