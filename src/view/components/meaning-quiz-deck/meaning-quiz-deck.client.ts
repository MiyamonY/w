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
  let current = 0;

  const show = (index: number) => {
    current = clamp(index, { min: 0, max: cards.length - 1 });
    cards.forEach((card, i) => {
      card.hidden = i !== current;
    });
    if (position) position.textContent = `${current + 1} / ${cards.length}`;
    if (prev) prev.disabled = current === 0;
    if (next) next.disabled = current === cards.length - 1;
    window.scrollTo({ top: 0 });
    playWord(cards[current]);
  };

  prev?.addEventListener("click", () => show(current - 1));
  next?.addEventListener("click", () => show(current + 1));

  deck.addEventListener("click", (e) => {
    const choice = e.target instanceof Element ? e.target.closest("button[hx-post]") : null;
    if (choice) playWord(choice.closest<HTMLElement>("[data-quiz-card]") ?? undefined);
  });

  playWord(cards[current]);
}
