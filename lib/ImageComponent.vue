<template>
  <div
    :class="cn('group relative my-4 inline-block')"
    data-streamdown="image-wrapper"
  >
    <img
      v-if="src"
      :alt="alt"
      :class="cn('max-w-full rounded-lg', showFallback && 'hidden', className)"
      :src="src"
      data-streamdown="image"
      v-bind="$attrs"
      @load="handleLoad"
      @error="handleError"
      ref="imgRef"
    />
    <span
      v-if="showFallback"
      :class="cn('text-muted-foreground text-xs italic')"
      data-streamdown="image-fallback"
    >
      {{ t.imageNotAvailable }}
    </span>
    <div :class="cn('pointer-events-none absolute inset-0 hidden rounded-lg bg-black/10 group-hover:block')" />
    <button
      v-if="showDownload"
      :class="cn(
        'absolute right-2 bottom-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-background',
        'opacity-0 group-hover:opacity-100'
      )"
      :title="t.downloadImage"
      type="button"
      @click="downloadImage"
    >
      <component :is="icons.DownloadIcon" :size="14" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useIcons, useTranslations, useCn } from "../composables";
import { save } from "./utils";

const props = withDefaults(defineProps<{
  src?: string;
  alt?: string;
  className?: string;
  width?: string | number;
  height?: string | number;
}>(), {});

const icons = useIcons();
const t = useTranslations();
const cn = useCn();

const imgRef = ref<HTMLImageElement | null>(null);
const imageLoaded = ref(false);
const imageError = ref(false);

const hasExplicitDimensions = computed(() => props.width != null || props.height != null);
const showDownload = computed(() => (imageLoaded.value || hasExplicitDimensions.value) && !imageError.value);
const showFallback = computed(() => imageError.value && !hasExplicitDimensions.value);

onMounted(() => {
  const img = imgRef.value;
  if (img?.complete) {
    const loaded = img.naturalWidth > 0;
    imageLoaded.value = loaded;
    imageError.value = !loaded;
  }
});

const handleLoad = () => {
  imageLoaded.value = true;
  imageError.value = false;
};

const handleError = () => {
  imageLoaded.value = false;
  imageError.value = true;
};

const fileExtensionPattern = /\.[^/.]+$/;

const downloadImage = async () => {
  if (!props.src) return;
  try {
    const response = await fetch(props.src);
    const blob = await response.blob();
    const urlPath = new URL(props.src, window.location.origin).pathname;
    const originalFilename = urlPath.split("/").pop() || "";
    const extension = originalFilename.split(".").pop();
    const hasExtension = originalFilename.includes(".") && extension !== undefined && extension.length <= 4;
    let filename = "";
    if (hasExtension) {
      filename = originalFilename;
    } else {
      const mimeType = blob.type;
      let fileExtension = "png";
      if (mimeType.includes("jpeg") || mimeType.includes("jpg")) fileExtension = "jpg";
      else if (mimeType.includes("png")) fileExtension = "png";
      else if (mimeType.includes("svg")) fileExtension = "svg";
      else if (mimeType.includes("gif")) fileExtension = "gif";
      else if (mimeType.includes("webp")) fileExtension = "webp";
      const baseName = props.alt || originalFilename || "image";
      filename = `${baseName.replace(fileExtensionPattern, "")}.${fileExtension}`;
    }
    save(filename, blob, blob.type);
  } catch {
    window.open(props.src, "_blank");
  }
};
</script>
