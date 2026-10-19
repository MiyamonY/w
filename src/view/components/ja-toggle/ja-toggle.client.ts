const JaStorageKey = "wordListJa";

const jaToggle = document.getElementById("ja-toggle");
const wordList = document.getElementById("word-list");

if (jaToggle instanceof HTMLInputElement && wordList) {
  const applyJa = (on: boolean) => {
    jaToggle.checked = on;
    wordList.dataset.ja = on ? "on" : "off";
  };
  applyJa(localStorage.getItem(JaStorageKey) !== "off");
  jaToggle.addEventListener("change", () => {
    localStorage.setItem(JaStorageKey, jaToggle.checked ? "on" : "off");
    applyJa(jaToggle.checked);
  });
}
