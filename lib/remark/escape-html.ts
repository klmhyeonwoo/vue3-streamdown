import type { HTML, Root, Parent } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

// Convert HTML nodes to text when rehype-raw is not present
// This allows HTML to be displayed as escaped text instead of being stripped
export const remarkEscapeHtml: Plugin<[], Root> = () => (tree) => {
  visit(tree, "html", (node: HTML, index: number | null | undefined, parent?: Parent) => {
    /* v8 ignore next */
    if (!parent || index == null) {
      return;
    }

    // Convert HTML node to text node — Vue will handle escaping
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (parent as any).children[index] = {
      type: "text",
      value: node.value,
    };
  });
};
