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
    text.push(`${instance.name}:${instance.width} \n`);
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

// This monitors the selection changes and posts the selection to the UI
figma.on("selectionchange", () => {
  const widgets = figma.currentPage.selection;
  console.log("widgets =", widgets);
  figma.ui.postMessage(widgets);
  const res: any[] = [];
  let text: string[] = [];
  for (const item of widgets) {
    res.push(traverse(item, text));
  }
  // console.log(text.join(""));
  // console.log(text.join("").length);
  console.log(JSON.stringify(res));
  console.log(JSON.stringify(res).length);
});
