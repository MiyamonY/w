import "./app.css";
import htmx from "htmx.org";

import.meta.glob("./**/*.client.ts", { eager: true });

htmx.config.allowEval = false;
htmx.config.responseHandling = [
  { code: "204", swap: false },
  { code: "[23]..", swap: true },
  { code: "422", swap: true },
  { code: "[45]..", swap: false, error: true },
];

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
