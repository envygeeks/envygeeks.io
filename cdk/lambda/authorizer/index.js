// noinspection JSUnresolvedReference

const originToken = process.env.ORIGIN_TOKEN;
function parseArn(arn) {
  const parts = arn.split(':');
  if (parts.length < 6) {
    throw new Error(`Invalid ARN: ${arn}`);
  }

  const resourceParts = parts.slice(5).join(':');
  const resource = resourceParts.split('/');
  return {
    arnPrefix: parts[0],
    partition: parts[1],
    service: parts[2],
    region: parts[3],
    account: parts[4],
    resource,
  };
}

exports.handler = async (event) => {
  try {
    const receivedToken = event.authorizationToken;
    const parsed = parseArn(event.methodArn);
    const wildcardArn = 'arn:aws:execute-api:'
      + `${parsed.region}:${parsed.account}:${parsed.resource[0]}/`
      + `${parsed.resource[1]}/*/*`;

    if (!receivedToken || receivedToken !== originToken) {
      console.log('token does not match');
      return {
        principalId: 'unauthorized',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Resource: wildcardArn,
              Action: 'execute-api:Invoke',
              Effect: 'Deny',
            },
          ],
        },
      };
    }

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Resource: wildcardArn,
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
          },
        ],
      },
    };
  }
  catch (error) {
    console.error('Error:', error);
    return {
      principalId: 'unauthorized',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Resource: event.methodArn,
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
          },
        ],
      },
    };
  }
};
