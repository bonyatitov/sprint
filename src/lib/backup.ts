import type { AppState } from "./types";

export const BACKUP_APP_ID = "sprint-planner";
export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  version: number;
  exportedAt: string;
  state: AppState;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function backupFilename(): string {
  const now = new Date();

  return `sprint-planner-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

/** Triggers a browser download of the current state as a pretty-printed JSON file — a manual backup the user keeps on their own machine. */
export function downloadBackup(state: AppState): void {
  const backup: BackupFile = {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = backupFilename();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Loose structural check — just enough to reject obvious garbage. Any fields missing beyond this get filled in from `fallback` by the caller (e.g. an older backup made before a field existed). */
function looksLikeAppState(value: unknown): value is Partial<AppState> {
  if (!isPlainObject(value)) return false;

  return Array.isArray(value.subjects) && isPlainObject(value.settings);
}

/**
 * Parses a backup file's text content into a usable AppState. Accepts both
 * the wrapped `{ app, version, state }` format `downloadBackup` produces and
 * a raw state object, so a hand-edited or older file still works. Throws
 * with a human-readable message when the file isn't recognisable.
 */
export function parseBackupFile(text: string, fallback: AppState): AppState {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Файл повреждён — это не корректный JSON.");
  }

  const candidate =
    isPlainObject(parsed) && parsed.app === BACKUP_APP_ID
      ? parsed.state
      : parsed;

  if (!looksLikeAppState(candidate)) {
    throw new Error("Файл не похож на резервную копию Планировщика спринта.");
  }

  return { ...fallback, ...candidate };
}
