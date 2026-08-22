# Syncing with upstream open-remote-ssh

firejail-manager forked from [jeanp413/open-remote-ssh](https://github.com/jeanp413/open-remote-ssh)
at `22b4519` and then replaced the SSH transport (`acc8877`). Because the fork
deleted or restructured whole subsystems, we do **not** merge or rebase against
upstream. Instead we cherry-pick applicable commits, adapt them as they land,
and track how far we've synced with the annotated tag `last-upstream-sync`.

## One-time setup (already done)

```sh
git remote add upstream https://github.com/jeanp413/open-remote-ssh.git
git fetch upstream
```

## Sync procedure

1. Fetch and list what's new since the last sync:

   ```sh
   git fetch upstream
   git log --oneline --reverse last-upstream-sync..upstream/master
   ```

2. Triage each commit, oldest first. Upstream squash-merges PRs, so each
   commit is a self-contained change.

   **Applies cleanly:**

   ```sh
   git cherry-pick -x <sha>
   ```

   **Applies with adaptation** (the common case):

   ```sh
   git cherry-pick -n <sha>     # stage changes without committing
   # edit until it fits the fork (see path map below)
   git add -A
   git commit                   # keep the upstream subject, add a trailer:
                                # Upstream-Commit: <sha>
   ```

   **Conflicted cherry-pick:** fix the files, `git add`, then
   `git cherry-pick --continue` (or `--abort` to bail and port by hand).

   **Not applicable** (SSH transport, Windows/macOS-only, repo-specific CI):
   skip it. Record the decision in the tag message in step 4 so the next sync
   doesn't re-review it. Skipped and adapted commits never match by patch-id,
   so `git log --cherry-pick` can't track this for us — the tag is the record.

3. Validate before moving on:

   ```sh
   npm run compile:src && npx eslint
   ```

4. Re-record the sync point, listing what was applied, adapted, skipped:

   ```sh
   git tag -fa last-upstream-sync upstream/master -m "Sync point: ..."
   git push origin master
   git push -f origin last-upstream-sync
   ```

## Path map (upstream → firejail-manager)

- `src/ssh/*`, auth parts of `src/authResolver.ts` — deleted. The transport is
  [src/jail/jailConnection.ts](../src/jail/jailConnection.ts), which pipes the
  install script to `bash -ls` over stdin, so shell-quoting fixes (e.g. the
  base64 encoding in `bc3852a`) are unnecessary.
- `src/scripts/server-setup.sh` — still inline in
  [src/serverSetup.ts](../src/serverSetup.ts) (`generateBashInstallScript`).
  Apply script changes by hand, or port `3cb82b9` (extract scripts into files)
  so future script fixes cherry-pick cleanly — most upstream install fixes
  touch those script files.
- `src/scripts/server-setup.ps1` — N/A, firejail is Linux-only.
- `CHANGELOG.md` — diverged; keep the fork's own entries and note the upstream
  PR number in the entry when porting a fix.

## Tips

- `git config rerere.enabled true` makes git remember how you resolved a
  conflict, which pays off when a chain of upstream commits touches the same
  lines you've already adapted.
- If a batch grows large, sync more often — the per-commit triage is cheap
  when it's only a handful of commits.
