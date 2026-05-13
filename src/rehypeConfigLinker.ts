import type { Root, Element, ElementContent } from "hast";
import { selectAll } from "hast-util-select";
import { toString } from "hast-util-to-string";
import { toHtml } from "hast-util-to-html";
import { fromHtml } from "hast-util-from-html"; // To parse innerHTML strings

// Replace sequences of non-word characters with single dashes. Remove
// extra dashes at the beginning or end.
//
// Example: <http_config> => "http_config"
function generateAnchor(text: string) {
  return text.replace(/\W+/g, "-").replace(/^-+|-+$/g, "");
}

const placeholderRegex = /^<[^>]+>$/;

const getPlaceholderTypes = (tree: Root): Record<string, string> => {
  const types: Record<string, string> = {};

  // First, find any headers that contain <code> placeholders and store their types if
  // their id matches the anchor we generate for the <code> element content.
  selectAll("h1, h2, h3, h4, h5, h6", tree).forEach((header) => {
    const codeNodes = selectAll("code", header);
    const codeNode = codeNodes[0];
    if (
      codeNodes.length !== 1 ||
      !placeholderRegex.test(toString(codeNodes[0]))
    ) {
      return;
    }

    const anchor = generateAnchor(toString(codeNode));
    if (header.properties?.id === anchor) {
      types[anchor] = toHtml(codeNode.children);
    }
  });

  // Create anchors for the remaining placeholder <code> elements.
  selectAll("code", tree).forEach((codeNode) => {
    if (!placeholderRegex.test(toString(codeNode))) {
      return;
    }

    const anchor = generateAnchor(toString(codeNode));
    if (anchor in types) {
      return;
    }

    codeNode.properties.id = anchor;
    types[anchor] = toHtml(codeNode.children);
  });

  return types;
};

export default function rehypeConfigLinker() {
  return (tree: Root) => {
    const types = getPlaceholderTypes(tree);

    // Second pass: Find <pre><code> blocks and link them
    const configBlocks: Element[] = selectAll("pre > code", tree);

    configBlocks.forEach((configCodeNode) => {
      let currentHtml = toHtml(configCodeNode.children);
      let changed = false;

      Object.entries(types).forEach(([anchor, html]) => {
        if (currentHtml.includes(html)) {
          currentHtml = currentHtml.replaceAll(
            html,
            // invertInDarkMode is to counteract the inversion of the
            // surrounding <code> element in dark mode. The link color
            // actually gets adjusted to the dark mode already, so we
            // want to revert it to the original color.
            `<a href="#${anchor}" class="invertInDarkMode">${html}</a>`
          );
          changed = true;
        }
      });

      if (changed) {
        // Replace children of configCodeNode with the new parsed HTML
        const newChildren = fromHtml(currentHtml, { fragment: true });

        const elementChildren = newChildren.children.filter(
          (child): child is ElementContent =>
            child.type === "element" || child.type === "text"
        );

        configCodeNode.children = elementChildren;
      }
    });
  };
}
