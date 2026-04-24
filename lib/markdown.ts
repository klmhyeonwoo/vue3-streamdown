import type { Element, Nodes, Parents, Root } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { urlAttributes } from "html-url-attributes";
import { Fragment, h } from "vue";
import type { Component, VNode } from "vue";
import rehypeRaw from "rehype-raw";
import remarkParse from "remark-parse";
import type { Options as RemarkRehypeOptions } from "remark-rehype";
import remarkRehype from "remark-rehype";
import type { PluggableList } from "unified";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { remarkEscapeHtml } from "./remark/escape-html";

export interface ExtraProps {
  node?: Element | undefined;
}

export type AllowElement = (
  element: Readonly<Element>,
  index: number,
  parent: Readonly<Parents> | undefined
) => boolean | null | undefined;

export type UrlTransform = (
  url: string,
  key: string,
  node: Readonly<Element>
) => string | null | undefined;

export type Components = {
  [key: string]: Component | string | undefined;
};

export interface Options {
  allowElement?: AllowElement;
  allowedElements?: readonly string[];
  children?: string;
  components?: Components;
  disallowedElements?: readonly string[];
  rehypePlugins?: PluggableList;
  remarkPlugins?: PluggableList;
  remarkRehypeOptions?: Readonly<RemarkRehypeOptions>;
  skipHtml?: boolean;
  unwrapDisallowed?: boolean;
  urlTransform?: UrlTransform;
}

// Stable references for common cases
const EMPTY_PLUGINS: PluggableList = [];
const DEFAULT_REMARK_REHYPE_OPTIONS = { allowDangerousHtml: true };

// Plugin name cache for faster serialization
// biome-ignore lint/complexity/noBannedTypes: Need Function type for plugin caching
const pluginNameCache = new WeakMap<Function, string>();

// LRU Cache for unified processors
class ProcessorCache {
  // biome-ignore lint/suspicious/noExplicitAny: Processor type varies with plugins
  private readonly cache = new Map<string, any>();
  private readonly keyCache = new WeakMap<Readonly<Options>, string>();
  private readonly maxSize = 100;

  generateCacheKey(options: Readonly<Options>): string {
    const cachedKey = this.keyCache.get(options);
    if (cachedKey) return cachedKey;

    const rehypePlugins = options.rehypePlugins;
    const remarkPlugins = options.remarkPlugins;
    const remarkRehypeOptions = options.remarkRehypeOptions;

    if (!(rehypePlugins || remarkPlugins || remarkRehypeOptions)) {
      const key = "default";
      this.keyCache.set(options, key);
      return key;
    }

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Plugin serialization requires checking multiple plugin formats
    const serializePlugins = (plugins: PluggableList | undefined): string => {
      if (!plugins || plugins.length === 0) return "";
      let result = "";
      for (let i = 0; i < plugins.length; i += 1) {
        const plugin = plugins[i];
        if (i > 0) result += ",";
        if (Array.isArray(plugin)) {
          const [pluginFn, pluginOptions] = plugin;
          if (typeof pluginFn === "function") {
            let name = pluginNameCache.get(pluginFn);
            if (!name) { name = pluginFn.name; pluginNameCache.set(pluginFn, name); }
            result += name;
          } else {
            result += String(pluginFn);
          }
          result += ":";
          result += JSON.stringify(pluginOptions);
        } else if (typeof plugin === "function") {
          let name = pluginNameCache.get(plugin);
          if (!name) { name = plugin.name; pluginNameCache.set(plugin, name); }
          result += name;
        } else {
          result += String(plugin);
        }
      }
      return result;
    };

    const rehypeKey = serializePlugins(rehypePlugins);
    const remarkKey = serializePlugins(remarkPlugins);
    const optionsKey = remarkRehypeOptions ? JSON.stringify(remarkRehypeOptions) : "";
    const key = `${remarkKey}::${rehypeKey}::${optionsKey}`;
    this.keyCache.set(options, key);
    return key;
  }

  get(options: Readonly<Options>) {
    const key = this.generateCacheKey(options);
    const processor = this.cache.get(key);
    if (processor) {
      this.cache.delete(key);
      this.cache.set(key, processor);
    }
    return processor;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Processor type varies with plugins
  set(options: Readonly<Options>, processor: any): void {
    const key = this.generateCacheKey(options);
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, processor);
  }

  /* v8 ignore next */
  clear(): void { this.cache.clear(); }
}

const processorCache = new ProcessorCache();

/**
 * Vue JSX Runtime Adapter for hast-util-to-jsx-runtime.
 *
 * toJsxRuntime expects React-style jsx/jsxs/Fragment functions.
 * We provide Vue equivalents:
 *   - jsx/jsxs: wraps Vue's h(), converting className->class,
 *               and passing children through default slot.
 *   - Fragment: Vue's Fragment symbol.
 */
const VUE_FRAGMENT = Fragment;

