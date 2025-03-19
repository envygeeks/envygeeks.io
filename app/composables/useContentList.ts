// noinspection JSUnusedGlobalSymbols

export async function useContentList(src: string) {
  return useAsyncData(
    `${src}/list`, async () => {
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
        .find();
    },
  );
}