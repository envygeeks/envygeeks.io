// noinspection JSUnusedGlobalSymbols
// noinspection JSUnresolvedReference

import {
  ListRolesCommand,
  ListRoleTagsCommand,
  IAMClient,
} from '@aws-sdk/client-iam';

const iam = new IAMClient({
  region: process.env.AWS_REGION,
});

export async function handler(event) {
  if (event.RequestType === 'Delete') {
    return {
      Data: {
        cdkRoles: [],
      },
    };
  }

  const rolesResponse = await iam.send(
    new ListRolesCommand({
      // Empty
    }),
  );

  const cdkRoles = [];
  for (const role of rolesResponse.Roles) {
    const RoleName = role.RoleName;
    const cmd = new ListRoleTagsCommand({
      RoleName,
    });

    const tagsResponse = await iam.send(cmd);
    const tagMatch = tagsResponse.Tags?.find(
      tag => tag.Key === 'aws-cdk:bootstrap-role'
        && event.ResourceProperties.cdkRoles.includes(
          tag.Value,
        ),
    );

    if (tagMatch) {
      cdkRoles.push(
        role.Arn,
      );
    }
  }

  return {
    Status: 'SUCCESS',
    PhysicalResourceId: `cdk-roles-${Date.now()}`,
    Data: {
      cdkRoles,
    },
  };
}
