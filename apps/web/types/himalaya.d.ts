declare module "himalaya" {
  export interface Attribute {
    key: string;
    value: string;
  }

  export interface TextNode {
    type: "text";
    content: string;
  }

  export type Node = TextNode | Element;

  export interface Element {
    type: "element";
    tagName: string;
    attributes: Attribute[];
    children: Node[];
  }

  export function parse(html: string): Node[];
}
