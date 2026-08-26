# R-D-mirrors-vs-generation — Checked duplication in the spec, or generation

**Status.** `open`
**Opened.** 2026-08-23
**Settles when.** It is stated whether the spec’s mirror declarations remain literal checked copies or are generated from their sources at load, and what the choice costs in standalone readability.

## Question

Four declarations in the spec are literal restatements of facts declared elsewhere in the
same file: the ID grammar’s letter class carries the type table’s keys, the heading grammar
carries the ID grammar, and the two event grammars carry the declared event kinds. Each
declares what it mirrors, and a rule recomposes and compares (M-27). That is
R-D-watched-copies applied to the format itself — the copies are permitted because the
assertion watches them.

The alternative was always available: generate the composed regexes from the declarations at
load, deleting the copies and the rule that watches them. It was refused so the JSON reads
standalone — a person opening the spec sees the actual pattern that will match their
heading, not a template awaiting assembly. That is a readability purchase paid for with
machinery, and the price rises with each new mirror: another declaration, another
recomposition, another way the notation can be half-learned. Whether the purchase still
earns its cost is worth re-asking before the notation becomes load-bearing habit.

This returns before the mirror notation’s next new use, or when the 0.2 line opens.
