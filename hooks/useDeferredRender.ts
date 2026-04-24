// useDeferredRender composable for Vue
import { ref, onMounted, onUnmounted } from "vue";

export interface UseDeferredRenderOptions {
  immediate?: boolean;
  debounceDelay?: number;
  rootMargin?: string;
  idleTimeout?: number;
}

export function useDeferredRender(options: UseDeferredRenderOptions = {}) {
  const {
    immediate = false,
    debounceDelay = 300,
    rootMargin = "300px",
    idleTimeout = 500,
  } = options;

  const shouldRender = ref(false);
  const containerRef = ref<HTMLDivElement | null>(null);

  let renderTimeout: number | null = null;
  let idleCallbackId: number | null = null;
  let observer: IntersectionObserver | null = null;

  const requestIdle = (cb: IdleRequestCallback): number => {
    if (typeof window !== "undefined" && window.requestIdleCallback) {
      return window.requestIdleCallback(cb, { timeout: idleTimeout });
    }
    const start = Date.now();
    return window.setTimeout(() => {
      cb({ didTimeout: false, timeRemaining: () => Math.max(0, 50 - (Date.now() - start)) });
    }, 1);
  };

  const cancelIdle = (id: number) => {
    if (typeof window !== "undefined" && window.cancelIdleCallback) {
      window.cancelIdleCallback(id);
    } else {
      clearTimeout(id);
    }
  };

  const clearPending = () => {
    if (renderTimeout !== null) { clearTimeout(renderTimeout); renderTimeout = null; }
    if (idleCallbackId !== null) { cancelIdle(idleCallbackId); idleCallbackId = null; }
  };

  const scheduleRender = () => {
    idleCallbackId = requestIdle((deadline) => {
      if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
        shouldRender.value = true;
        observer?.disconnect();
      } else {
        idleCallbackId = requestIdle(() => {
          shouldRender.value = true;
          observer?.disconnect();
        });
      }
    });
  };

  const setup = () => {
    if (immediate) { shouldRender.value = true; return; }
    const container = containerRef.value;
    if (!container) return;

    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          clearPending();
          renderTimeout = window.setTimeout(() => {
            const records = observer?.takeRecords() ?? [];
            const stillInView = records.length === 0 || (records.at(-1)?.isIntersecting ?? false);
            if (stillInView) scheduleRender();
          }, debounceDelay);
        } else {
          clearPending();
        }
      }
    }, { rootMargin, threshold: 0 });

    observer.observe(container);
  };

  onMounted(setup);
  onUnmounted(() => { clearPending(); observer?.disconnect(); });

  return { shouldRender, containerRef };
}
