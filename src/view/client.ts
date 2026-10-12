import htmx from "htmx.org";

import.meta.glob(["./**/*.css", "./**/*.client.ts"], { eager: true });

htmx.config.responseHandling = [
  { code: "204", swap: false },
  { code: "[23]..", swap: true },
  { code: "422", swap: true },
  { code: "[45]..", swap: false, error: true },
];
