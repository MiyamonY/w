// キャッシュ名は helper/offline-cache.ts と揃える
const PageCacheName = "pages";
const MediaCacheName = "media";

const OfflinePage = `<!doctype html>
<html lang="ja">
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<title>オフライン - 単語帳</title>
<body style="font-family: system-ui, sans-serif; padding: 2rem; text-align: center">
  <h1 style="font-size: 1.25rem">オフラインです</h1>
  <p>このページはオフライン用に保存されていません。</p>
  <p><a href="/">単語帳の一覧へ</a></p>
  <button onclick="location.reload()" style="padding: 0.5rem 1.5rem">再読み込み</button>
</body>
</html>`;

const offlinePage = () =>
  new Response(OfflinePage, { headers: { "content-type": "text/html; charset=utf-8" } });

const isMedia = (url) => url.pathname.startsWith("/audio/") || url.pathname.startsWith("/images/");

// <audio> は Range 付きで取りに来る。保存した全体から要求された範囲を切り出して 206 で返す
const sliceRange = async (res, range) => {
  const match = range && /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) return res;
  const body = await res.arrayBuffer();
  const size = body.byteLength;
  const [, from, to] = match;
  const start = from === "" ? Math.max(size - Number(to), 0) : Number(from);
  const end = from === "" || to === "" ? size - 1 : Math.min(Number(to), size - 1);
  if (start > end) {
    return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
  }
  const headers = new Headers(res.headers);
  headers.set("content-range", `bytes ${start}-${end}/${size}`);
  headers.set("content-length", String(end - start + 1));
  return new Response(body.slice(start, end + 1), { status: 206, headers });
};

// 音声・画像は変わらないので、保存済みならそれを返す。無ければ取りに行き、後で全体を保存する
const fromMedia = async (event) => {
  const { request } = event;
  const cache = await caches.open(MediaCacheName);
  const cached = await cache.match(request.url);
  if (cached) return sliceRange(cached, request.headers.get("range"));
  const res = await fetch(request);
  if (res.status === 200) event.waitUntil(cache.put(request.url, res.clone()));
  else if (res.status === 206) event.waitUntil(cache.add(request.url).catch(() => {}));
  return res;
};

// 単語帳のページは start だけが違うものを代わりに使える（start のカードはページ側で読み直す）
const similarPage = async (cache, request) => {
  const only = new URL(request.url).searchParams.get("only");
  const keys = await cache.keys(request, { ignoreSearch: true });
  const key = keys.find((k) => new URL(k.url).searchParams.get("only") === only);
  return key && cache.match(key);
};

// ページとカードはネットを優先し、取れたら保存する。オフラインなら保存したものを返す
const fromNetwork = async (event) => {
  const { request } = event;
  const cache = await caches.open(PageCacheName);
  try {
    const res = await fetch(request);
    if (res.ok && res.type === "basic") event.waitUntil(cache.put(request, res.clone()));
    return res;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode !== "navigate") throw error;
    return (await similarPage(cache, request)) ?? offlinePage();
  }
};

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(isMedia(url) ? fromMedia(event) : fromNetwork(event));
});
