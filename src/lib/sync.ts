"use client";

/**
 * Two-way sync through a private GitHub gist.
 *
 * The app is served as a static site, so there is no server and nowhere to
 * hide a credential. Instead the token is supplied per device and kept in
 * localStorage: it never enters the repo, never ships in the bundle, and is
 * only ever readable by the browser its owner pasted it into. Scope it to
 * `gist` alone so a leak costs gists rather than repository write access.
 *
 * The same gist is what Claude Code reads and writes from the terminal, so
 * "log this from my laptop" and "ask Claude to work out the macros" end up in
 * the same place without either side knowing about the other.
 *
 * The merge is deliberately commutative and idempotent — union entries by id,
 * last-write-wins per entry, and deletions recorded as tombstones rather than
 * as absence. That is what makes a lost race self-heal: two devices writing at
 * the same moment may briefly disagree, but the next sync from either side
 * converges to the same state, so no conditional-write dance is required.
 */

import type { AppData, Food, LogEntry } from "./types";

const API = "https://api.github.com";
const GIST_FILE = "nutrition-log.json";
const CONFIG_KEY = "nutrition-calculator:sync";

/** Where the remote lives and how to reach it. Never leaves this device. */
export interface SyncConfig {
  token: string;
  gistId: string;
}

/**
 * `AppData` plus the bookkeeping a merge needs.
 *
 * Deletions have to be recorded rather than implied. If a delete were just an
 * absence, syncing with a peer that still holds the entry would read as "they
 * have something I lack" and put it straight back — the entry you removed on
 * your laptop would reappear the next time your desktop wrote.
 */
export interface SyncedData extends AppData {
  /** Entry id → ISO timestamp of its deletion. */
  deletions: Record<string, string>;
  /** Stamps for the fields replaced wholesale rather than merged per item. */
  goalsUpdatedAt?: string;
  favoritesUpdatedAt?: string;
}

/** Entries gain an edit stamp; older records fall back to their log time. */
type Stamped = LogEntry & { updatedAt?: string };

const stampOf = (e: Stamped): string => e.updatedAt ?? e.loggedAt;

const laterOf = (a: string | undefined, b: string | undefined): string | undefined =>
  a === undefined ? b : b === undefined ? a : a > b ? a : b;

export function withSyncFields(data: AppData): SyncedData {
  const d = data as Partial<SyncedData>;
  return {
    ...data,
    deletions: d.deletions ?? {},
    goalsUpdatedAt: d.goalsUpdatedAt,
    favoritesUpdatedAt: d.favoritesUpdatedAt,
  };
}

/**
 * Merge two snapshots into the state both devices should converge on.
 *
 * Order of arguments does not matter, and merging a snapshot with itself
 * changes nothing — those two properties are what let a device recover from a
 * failed or overlapping write by simply syncing again.
 */
export function merge(a: AppData, b: AppData): SyncedData {
  const left = withSyncFields(a);
  const right = withSyncFields(b);

  // Tombstones union, keeping whichever delete happened later. A re-added
  // entry gets a fresh id, so a resurrected id is always the same event.
  const deletions: Record<string, string> = { ...left.deletions };
  for (const [id, at] of Object.entries(right.deletions)) {
    deletions[id] = laterOf(deletions[id], at) ?? at;
  }

  // Entries union by id, newest edit winning. An entry survives its own
  // tombstone only if it was edited after the delete — which is what makes an
  // "undo, then sync" sequence do the right thing.
  const byId = new Map<string, Stamped>();
  for (const e of [...left.entries, ...right.entries] as Stamped[]) {
    const seen = byId.get(e.id);
    if (!seen || stampOf(e) > stampOf(seen)) byId.set(e.id, e);
  }
  const entries = [...byId.values()]
    .filter((e) => {
      const deletedAt = deletions[e.id];
      return deletedAt === undefined || stampOf(e) > deletedAt;
    })
    .sort((x, y) => x.date.localeCompare(y.date) || x.loggedAt.localeCompare(y.loggedAt));

  // Custom foods union by id. They are definitions rather than events, so the
  // more recently created record wins a genuine id collision.
  const foods = new Map<string, Food>();
  for (const f of [...left.customFoods, ...right.customFoods]) {
    const seen = foods.get(f.id);
    if (!seen || (f.createdAt ?? "") > (seen.createdAt ?? "")) foods.set(f.id, f);
  }

  // Goals and favourites are small and replaced as a unit, so a plain
  // last-write-wins is honest here — merging them per-field would silently
  // invent a combination neither device ever had.
  const goalsUpdatedAt = laterOf(left.goalsUpdatedAt, right.goalsUpdatedAt);
  const goalsWinner =
    (right.goalsUpdatedAt ?? "") > (left.goalsUpdatedAt ?? "") ? right : left;

  const favoritesUpdatedAt = laterOf(left.favoritesUpdatedAt, right.favoritesUpdatedAt);
  const favoritesWinner =
    (right.favoritesUpdatedAt ?? "") > (left.favoritesUpdatedAt ?? "") ? right : left;

  return {
    version: 1,
    goals: goalsWinner.goals,
    goalsUpdatedAt,
    entries,
    customFoods: [...foods.values()],
    favorites: favoritesWinner.favorites,
    favoritesUpdatedAt,
    deletions: pruneTombstones(deletions),
  };
}

