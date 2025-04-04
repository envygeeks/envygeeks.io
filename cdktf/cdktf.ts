import { RepoStack } from './lib/repo';
import { App } from 'cdktf';

const app = new App();
new RepoStack(
  app, 'GithubRepo',
);
app.synth();
