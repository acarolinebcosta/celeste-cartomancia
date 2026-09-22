import { randomBytes } from "node:crypto";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function createPublicCode(bytes: (size: number) => Buffer = randomBytes): string {
  const entropy = bytes(10);
  let token = "";
  for (let index = 0; index < 10; index += 1) {
    token += ALPHABET[entropy[index] % ALPHABET.length];
  }
  return `CEL-${token}`;
}
