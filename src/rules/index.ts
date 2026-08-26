import { M02, M03, M04, M25 } from "./ids.ts";
import { M05, M06, M19, M29 } from "./fields.ts";
import { M07, M08, M09 } from "./status.ts";
import { M01, M13, M18, M24 } from "./links.ts";
import { M12, M17, M23, M30 } from "./graph.ts";
import { M14 } from "./scope.ts";
import { M15, M16, M31 } from "./lines.ts";
import { M20, M21 } from "./dates.ts";
import { M22, M26, M27, M28 } from "./spec.ts";
import type { Rule } from "./types.ts";

// M-10 and M-11 are retired rule numbers and are never reused.
export const RULES: Rule[] = [
  M01, M02, M03, M04, M05, M06, M07, M08, M09,
  M12, M13, M14, M15, M16, M17, M18, M19, M20, M21,
  M22, M23, M24, M25, M26, M27, M28, M29, M30, M31,
];
