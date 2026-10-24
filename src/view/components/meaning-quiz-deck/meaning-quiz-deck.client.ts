import { clamp } from "remeda";
import { playOne } from "../../helper/audio-player.client";

const playWord = (card: HTMLElement | undefined) => {
  const src = card?.querySelector<HTMLElement>(".speak")?.dataset.audio;
  if (src) playOne(src);
};

const deck = document.getElementById("meaning-quiz-deck");

if (deck) {
  const cards = [...deck.querySelectorAll<HTMLElement>("[data-quiz-card]")];
  const position = document.getElementById("meaning-quiz-position");
  const prev = document.querySelector<HTMLButtonElement>('[data-quiz-nav="prev"]');
  const next = document.querySelector<HTMLButtonElement>('[data-quiz-nav="next"]');
  const nextLabel = next?.querySelector<HTMLElement>('[data-nav-label="next"]');
  const finishLabel = next?.querySelector<HTMLElement>('[data-nav-label="finish"]');
  let current = 0;

  const show = (index: number) => {
    current = clamp(index, { min: 0, max: cards.length - 1 });
    cards.forEach((card, i) => {
      card.hidden = i !== current;
    });
    if (position) position.textContent = `${current + 1} / ${cards.length}`;
    if (prev) prev.disabled = current === 0;
    const last = current === cards.length - 1;
    if (next) next.ariaLabel = last ? "終了" : "次の問題";
    if (nextLabel) nextLabel.hidden = last;
    if (finishLabel) finishLabel.hidden = !last;
    window.scrollTo({ top: 0 });
    playWord(cards[current]);
  };

  prev?.addEventListener("click", () => show(current - 1));
  next?.addEventListener("click", () => {
    if (current < cards.length - 1) show(current + 1);
    else if (next.dataset.finishHref) location.href = next.dataset.finishHref;
  });

  deck.addEventListener("click", (e) => {
    const choice = e.target instanceof Element ? e.target.closest("button[hx-post]") : null;
    if (choice) playWord(choice.closest<HTMLElement>("[data-quiz-card]") ?? undefined);
  });

  playWord(cards[current]);
}
