<script setup lang="ts">
import { computed } from "vue";
import { useCn } from "../../composables/index";
import TableCopyDropdown from "./TableCopyDropdown.vue";
import TableDownloadDropdown from "./TableDownloadDropdown.vue";
import TableFullscreenButton from "./TableFullscreenButton.vue";

const props = withDefaults(defineProps<{
  showControls?: boolean;
  showCopy?: boolean;
  showDownload?: boolean;
  showFullscreen?: boolean;
  class?: string;
}>(), {
  showCopy: true,
  showDownload: true,
  showFullscreen: true,
});

const cn = useCn();

const hasCopy = computed(() => props.showControls && props.showCopy);
const hasDownload = computed(() => props.showControls && props.showDownload);
const hasFullscreen = computed(() => props.showControls && props.showFullscreen);
const hasAnyControl = computed(() => hasCopy.value || hasDownload.value || hasFullscreen.value);
</script>

<template>
  <div
    :class="cn('my-4 flex flex-col gap-2 rounded-lg border border-border bg-sidebar p-2')"
    data-streamdown="table-wrapper"
  >
    <div v-if="hasAnyControl" :class="cn('flex items-center justify-end gap-1')">
      <TableCopyDropdown v-if="hasCopy" />
      <TableDownloadDropdown v-if="hasDownload" />
      <TableFullscreenButton v-if="hasFullscreen" :showCopy="hasCopy" :showDownload="hasDownload">
        <slot />
      </TableFullscreenButton>
    </div>
    <div :class="cn('border-collapse overflow-x-auto overflow-y-auto rounded-md border border-border bg-background')">
      <table
        :class="cn('w-full divide-y divide-border', $props.class)"
        data-streamdown="table"
      >
        <slot />
      </table>
    </div>
  </div>
</template>
