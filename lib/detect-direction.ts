/**
 * Unicode ranges for RTL "strong" characters.
 */
const RTL_PATTERN = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

const LETTER_PATTERN = /\p{L}/u;

/**
 * Detect text direction using the "first strong character" algorithm.
 */
export function detectTextDirection(text: string): "ltr" | "rtl" {
  const stripped = text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*{1,3}|_{1,3})/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[\s>*\-+\d.]+/gm, "");

  for (const char of stripped) {
    if (RTL_PATTERN.test(char)) {
      return "rtl";
    }
    if (LETTER_PATTERN.test(char)) {
      return "ltr";
    }
  }

  return "ltr";
}
