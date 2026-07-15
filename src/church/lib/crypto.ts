import CryptoJS from 'crypto-js';

export function encryptData(text: string, key: string): string {
  if (!text) return '';
  return CryptoJS.AES.encrypt(text, key).toString();
}

export function decryptData(encryptedText: string, key: string): string {
  if (!encryptedText) return '';
  const bytes = CryptoJS.AES.decrypt(encryptedText, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}
