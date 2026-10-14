import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
export function encrypt(value: unknown, key: string, context: string): Buffer {
  const material = Buffer.from(key, "base64url");
  if (material.length !== 32)
    throw new Error("Encryption key must be 32 bytes");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", material, iv);
  cipher.setAAD(Buffer.from(context));
  const data = Buffer.concat([
    cipher.update(JSON.stringify(value)),
    cipher.final(),
  ]);
  return Buffer.concat([Buffer.from([1]), iv, cipher.getAuthTag(), data]);
}
export function decrypt<T>(value: Buffer, key: string, context: string): T {
  if (value[0] !== 1 || value.length < 29)
    throw new Error("Invalid encrypted field");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "base64url"),
    value.subarray(1, 13),
  );
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(value.subarray(13, 29));
  return JSON.parse(
    Buffer.concat([
      decipher.update(value.subarray(29)),
      decipher.final(),
    ]).toString(),
  ) as T;
}
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
