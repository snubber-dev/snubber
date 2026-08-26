// Markdown scanning, as spec/format.json's parsing section defines it.
// Masking replaces code with spaces before the reference and link scans and
// never before structural matching — a line wholly inside code is blank after
// masking and is skipped for structure, which is how artifact syntax is quoted
// safely inside a fence.

// A fence opener: up to three spaces of indent, then a run of three or more
// backticks or tildes, then an info string. CommonMark forbids a backtick in a
// backtick fence's info string. The closer is the same character, at least the
// opener's length, nothing after it. Delimiter lines mask with their blocks; an
// unclosed fence extends to the end of the file. Indented code is not code to
// this parser, deliberately.
const FENCE_OPEN = /^ {0,3}((`{3,})|(~{3,}))(.*)$/;

// Inline spans, per line, CommonMark's pairing: an opener run of n backticks
// closes at the next run of exactly n backticks. A span never crosses a line —
// the record is line-oriented because its diffs are.
export function maskSpans(line: string): string {
  const runs: { start: number; len: number }[] = [];
  const re = /`+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) runs.push({ start: m.index, len: m[0].length });
  const out = line.split("");
  let i = 0;
  while (i < runs.length) {
    const open = runs[i];
    if (open === undefined) break;
    let j = i + 1;
    let close = runs[j];
    while (close !== undefined && close.len !== open.len) close = runs[++j];
    if (close !== undefined) {
      for (let k = open.start; k < close.start + close.len; k++) out[k] = " ";
      i = j + 1;
    } else {
      i++;
    }
  }
  return out.join("");
}

