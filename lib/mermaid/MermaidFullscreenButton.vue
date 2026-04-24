<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import type { MermaidConfig } from "mermaid";
import { useCn, useIcons, useTranslations, useStreamdownContext } from "../../composables/index";
import { lockBodyScroll, unlockBodyScroll } from "../scroll-lock";
import Mermaid from "./Mermaid.vue";

const props = defineProps<{
  chart: string;
  config?: MermaidConfig;
  onFullscreen?: () => void;
  onExit?: () => void;
  class?: string;
}>();

const cn = useCn();
const { Maximize2Icon, XIcon } = useIcons();
const t = useTranslations();
const { isAnimating, controls: controlsConfig } = useStreamdownContext();

const isFullscreen = ref(false);

const showPanZoomControls = (() => {
  const cfg = controlsConfig.value;
  if (typeof cfg === "boolean") return cfg;
  const mermaidCtl = cfg?.mermaid;
  if (mermaidCtl === false) return false;
  if (mermaidCtl === true || mermaidCtl === undefined) return true;
  return (mermaidCtl as Record<string, unknown>).panZoom !== false;
})();

const handleToggle = () => { isFullscreen.value = !isFullscreen.value; };

const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") isFullscreen.value = false; };

watch(isFullscreen, (v) => {
  if (v) {
    lockBodyScroll();
    document.addEventListener("keydown", handleEsc);
    props.onFullscreen?.();
  } else {
    document.removeEventListener("keydown", handleEsc);
    unlockBodyScroll();
    props.onExit?.();
  }
});

onUnmounted(() => { document.removeEventListener("keydown", handleEsc); });
</script>

<template>
  <button
    :class="cn('cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50', $props.class)"
    :disabled="isAnimating"
    @click="handleToggle"
    :title="t.viewFullscreen"
    type="button"
  >
    <component :is="Maximize2Icon" :size="14" />
  </button>

  <Teleport to="body" v-if="isFullscreen">
    <div
      :class="cn('fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm')"
      @click="handleToggle"
      @keydown.escape="handleToggle"
      role="button"
      tabindex="0"
    >
      <button
        :class="cn('absolute top-4 right-4 z-10 rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground')"
        @click="handleToggle"
        :title="t.exitFullscreen"
        type="button"
      >
        <component :is="XIcon" :size="20" />
      </button>
      <div
        :class="cn('flex size-full items-center justify-center p-4')"
        @click.stop
        @keydown.stop
        role="presentation"
      >
        <Mermaid
          :chart="chart"
          :class="cn('size-full [&_svg]:h-auto [&_svg]:w-auto')"
          :config="config"
          :fullscreen="true"
          :showControls="showPanZoomControls"
        />
      </div>
    </div>
  </Teleport>
</template>
