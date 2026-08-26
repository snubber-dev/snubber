# snubber

Keeps settled things settled in a repository worked on with agents.

A project accumulates decisions faster than it accumulates ways to keep them. snubber gives
a repository a *record*: Decisions, the Evidence behind them, and the Work they gate, written
as Markdown files that live and travel with the code they govern. The `snubber` CLI checks
the record against the tree and fails when the two disagree — a settled thing quietly
unsettled is a red, not a surprise three months later.

The format is the point; the tool enforces it. The format's contract is
[`spec/format.json`](spec/format.json), which travels with each repository as its carried
spec, and its prose is [`spec/v0.md`](spec/v0.md). Below 1.0.0 the format is not stable — a
minor bump may fail an existing conforming record.

## Use

Requires Node >= 22.18 and a git repository — the repository is what git reports present
and not ignored, so no git is an error, not a fallback.

```
npx snubber init            # seed record/ in the current repository
npx snubber init --context  # also seed record/context.md, red until filled
npx snubber check           # 0 clean, 1 violations, 2 the tool could not run
npx snubber check --rule M-15
npx snubber board           # the computed view of the record's state
npx snubber rules           # every rule the checker implements
```

The exit code is the whole external contract: `0` clean, `1` violations, `2` a tool error.
Every error names what was not understood and the way out.

## The GitHub Action

`action.yml` runs the check on a pull request and posts the board to the step summary:

```yaml
on: pull_request

jobs:
  record:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: snubber-dev/snubber@v0.1.0
```

## This repository's own record

This repository is checked by the tool it ships — `record/` holds its decisions, and CI
runs the same action a consumer would. Two things are deliberate and worth knowing before
reading. The record currently exercises one artifact type of three: decisions are filed,
Evidence and Work items come as the project accrues them, and the board reports
`record/evidence/**` as a gated Scope — that is the ruled behaviour, not a fault. And the
published npm package ships the checker and the spec (`dist/`, `spec/`), never this
record: a record travels with its repository, not with the tool.

## Development

```
pnpm install
node test/run.ts   # the battery
pnpm run build     # tsc, emits dist/
```

MIT — see [LICENSE](LICENSE).