export function maskCode(text: string): string {
  const lines = text.split("\n");
  let fenceChar = "";
  let fenceLen = 0;
  const out: string[] = [];
  for (const line of lines) {
    if (fenceChar) {
      const close = line.match(/^ {0,3}(`{3,}|~{3,})\s*$/)?.[1];
      if (close !== undefined && close.charAt(0) === fenceChar && close.length >= fenceLen) {
        fenceChar = "";
        fenceLen = 0;
      }
      out.push(" ".repeat(line.length));
      continue;
    }
    const open = line.match(FENCE_OPEN);
    const mark = open?.[1];
    if (open && mark !== undefined && !(open[2] && (open[4] ?? "").includes("`"))) {
      fenceChar = mark.charAt(0);
      fenceLen = mark.length;
      out.push(" ".repeat(line.length));
      continue;
    }
    out.push(maskSpans(line));
  }
  return out.join("\n");
}

// Which raw lines lie wholly inside a fenced block (delimiter lines included).
// M-15's fence exemption reads this; masking alone cannot tell a fenced line
// from a line that is one long inline span.
export function fencedLines(text: string): boolean[] {
  const lines = text.split("\n");
  const fenced: boolean[] = [];
  let fenceChar = "";
  let fenceLen = 0;
  for (const line of lines) {
    if (fenceChar) {
      fenced.push(true);
      const close = line.match(/^ {0,3}(`{3,}|~{3,})\s*$/)?.[1];
      if (close !== undefined && close.charAt(0) === fenceChar && close.length >= fenceLen) {
        fenceChar = "";
        fenceLen = 0;
      }
      continue;
    }
    const open = line.match(FENCE_OPEN);
    const mark = open?.[1];
    if (open && mark !== undefined && !(open[2] && (open[4] ?? "").includes("`"))) {
      fenceChar = mark.charAt(0);
      fenceLen = mark.length;
      fenced.push(true);
      continue;
    }
    fenced.push(false);
  }
  return fenced;
}

export type Link = {
  text: string;
  dest: string;
  line: number;
  image: boolean;
  // Character span of the destination (and title) on its line, for the bare
  // web-reference scan, which excludes destinations and titles and reads link
  // text as prose.
  destStart: number;
  destEnd: number;
};

const DEF = /^ {0,3}\[([^\]]+)\]:\s*(?:<([^<>\n]*)>|(\S+))(?:\s+(?:"[^"]*"|'[^']*'|\([^()]*\)))?\s*$/;

function normalizeLabel(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

// All three CommonMark reference forms — full, collapsed, shortcut — resolved
// against their definitions; a bracketed token with no matching definition is
// not a link, and a definition line is not a link (only its uses are).
export function extractLinks(masked: string): { links: Link[]; defLines: Set<number> } {
  const links: Link[] = [];
  const defLines = new Set<number>();
  const defs = new Map<string, string>();
  const lines = masked.split("\n");

  lines.forEach((line, i) => {
    const d = line.match(DEF);
    if (d) {
      const label = normalizeLabel(d[1] ?? "");
      if (!defs.has(label)) defs.set(label, d[2] ?? d[3] ?? "");
      defLines.add(i + 1);
    }
  });

  lines.forEach((line, i) => {
    const ln = i + 1;
    if (defLines.has(ln)) return;
    const taken: [number, number][] = [];
    const covered = (a: number, b: number) => taken.some(([s, e]) => a < e && b > s);

    // Inline: [text](dest "title") and ![text](dest), angle-bracket destinations.
    const inline = /(!?)\[([^\]]*)\]\(\s*(<[^<>\n]*>|[^\s)]*)((?:\s+(?:"[^"]*"|'[^']*'|\([^()]*\)))?)\s*\)/dg;
    let m: RegExpExecArray | null;
    while ((m = inline.exec(line)) !== null) {
      let dest = m[3] ?? "";
      const destStart = m.indices?.[3]?.[0] ?? -1;
      const destEnd = m.index + m[0].length - 1;
      if (dest.startsWith("<") && dest.endsWith(">")) dest = dest.slice(1, -1);
      links.push({ text: m[2] ?? "", dest, line: ln, image: m[1] === "!", destStart, destEnd });
      taken.push([m.index, m.index + m[0].length]);
    }

    // Full and collapsed reference forms: [text][label], [text][].
    const ref = /(!?)\[([^\]]*)\]\[([^\]]*)\]/g;
    while ((m = ref.exec(line)) !== null) {
      if (covered(m.index, m.index + m[0].length)) continue;
      const label = normalizeLabel(m[3] || m[2] || "");
      const dest = defs.get(label);
      if (dest === undefined) continue;
      links.push({ text: m[2] ?? "", dest, line: ln, image: m[1] === "!", destStart: -1, destEnd: -1 });
      taken.push([m.index, m.index + m[0].length]);
    }

    // Shortcut form: [label] with a definition, not followed by ( or [.
    const short = /(!?)\[([^\]]+)\](?![([])/g;
    while ((m = short.exec(line)) !== null) {
      if (covered(m.index, m.index + m[0].length)) continue;
      const dest = defs.get(normalizeLabel(m[2] ?? ""));
      if (dest === undefined) continue;
      links.push({ text: m[2] ?? "", dest, line: ln, image: m[1] === "!", destStart: -1, destEnd: -1 });
      taken.push([m.index, m.index + m[0].length]);
    }
  });

  return { links, defLines };
}

// The scope glob dialect: whole-path, root-relative; ** in the three gitignore
// positions, a ** anywhere else is a *; * does not cross /; ? is one non-/
// character; no classes, no braces, everything else literal.
export function globToRegExp(glob: string): RegExp {
  let out = "";
  let g = glob;
  if (g.startsWith("**/")) {
    out += "(?:[^/]+/)*";
    g = g.slice(3);
  }
  let i = 0;
  while (i < g.length) {
    if (g.startsWith("/**/", i)) {
      out += "/(?:[^/]+/)*";
      i += 4;
      continue;
    }
    if (g.startsWith("/**", i) && i + 3 === g.length) {
      out += "/.+";
      i += 3;
      continue;
    }
    const c = g[i];
    if (c === undefined) break;
    if (c === "*") {
      if (g[i + 1] === "*") i++; // a ** anywhere else is a *
      out += "[^/]*";
    } else if (c === "?") {
      out += "[^/]";
    } else {
      out += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
    i++;
  }
  return new RegExp("^" + out + "$");
}
