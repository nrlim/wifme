import crypto from 'crypto';

if (!process.env.ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: ENCRYPTION_KEY environment variable is not set in production.');
}
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'wifme-dev-key-00000000000000000'; // 32 chars for dev only
const IV_LENGTH = 16;

export function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

export function decrypt(text: string) {
  const textParts = text.split(':');
  
  // Fallback for old CBC format: iv:encrypted
  if (textParts.length === 2) {
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  // New GCM format: iv:authTag:encrypted
  const iv = Buffer.from(textParts[0], 'hex');
  const authTag = Buffer.from(textParts[1], 'hex');
  const encryptedText = textParts[2];
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
