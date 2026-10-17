import {
  buildSequence,
  loadProgress,
  PlayOrderStorageKey,
  storeProgress,
} from "../../helper/card-progress.client";
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
  const rows = [...dialog.querySelectorAll<HTMLElement>("section[data-filter]")];
  let groupId = "";

  const open = (opener: HTMLElement) => {
    groupId = opener.dataset.startDialog ?? "";
    for (const row of rows) {
      const filter = row.dataset.filter ?? "all";
      const total = Number(
        filter === "favorites" ? opener.dataset.favoritesCount : opener.dataset.allCount,
      );
      row.dataset.total = String(total);
      row.hidden = total === 0;
      const count = row.querySelector("[data-count]");
      if (count) count.textContent = `${total} 語`;
      const resume = row.querySelector<HTMLButtonElement>('[data-start="resume"]');
      if (!resume) continue;
      const progress = loadProgress(groupId, filter, total);
      resume.hidden = !progress;
      if (progress) {
        resume.textContent = `続きから（${PlayOrderLabels[progress.order]} ${progress.step + 1} / ${total}）`;
      }
    }
    const order = parsePlayOrder(localStorage.getItem(PlayOrderStorageKey));
    const orderInput = dialog.querySelector<HTMLInputElement>(
      `input[name="play-order"][value="${order}"]`,
    );
    if (orderInput) orderInput.checked = true;
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
    const row = closest(e.target, "section[data-filter]");
    if (!button || !row) return;
    const filter = row.dataset.filter ?? "all";
    const total = Number(row.dataset.total);
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
