document.addEventListener("click", (e) => {
  if (!(e.target instanceof Element) || e.target.closest("a, button, input, select, label")) return;
  e.target.closest<HTMLElement>("[data-word-item]")?.toggleAttribute("data-open");
});
