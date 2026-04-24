<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useCn, useIcons, useTranslations, useStreamdownContext } from "../../composables/index";
import {
  extractTableDataFromElement,
  tableDataToCSV,
  tableDataToMarkdown,
  tableDataToTSV,
} from "./utils";

const props = withDefaults(defineProps<{
  onCopy?: (format: "csv" | "tsv" | "md") => void;
  onError?: (error: Error) => void;
  timeout?: number;
  class?: string;
}>(), { timeout: 2000 });

const cn = useCn();
const t = useTranslations();
const { isAnimating } = useStreamdownContext();
const icons = useIcons();

const isOpen = ref(false);
const isCopied = ref(false);
const dropdownRef = ref<HTMLDivElement | null>(null);
let timeoutId = 0;

const copyTableData = async (format: "csv" | "tsv" | "md") => {
  if (typeof window === "undefined" || !navigator?.clipboard?.write) {
    props.onError?.(new Error("Clipboard API not available"));
    return;
  }
  try {
    const tableWrapper = dropdownRef.value?.closest('[data-streamdown="table-wrapper"]');
    const tableElement = tableWrapper?.querySelector("table") as HTMLTableElement;
    if (!tableElement) { props.onError?.(new Error("Table not found")); return; }

    const tableData = extractTableDataFromElement(tableElement);
    const formatters = { csv: tableDataToCSV, tsv: tableDataToTSV, md: tableDataToMarkdown };
    const content = formatters[format](tableData);

    const clipboardItemData = new ClipboardItem({
      "text/plain": new Blob([content], { type: "text/plain" }),
      "text/html": new Blob([tableElement.outerHTML], { type: "text/html" }),
    });
    await navigator.clipboard.write([clipboardItemData]);
    isCopied.value = true;
    isOpen.value = false;
    props.onCopy?.(format);
    timeoutId = window.setTimeout(() => { isCopied.value = false; }, props.timeout);
  } catch (error) { props.onError?.(error as Error); }
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !event.composedPath().includes(dropdownRef.value)) isOpen.value = false;
};
onMounted(() => document.addEventListener("mousedown", handleClickOutside));
onUnmounted(() => { document.removeEventListener("mousedown", handleClickOutside); window.clearTimeout(timeoutId); });
</script>

<template>
  <div :class="cn('relative')" ref="dropdownRef">
    <button
      :class="cn('cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50', $props.class)"
      :disabled="isAnimating"
      @click="isOpen = !isOpen"
      :title="t.copyTable"
      type="button"
    >
      <slot>
        <component :is="isCopied ? icons.CheckIcon : icons.CopyIcon" :height="14" :width="14" />
      </slot>
    </button>
    <div
      v-if="isOpen"
      :class="cn('absolute top-full right-0 z-20 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg')"
    >
      <button :class="cn('w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40')" @click="copyTableData('md')" :title="t.copyTableAsMarkdown" type="button">{{ t.tableFormatMarkdown }}</button>
      <button :class="cn('w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40')" @click="copyTableData('csv')" :title="t.copyTableAsCsv" type="button">{{ t.tableFormatCsv }}</button>
      <button :class="cn('w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40')" @click="copyTableData('tsv')" :title="t.copyTableAsTsv" type="button">{{ t.tableFormatTsv }}</button>
    </div>
  </div>
</template>
