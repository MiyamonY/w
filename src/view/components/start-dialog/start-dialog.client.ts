import {
  buildSequence,
  loadProgress,
  PlayOrderStorageKey,
  storeProgress,
} from "../../helper/card-progress.client";
import { AudioModeStorageKey, parseAudioMode } from "../../helper/audio-mode";
import { type CardFilter, CardFilterStorageKey, parseCardFilter } from "../../helper/card-filter";
import { PlayOrderLabels, parsePlayOrder } from "../../helper/play-order";

const closest = (target: EventTarget | null, selector: string) =>
  target instanceof Element ? target.closest<HTMLElement>(selector) : null;

const isOutside = (dialog: HTMLDialogElement, e: MouseEvent) => {
  const rect = dialog.getBoundingClientRect();
  return (
    e.clientX < rect.left ||
    e.clientX > rect.right ||
    e.clientY < rect.top ||
    e.clientY > rect.bottom
  );
};

const setupStartDialog = (dialog: HTMLDialogElement) => {
  const favoritesInput = dialog.querySelector<HTMLInputElement>(
    'input[name="card-filter"][value="favorites"]',
  );
  const count = dialog.querySelector("[data-count]");
  const resume = dialog.querySelector<HTMLButtonElement>('[data-start="resume"]');
  let currentOpener: HTMLElement | null = null;
  let groupId = "";

  const currentFilter = (): CardFilter => (favoritesInput?.checked ? "favorites" : "all");
  const totalOf = (filter: CardFilter) =>
    Number(
      filter === "favorites"
        ? currentOpener?.dataset.favoritesCount
        : currentOpener?.dataset.allCount,
    );

  const refresh = () => {
    const filter = currentFilter();
    const total = totalOf(filter);
    if (count) count.textContent = `${total} 語`;
    if (!resume) return;
    const saved = loadProgress(groupId, filter, total);
    const progress = saved?.order === "random" ? null : saved;
    resume.hidden = !progress;
    if (progress) {
      resume.textContent = `続きから（${PlayOrderLabels[progress.order]} ${progress.step + 1} / ${total}）`;
    }
  };

  const check = (name: string, value: string) => {
    const input = dialog.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
    if (input) input.checked = true;
  };

  const StorageKeys: Record<string, string> = {
    "play-order": PlayOrderStorageKey,
    "audio-mode": AudioModeStorageKey,
    "card-filter": CardFilterStorageKey,
  };
  dialog.addEventListener("change", (e) => {
    if (!(e.target instanceof HTMLInputElement)) return;
    const key = StorageKeys[e.target.name];
    if (key) localStorage.setItem(key, e.target.value);
    if (e.target.name === "card-filter") refresh();
  });

  const open = (target: HTMLElement) => {
    currentOpener = target;
    groupId = target.dataset.startDialog ?? "";
    const hasFavorites = totalOf("favorites") > 0;
    if (favoritesInput) favoritesInput.disabled = !hasFavorites;
    const saved = parseCardFilter(localStorage.getItem(CardFilterStorageKey));
    check("card-filter", hasFavorites ? saved : "all");
    refresh();
    check("play-order", parsePlayOrder(localStorage.getItem(PlayOrderStorageKey)));
    check("audio-mode", parseAudioMode(localStorage.getItem(AudioModeStorageKey)));
    dialog.showModal();
  };

  document.addEventListener("click", (e) => {
    const opener = closest(e.target, "[data-start-dialog]");
    if (!opener || Number(opener.dataset.allCount) === 0) return;
    e.preventDefault();
    open(opener);
  });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog && isOutside(dialog, e)) {
      dialog.close();
      return;
    }
    const button = closest(e.target, "[data-start]");
    if (!button) return;
    const filter = currentFilter();
    const total = totalOf(filter);
    const resumed = button.dataset.start === "resume" ? loadProgress(groupId, filter, total) : null;
    const order =
      resumed?.order ??
      parsePlayOrder(
        dialog.querySelector<HTMLInputElement>('input[name="play-order"]:checked')?.value,
      );
    const progress = resumed ?? { order, step: 0, sequence: buildSequence(order, total) };
    localStorage.setItem(PlayOrderStorageKey, order);
    storeProgress(groupId, filter, progress);
    dialog.close();
    const params = new URLSearchParams({ start: String(progress.sequence[progress.step] ?? 0) });
    if (filter === "favorites") params.set("only", "favorites");
    location.href = `/groups/${groupId}?${params}`;
  });
};

const dialog = document.getElementById("start-dialog");
if (dialog instanceof HTMLDialogElement) setupStartDialog(dialog);
