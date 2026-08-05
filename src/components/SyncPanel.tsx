"use client";

import { useEffect, useId, useState } from "react";
import type { AppData } from "@/lib/types";
import { SyncError, loadConfig, saveConfig, sync, type SyncConfig } from "@/lib/sync";

/**
 * Setup and status for gist sync.
 *
 * The token is handled as a write-only secret: it goes from the field straight
 * into localStorage and is never read back into the form, never logged, and
 * never placed in a URL. The only thing that touches it afterwards is `sync()`,
 * which sends it as an Authorization header.
 */

type Status =
  | { kind: "idle" }
  | { kind: "syncing" }
  | { kind: "done"; at: Date; entries: number }
  | { kind: "error"; message: string };

export function SyncPanel({
  data,
  onSynced,
}: {
  data: AppData;
  /** Adopt the merged snapshot — `replaceAll` from the store. */
  onSynced: (next: AppData) => void;
}) {
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [gistId, setGistId] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const tokenFieldId = useId();
  const gistFieldId = useId();
  const statusId = useId();

  // Whether this device is configured is a localStorage question, so it can
  // only be answered after mount — rendering "not set up" before that would be
  // a guess, and a wrong one for anybody who has already connected.
  useEffect(() => {
    const saved = loadConfig();
    setConfig(saved);
    setGistId(saved?.gistId ?? "");
    setReady(true);
  }, []);

  const connected = config !== null;
  const syncing = status.kind === "syncing";
  const trimmedGist = gistId.trim();
  const trimmedToken = token.trim();

  const canSave =
    trimmedGist.length > 0 && (trimmedToken.length > 0 || config !== null);
  const credentialsChanged =
    trimmedToken.length > 0 || trimmedGist !== (config?.gistId ?? "");

  function handleSave() {
    const next: SyncConfig = {
      // A blank token on an already-connected device means "keep the one you
      // have" — the alternative would be forcing a re-paste to fix a typo in
      // the gist id.
      token: trimmedToken || (config?.token ?? ""),
      gistId: trimmedGist,
    };
    if (!next.token || !next.gistId) return;
    saveConfig(next);
    setConfig(next);
    setToken("");
    setStatus({ kind: "idle" });
  }

  function handleDisconnect() {
    saveConfig(null);
    setConfig(null);
    setToken("");
    setGistId("");
    setStatus({ kind: "idle" });
  }

  async function handleSync() {
    if (!config) return;
    setStatus({ kind: "syncing" });
    try {
      const merged = await sync(config, data);
      onSynced(merged);
      setStatus({ kind: "done", at: new Date(), entries: merged.entries.length });
    } catch (e) {
      // `SyncError` already names the failures that actually happen — an
      // expired token, a missing `gist` scope, a gist id this token cannot
      // see. Anything else reached the network layer and never got a reply.
      setStatus({
        kind: "error",
        message:
          e instanceof SyncError
            ? e.message
            : "Could not reach GitHub — check your connection and try again.",
      });
    }
  }

  if (!ready) {
    return (
      <div className="mt-5 border-t border-hairline pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Sync</h3>
        <p className="mt-1 text-xs text-muted">Checking this device…</p>
      </div>
    );
  }

  return (
    <div className="mt-5 border-t border-hairline pt-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Sync</h3>
        <span
          className={`rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            connected ? "" : "text-muted"
          }`}
          style={connected ? { color: "var(--success-text)" } : undefined}
        >
          {connected ? "Connected" : "Not set up"}
        </span>
      </div>

      <p className="mt-1 text-xs leading-relaxed text-muted">
        Optional. Point this device at one private GitHub gist and it stays in step with
        your other devices — and with Claude Code in the terminal, which reads and writes
        the same file. Everything here works without it.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={tokenFieldId}
            className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted"
          >
            GitHub token
          </label>
          <input
            id={tokenFieldId}
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={connected ? "Stored — leave blank to keep" : "github_pat_…"}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted"
          />
        </div>
        <div>
          <label
            htmlFor={gistFieldId}
            className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted"
          >
            Gist id
          </label>
          <input
            id={gistFieldId}
            type="text"
            value={gistId}
            onChange={(e) => setGistId(e.target.value)}
            placeholder="e.g. 4c1f9b2a…"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted"
          />
        </div>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted">
        Make the token at{" "}
        <a
          href="https://github.com/settings/tokens"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-ink"
        >
          github.com/settings/tokens
        </a>{" "}
        — fine-grained, with the <code>gist</code> scope and nothing else, so a leak costs
        gists rather than your repositories. The gist id is the string at the end of the
        gist&apos;s URL. Both are kept in this browser&apos;s local storage on this device
        only: they never enter the repo, the bundle, or anyone else&apos;s copy.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {connected ? (
          <>
            <button
              onClick={() => void handleSync()}
              disabled={syncing}
              aria-busy={syncing}
              aria-describedby={statusId}
              className="rounded-lg bg-protein px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {syncing ? "Syncing…" : "Sync now"}
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || !credentialsChanged}
              className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-ink-2 hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Save changes
            </button>
            <button
              onClick={handleDisconnect}
              className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-ink-2 hover:bg-surface-2"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-lg bg-protein px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Connect
          </button>
        )}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted">
        A gist with no log in it yet simply receives whatever this device holds. If you
        are connecting a second device that already has its own entries, the two logs are
        unioned rather than one replacing the other — so both sides keep everything, and
        deletions you made stay deleted.
      </p>

      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className="mt-2 min-h-[1rem] text-xs"
      >
        {status.kind === "syncing" && <span className="text-muted">Syncing…</span>}
        {status.kind === "done" && (
          <span style={{ color: "var(--success-text)" }}>
            ✓ Synced at{" "}
            {status.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
            {status.entries} {status.entries === 1 ? "entry" : "entries"}
          </span>
        )}
        {status.kind === "error" && (
          <span className="text-critical">{status.message}</span>
        )}
        {status.kind === "idle" && (
          <span className="text-muted">
            {connected
              ? "Connected — nothing synced yet this session."
              : "Not syncing. Your log stays in this browser."}
          </span>
        )}
      </p>
    </div>
  );
}
