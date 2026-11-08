import { type CardFilter, CardFilters } from "../../helper/card-filter";
import { cardUrl } from "../../helper/card-url";
import { MediaCacheName, PageCacheName } from "../../helper/offline-cache";

const Concurrency = 4;

// 同じオリジンの JS・CSS・マニフェスト・アイコン
const assetUrls = () =>
  [...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>("script[src], link[href]")]
    .map((el) => new URL("src" in el ? el.src : el.href, location.href))
    .filter((url) => url.origin === location.origin)
    .map((url) => url.href);

// 単語帳のページの URL。開始ダイアログが作る URL と同じ形にする（start だけ違うものは Service Worker が代わりに使う）
const playerUrl = (groupId: string, filter: CardFilter) => {
  const params = new URLSearchParams({ start: "0" });
  if (filter === "favorites") params.set("only", "favorites");
  return `/groups/${groupId}?${params}`;
};

// 単語帳のページの HTML から、そのページで開くカードの URL を集める
const cardUrls = (groupId: string, filter: CardFilter, html: string) => {
  const deck = new DOMParser().parseFromString(html, "text/html").getElementById("deck");
  const wordIds: number[] = JSON.parse(deck?.dataset.wordIds ?? "[]");
  return wordIds.map((_, index) => cardUrl({ groupId, wordIds, filter, index }));
};

// カードの HTML から音声と画像の URL を集める
const mediaUrls = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const audios = [...doc.querySelectorAll<HTMLElement>("[data-audio]")].flatMap(
    (el) => el.dataset.audio ?? [],
  );
  const images = [...doc.querySelectorAll("img[src]")].flatMap(
    (el) => el.getAttribute("src") ?? [],
  );
  return [...audios, ...images];
};

const fetchOk = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok || res.type !== "basic" || res.redirected) throw new Error(`${res.status} ${url}`);
  return res;
};

// tasks を Concurrency 個ずつ並べて動かし、1つ終わるたびに onDone を呼ぶ
const runAll = async (tasks: (() => Promise<void>)[], onDone: () => void) => {
  const queue = [...tasks];
  const worker = async () => {
    for (let task = queue.shift(); task; task = queue.shift()) {
      await task();
      onDone();
    }
  };
  await Promise.all(Array.from({ length: Concurrency }, worker));
};

const setupOfflineSave = (root: HTMLElement) => {
  const button = root.querySelector("button");
  const status = root.querySelector<HTMLElement>("[data-offline-status]");
  const groupId = root.dataset.offlineSave ?? "";
  const filters = CardFilters.filter(
    (filter) => filter === "all" || Number(root.dataset.favoritesCount) > 0,
  );
  const setStatus = (text: string) => {
    if (status) status.textContent = text;
  };

  const showSaved = async () => {
    const pages = await caches.open(PageCacheName);
    for (const filter of filters) {
      const player = await pages.match(playerUrl(groupId, filter));
      if (!player) return;
      const cards = cardUrls(groupId, filter, await player.text());
      const saved = await Promise.all(cards.map((url) => pages.match(url)));
      if (!saved.every(Boolean)) return;
    }
    setStatus("保存済み");
  };

  const save = async () => {
    const pages = await caches.open(PageCacheName);
    const media = await caches.open(MediaCacheName);
    await navigator.storage?.persist?.();

    const shared = [location.href, "/", ...assetUrls()];
    await Promise.all(shared.map(async (url) => pages.put(url, await fetchOk(url))));

    const cards: string[] = [];
    for (const filter of filters) {
      const url = playerUrl(groupId, filter);
      const res = await fetchOk(url);
      cards.push(...cardUrls(groupId, filter, await res.clone().text()));
      await pages.put(url, res);
    }

    const found = new Set<string>();
    let done = 0;
    await runAll(
      cards.map((url) => async () => {
        const res = await fetchOk(url);
        for (const src of mediaUrls(await res.clone().text())) found.add(src);
        await pages.put(url, res);
      }),
      () => setStatus(`カード ${++done} / ${cards.length}`),
    );

    const missing = [];
    for (const url of found) if (!(await media.match(url))) missing.push(url);
    done = 0;
    await runAll(
      missing.map((url) => async () => media.put(url, await fetchOk(url))),
      () => setStatus(`音声・画像 ${++done} / ${missing.length}`),
    );
  };

  button?.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await save();
      setStatus("保存済み");
    } catch {
      setStatus(navigator.onLine ? "保存に失敗しました。開き直してください" : "オフラインです");
    } finally {
      button.disabled = false;
    }
  });

  root.hidden = false;
  showSaved();
};

if ("caches" in window && "serviceWorker" in navigator) {
  for (const root of document.querySelectorAll<HTMLElement>("[data-offline-save]")) {
    setupOfflineSave(root);
  }
}
