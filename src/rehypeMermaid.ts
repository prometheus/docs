import type { Element, Root, RootContent } from "hast";
import { toString } from "hast-util-to-string";

function hasMermaidLanguageClass(node: Element): boolean {
  const className = node.properties?.className;
  if (typeof className === "string") {
    return className.split(/\s+/).includes("language-mermaid");
  }
  if (Array.isArray(className)) {
    return className.map(String).includes("language-mermaid");
  }
  return false;
}

export default function rehypeMermaid() {
  function visit(
    node: Root | Element,
    parent?: Root | Element,
    index?: number
  ): void {
    if (node.type === "element" && node.tagName === "pre") {
      const firstChild = node.children[0];
      if (
        firstChild &&
        firstChild.type === "element" &&
        firstChild.tagName === "code" &&
        hasMermaidLanguageClass(firstChild)
      ) {
        const mermaidSource = toString(firstChild);
        const replacement: Element = {
          type: "element",
          tagName: "div",
          properties: {
            "data-mermaid-chart": "true",
          },
          children: [
            {
              type: "text",
              value: mermaidSource,
            },
          ],
        };

        if (parent && typeof index === "number") {
          parent.children[index] = replacement as RootContent;
        }
        return;
      }
    }

    if (!("children" in node)) {
      return;
    }

    node.children.forEach((child, childIndex) => {
      if (child.type === "element") {
        visit(child, node, childIndex);
      }
    });
  }

  return (tree: Root) => {
    visit(tree);
  };
}
