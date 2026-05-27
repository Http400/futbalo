---
name: commit-message
description: Draft a Conventional Commits message for the current git change set, following this repo's house style (lowercase subject, workspace-derived scope, optional body). Inspects staged changes by default (pass `all` to include unstaged). Prints the proposed message and a ready-to-run `git commit` command, then offers to run it. Use when the user asks to "write a commit message", "generate commit", "commit this", "draft a commit", or similar.
---

# /commit-message — Draft a Conventional Commits message

Produce a commit message for the current change set and offer to commit. Mirrors this repo's house style: Conventional Commits, lowercase imperative subject, scope inferred from the workspace, subject + optional body. Default scope is **staged changes only**; pass `all` inline to include unstaged tracked changes.

This skill drafts on the user's behalf. It does **not** add a co-author trailer (that policy applies when the CLI itself authors a commit). It never commits without explicit approval.

## Initial Response

When this skill is invoked:

1. Parse the inline arg, if any:
   - `all` (case-insensitive) → include unstaged tracked changes (`git diff HEAD`).
   - anything else (or empty) → staged only (`git diff --cached`).
2. Verify the environment with quick git probes (all errors stop the skill and surface verbatim):
   - `git rev-parse --is-inside-work-tree` → must be true; else abort with: "Not inside a git repository."
   - `git rev-parse --abbrev-ref HEAD` → note branch; if `HEAD` (detached), warn but continue.
   - Check `.git/MERGE_HEAD`, `.git/REBASE_HEAD`, `.git/CHERRY_PICK_HEAD` — if any exist, warn the user a merge/rebase/cherry-pick is in progress before drafting.
3. Snapshot the change set:
   - `git status --porcelain=v1` — list of changed paths and their states.
   - `git diff --cached --stat` (or `git diff HEAD --stat` for `all`) — per-file line deltas.
   - `git diff --cached` (or `git diff HEAD`) — full diff. If total changed lines > ~2000 **or** the diff exceeds a comfortable read budget, switch to per-file `--stat` mode and note "Large diff — summary is heuristic." Skip binary files' content (only their paths).
   - `git log -20 --pretty=format:"%s"` — recent subjects, to mirror tone, casing, and existing scope vocabulary.
4. If the relevant change set is empty:
   - Staged mode: abort with "No staged changes. Run `git add <paths>` first, or invoke `/commit-message all` to include unstaged changes."
   - `all` mode: abort with "No tracked changes in the working tree."
5. Otherwise echo a one-line plan: `Inspecting N file(s) across <workspaces>; drafting a Conventional Commits message.`

## Process

### Step 1: Classify the change

**Type** — pick exactly one from: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `build`, `ci`, `chore`, `style`, `revert`. Use diff signals, not guesses:

- `feat` — new public surface (new exported function, route, component, schema, env var, package).
- `fix` — corrects misbehaviour; look for negative diff in implementation paired with new/changed tests, or commits/issues referenced in the diff.
- `refactor` — internal restructuring; no behaviour change, no public-surface change.
- `perf` — measurable performance work (caching, batching, algorithm swap).
- `docs` — only `*.md`, `docs/**`, JSDoc/TSdoc, or comment-only changes.
- `test` — only `*.test.*` / `*.spec.*` / `__tests__/**` changes (no production code).
- `build` — build system, bundler, compiler config (`tsconfig*`, `vite.config*`, `turbo.json`, Dockerfile, `docker-compose.yml`).
- `ci` — `.github/workflows/**` only. *(Note: this repo has no CI workflows yet per `AGENTS.md`; do not invent a CI scope.)*
- `chore` — tooling, lint/format config, scripts, housekeeping. Dep-only bumps → `chore(deps)`.
- `style` — pure formatting/whitespace (Prettier run with no logic edits).
- `revert` — revert commit; subject mirrors the reverted one.

Mixed-intent diffs: pick the dominant intent for the subject, mention the secondary one in the body, and add a one-line warning to the user suggesting they may want to split the commit.

**Scope** — derive from the file paths:

- All files under a single `apps/<name>` → scope is `<name>` (`web-app`, `admin-app`).
- All files under a single `services/<name>` → scope is `<name>` (e.g. `auth-service`).
- All files under a single `packages/<name>` → scope is `<name>` (`ui`, `types`).
- All files under `nginx/` → scope `nginx`. Under root Docker files (`docker-compose.yml`, `Dockerfile*`) → `docker`. Under `.github/**` → `github` (or `ci` only for `workflows/`).
- Dependency-only changes (`package.json` + `pnpm-lock.yaml`, no source) → scope `deps`.
- Two or more workspaces touched: if one workspace owns > ~70% of changed lines, use it as scope; otherwise **omit the scope** (bare `feat: ...`).
- Root-only config with no clean scope → omit scope rather than invent one.

