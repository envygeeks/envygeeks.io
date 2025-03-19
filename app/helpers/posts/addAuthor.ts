import { normalizeURL as normalize } from 'ufo';
import type { ParsedContent } from '@nuxt/content';
import { joinURL as join } from 'ufo';

/**
 * Adds an author object to the
 * provided post by querying the authors'
 * content collection. The method uses the `created_by` ID
 * from the post to filter the authors and retrieve
 * the matching author record.
 */
export async function addAuthor(post: ParsedContent): Promise<void> {
  post.author = await queryContent()
    .where({
      _source: {
        $eq: 'authors',
      },
      id: {
        $eq: post.created_by,
      },
    })
    .findOne();
  
  const name = normalize(post.author.slug ?? '') + '.jpg';
  post.author.avatarUrl =  join(
    '/avatars', name,
  );
}

/**
 * Adds author information to
 * each post in the provided list by
 * asynchronously fetching and appending author
 * details. Iterates through the array of parsed
 * content posts and processes each post individually.
 * For each post, invokes the `addAuthor` method,
 * which populates the associated author data.
 * Completes all updates concurrently
 */
export async function addAuthors(posts: ParsedContent[]): Promise<void> {
  await Promise.all(posts.map(addAuthor)).catch(
    console.error,
  );
}
