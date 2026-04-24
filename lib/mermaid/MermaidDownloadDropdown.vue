<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { MermaidConfig } from "mermaid";
import { useCn, useIcons, useTranslations, useStreamdownContext, useMermaidPlugin } from "../../composables/index";
import { save } from "../utils";
import { svgToPngBlob } from "./utils";

const props = defineProps<{
  chart: string;
  class?: string;
  config?: MermaidConfig;
  onDownload?: (format: "mmd" | "png" | "svg") => void;
  onError?: (error: Error) => void;
}>();

const cn = useCn();
const icons = useIcons();
const t = useTranslations();
const { isAnimating } = useStreamdownContext();
const mermaidPlugin = useMermaidPlugin();

const isOpen = ref(false);
const dropdownRef = ref<HTMLDivElement | null>(null);

const downloadMermaid = async (format: "mmd" | "png" | "svg") => {
  try {
    if (format === "mmd") {
      save("diagram.mmd", props.chart, "text/plain");
      isOpen.value = false;
      props.onDownload?.(format);
      return;
    }
    if (!mermaidPlugin.value) {
      props.onError?.(new Error("Mermaid plugin not available"));
      return;
    }
    const mermaid = mermaidPlugin.value.getMermaid(props.config);
    const chartHash = props.chart.split("").reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
    const uniqueId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const { svg } = await mermaid.render(uniqueId, props.chart);
    if (!svg) { props.onError?.(new Error("SVG not found.")); return; }
    if (format === "svg") { save("diagram.svg", svg, "image/svg+xml"); isOpen.value = false; props.onDownload?.(format); return; }
    if (format === "png") { const blob = await svgToPngBlob(svg); save("diagram.png", blob, "image/png"); props.onDownload?.(format); isOpen.value = false; }
  } catch (error) { props.onError?.(error as Error); }
};

const handleClickOutside = (event: MouseEvent) => {
  const path = event.composedPath();
  if (dropdownRef.value && !path.includes(dropdownRef.value)) isOpen.value = false;
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
      :title="t.downloadDiagram"
      type="button"
    >
      <slot><component :is="icons.DownloadIcon" :size="14" /></slot>
    </button>
    <div
      v-if="isOpen"
      :class="cn('absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg')"
    >
      <button :class="cn('w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40')" @click="downloadMermaid('svg')" :title="t.downloadDiagramAsSvg" type="button">{{ t.mermaidFormatSvg }}</button>
      <button :class="cn('w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40')" @click="downloadMermaid('png')" :title="t.downloadDiagramAsPng" type="button">{{ t.mermaidFormatPng }}</button>
      <button :class="cn('w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40')" @click="downloadMermaid('mmd')" :title="t.downloadDiagramAsMmd" type="button">{{ t.mermaidFormatMmd }}</button>
    </div>
  </div>
</template>
