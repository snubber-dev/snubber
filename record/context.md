# Context

## What this is

snubber is a file format and a command-line checker for keeping settled things settled in a
repository worked on with agents. Decisions, the evidence behind them, and the work they
gate live as Markdown files inside the repository they govern; the checker reads the tree
and reports where the record and the repository disagree.

## Who this is for

People and agents sharing a repository, where a thing decided earlier must stay visible and
binding while later work — human or agent — continues around it.

## Vocabulary

An *artifact* is a Markdown file the format's grammar reads; the types are *Decision* (a
question, its candidates, and a *Ruling* once closed), *Evidence* (an immutable
observation), and *Work* (implementation an open Decision gates). A Ruling's *Scope* names
the files it binds. The *record* is the artifacts under their declared homes together with
the *carried spec* — the `spec/format.json` in the checked tree. A *rule* (`M-nn`) is one
check; a *violation* is its red. The *board* is the computed view of the record's state.

## Non-goals

snubber is not a task tracker, not a documentation generator, and not a CI system. It runs
no network calls, keeps no state outside the tree, and stores no view a command can compute.

## Where things live

Decisions live in `record/decisions/`. The format is `spec/format.json`, with its prose in
`spec/v0.md`. The checker is `src/`, its battery `test/`, and `action.yml` runs the checker
on a pull request.