/**
 * Tombstones are kept for 90 days and then dropped.
 *
 * They only need to outlive the slowest device's sync interval; keeping them
 * forever would grow the gist without bound. The risk of pruning is that a
 * device offline for longer than the window reintroduces an entry it never
 * learned was deleted — 90 days makes that vanishingly unlikely for a tracker
 * someone opens most days.
 */
function pruneTombstones(deletions: Record<string, string>): Record<string, string> {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  return Object.fromEntries(
    Object.entries(deletions).filter(([, at]) => at > cutoff),
  );
}

export function loadConfig(): SyncConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SyncConfig>;
    return parsed.token && parsed.gistId
      ? { token: parsed.token, gistId: parsed.gistId }
      : null;
  } catch {
    return null;
  }
}

export function saveConfig(config: SyncConfig | null) {
  if (typeof window === "undefined") return;
  if (config === null) window.localStorage.removeItem(CONFIG_KEY);
  else window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

class SyncError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

async function gist(config: SyncConfig, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API}/gists/${config.gistId}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) {
    // These three are the ones worth naming: they are what a mistyped token,
    // a revoked one, and a wrong gist id actually look like.
    const hint =
      res.status === 401
        ? "Token rejected — check it hasn't expired or been revoked."
        : res.status === 403
          ? "Token lacks the `gist` scope."
          : res.status === 404
            ? "No gist with that id is visible to this token."
            : `GitHub returned ${res.status}.`;
    throw new SyncError(hint, res.status);
  }
  return res;
}

/** Read the remote snapshot. A gist with no log file yet reads as empty. */
export async function pull(config: SyncConfig): Promise<SyncedData | null> {
  const res = await gist(config);
  const body = (await res.json()) as {
    files?: Record<string, { content?: string; truncated?: boolean; raw_url?: string }>;
  };
  const file = body.files?.[GIST_FILE];
  if (!file) return null;

  // Gists inline only the first megabyte; past that GitHub hands back a URL.
  const content = file.truncated && file.raw_url
    ? await (await fetch(file.raw_url)).text()
    : (file.content ?? "");
  if (!content.trim()) return null;

  try {
    return withSyncFields(JSON.parse(content) as AppData);
  } catch {
    // Never overwrite a remote we failed to understand — surfacing this lets
    // the caller stop rather than silently replace someone else's data.
    throw new SyncError("Remote log is not valid JSON; refusing to overwrite it.");
  }
}

export async function push(config: SyncConfig, data: SyncedData): Promise<void> {
  await gist(config, {
    method: "PATCH",
    body: JSON.stringify({
      files: { [GIST_FILE]: { content: JSON.stringify(data, null, 2) } },
    }),
  });
}

/**
 * One full round trip: read the remote, merge it with what this device holds,
 * and write the result back. Returns the merged state for the caller to adopt.
 *
 * Pushing unconditionally after a merge is safe precisely because the merge is
 * commutative — a peer that wrote between our read and our write loses nothing
 * permanently, since their next sync folds our result back into theirs.
 */
export async function sync(config: SyncConfig, local: AppData): Promise<SyncedData> {
  const remote = await pull(config);
  const merged = remote ? merge(local, remote) : withSyncFields(local);
  await push(config, merged);
  return merged;
}

export { SyncError };
