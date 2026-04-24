<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import { useCn, useIcons, useTranslations, useStreamdownContext } from "../../composables/index";
import { lockBodyScroll, unlockBodyScroll } from "../scroll-lock";
import TableCopyDropdown from "./TableCopyDropdown.vue";
import TableDownloadDropdown from "./TableDownloadDropdown.vue";

const props = withDefaults(defineProps<{
  showCopy?: boolean;
  showDownload?: boolean;
  class?: string;
}>(), { showCopy: true, showDownload: true });

const cn = useCn();
const { Maximize2Icon, XIcon } = useIcons();
const t = useTranslations();
const { isAnimating } = useStreamdownContext();

const isFullscreen = ref(false);

const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") isFullscreen.value = false; };

watch(isFullscreen, (v) => {
  if (v) { lockBodyScroll(); document.addEventListener("keydown", handleEsc); }
  else { document.removeEventListener("keydown", handleEsc); unlockBodyScroll(); }
});
onUnmounted(() => document.removeEventListener("keydown", handleEsc));
</script>

<template>
  <button
    :class="cn('cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50', $props.class)"
    :disabled="isAnimating"
    @click="isFullscreen = true"
    :title="t.viewFullscreen"
    type="button"
  >
    <component :is="Maximize2Icon" :size="14" />
  </button>

  <Teleport to="body" v-if="isFullscreen">
    <div
      aria-label="Table fullscreen"
      aria-modal="true"
      :class="cn('fixed inset-0 z-50 flex flex-col bg-background')"
      data-streamdown="table-fullscreen"
      @click="isFullscreen = false"
      @keydown.escape="isFullscreen = false"
      role="dialog"
    >
      <div
        :class="cn('flex h-full flex-col')"
        @click.stop
        @keydown.stop
        role="presentation"
      >
        <div :class="cn('flex items-center justify-end gap-1 p-4')">
          <TableCopyDropdown v-if="showCopy" />
          <TableDownloadDropdown v-if="showDownload" />
          <button :class="cn('rounded-md p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground')" @click="isFullscreen = false" :title="t.exitFullscreen" type="button">
            <component :is="XIcon" :size="20" />
          </button>
        </div>
        <div :class="cn('flex-1 overflow-auto p-4 pt-0 [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10')">
          <table :class="cn('w-full border-collapse border border-border')" data-streamdown="table">
            <slot />
          </table>
        </div>
      </div>
    </div>
  </Teleport>
</template>
