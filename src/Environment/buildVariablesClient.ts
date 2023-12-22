import dotenv from 'dotenv';
import fs from 'fs';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

dotenv.config();

const SECRET_NAME = process.env.SECRET_NAME || 'prod/beerpassport/backend';

const client = new SecretsManagerClient({
  region: 'us-east-1',
});

const getSecret = async () => {
  let response;
  try {
    response = await client.send(
      new GetSecretValueCommand({
        SecretId: SECRET_NAME,
        VersionStage: 'AWSCURRENT', // VersionStage defaults to AWSCURRENT if unspecified
      }),
    );
  } catch (error) {
    // For a list of exceptions thrown, see
    // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    console.error(error);
    throw error;
  }
  return response.SecretString;
};

interface BuildVariables {
  SENTRY_AUTH_TOKEN: string | undefined;
}

export const buildVariablesClient = async () => {
  const secret = await getSecret();
  if (!secret) {
    throw new Error('Cannot find secret from AWS Secrets Manager');
  }
  const secretJSON = JSON.parse(secret);
  const buildVariables: BuildVariables = {
    SENTRY_AUTH_TOKEN: secretJSON.SENTRY_AUTH_TOKEN,
  };
  if (hasUndefinedKeys(buildVariables)) {
    throw new Error('Missing environment variables build');
  }
  return buildVariables;
};

const setBuildVariables = async () => {
  const envData = (await buildVariablesClient()) as unknown as Record<string, string>;
  const envString = Object.keys(envData)
    .map(key => `${key}=${envData[key]}`)
    .join('\n');
  try {
    fs.appendFileSync('.env', `${envString}\n`, 'utf8');
    console.log('.env file has been updated with build variables.');
  } catch (error) {
    console.error('Error writing .env file:', error);
  }
};

setBuildVariables();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasUndefinedKeys(obj: Record<string, any>): boolean {
  return Object.keys(obj).some(key => obj[key] === undefined);
}
