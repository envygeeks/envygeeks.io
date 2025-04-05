import { DataGithubUser } from '@cdktf/provider-github/lib/data-github-user';
import { BranchProtection } from '@cdktf/provider-github/lib/branch-protection';
import { GithubProvider } from '@cdktf/provider-github/lib/provider';
import { Repository } from '@cdktf/provider-github/lib/repository';
import { type App, TerraformStack } from 'cdktf';
import { get } from 'env-var';

const githubRepo = get('GH_REPO').required(true).asString();
const githubRepoOwner = get('GH_REPO_OWNER')
  .required(true).asString();

export class RepoStack extends TerraformStack {
  constructor(scope: App, id: string) {
    super(
      scope, id,
    );

    /**
     * Init Github
     */
    new GithubProvider(
      this, 'Github', {
        token: process.env.GITHUB_TOKEN!,
      },
    );

    /**
     * Owner
     */
    const owner = new DataGithubUser(
      this, 'RepoOwner', {
        username: githubRepoOwner,
      },
    );

    /**
     * Repo
     */
    const repo = new Repository(
      this, 'Repo', {
        name: githubRepo,
        hasProjects: true,
        hasDownloads: false,
        hasDiscussions: false,
        allowAutoMerge: false,
        allowUpdateBranch: true,
        deleteBranchOnMerge: true,
        allowMergeCommit: false,
        allowRebaseMerge: false,
        allowSquashMerge: true,
        visibility: 'public',
        hasIssues: true,
        hasWiki: false,
      },
    );

    /**
     * Branch Rule
     * Main
     */
    new BranchProtection(this, 'ProtectMain', {
      repositoryId: repo.nodeId,
      pattern: 'main',
      allowsDeletions: false,
      allowsForcePushes: false,
      requiredLinearHistory: true,
      requireConversationResolution: true,
      requireSignedCommits: false,
      enforceAdmins: false,
      forcePushBypassers: [
        owner.nodeId,
      ],
      requiredPullRequestReviews: [
        {
          dismissStaleReviews: true,
          requireCodeOwnerReviews: true,
          requireLastPushApproval: true,
          restrictDismissals: true,
          pullRequestBypassers: [
            owner.nodeId,
          ],
        },
      ],
    });
  }
}