const vueJsx = (
  type: string | Component | symbol,
  props: Record<string, unknown> | null,
  _key?: string
): VNode => {
  const { children, className, node: _node, ...rest } = (props ?? {}) as Record<string, unknown>;

  const vueProps: Record<string, unknown> = { ...rest };
  if (className) vueProps.class = className;

  const childrenArr: unknown[] = children === undefined
    ? []
    : Array.isArray(children)
      ? (children as unknown[])
      : [children];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((type as any) === VUE_FRAGMENT) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return h(Fragment as any, undefined, childrenArr) as VNode;
  }

  if (typeof type === "string") {
    // Native HTML element — pass children as array (no slots)
    return childrenArr.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? h(type, vueProps, childrenArr as any)
      : h(type, vueProps);
  }

  // Vue component — children go through default slot
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slots = childrenArr.length ? { default: () => childrenArr as any } : undefined;
  return h(type as Component, vueProps, slots) as VNode;
};

// vueRuntime is typed as any to avoid a direct dependency on react/jsx-runtime types.
// toJsxRuntime will call jsx/jsxs/Fragment at runtime using our Vue equivalents.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vueRuntime: any = {
  Fragment: VUE_FRAGMENT,
  jsx: vueJsx,
  jsxs: vueJsx,
};

export const Markdown = (options: Readonly<Options>): VNode => {
  const processor = getCachedProcessor(options);
  const content = options.children || "";
  // biome-ignore lint/suspicious/noExplicitAny: runSync return type varies
  const tree = processor.runSync(processor.parse(content), content) as any;
  return post(tree, options);
};

const getCachedProcessor = (options: Readonly<Options>) => {
  const cached = processorCache.get(options);
  if (cached) return cached;
  const processor = createProcessor(options);
  processorCache.set(options, processor);
  return processor;
};

const hasRehypeRaw = (plugins: PluggableList): boolean =>
  plugins.some((plugin) =>
    Array.isArray(plugin) ? plugin[0] === rehypeRaw : plugin === rehypeRaw
  );

const createProcessor = (options: Readonly<Options>) => {
  const rehypePlugins = options.rehypePlugins || EMPTY_PLUGINS;
  const remarkPlugins = options.remarkPlugins || EMPTY_PLUGINS;

  const finalRemarkPlugins = hasRehypeRaw(rehypePlugins)
    ? remarkPlugins
    : [...remarkPlugins, remarkEscapeHtml];

  const remarkRehypeOptions = options.remarkRehypeOptions
    ? { ...DEFAULT_REMARK_REHYPE_OPTIONS, ...options.remarkRehypeOptions }
    : DEFAULT_REMARK_REHYPE_OPTIONS;

  return unified()
    .use(remarkParse)
    .use(finalRemarkPlugins)
    .use(remarkRehype, remarkRehypeOptions)
    .use(rehypePlugins);
};

export const defaultUrlTransform: UrlTransform = (value) => value;

const handleRawNode = (
  parent: Parents,
  index: number,
  skipHtml: boolean | undefined,
  value: string
): void => {
  if (skipHtml) {
    parent.children.splice(index, 1);
  } else {
    parent.children[index] = { type: "text", value } as never;
  }
};

const transformUrls = (node: Element, transform: UrlTransform): void => {
  for (const key in urlAttributes) {
    if (
      Object.hasOwn(urlAttributes, key) &&
      Object.hasOwn(node.properties, key)
    ) {
      const value = node.properties[key];
      const test = urlAttributes[key];
      if (test === null || test.includes(node.tagName)) {
        node.properties[key] =
          transform(String(value || ""), key, node) ?? undefined;
      }
    }
  }
};

const shouldRemoveElement = (
  node: Readonly<Element>,
  index: number | undefined,
  parent: Readonly<Parents> | undefined,
  allowedElements: readonly string[] | undefined,
  disallowedElements: readonly string[] | undefined,
  allowElement: AllowElement | undefined
): boolean => {
  let remove = false;
  if (allowedElements) {
    remove = !allowedElements.includes(node.tagName);
  } else if (disallowedElements) {
    remove = disallowedElements.includes(node.tagName);
  }
  if (!remove && allowElement && typeof index === "number") {
    remove = !allowElement(node, index, parent);
  }
  return remove;
};

const post = (tree: Nodes, options: Readonly<Options>): VNode => {
  const {
    allowElement,
    allowedElements,
    disallowedElements,
    skipHtml,
    unwrapDisallowed,
    urlTransform,
  } = options;

  const hasFiltering =
    allowElement || allowedElements || disallowedElements || skipHtml || urlTransform;

  if (hasFiltering) {
    const transform = urlTransform || defaultUrlTransform;

    visit(tree as Root, (node, index, parent) => {
      if (node.type === "raw" && parent && typeof index === "number") {
        handleRawNode(parent, index, skipHtml, node.value);
        return index;
      }
      if (node.type === "element") {
        transformUrls(node, transform);
        const remove = shouldRemoveElement(
          node, index, parent, allowedElements, disallowedElements, allowElement
        );
        if (remove && parent && typeof index === "number") {
          if (unwrapDisallowed && node.children) {
            parent.children.splice(index, 1, ...node.children);
          } else {
            parent.children.splice(index, 1);
          }
          return index;
        }
      }
    });
  }

  return toJsxRuntime(tree, {
    ...vueRuntime,
    components: options.components as Record<string, Component>,
    ignoreInvalidStyle: true,
    passKeys: true,
    passNode: true,
  } as unknown as Parameters<typeof toJsxRuntime>[1]) as unknown as VNode;
};
