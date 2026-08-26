// Field-value reading, as parsing.field_values defines it. A value is a single
// raw line: trimmed before any reading, wrapped means the entire value is one
// code span, the wrap's backticks strip before any reading, and the result is
// trimmed again. A value carrying several spans is not wrapped and strips
// nowhere. List-shaped values split on commas outside code spans, each item
// trimmed, the whole-value strip then applying per item.

import { maskSpans } from "./md.ts";

export function stripValue(value: string): string {
  const t = value.trim();
  const open = t.match(/^`+/);
  if (!open) return t;
  const n = open[0].length;
  // The closer is the next run of exactly n backticks; a wrap's closer ends at
  // the value's last character.
  const re = /`+/g;
  re.lastIndex = n;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    if (m[0].length !== n) continue;
    if (m.index + n === t.length) return t.slice(n, t.length - n).trim();
    return t; // a span that closes early: several spans, or trailing text — not a wrap
  }
  return t; // unclosed backticks are not a wrap
}

export function splitList(value: string): string[] {
  const masked = maskSpans(value);
  const items: string[] = [];
  let start = 0;
  for (let i = 0; i < masked.length; i++) {
    if (masked[i] === ",") {
      items.push(value.slice(start, i));
      start = i + 1;
    }
  }
  items.push(value.slice(start));
  return items.map((s) => stripValue(s.trim()));
}
