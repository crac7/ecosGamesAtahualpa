/**
 * Versioned save data in localStorage. Only plain data is stored; entities
 * are rebuilt from it on load. A single setItem on one key is atomic, so a
 * crash leaves either the old or the new save.
 */
export const SAVE_VERSION = 2
const SAVE_KEY = 'eco-atahualpa.save'

export interface SaveData {
  version: typeof SAVE_VERSION
  /** Map the checkpoint belongs to. */
  map: string
  /** Last checkpoint rested at, or null when none yet. */
  checkpointId: string | null
  /** Every checkpoint lit so far. */
  litCheckpoints: string[]
  /** Every one-way shortcut opened so far. */
  openedShortcuts: string[]
}

export function defaultSave(map: string): SaveData {
  return {
    version: SAVE_VERSION,
    map,
    checkpointId: null,
    litCheckpoints: [],
    openedShortcuts: [],
  }
}

type RawSave = Record<string, unknown>

/** Each step upgrades a save from version N to N + 1. */
const MIGRATIONS: Record<number, (d: RawSave) => RawSave> = {
  // v2 adds opened shortcuts; v1 saves had none.
  1: (d) => ({ ...d, openedShortcuts: [] }),
}

/** Parses, migrates and validates raw save text. Returns null when unusable. */
export function parseSave(raw: string | null): SaveData | null {
  if (!raw) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null
  let d = data as RawSave

  let version = d.version
  if (typeof version !== 'number' || !Number.isInteger(version)) return null
  // A save from a newer build cannot be read safely.
  if (version > SAVE_VERSION) return null
  while (version < SAVE_VERSION) {
    const migrate = MIGRATIONS[version]
    if (!migrate) return null
    d = migrate(d)
    version += 1
    d.version = version
  }

  if (typeof d.map !== 'string') return null
  if (d.checkpointId !== null && typeof d.checkpointId !== 'string') return null
  if (!isStringArray(d.litCheckpoints)) return null
  if (!isStringArray(d.openedShortcuts)) return null

  return {
    version: SAVE_VERSION,
    map: d.map,
    checkpointId: d.checkpointId,
    litCheckpoints: [...new Set(d.litCheckpoints)],
    openedShortcuts: [...new Set(d.openedShortcuts)],
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

/** Loads the save, falling back to a fresh one when missing or corrupt. */
export function loadSave(map: string): SaveData {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(SAVE_KEY)
  } catch {
    // Storage blocked (private mode, disabled site data): play without saves.
  }
  const save = parseSave(raw)
  return save && save.map === map ? save : defaultSave(map)
}

/** Writes the save. Returns false when storage is unavailable or full. */
export function writeSave(data: SaveData): boolean {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}
