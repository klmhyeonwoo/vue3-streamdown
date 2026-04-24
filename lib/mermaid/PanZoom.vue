<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import { useCn, useIcons } from "../../composables/index";

const props = withDefaults(defineProps<{
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  showControls?: boolean;
  initialZoom?: number;
  fullscreen?: boolean;
  class?: string;
}>(), {
  minZoom: 0.5,
  maxZoom: 3,
  zoomStep: 0.1,
  showControls: true,
  initialZoom: 1,
  fullscreen: false,
});

const cn = useCn();
const icons = useIcons();

const zoom = ref(props.initialZoom);
const pan = ref({ x: 0, y: 0 });
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });
const panStartPosition = ref({ x: 0, y: 0 });

const containerRef = ref<HTMLDivElement | null>(null);
const contentRef = ref<HTMLDivElement | null>(null);

const handleZoom = (delta: number) => {
  zoom.value = Math.max(props.minZoom, Math.min(props.maxZoom, zoom.value + delta));
};
const handleZoomIn = () => handleZoom(props.zoomStep);
const handleZoomOut = () => handleZoom(-props.zoomStep);
const handleReset = () => { zoom.value = props.initialZoom; pan.value = { x: 0, y: 0 }; };

const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  handleZoom(e.deltaY > 0 ? -props.zoomStep : props.zoomStep);
};

const handlePointerDown = (e: PointerEvent) => {
  if (e.button !== 0 || e.isPrimary === false) return;
  isPanning.value = true;
  panStart.value = { x: e.clientX, y: e.clientY };
  panStartPosition.value = { ...pan.value };
  (e.currentTarget as HTMLElement)?.setPointerCapture(e.pointerId);
};

const handlePointerMove = (e: PointerEvent) => {
  if (!isPanning.value) return;
  e.preventDefault();
  pan.value = {
    x: panStartPosition.value.x + (e.clientX - panStart.value.x),
    y: panStartPosition.value.y + (e.clientY - panStart.value.y),
  };
};

const handlePointerUp = (e: PointerEvent) => {
  isPanning.value = false;
  (e.currentTarget as HTMLElement)?.releasePointerCapture(e.pointerId);
};

// Wheel event (passive: false)
watch(containerRef, (el, old) => {
  old?.removeEventListener("wheel", handleWheel);
  el?.addEventListener("wheel", handleWheel, { passive: false });
});
onUnmounted(() => containerRef.value?.removeEventListener("wheel", handleWheel));

// Panning events
watch([isPanning, contentRef], ([panning, content]) => {
  if (!content) return;
  if (panning) {
    document.body.style.userSelect = "none";
    content.addEventListener("pointermove", handlePointerMove, { passive: false });
    content.addEventListener("pointerup", handlePointerUp);
    content.addEventListener("pointercancel", handlePointerUp);
  } else {
    document.body.style.userSelect = "";
    content.removeEventListener("pointermove", handlePointerMove);
    content.removeEventListener("pointerup", handlePointerUp);
    content.removeEventListener("pointercancel", handlePointerUp);
  }
});

const contentStyle = computed(() => ({
  transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})`,
  transformOrigin: "center center",
  touchAction: "none",
  willChange: "transform",
}));
</script>

<template>
  <div
    :class="cn('relative flex flex-col', fullscreen ? 'h-full w-full' : 'min-h-28 w-full', $props.class)"
    ref="containerRef"
    :style="{ cursor: isPanning ? 'grabbing' : 'grab' }"
  >
    <div
      v-if="showControls"
      :class="cn('absolute z-10 flex flex-col gap-1 rounded-md border border-border bg-background/80 p-1 supports-[backdrop-filter]:bg-background/70 supports-[backdrop-filter]:backdrop-blur-sm', fullscreen ? 'bottom-4 left-4' : 'bottom-2 left-2')"
    >
      <button :class="cn('flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50')" :disabled="zoom >= maxZoom" @click="handleZoomIn" title="Zoom in" type="button">
        <component :is="icons.ZoomInIcon" :size="16" />
      </button>
      <button :class="cn('flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50')" :disabled="zoom <= minZoom" @click="handleZoomOut" title="Zoom out" type="button">
        <component :is="icons.ZoomOutIcon" :size="16" />
      </button>
      <button :class="cn('flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground')" @click="handleReset" title="Reset zoom and pan" type="button">
        <component :is="icons.RotateCcwIcon" :size="16" />
      </button>
    </div>
    <div
      :class="cn('flex-1 origin-center transition-transform duration-150 ease-out', fullscreen ? 'flex h-full w-full items-center justify-center' : 'flex w-full items-center justify-center')"
      @pointerdown="handlePointerDown"
      ref="contentRef"
      role="application"
      :style="contentStyle"
    >
      <slot />
    </div>
  </div>
</template>
