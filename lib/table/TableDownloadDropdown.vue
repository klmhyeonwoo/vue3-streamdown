<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useCn, useIcons, useTranslations, useStreamdownContext } from "../../composables/index";
import { save } from "../utils";
import { extractTableDataFromElement, tableDataToCSV, tableDataToMarkdown } from "./utils";

const props = defineProps<{
  onDownload?: (format: "csv" | "markdown") => void;
  onError?: (error: Error) => void;
  class?: string;
}>();

const cn = useCn();
const t = useTranslations();
const { isAnimating } = useStreamdownContext();
const icons = useIcons();

const isOpen = ref(false);
const dropdownRef = ref<HTMLDivElement | null>(null);

const downloadTableData = (format: "csv" | "markdown") => {
  try {
    const tableWrapper = dropdownRef.value?.closest('[data-streamdown="table-wrapper"]');
    const tableElement = tableWrapper?.querySelector("table") as HTMLTableElement;
    if (!tableElement) { props.onError?.(new Error("Table not found")); return; }

    const tableData = extractTableDataFromElement(tableElement);
    const content = format === "csv" ? tableDataToCSV(tableData) : tableDataToMarkdown(tableData);
    const extension = format === "csv" ? "csv" : "md";
    save(`table.${extension}`, content, format === "csv" ? "text/csv" : "text/markdown");
    isOpen.value = false;
    props.onDownload?.(format);
  } catch (error) { props.onError?.(error as Error); }
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !event.composedPath().includes(dropdownRef.value)) isOpen.value = false;
};
onMounted(() => document.addEventListener("mousedown", handleClickOutside));
onUnmounted(() => document.removeEventListener("mousedown", handleClickOutside));
</script>

<template>
  <div :class="cn('relative')" ref="dropdownRef">
    <button
      :class="cn('cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50', $props.class)"
      :disabled="isAnimating"
      @click="isOpen = !isOpen"
      :title="t.downloadTable"
      type="button"
    >
      <slot><component :is="icons.DownloadIcon" :size="14" /></slot>
    </button>
    <div
      v-if="isOpen"
      :class="cn('absolute top-full right-0 z-20 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg')"
    >
      <button :class="cn('w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40')" @click="downloadTableData('csv')" :title="t.downloadTableAsCsv" type="button">{{ t.tableFormatCsv }}</button>
      <button :class="cn('w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40')" @click="downloadTableData('markdown')" :title="t.downloadTableAsMarkdown" type="button">{{ t.tableFormatMarkdown }}</button>
    </div>
  </div>
</template>
