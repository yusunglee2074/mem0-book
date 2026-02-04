export type FlatSection = {
  id: string;
  parent_id: string | null;
  title: string;
  order_index: number;
  depth: number;
};

export type SectionNode = {
  id: string;
  title: string;
  depth: number;
  children: SectionNode[];
};

export function buildSectionTree(sections: FlatSection[]) {
  const orderMap = new Map<string, number>();
  sections.forEach((section) => orderMap.set(section.id, section.order_index));
  const map = new Map<string, SectionNode>();
  const roots: SectionNode[] = [];

  for (const section of sections) {
    map.set(section.id, {
      id: section.id,
      title: section.title,
      depth: section.depth,
      children: [],
    });
  }

  for (const section of sections) {
    const node = map.get(section.id);
    if (!node) {
      continue;
    }
    if (section.parent_id && map.has(section.parent_id)) {
      map.get(section.parent_id)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (nodes: SectionNode[]) => {
    nodes.sort(
      (a, b) =>
        (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
    );
    nodes.forEach((node) => sortTree(node.children));
  };

  sortTree(roots);
  return roots;
}
