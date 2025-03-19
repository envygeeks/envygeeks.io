// noinspection JSUnusedGlobalSymbols

import type { MenuTree } from '~/types/MenuTree';
import type { Reactive } from '@vue/reactivity';

/**
 * Build a structured menu from
 * any @nuxt/content source that exists
 * on the filesystem
 */
export async function useMenu(
  path: string,
  menu: Reactive<MenuTree>,
): Promise<MenuTree> {
  const { data: list } = await useContentList(path);

  if (list.value) {
    list.value.forEach(({ _path = '', title = '' }) => {
      let current = menu;
      const parts = _path!.split('/')
        .filter(Boolean);

      parts.shift(); // No Root
      parts.forEach((part, index) => {
        if (!current[part]) {
          if (index === parts.length - 1) {
            current[part] = {
              title: title, path: _path,
            };

            return;
          }
          else {
            current[part] = {
              // New Level
            };
          }
        }

        current = (
          current[part] as MenuTree
        );
      });
    });
  }

  return menu;
}