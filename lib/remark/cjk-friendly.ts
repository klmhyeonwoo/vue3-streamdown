/**
 * CJK-friendly markdown preprocessor.
 *
 * CommonMark's flanking delimiter rules classify CJK punctuation (。！？）】 etc.)
 * as "Unicode punctuation". This causes closing delimiters like **, *, ~~ to fail
 * when immediately preceded by CJK punctuation AND followed by non-whitespace text.
 *
 * Example that breaks without this fix:
 *   **太字（bold）。**この文が後に続く  →  bold not recognized
 *
 * Fix: insert a Zero-Width Non-Joiner (U+200C, ZWNJ) between CJK punctuation
 * and a closing delimiter. ZWNJ is classified as "other" in CommonMark (not
 * whitespace, not punctuation), so the delimiter is no longer considered
 * "preceded by punctuation" and flanking detection works correctly.
 * ZWNJ is invisible in all rendered output.
 *
 * Affected Unicode blocks:
 *   U+3000–U+303F  CJK Symbols and Punctuation
 *   U+FF00–U+FFEF  Halfwidth and Fullwidth Forms
 *
 * Additionally, ASCII closing brackets/punctuation (e.g. ), ], }) before a
 * closing delimiter also trigger the same flanking failure when followed by
 * non-whitespace text (e.g. ~~텍스트(괄호 포함)~~가).
 */

const ZWNJ = "\u200C";

// Matches a CJK/fullwidth punctuation character OR an ASCII closing bracket
// immediately before a closing markdown delimiter.
const CJK_BEFORE_CLOSING_DELIMITER =
  /([\u3000-\u303F\uFF00-\uFFEF\)\]\}])(\*\*|\*|~~|__|_)/gu;

// Matches the opening line of a code fence (``` or ~~~, with optional indent).
const FENCE_OPEN = /^[ \t]{0,3}(`{3,}|~{3,})/;

export function preprocessCjkDelimiters(text: string): string {
  // Apply only outside code fences to avoid corrupting code/mermaid content.
  const lines = text.split("\n");
  const result: string[] = [];
  let inFence = false;
  let fenceChar = "";
  let fenceMinLen = 0;

  for (const line of lines) {
    const fenceMatch = FENCE_OPEN.exec(line);

    if (!inFence) {
      if (fenceMatch) {
        // Opening fence — record the fence character and minimum closing length.
        inFence = true;
        fenceChar = fenceMatch[1][0];
        fenceMinLen = fenceMatch[1].length;
        result.push(line);
      } else {
        result.push(line.replace(CJK_BEFORE_CLOSING_DELIMITER, `$1${ZWNJ}$2`));
      }
    } else {
      // Inside a fence — check for a matching closing fence.
      if (
        fenceMatch &&
        fenceMatch[1][0] === fenceChar &&
        fenceMatch[1].length >= fenceMinLen
      ) {
        inFence = false;
      }
      result.push(line);
    }
  }

  return result.join("\n");
}
