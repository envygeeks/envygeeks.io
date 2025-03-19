import { strToIcon } from '~/helpers/strToIcon';
export type Nav = NavItem[];

/**
 * Represents a navigation
 * item to be used in a menu
 * or routing
 */
export interface NavItem {
  name: string,
  icon?: Component|null,
  path: string,
}

/**
 * Generates and returns a combined list
 * of navigation routes from Vue Router and
 * Nuxt Content. Filters Vue Router routes to exclude
 * parameterized paths and the root path, ensuring only
 * named routes are included. Formats route names by replacing
 * hyphens with spaces and capitalizing words for better
 * readability. Fetches Nuxt Content routes, formatting
 * titles, and paths appropriately. Combines both
 * sets of routes into a single array for
 * unified navigation data.
 */

// noinspection JSUnusedGlobalSymbols
export default async function useNav() {
  const router = useRouter();

  const vueRoutes: Nav = router.getRoutes()
    .filter((route) => {
      return typeof route.name === 'string' &&
        route.meta?.nav;
    })
    .map((route) => {
      const name: string = route.name as string;
      const icon: string = route.meta.icon as string;
      const out: NavItem = {
        icon: strToIcon(icon),
        path: router.resolve(route.path).href,
        name: name.replace(/-/g, ' ')
          .replace(/\b\w/g, (c: string) => {
            return c.toUpperCase();
          }),
      };

      return out;
    });

  // @nuxt/content
  const contentRoutes =
    (await fetchContentNavigation({
      where: [
        {
          _source: 'pages',
        },
      ],
    })).map((
      route,
    ) => ({
      name: route.title,
      icon: strToIcon(route.icon),
      path: router.resolve(
        route._path,
      ),
    }));

  return [
    ...contentRoutes, ...vueRoutes,
  ] as Nav;
}