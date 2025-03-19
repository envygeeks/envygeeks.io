// noinspection JSUnusedGlobalSymbols

export async function useContentFirst(src: string) {
  const { data } = await useAsyncData(
    `${src}/first`, async () => {
      return await queryContent()
        .where({
          _source: {
            $eq: src,
          },
        })
        .only([
          '_path',
          'title',
        ])
        .findOne();
    },
  );

  return data;
}