const passage = document.getElementById("passage");
const toggle = document.getElementById("meaning-toggle");

if (passage && toggle) {
  toggle.addEventListener("click", () => {
    const on = passage.dataset.meaning !== "on";
    passage.dataset.meaning = on ? "on" : "off";
    toggle.textContent = on ? "意味を隠す" : "意味を表示";
  });
  passage.addEventListener("click", (e) => {
    const word = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-word]") : null;
    if (!word) return;
    word.toggleAttribute("data-open");
  });
}
