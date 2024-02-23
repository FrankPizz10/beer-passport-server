import { randomBytes, scryptSync } from 'crypto';

export const generateKey = (size = 32, format: BufferEncoding | undefined = 'base64') => {
  const buffer = randomBytes(size);
  return buffer.toString(format);
};

export const generateSecretHash = (key: string) => {
  const salt = randomBytes(8).toString('hex');
  const buffer = scryptSync(key, salt, 64) as Buffer;
  return `${buffer.toString('hex')}.${salt}`;
};
