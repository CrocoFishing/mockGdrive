
export const treeBuilder={
  buildTree(items) {
  const root = [];

  function ensureDir(path) {
    let currentLevel = root;
    for (const segment of path) {
      let dir = currentLevel.find(
        (n) => !n.isFile && n.name === segment
      );
      if (!dir) {
        dir = { name: segment, isFile: false, children: [] };
        currentLevel.push(dir);
      }
      currentLevel = dir.children;
    }
    return currentLevel;
  }

  for (const item of items) {
    const parentChildren = ensureDir(item.path);

    if (item.isFile) {
      parentChildren.push({
        name: item.name,
        isFile: true,
        children: null,
        parent: items,
      });
    } else {
      // 資料裡的資料夾項目也要確保存在
      ensureDir([...item.path, item.name]);
    }
  }

  // 排序：資料夾在前、檔案在後，依名字排序
  function sortTree(nodes) {
    nodes.sort((a, b) => {
      if (a.isFile !== b.isFile) {
        return a.isFile ? 1 : -1; // 資料夾(false) 在檔案(true) 前面
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => {
      if (!n.isFile && n.children) sortTree(n.children);
    });
  }

  sortTree(root);

  // Assign path arrays to nodes for later operations
  function assignPaths(nodes, parentPath = []) {
    for (const n of nodes) {
      n.path = parentPath.slice();
      if (!n.isFile && n.children) {
        assignPaths(n.children, [...parentPath, n.name]);
      }
    }
  }
  assignPaths(root, []);

  return root;
}
}
//chatGPT