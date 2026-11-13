// Paced walkthrough for the Devpost demo video. Not a test of a criterion: it plays the whole Lens once
// at a watchable pace while the Preview panel is recorded. v2 (13.11.2026), after the v1 review:
// - tiles are on screen from the first second and three are picked before 10 s;
// - the floor shot looks down at Me and pans slowly to the goal (about 6 s);
// - the first breathing round plays at the real pace (4 s per phase), later breathing is sped up
//   so the take stays near 2:45;
// - Not yet split, Done by pinch, the return arrow (turn away, turn back), Done by stepping forward;
// - preview Restart in the middle of the climb ("You stopped at: ...") and at the end
//   ("Your step for today: ...").
// Pauses are left on purpose for narration or subtitles. The camera is driven by the script, so
// DeviceTracking is paused (as in C7) and restored in finally.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep, nextFrame, findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {getMain, waitFor, waitChoices, press, restoreTiming} from "./LadderTestUtil"

// Real breathing pace of the Lens, shown for one full round on the first step.
const REAL_PHASE = 4
// Sped-up pace for the rest of the breathing in the video.
const FAST_PHASE_FIRST = 1.2
const FAST_PHASE = 1

@component
export class DemoWalkthrough extends Scenario {
  async run(): Promise<void> {
    const main = getMain()
    const m = main as any
    const it = new DefaultLeafInteractor()
    const camSo = main.camera ? main.camera : findSceneObjectByName("Camera Object")
    const camT = camSo.getTransform()
    const pos0 = camT.getWorldPosition()
    const rot0 = camT.getWorldRotation()
    const tracking = camSo.getComponent("Component.DeviceTracking")
    const trackingWas = tracking ? tracking.enabled : false
    if (tracking) tracking.enabled = false

    // Level head at the ladder origin, facing down the ladder (-Z).
    const origin = main.getOrigin()
    const home = new vec3(origin.x, origin.y, origin.z)
    const level = quat.lookAt(vec3.forward(), vec3.up())
    let pos = home
    let rot = level
    let pinned = true
    const pin = (async () => {
      while (pinned) {
        camT.setWorldPosition(pos)
        camT.setWorldRotation(rot)
        await nextFrame()
      }
    })()
    const glide = async (toPos: vec3, toRot: quat, seconds: number) => {
      const p1 = pos
      const r1 = rot
      const t0 = getTime()
      while (true) {
        const k = Math.min(1, (getTime() - t0) / seconds)
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
        pos = vec3.lerp(p1, toPos, e)
        rot = quat.slerp(r1, toRot, e)
        if (k >= 1) break
        await nextFrame()
      }
    }
    // The camera looks along its -Z, so lookAt gets the direction from the target back to the eye.
    const lookAt = (from: vec3, target: vec3): quat => quat.lookAt(from.sub(target).normalize(), vec3.up())
    // Start the current breathing again from round `round` (0-based) at `phaseSec` per phase.
    // Demo only: lets the first round play in full once the camera is level again.
    const breathFrom = (round: number, phaseSec: number) => {
      main.breathPhaseSeconds = phaseSec
      m.breathStart = getTime() - round * 4 * phaseSec
    }
    const pressRestart = async () => {
      const btn = findSceneObjectByName("RestartButton")
      if (btn) await glide(pos, lookAt(pos, btn.getTransform().getWorldPosition()), 2.0)
      await sleep(600)
      await press(it, "RestartButton")
      await sleep(400)
      await glide(pos, level, 1.5)
    }

    try {
      // 1. Three obstacles: the six tiles are on screen at once, three are picked by pinch.
      main.breathPhaseSeconds = REAL_PHASE
      main.clearProgress()
      await sleep(4000)
      await press(it, "Tile1")
      await sleep(1700)
      await press(it, "Tile3")
      await sleep(1700)
      await press(it, "Tile5")

      // 2. The tiles fly down and become the ladder on the floor: look down at Me, pan slowly to the goal.
      await sleep(500)
      const me = main.getStepWorldPosition(-1)
      await glide(pos, lookAt(pos, me), 2.5)
      await waitFor(() => main.getPhase() === "climb" && !main.isBusy(), 6000)
      await sleep(2000)
      await glide(pos, lookAt(pos, main.getGoalWorldPosition()), 6.0)
      await sleep(4000)
      await glide(pos, level, 2.0)

      // 3. Step 1: one full breathing round at the real pace, then the rest sped up.
      await waitFor(() => main.isBreathing(), 5000)
      breathFrom(0, REAL_PHASE)
      await sleep(REAL_PHASE * 4 * 1000)
      if (main.isBreathing()) breathFrom(1, FAST_PHASE_FIRST)
      await waitChoices(main, 30000)
      await sleep(3000)
      main.breathPhaseSeconds = FAST_PHASE
      // Done by pinch: the phrase crumbles.
      await press(it, "DoneButton")
      await sleep(4500)
      await waitFor(() => main.isBreathing(), 5000)

      // 4. Step 2: Not yet splits it into two smaller steps.
      await waitChoices(main, 30000)
      await sleep(2500)
      await press(it, "NotYetButton")
      await sleep(500)
      // small step 1 of 2: Done by pinch
      await waitChoices(main, 30000)
      await sleep(1500)
      await press(it, "DoneButton")
      await sleep(1500)
      await waitFor(() => main.isBreathing(), 5000)

      // 5. Small step 2 of 2: look away during the breathing, the return arrow shows the way back.
      await sleep(2000)
      await glide(pos, quat.angleAxis(1.4, vec3.up()).multiply(level), 2.5)
      await sleep(3500)
      await glide(pos, level, 2.5)
      await waitChoices(main, 30000)
      await sleep(1500)
      await press(it, "DoneButton")
      await sleep(1500)
      await waitFor(() => main.isBreathing(), 5000)

      // 6. Last step: preview Restart in the middle of the climb. The Lens opens from storage on the same
      // step and says "You stopped at: ...".
      await sleep(3000)
      await pressRestart()
      await sleep(5000)

      // 7. Done by stepping forward past the step.
      await waitChoices(main, 30000)
      await sleep(1500)
      const stepZ = main.getCurrentStepWorldPosition().z
      await glide(new vec3(pos.x, pos.y, stepZ + 2), level, 3.5)
      await waitFor(() => main.getPhase() === "cards" && !main.isBusy(), 6000)
      await waitFor(() => findSceneObjectByName("Card3") !== undefined, 6000)

      // 8. Goal question and three "when and what" cards: read, pick one; it stays, the others fade.
      await sleep(9000)
      await press(it, "Card2")
      // Step back to the start while the kept card flies to the goal, so its flight and landing stay in
      // the frame (looking at the goal from close up filled the frame with the goal, 14.11.2026).
      await sleep(1500)
      await glide(home, level, 2.5)
      await sleep(2000)

      // 9. Press Restart at the start: the Lens opens with "Your step for today: ...".
      await pressRestart()
      await sleep(9000)
    } finally {
      pinned = false
      await pin
      camT.setWorldPosition(pos0)
      camT.setWorldRotation(rot0)
      if (tracking) tracking.enabled = trackingWas
      restoreTiming(main)
    }
  }
}
