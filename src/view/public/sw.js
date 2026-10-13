const OfflinePage = `<!doctype html>
<html lang="ja">
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>オフライン - 単語帳</title>
<body style="font-family: system-ui, sans-serif; padding: 2rem; text-align: center; color: #333">
  <h1 style="font-size: 1.25rem">オフラインです</h1>
  <p>ネットワークにつながったら、もう一度開いてください。</p>
  <button onclick="location.reload()" style="padding: 0.5rem 1.5rem">再読み込み</button>
</body>
</html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OfflinePage, { headers: { "content-type": "text/html; charset=utf-8" } }),
    ),
  );
});
