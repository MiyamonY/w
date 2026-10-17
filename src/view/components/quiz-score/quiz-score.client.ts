const score = document.getElementById("quiz-score");

const countResults = (selector: string) =>
  String(document.querySelectorAll(`section[data-result${selector}]`).length);

const updateScore = () => {
  const correct = score?.querySelector('[data-score="correct"]');
  const answered = score?.querySelector('[data-score="answered"]');
  if (correct) correct.textContent = countResults('="correct"');
  if (answered) answered.textContent = countResults("");
};

if (score) document.body.addEventListener("htmx:afterSettle", updateScore);
