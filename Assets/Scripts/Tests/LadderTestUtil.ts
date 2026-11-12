// Shared helpers for the Ladder Steps LEAF scenarios (test code only, not part of the Lens).
import {sleep, findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils"
import {findInteractableByName, findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {LadderMain} from "../LadderMain"

export function getMain(): LadderMain {
  const so = findSceneObjectByName("LadderSteps")
  expect(so !== undefined, "scene object LadderSteps exists").toBeTruthy()
  const m = so.getComponent(LadderMain.getTypeName()) as LadderMain
  expect(m !== null, "LadderMain component on LadderSteps").toBeTruthy()
  return m
}

// Poll until cond() is true or timeoutMs passes. Returns whether it became true.
export async function waitFor(cond: () => boolean, timeoutMs: number, stepMs = 100): Promise<boolean> {
  const t0 = getTime()
  while ((getTime() - t0) * 1000 < timeoutMs) {
    if (cond()) return true
    await sleep(stepMs)
  }
  return cond()
}

// Trigger an enabled interactable by exact scene object name.
export async function press(it: DefaultLeafInteractor, name: string): Promise<void> {
  const target = findInteractableByName(name, undefined, true)
  expect(target !== undefined, "enabled interactable " + name + " found").toBeTruthy()
  try {
    await it.trigger(target)
  } catch (e) {
    // The Lens hides Done / Not yet (destroys the row) inside the button's own press callback.
    // LEAF then reads the destroyed target's name after onTriggerEnd and throws "Object is null".
    // The press itself went through, so only accept that exact case.
    if (isNull(target) && ("" + e).indexOf("Object is null") >= 0) {
      print("[LadderTest] " + name + " was removed by its own press; trigger completed")
      return
    }
    throw e
  }
}

// Fresh start: wipe saved progress, pick Tile1, Tile3, Tile5 by pinch, wait for the climb phase.
// breathPhase: seconds per breathing phase used for the test (Lens default is 4).
export async function startClimb(main: LadderMain, it: DefaultLeafInteractor, breathPhase: number): Promise<void> {
  main.breathPhaseSeconds = breathPhase
  main.clearProgress()
  await sleep(300)
  expect(main.getPhase()).toBe("pick")
  await press(it, "Tile1")
  await sleep(150)
  await press(it, "Tile3")
  await sleep(150)
  await press(it, "Tile5")
  const ok = await waitFor(() => main.getPhase() === "climb" && !main.isBusy(), 5000)
  expect(ok, "reached climb phase after three picks").toBeTruthy()
}

// UIKit Button creates its Interactable a frame after the button object, so wait for it.
export function choiceButtonsReady(): boolean {
  return (
    findInteractablesByName("DoneButton", undefined, true).length === 1 &&
    findInteractablesByName("NotYetButton", undefined, true).length === 1
  )
}

// Wait for breathing to end and Done / Not yet to show and be pinchable.
export async function waitChoices(main: LadderMain, timeoutMs: number): Promise<void> {
  const ok = await waitFor(() => main.areChoicesVisible() && choiceButtonsReady(), timeoutMs)
  expect(ok, "Done / Not yet visible after breathing").toBeTruthy()
}

// Put the Lens back to its designed timing after a scenario.
export function restoreTiming(main: LadderMain): void {
  main.breathPhaseSeconds = 4
}
