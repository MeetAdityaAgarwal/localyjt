import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const algorithm = 'aes-256-cbc';
const key = process.env.ENCRYPTION_KEY || randomBytes(32);
const iv = process.env.ENCRYPTION_IV || randomBytes(16);

export function encrypt(text: string): string {
  const cipher = createCipheriv(algorithm, Buffer.from(key), Buffer.from(iv));
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
}

export function decrypt(encryptedText: string): string {
  const encryptedBuffer = Buffer.from(encryptedText, 'hex');
  const decipher = createDecipheriv(algorithm, Buffer.from(key), Buffer.from(iv));
  let decrypted = decipher.update(encryptedBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export function encryptObject<T extends object>(obj: T): T {
  const encrypted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && shouldEncrypt(key)) {
      encrypted[key] = encrypt(value);
    } else {
      encrypted[key] = value;
    }
  }
  return encrypted as T;
}

export function decryptObject<T extends object>(obj: T): T {
  const decrypted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && shouldEncrypt(key)) {
      decrypted[key] = decrypt(value);
    } else {
      decrypted[key] = value;
    }
  }
  return decrypted as T;
}

function shouldEncrypt(key: string): boolean {
  const sensitiveFields = [
    'name',
    'email',
    'details',
    'address',
    'phone',
    'notes',
  ];
  return sensitiveFields.includes(key);
}