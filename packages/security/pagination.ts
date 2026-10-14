import { createHmac, timingSafeEqual } from "node:crypto";
export function paginate<T>(
  items: readonly T[],
  pageSize: number,
  cursor: string | undefined,
  scope: string,
  secret: string,
) {
  const sign = (text: string) =>
    createHmac("sha256", secret).update(text).digest("base64url");
  const digest = sign(`${scope}:${JSON.stringify(items)}`);
  let offset = 0;
  if (cursor) {
    const [payload, signature] = cursor.split("."),
      expected = sign(payload ?? "");
    if (
      !signature ||
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      throw new Error("invalid_cursor");
    const decoded = JSON.parse(
      Buffer.from(payload ?? "", "base64url").toString(),
    ) as { offset: number; digest: string; expires: number };
    if (
      decoded.digest !== digest ||
      decoded.expires < Date.now() ||
      !Number.isInteger(decoded.offset) ||
      decoded.offset < 0 ||
      decoded.offset > items.length
    )
      throw new Error("restart_required");
    offset = decoded.offset;
  }
  const selected = items.slice(offset, offset + pageSize),
    next = offset + selected.length;
  const payload = Buffer.from(
    JSON.stringify({ offset: next, digest, expires: Date.now() + 300000 }),
  ).toString("base64url");
  return {
    items: selected,
    next_cursor: next < items.length ? `${payload}.${sign(payload)}` : null,
  };
}
