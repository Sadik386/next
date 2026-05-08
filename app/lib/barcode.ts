import JsBarcode from "jsbarcode";

type Attrs = Record<string, string>;

interface FakeNode {
  nodeType: "element" | "text";
  nodeName: string;
  tagName?: string;
  text?: string;
  attrs: Attrs;
  children: FakeNode[];
  firstChild: FakeNode | null;
  parentNode: FakeNode | null;
  hasAttribute(name: string): boolean;
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string | number): void;
  appendChild(child: FakeNode): FakeNode;
  removeChild(child: FakeNode): FakeNode;
}

function createElement(tagName: string): FakeNode {
  const node: FakeNode = {
    nodeType: "element",
    nodeName: tagName,
    tagName,
    attrs: {},
    children: [],
    firstChild: null,
    parentNode: null,
    hasAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attrs, name);
    },
    getAttribute(name) {
      return this.attrs[name] ?? null;
    },
    setAttribute(name, value) {
      this.attrs[name] = String(value);
    },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      this.firstChild = this.children[0] ?? null;
      return child;
    },
    removeChild(child) {
      this.children = this.children.filter((c) => c !== child);
      this.firstChild = this.children[0] ?? null;
      child.parentNode = null;
      return child;
    },
  };
  return node;
}

function createTextNode(text: string): FakeNode {
  return {
    nodeType: "text",
    nodeName: "#text",
    text,
    attrs: {},
    children: [],
    firstChild: null,
    parentNode: null,
    hasAttribute() {
      return false;
    },
    getAttribute() {
      return null;
    },
    setAttribute() {},
    appendChild(child) {
      return child;
    },
    removeChild(child) {
      return child;
    },
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function serialize(node: FakeNode): string {
  if (node.nodeType === "text") {
    return escapeXml(node.text ?? "");
  }
  const attrs = Object.entries(node.attrs)
    .map(([k, v]) => `${k}="${escapeXml(v)}"`)
    .join(" ");
  const open = attrs ? `<${node.tagName} ${attrs}>` : `<${node.tagName}>`;
  const inner = node.children.map(serialize).join("");
  return `${open}${inner}</${node.tagName}>`;
}

export interface BarcodeOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
  margin?: number;
}

export function generateBarcodeSVG(value: string, opts: BarcodeOptions = {}): string {
  const svg = createElement("svg");
  const fakeDocument = {
    createElementNS: (_ns: string, tag: string) => createElement(tag),
    createTextNode: (text: string) => createTextNode(text),
  };

  const options = {
    format: "CODE128",
    width: opts.width ?? 2,
    height: opts.height ?? 80,
    displayValue: opts.displayValue ?? true,
    fontSize: opts.fontSize ?? 14,
    margin: opts.margin ?? 10,
    xmlDocument: fakeDocument,
  };

  (JsBarcode as unknown as (el: unknown, text: string, opts: unknown) => void)(
    svg,
    value,
    options
  );

  return serialize(svg);
}