Cross-check the chosen scope against `git log -20` subjects. If the project uses a different short form for the same area (e.g. `auth` vs `auth-service`), prefer the form that appears in history.

### Step 2: Draft the message

**Subject** — `type(scope): summary` (or `type: summary` when scope is omitted):

- Lowercase, imperative (`add`, `fix`, `move`, not `added` / `adds`).
- ≤ 72 characters. No trailing period.
- Describe *what changes* in the codebase, not what the user did. Reference the public surface when relevant ("add /signup endpoint", not "implement signup").
- For `revert`, mirror the original subject prefixed with `revert: `.

**Body** — include only when the diff is non-trivial. Triggers for including a body:

- More than one file changed **and** the changes span more than one concern, **or**
- Total changed lines > ~30, **or**
- A breaking change, migration, or user-visible behaviour shift is present.

When included:

- Blank line after the subject, then short paragraphs or `- ` bullets.
- Wrap at ~80 characters.
- Explain *what* and *why* (not *how* — the diff shows that). One bullet per logical concern.
- If breaking: add a `BREAKING CHANGE: <description>` footer (blank line before it).
- No issue refs unless the diff/branch name carries one; if the branch is e.g. `123-add-signup`, you may add a `Refs #123` footer.

Skip the body for trivial single-file edits (typo fix, version bump, formatting).

### Step 3: Echo + confirm

Print the proposed message in a fenced block. Then print the ready-to-run command:

- **Subject only** — print as one line:

  ````
  git commit -m "<subject>"
  ````

- **Subject + body** — print as a heredoc (avoids `-m` quoting hell):

  ````
  git commit -F- <<'EOF'
  <subject>

  <body>
  EOF
  ````

If a merge/rebase/cherry-pick was detected in the Initial Response, restate that warning here.

Then ask the user (multiple-choice):

- question: "Commit with this message?"
  header: "Confirm"
  options:
  - label: "Run it"
    description: "Execute the git commit command above."
  - label: "Edit"
    description: "Tell me what to change and I'll redraft."
  - label: "Copy only"
    description: "Don't commit — I'll copy the command myself."
  - label: "Cancel"
    description: "Discard the draft."
    multiSelect: false

### Step 4: Execute (only on "Run it")

Run the exact command shown. Capture stdout and stderr.

- On success: print the new commit's short SHA and subject (`git log -1 --pretty=format:"%h %s"`).
- On non-zero exit: surface the full stderr verbatim. Do not retry. Do not amend or rephrase the message without the user's say-so.

### Step 5: Stop

Do not chain into other skills. Do not offer to push. The user invoked this for one commit.

## Edge cases

- **No git repo** — abort in Initial Response.
- **No staged changes** (and not `all`) — abort with the `git add` / `/commit-message all` hint.
- **Detached HEAD** — warn, continue. Note in the confirm step that the commit will be unreachable without a branch.
- **Merge / rebase / cherry-pick in progress** — warn before drafting; recommend the user finish the in-progress operation unless they specifically want to commit mid-conflict resolution.
- **Binary-only diff** — base the summary on `git status` + `--stat`; do not attempt to read binary content.
- **Very large diff (> ~2000 lines)** — switch to per-file `--stat` summary; warn the message is heuristic; bias toward a body with one bullet per file group.
- **Mixed intent** — pick dominant type, mention secondary in body, warn the user a split commit may be cleaner.
- **Lockfile-only changes** — `chore(deps): bump <pkg> to <ver>` when a single dep is responsible; otherwise `chore(deps): update dependencies` with a body listing significant bumps.
- **Generated files** (`services/auth-service/src/generated/**`) — if these appear in the diff, mention them in the body and ask the user to confirm they intended to commit generated output (per `AGENTS.md`, the directory is normally not hand-edited).
- **Pre-commit hook failure** — surface stderr; do not auto-`--no-verify`.

## Notes

- **Never auto-commit.** Even in autopilot, the confirm step is mandatory. The user owns the message.
- **No co-author trailer.** The CLI's trailer policy applies to commits the CLI authors; this skill drafts on the user's behalf, so the trailer is omitted unless the user asks for it.
- **Mirror history, don't override it.** If recent commits use a scope form that differs from the rules above (e.g. `auth` instead of `auth-service`), prefer the existing form so history stays consistent.
- **Subject-only when you can.** A clear subject + an honest diff beats a padded body. Add a body only when the change actually warrants explanation.
- **No issue invention.** Only add `Refs #N` / `Closes #N` when N is visibly present in the branch name, diff, or the user's invocation. Never guess.
- **Read `AGENTS.md` for repo conventions** when in doubt about scope vocabulary or commit examples — it's the source of truth for house style.
