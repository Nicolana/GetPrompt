// This plugin will open a tab that indicates that it will monitor the current
// selection on the page. It cannot change the document itself.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

type FigmaNode = SceneNode & { children?: SceneNode[] };

const ParseNodes = (nodes: FigmaNode[]): string | null => {
  if (!nodes) {
    return null;
  }
  let text = "";
  let index = 0;
  for (const subNode of nodes) {
    if (Array.isArray(subNode)) {
      return ParseNodes(subNode);
    }
    const subNodeText = GetNodeText(subNode as FigmaNode);
    if (subNodeText) {
      text += `${index > 0 ? " " : ""}${subNodeText}`;
      index++;
    }
  }
  console.log("Text =", text);
  return text;
};

/**
 * 获取节点下的Text，忽略其他数据
 * @param node 获
 */
const GetNodeText = (node: FigmaNode): string | null => {
  if (node.type === "TEXT") {
    return node.characters ?? "";
  }

  if (node.name.includes('图标')) {
    return `(${node.name})` ?? "";
  }

  if (node.children) {
    let text = "";
    let index = 0;
    for (const subNode of node.children) {
      if (Array.isArray(subNode)) {
        return ParseNodes(subNode);
      }
      const subNodeText = GetNodeText(subNode as FigmaNode);
      if (subNodeText) {
        text += `${index > 0 ? " " : ""}${subNodeText}`;
        index++;
      }
    }
    return text;
  }
  return null;
};

/**
 * 用于递归的处理节点的逻辑
 * @param node
 * @returns
 */
const GetNodeInfo = (node: FigmaNode) => {
  // 定义返回的边界条件
  if (node.name.includes("SDS/table/head")) {
    const headText = GetNodeText(node);
    if (!headText) {
      return null;
    }
    return `]\nhead=${headText}, headWith=${node.width}, data =[`;
  }
  if (node.name.includes("SDS/table/cell")) {
    const cellText = GetNodeText(node);
    if (!cellText) {
      return cellText;
    }
    return `${cellText}`;
  }
  const inputRegex = /SDS\/input/
  if (inputRegex.test(node.name)) {
    const inputText = GetNodeText(node);
    if (!inputText) {
      return null;
    }
    return `]\n${inputText}`;
  }

  if (node.name === "筛选区") {
    const filterInfo = node.children?.map(filterItem => GetNodeText(filterItem as FigmaNode))?.filter(item => item).join(',');
    return `筛选区: [${filterInfo}]`
  }

  if (node.name === 'table') {
    let tableText = "\nTABLE: \n"
    tableText += node.children?.map((item) => GetNodeInfo(item as FigmaNode))?.filter(item => item).join(',');
    return tableText
  }

  let text = "";

  if (node.children) {
    text += node.children?.map((item) => GetNodeInfo(item as FigmaNode))?.filter(item => item).join(',');
  }

  return text;
};

const GetTableColumns = (nodes: FigmaNode[]) => {
  let text = "";
  for (const node of nodes) {
    const nodeText = GetNodeInfo(node);
    if (!nodeText) {
      continue;
    }
    text += nodeText;
  }
  return text?.replace("]", "") + "]";
};

figma.on("selectionchange", () => {
  const widgets = figma.currentPage.selection;
  console.log(widgets)
  // console.log("widgets =", GetNodeText(widgets?.[0]));
  figma.ui.postMessage(GetTableColumns(widgets as FigmaNode[]));
  // figma.ui.postMessage(res);
});
