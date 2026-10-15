import { clamp } from "remeda";

export const serveObject = async (
  bucket: R2Bucket,
  key: string,
  req: Request,
): Promise<Response> => {
  const rangeHeader = req.headers.get("range");
  const obj = await bucket.get(key, rangeHeader ? { range: req.headers } : undefined);
  if (!obj) return new Response("Not Found", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "public, max-age=86400");

  if (rangeHeader && obj.range) {
    const { start, end } = resolveRange(obj.range, obj.size);
    headers.set("content-range", `bytes ${start}-${end}/${obj.size}`);
    headers.set("content-length", String(end - start + 1));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set("content-length", String(obj.size));
  return new Response(obj.body, { headers });
};

const resolveRange = (range: R2Range, size: number): { start: number; end: number } => {
  const { offset, length, suffix } = range as { offset?: number; length?: number; suffix?: number };
  if (typeof suffix === "number") {
    return { start: clamp(size - suffix, { min: 0 }), end: size - 1 };
  }
  const start = typeof offset === "number" ? offset : 0;
  const end = typeof length === "number" ? clamp(start + length, { max: size }) - 1 : size - 1;
  return { start, end };
};
