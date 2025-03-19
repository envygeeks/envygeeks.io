import type { MarkdownRoot } from '@nuxt/content';
import type { ParsedContent } from '@nuxt/content';

/**
 * Adds an excerpt to a content-object
 * if none exists.  Appends child nodes until
 * a `<p>` tag, including the immediately
 * following `<pre>` blocks.
 */
export async function addExcerpt(post: ParsedContent) {
  if (Object.prototype.hasOwnProperty.call(post, 'excerpt')) return;
  const excerpt: MarkdownRoot = {
    type: 'root',
    children: [],
  };

  const children = post.body?.children;
  children?.some((child, index) => {
    excerpt.children.push(child);
    const nextChild = children[index + 1];
    if (nextChild?.tag === 'pre') {
      excerpt.children.push(
        nextChild,
      );
    }

    if (child.tag === 'p') {
      return true;
    }
  });

  post.excerpt = excerpt;
}

/**
 * Adds excerpt properties to posts
 * missing them by calling `addExcerpt`
 * for each post in the input list, only
 * if the post lacks an `excerpt`
 * property
 */
export async function addExcerpts(posts: ParsedContent[]): Promise<void> {
  await Promise.all(posts.map(addExcerpt)).catch(
    console.error,
  );
}