import type { SourceNumber } from "../../backend/db";

export const formatSourceNumbers = (numbers: SourceNumber[], prefix = "No.") =>
  numbers.length === 1
    ? `${prefix}${numbers[0].number}`
    : numbers.map((n) => `${prefix}${n.number}（${n.source_title}）`).join(" / ");
