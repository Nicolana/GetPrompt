// This plugin will open a tab that indicates that it will monitor the current
// selection on the page. It cannot change the document itself.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

type FigmaNode = SceneNode & { children?: SceneNode[] };

const padding = 8; // table cell padding

const ParseNodes = (nodes: FigmaNode[]): string | undefined => {
  if (!nodes) {
    return;
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
  // console.log("Text =", text);
  return text;
};

const parseInstanceNode = (node: FigmaNode): string | undefined => {
  if (/(SDS\/table\/cell|SDS\/table\/head)/.test(node.name)) {
    // Table 组件
    return node.children?.map(item => GetNodeText(item as FigmaNode))?.filter(item => item).join(',');
  }

  if (/tag\/.*/.test(node.name)) {
    // Tag 组件
    const tagText = node.children?.map(item => GetNodeText(item as FigmaNode))?.filter(item => item).join(',');
    return `tag[text=${tagText}]`;
  }

  return node.name;
}

/**
 * 获取节点下的Text，忽略其他数据
 * @param node 获
 */
const GetNodeText = (node: FigmaNode): string | undefined => {
  if (!node.visible) {
    // 忽略隐藏节点数据
    return ""
  }
  if (node.type === "TEXT") {
    return node.characters ?? "";
  }

  if (node.type === "INSTANCE") {
    return parseInstanceNode(node);
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
  return;
};

/**
 * 根据组件名称及组件的属性，生成组件的提示词
 * @param node 
 * @returns 
 */
const parseComponent = (node: FigmaNode): string | null => {

  return "";
}

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
    const tableCells = [];
    for (const tableCellNode of node.parent?.children?.slice(1, 5)!) {
      tableCells.push(GetNodeText(tableCellNode as FigmaNode))
    }
    const tableCellData = tableCells?.filter(item => item).join(',');
    const headWidth = node.width - padding * 2;
    return `\nhead=${headText}, headWith=${headWidth}, data =[${tableCellData}]`;
  }
  if (node.name.includes("SDS/table/cell")) {
    return
    // const cellText = GetNodeText(node);
    // if (!cellText) {
    //   return cellText;
    // }
    // return `${cellText}`;
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

  let text = "";

  if (node.name === 'table') {
    text = "\nTABLE: \n"
  }

  if (node.children) {
    text += node.children?.map((item) => GetNodeInfo(item as FigmaNode))?.filter(item => item).join(',');
  }

  return text;
};

const TraverseNodes = (nodes: FigmaNode[]) => {
  let text = "";
  for (const node of nodes) {
    if (!node.visible) {
      continue;
    }
    const nodeText = GetNodeInfo(node);
    if (!nodeText) {
      continue;
    }
    text += nodeText;
  }
  // return text?.replace("]", "") + "]";
  return text;
};

figma.on("selectionchange", () => {
  const widgets = figma.currentPage.selection;
  console.log(widgets)
  figma.ui.postMessage(TraverseNodes(widgets as FigmaNode[]));
});
