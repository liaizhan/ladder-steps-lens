// Ladder Steps: pure state + persistent storage (no scene objects here).
// Saved as one JSON string under STORAGE_KEY in global.persistentStorageSystem.store.

export const STORAGE_KEY = "ladderSteps.v1"

export const PHRASES: string[] = [
  "You will never make it.",
  "Other people are better than you.",
  "Don't stick out. Be like everyone else.",
  "Rich people are bad people.",
  "Don't take risks. A bird in the hand is worth two in the bush.",
  "First finish your studies, then live and enjoy life."
]

export const QUESTION = "What can I do for myself today to get closer to my goal?"

export const CARDS: string[] = [
  "Today: write three small steps toward my goal and do the first one right away.",
  "Today: write down one real piece of progress.",
  "Today: do one thing I usually put off."
]

export const NOTE =
  "Ladder Steps is a self-reflection exercise from the Ladder method by its author. " +
  "It helps you notice the words that stand between you and your goal. " +
  "It is not therapy and does not replace working with a specialist."

export type Phase = "pick" | "climb" | "cards" | "done"

// part: 0 = whole step, 1 = first half of a split step, 2 = second half
export interface StepData {
  p: number
  part: number
  done: boolean
}

export interface LadderData {
  v: number
  phase: Phase
  chosen: number[]
  steps: StepData[]
  current: number
  card: number
}

export function freshData(): LadderData {
  return {v: 1, phase: "pick", chosen: [], steps: [], current: 0, card: -1}
}

function store(): GeneralDataStore | null {
  try {
    return global.persistentStorageSystem.store
  } catch (e) {
    print("[LadderState] no persistent storage: " + e)
    return null
  }
}

export function saveData(d: LadderData): string {
  const json = JSON.stringify(d)
  const s = store()
  if (s) {
    s.putString(STORAGE_KEY, json)
  }
  return json
}

export function readRaw(): string {
  const s = store()
  if (!s) {
    return ""
  }
  return s.getString(STORAGE_KEY) || ""
}

export function parseData(json: string): LadderData | null {
  if (!json) {
    return null
  }
  try {
    const d = JSON.parse(json) as LadderData
    if (!d || d.v !== 1 || !Array.isArray(d.chosen) || !Array.isArray(d.steps)) {
      return null
    }
    if (d.current < 0) d.current = 0
    if (d.steps.length > 0 && d.current > d.steps.length) d.current = d.steps.length
    return d
  } catch (e) {
    print("[LadderState] bad saved json: " + e)
    return null
  }
}

export function loadData(): LadderData | null {
  return parseData(readRaw())
}

export function clearData(): void {
  const s = store()
  if (s) {
    s.putString(STORAGE_KEY, "")
  }
}

// Build the climb steps from the three chosen phrase indices, in the order chosen.
export function stepsFromChosen(chosen: number[]): StepData[] {
  return chosen.map((p) => ({p: p, part: 0, done: false}))
}

// Not yet: split steps[i] into two smaller steps with the same phrase.
export function splitStep(d: LadderData, i: number): boolean {
  const s = d.steps[i]
  if (!s || s.part !== 0 || s.done) {
    return false
  }
  d.steps.splice(i, 1, {p: s.p, part: 1, done: false}, {p: s.p, part: 2, done: false})
  return true
}
