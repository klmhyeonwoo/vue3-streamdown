import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type CnFunction = (...inputs: ClassValue[]) => string;

/**
 * Prepends a prefix to each Tailwind utility class in a class string.
 * Used to support Tailwind v4's `prefix()` feature.
 *
 * @example
 * prefixClasses("tw", "flex items-center") // "tw:flex tw:items-center"
 * prefixClasses("tw", "dark:bg-red-500")   // "tw:dark:bg-red-500"
 */
export const prefixClasses = (prefix: string, classString: string): string => {
  if (!prefix || !classString) return classString;
  const prefixWithColon = `${prefix}:`;
  return classString
    .split(/\s+/)
    .filter(Boolean)
    .map((cls) => cls.startsWith(prefixWithColon) ? cls : `${prefix}:${cls}`)
    .join(" ");
};

/**
 * Creates a prefix-aware `cn` function. When no prefix is provided,
 * returns the standard `cn` with zero overhead.
 */
export const createCn = (prefix?: string): CnFunction => {
  if (!prefix) return cn;
  return (...inputs: ClassValue[]) => prefixClasses(prefix, twMerge(clsx(inputs)));
};

export const save = (filename: string, content: string | Blob, mimeType: string) => {
  // Prepend UTF-8 BOM for CSV so Excel on Windows correctly detects the encoding.
  const bom = typeof content === 'string' && mimeType.startsWith('text/csv') ? '\uFEFF' : '';
  const blob = typeof content === 'string' ? new Blob([bom + content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─── HTML indentation normalization ──────────────────────────────────────────

// Matches if content starts with an HTML tag (possibly with leading whitespace)
const HTML_BLOCK_START_PATTERN = /^[ \t]*<[\w!/?-]/;
// Matches 4+ spaces/tabs before HTML tags at line starts
const HTML_LINE_INDENT_PATTERN = /(^|\n)[ \t]{4,}(?=<[\w!/?-])/g;

/**
 * Normalizes indentation in HTML blocks to prevent Markdown parsers from
 * treating indented HTML tags as code blocks (4+ spaces = code in Markdown).
 */
export const normalizeHtmlIndentation = (content: string): string => {
  if (typeof content !== "string" || content.length === 0) {
    return content;
  }
  if (!HTML_BLOCK_START_PATTERN.test(content)) {
    return content;
  }
  return content.replace(HTML_LINE_INDENT_PATTERN, "$1");
};
