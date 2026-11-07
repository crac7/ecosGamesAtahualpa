/**
 * Versioned save data in localStorage. Only plain data is stored; entities
 * are rebuilt from it on load. A single setItem on one key is atomic, so a
 * crash leaves either the old or the new save.
 */
export const SAVE_VERSION = 1
const SAVE_KEY = 'eco-atahualpa.save'

export interface SaveData {
  version: typeof SAVE_VERSION
  /** Map the checkpoint belongs to. */
  map: string
  /** Last checkpoint rested at, or null when none yet. */
  checkpointId: string | null
  /** Every checkpoint lit so far. */
  litCheckpoints: string[]
}

export function defaultSave(map: string): SaveData {
  return { version: SAVE_VERSION, map, checkpointId: null, litCheckpoints: [] }
}

/** Parses and validates raw save text. Returns null when it is unusable. */
export function parseSave(raw: string | null): SaveData | null {
  if (!raw) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const d = data as Record<string, unknown>

  // Future schema changes migrate here, one version at a time.
  if (d.version !== SAVE_VERSION) return null

  if (typeof d.map !== 'string') return null
  if (d.checkpointId !== null && typeof d.checkpointId !== 'string') return null
  if (!Array.isArray(d.litCheckpoints)) return null
  if (!d.litCheckpoints.every((id) => typeof id === 'string')) return null

  return {
    version: SAVE_VERSION,
    map: d.map,
    checkpointId: d.checkpointId,
    litCheckpoints: [...new Set(d.litCheckpoints as string[])],
  }
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
