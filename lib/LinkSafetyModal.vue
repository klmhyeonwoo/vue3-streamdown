<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      :class="cn('fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm')"
      data-streamdown="link-safety-modal"
      role="button"
      tabindex="0"
      @click="onClose"
      @keydown.escape="onClose"
    >
      <div
        :class="cn('relative mx-4 flex w-full max-w-md flex-col gap-4 rounded-xl border bg-background p-6 shadow-lg')"
        role="presentation"
        @click.stop
        @keydown.stop
      >
        <button
          :class="cn('absolute top-4 right-4 rounded-md p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground')"
          :title="t.close"
          type="button"
          @click="onClose"
        >
          <component :is="icons.XIcon" :size="16" />
        </button>

        <div :class="cn('flex flex-col gap-2')">
          <div :class="cn('flex items-center gap-2 font-semibold text-lg')">
            <component :is="icons.ExternalLinkIcon" :size="20" />
            <span>{{ t.openExternalLink }}</span>
          </div>
          <p :class="cn('text-muted-foreground text-sm')">{{ t.externalLinkWarning }}</p>
        </div>

        <div
          :class="cn('break-all rounded-md bg-muted p-3 font-mono text-sm', url.length > 100 && 'max-h-32 overflow-y-auto')"
        >
          {{ url }}
        </div>

        <div :class="cn('flex gap-2')">
          <button
            :class="cn('flex flex-1 items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 font-medium text-sm transition-all hover:bg-muted')"
            type="button"
            @click="handleCopy"
          >
            <template v-if="copied">
              <component :is="icons.CheckIcon" :size="14" />
              <span>{{ t.copied }}</span>
            </template>
            <template v-else>
              <component :is="icons.CopyIcon" :size="14" />
              <span>{{ t.copyLink }}</span>
            </template>
          </button>
          <button
            :class="cn('flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-all hover:bg-primary/90')"
            type="button"
            @click="handleConfirm"
          >
            <component :is="icons.ExternalLinkIcon" :size="14" />
            <span>{{ t.openLink }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useIcons, useTranslations, useCn } from "../composables";
import { lockBodyScroll, unlockBodyScroll } from "./scroll-lock";

const props = defineProps<{
  isOpen: boolean;
  url: string;
  onClose: () => void;
  onConfirm: () => void;
}>();

const icons = useIcons();
const t = useTranslations();
const cn = useCn();
const copied = ref(false);

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.url);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    // Clipboard API not available
  }
};

const handleConfirm = () => {
  props.onConfirm();
  props.onClose();
};

const handleEsc = (e: KeyboardEvent) => {
  if (e.key === "Escape") props.onClose();
};

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    lockBodyScroll();
    document.addEventListener("keydown", handleEsc);
  } else {
    document.removeEventListener("keydown", handleEsc);
    unlockBodyScroll();
  }
});
</script>
