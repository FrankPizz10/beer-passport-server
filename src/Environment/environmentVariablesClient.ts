import dotenv from 'dotenv';
import fs from 'fs';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
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

dotenv.config();

interface EnvironmentVariables {
  PORT: string | undefined;
  DATABASE_URL: string | undefined;
  FIREBASE_TYPE: string | undefined;
  FIREBASE_PROJECT_ID: string | undefined;
  FIREBASE_PRIVATE_KEY_ID: string | undefined;
  FIREBASE_PRIVATE_KEY: string | undefined;
  FIREBASE_CLIENT_EMAIL: string | undefined;
  FIREBASE_CLIENT_ID: string | undefined;
  FIREBASE_AUTH_URI: string | undefined;
  FIREBASE_TOKEN_URI: string | undefined;
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL: string | undefined;
  FIREBASE_CLIENT_X509_CERT_URL: string | undefined;
  FIREBASE_UNIVERSE_DOMAIN: string | undefined;
  MYSQL_ROOT_PASSWORD: string | undefined;
  MYSQL_DATABASE: string | undefined;
  SENTRY_DSN: string | undefined;
}

export const environmentVariablesClient = async () => {
  const secret = await getSecret();
  if (!secret) {
    throw new Error('Cannot find secret from AWS Secrets Manager');
  }
  const secretJSON = JSON.parse(secret);
  const environmentVariables: EnvironmentVariables = {
    PORT: process.env.PORT,
    DATABASE_URL: secretJSON.DATABASE_URL,
    FIREBASE_TYPE: secretJSON.FIREBASE_TYPE,
    FIREBASE_PROJECT_ID: secretJSON.FIREBASE_PROJECT_ID,
    FIREBASE_PRIVATE_KEY_ID: secretJSON.FIREBASE_PRIVATE_KEY_ID,
    FIREBASE_PRIVATE_KEY: secretJSON.FIREBASE_PRIVATE_KEY,
    FIREBASE_CLIENT_EMAIL: secretJSON.FIREBASE_CLIENT_EMAIL,
    FIREBASE_CLIENT_ID: secretJSON.FIREBASE_CLIENT_ID,
    FIREBASE_AUTH_URI: secretJSON.FIREBASE_AUTH_URI,
    FIREBASE_TOKEN_URI: secretJSON.FIREBASE_TOKEN_URI,
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: secretJSON.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    FIREBASE_CLIENT_X509_CERT_URL: secretJSON.FIREBASE_CLIENT_X509_CERT_URL,
    FIREBASE_UNIVERSE_DOMAIN: secretJSON.FIREBASE_UNIVERSE_DOMAIN,
    MYSQL_ROOT_PASSWORD: secretJSON.MYSQL_ROOT_PASSWORD,
    MYSQL_DATABASE: secretJSON.MYSQL_DATABASE,
    SENTRY_DSN: secretJSON.SENTRY_DSN,
  };
  if (hasUndefinedKeys(environmentVariables)) {
    throw new Error('Missing environment variables production');
  }
  return environmentVariables;
};

const setEnvironmentVariables = async () => {
  const envData = (await environmentVariablesClient()) as unknown as Record<string, string>;
  const envString = Object.keys(envData)
    .map(key => `${key}=${envData[key]}`)
    .join('\n');
  try {
    fs.writeFileSync('.env', envString, 'utf8');
    console.log('.env file has been updated with environment variables.');
  } catch (error) {
    console.error('Error writing .env file:', error);
  }
};

setEnvironmentVariables();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasUndefinedKeys(obj: Record<string, any>): boolean {
  return Object.keys(obj).some(key => obj[key] === undefined);
}
