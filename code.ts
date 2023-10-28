// This plugin will open a tab that indicates that it will monitor the current
// selection on the page. It cannot change the document itself.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

function getInstanceReturn(instance: any, text: string[]) {
  if (instance.name === "SDS/table/head (legacy)") {
    text.push(`宽度:${instance.width} \n`);
    return {
      name: instance.name,
      type: instance.type,
      width: instance.width,
    };
  }
  if (instance.name === "SDS/table/head") {
    text.push(`宽度:${instance.width} \n`);
    return {
      name: instance.name,
      type: instance.type,
      width: instance.width,
    };
  }
  if (instance.name === "SDS/tabItem") {
    text.push(`${instance.name}:${instance.width} \n`);
    return {
      name: instance.name,
      type: instance.type,
      width: instance.width,
    };
  }
  // if (instance.name === "SDS/table/cell") {
  //   text.push(`${instance.name}\n`);
  //   return {
  //     name: instance.name,
  //     type: instance.type,
  //   };
  // }
  // text.push(`${instance.name}:${instance.width} \n`);
  return {
    name: instance.name,
    type: instance.type,
  };
}

function getReturnByType(node: SceneNode, text: string[]) {
  switch (node.type) {
    case "TEXT":
      text.push(`${node.name}:${node.characters} \n`);
      return {
        name: node.name,
        type: node.type,
        characters: node.characters,
      };
    case "INSTANCE":
      return getInstanceReturn(node, text);
  }
  text.push(`${node.name}:\n`);
  return {
    name: node.name,
    type: node.type,
  };
}

function traverse(node: SceneNode, text: string[]) {
  const children = [];
  if ("children" in node) {
    for (const child of node.children) {
      children.push(traverse(child, text));
    }
  }
  const res = {
    ...getReturnByType(node, text),
  };
  if (children.length > 0) {
    res.children = children;
  }
  return res;
}

type FigmaNode = SceneNode & { children?: SceneNode[] }

/**
 * 获取节点下的Text，忽略其他数据
 * @param node 获
 */
const GetNodeText = (node: FigmaNode): string | null => {
  if (node.type === 'TEXT') {
    return node.characters ?? ''
  }

  if (node.children) {
    for (const subNode of node.children) {
      const text = GetNodeText(subNode as FigmaNode);
      if (text) {
        return text
      }
    }
  }
  return null
}

/**
 * 用于递归的处理节点的逻辑
 * @param node 
 * @returns 
 */
const GetNodeInfo = (node: FigmaNode) => {
  // 定义返回的边界条件
  if (node.type === 'INSTANCE') {
    if (node.name.includes('SDS/table/head')) {
      const headText = GetNodeText(node);
      if (!headText) {
        return null;
      }
      return `]\nhead=${headText}, headWith=${node.width}, data =[`;
    }
    if (node.name.includes('SDS/table/cell')) {
      return `${GetNodeText(node)}`;
    }
  }
  let text = '';

  if (node.children) {
    text += node.children?.map(item => GetNodeInfo(item as FigmaNode));
  }

  return text;
}

const GetTableColumns = (nodes: FigmaNode[]) => {
  let text = '';
  for (const node of nodes) {
    const nodeText = GetNodeInfo(node);
    if (!nodeText) {
      continue
    }
    text += nodeText
  }
  console.log("Text =", text);
  return text?.replace(']', '') + ']';
}

figma.on("selectionchange", () => {
  const widgets = figma.currentPage.selection;
  figma.ui.postMessage(GetTableColumns(widgets as FigmaNode[]));
  // figma.ui.postMessage(res);
});
