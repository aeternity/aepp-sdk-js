import { AensName } from '../src';

function randomString(len: number): string {
  const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < len; i++) {
    const randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.charAt(randomPoz);
  }
  return randomString;
}

export function randomName(length: number): AensName {
  return `${randomString(length)}.chain`;
}
