<template>
  <PageLayout :many="true">
    <div class="tags">
      <ul>
        <li class="tag__item" v-for="edge in $page.tags.edges">
          <a :href="edge.node.path">
            {{ edge.node.title }}
          </a>
        </li>
      </ul>
    </div>
    <ArchivePartial
      :posts="$page.posts"
      order=desc
    />
  </PageLayout>
</template>

<style lang=scss scoped>
  @import "../components/scss/scss_vars";

  .tags {
    margin: 6rem 0 0;
    float: left;

    ul {
      width: 80%;
      margin: 0 auto;
      font-size: 1rem;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      display: flex;
      padding: 0;
    }
  }

  .tag__item {
    line-height: 1em;
    list-style-type: none;
    box-shadow: 1px 1px 2px var(--grey-200);
    background-color: var(--purple-800);
    border-radius: 1024rem;
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
    margin: 0.2rem;

    &:hover {
      background-color: var(--pink-800);
    }

    a {
      color: var(--purple-200);
      text-decoration: none;
      &:hover {
        color: var(--pink-200);
      }
    }
  }

  @media (max-width: $medium-screen) {
    .tags {
      ul {
        width: 100%;
      }
    }
  }
</style>

<script>
  import ArchivePartial from "../components/partials/Archive";
  import PageLayout  from "../layouts/Page";
  export default {
    components: {
      ArchivePartial,
      PageLayout
    }
  };
</script>

<page-query lang=graphql>
  query {
    tags: allTag(sortBy: "slug", order: ASC) {
      edges {
        node {
          title
          path
        }
      }
    }

    posts: allPost(sortBy: "date") {
      edges {
        node {
          date
          title
          path
        }
      }
    }
  }
</page-query>
