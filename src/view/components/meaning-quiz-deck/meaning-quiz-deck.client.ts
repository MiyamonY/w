import { clamp } from "remeda";

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
  };

  prev?.addEventListener("click", () => show(current - 1));
  next?.addEventListener("click", () => show(current + 1));
}
