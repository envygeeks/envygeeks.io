export interface MenuTreeItem { title: string; path: string; }
export interface MenuTree {
  [key: string]: MenuTreeItem | MenuTree;
}