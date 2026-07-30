const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*";
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function secureIndex(length: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % length;
}

function securePick(s: string): string {
  return s[secureIndex(s.length)];
}

function secureShuffle(arr: string[]): string[] {
  const buf = new Uint32Array(arr.length);
  crypto.getRandomValues(buf);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = buf[i] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateStrongPassword(): string {
  const arr = [securePick(UPPER), securePick(LOWER), securePick(DIGITS), securePick(SYMBOLS)];
  for (let i = 0; i < 8; i++) arr.push(securePick(ALL));
  return secureShuffle(arr).join("");
}

export function generateCode(length = 8): string {
  let c = "";
  for (let i = 0; i < length; i++) c += securePick(CODE_CHARS);
  return c;
}
