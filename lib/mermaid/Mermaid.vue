<script setup lang="ts">
import { ref, watch } from "vue";
import type { MermaidConfig } from "mermaid";
import { useCn, useStreamdownContext, useMermaidPlugin } from "../../composables/index";
import { useDeferredRender } from "../../hooks/useDeferredRender";
import PanZoom from "./PanZoom.vue";

const props = withDefaults(defineProps<{
  chart: string;
  class?: string;
  config?: MermaidConfig;
  fullscreen?: boolean;
  showControls?: boolean;
}>(), {
  fullscreen: false,
  showControls: true,
});

const cn = useCn();
const { mermaid: mermaidContext } = useStreamdownContext();
const mermaidPlugin = useMermaidPlugin();

const error = ref<string | null>(null);
const isLoading = ref(false);
const svgContent = ref("");
const lastValidSvg = ref("");
const retryCount = ref(0);

const { shouldRender, containerRef } = useDeferredRender({ immediate: props.fullscreen });

const renderChart = async () => {
  if (!shouldRender.value) return;

  if (!mermaidPlugin.value) {
    error.value = "Mermaid plugin not available. Please add the mermaid plugin to enable diagram rendering.";
    return;
  }

  try {
    error.value = null;
    isLoading.value = true;
    const mermaid = mermaidPlugin.value.getMermaid(props.config);
    const chartHash = props.chart.split("").reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
    const uniqueId = `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const { svg } = await mermaid.render(uniqueId, props.chart);
    svgContent.value = svg;
    lastValidSvg.value = svg;
  } catch (err) {
    if (!(lastValidSvg.value || svgContent.value)) {
      error.value = err instanceof Error ? err.message : "Failed to render Mermaid chart";
    }
  } finally {
    isLoading.value = false;
  }
};

watch([() => props.chart, () => props.config, retryCount, shouldRender, mermaidPlugin], renderChart, { immediate: true });

const retry = () => { retryCount.value++; };
const displaySvg = () => svgContent.value || lastValidSvg.value;
</script>

<template>
  <!-- Placeholder: not yet scheduled to render -->
  <div
    v-if="!(shouldRender || svgContent || lastValidSvg)"
    :class="cn('my-4 min-h-[200px]', $props.class)"
    ref="containerRef"
  />

  <!-- Loading -->
  <div
    v-else-if="isLoading && !svgContent && !lastValidSvg"
    :class="cn('my-4 flex justify-center p-4', $props.class)"
    ref="containerRef"
  >
    <div :class="cn('flex items-center space-x-2 text-muted-foreground')">
      <div :class="cn('h-4 w-4 animate-spin rounded-full border-current border-b-2')" />
      <span :class="cn('text-sm')">Loading diagram...</span>
    </div>
  </div>

  <!-- Error: custom component -->
  <div
    v-else-if="error && !svgContent && !lastValidSvg && mermaidContext?.errorComponent"
    ref="containerRef"
  >
    <component :is="mermaidContext.errorComponent" :chart="chart" :error="error" :retry="retry" />
  </div>

  <!-- Error: default -->
  <div
    v-else-if="error && !svgContent && !lastValidSvg"
    :class="cn('rounded-md bg-red-50 p-4', $props.class)"
    ref="containerRef"
  >
    <p :class="cn('font-mono text-red-700 text-sm')">Mermaid Error: {{ error }}</p>
    <details :class="cn('mt-2')">
      <summary :class="cn('cursor-pointer text-red-600 text-xs')">Show Code</summary>
      <pre :class="cn('mt-2 overflow-x-auto rounded bg-red-100 p-2 text-red-800 text-xs')">{{ chart }}</pre>
    </details>
  </div>

  <!-- Rendered SVG -->
  <div
    v-else
    :class="cn('size-full', $props.class)"
    data-streamdown="mermaid"
    ref="containerRef"
  >
    <PanZoom
      :class="cn(fullscreen ? 'size-full overflow-hidden' : 'overflow-hidden', $props.class)"
      :fullscreen="fullscreen"
      :maxZoom="3"
      :minZoom="0.5"
      :showControls="showControls"
      :zoomStep="0.1"
    >
      <div
        aria-label="Mermaid chart"
        :class="cn('flex justify-center', fullscreen ? 'size-full items-center' : null)"
        v-html="displaySvg()"
        role="img"
      />
    </PanZoom>
  </div>
</template>
