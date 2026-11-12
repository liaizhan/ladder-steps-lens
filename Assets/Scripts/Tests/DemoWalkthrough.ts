// Paced walkthrough for the Devpost demo video (12.11.2026). Not a test of a criterion: it plays the
// whole Lens once at a watchable pace while the screen is recorded. Breathing is sped up (Lens default
// is 4 s per phase) so the take stays under 3 minutes. The camera is driven by the script, so
// DeviceTracking is paused (as in C7) and restored in finally.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep, nextFrame, findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {getMain, waitFor, waitChoices, press, restoreTiming} from "./LadderTestUtil"

@component
export class DemoWalkthrough extends Scenario {
  async run(): Promise<void> {
    const main = getMain()
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
    const level = quat.lookAt(vec3.forward(), vec3.up())
    let pos = new vec3(origin.x, origin.y, origin.z)
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
    const lookDown = quat.lookAt(new vec3(0, Math.sin(0.7), Math.cos(0.7)).normalize(), vec3.up())

    try {
      // 1. Three obstacles: pick three phrase tiles by pinch.
      main.breathPhaseSeconds = 1.5
      main.clearProgress()
      await sleep(2500)
      await press(it, "Tile1")
      await sleep(1200)
      await press(it, "Tile3")
      await sleep(1200)
      await press(it, "Tile5")
      // 2. The tiles fly down and become the ladder on the floor: look down at it, then back up.
      await sleep(300)
      await glide(pos, lookDown, 2.5)
      await waitFor(() => main.getPhase() === "climb" && !main.isBusy(), 6000)
      await sleep(2500)
      await glide(pos, level, 2.0)

      // 3. Breathing on step 1 (sped up), then Done by pinch: the phrase crumbles.
      await waitChoices(main, 40000)
      await sleep(1500)
      main.breathPhaseSeconds = 1
      await press(it, "DoneButton")
      await waitFor(() => main.isBreathing(), 5000)

      // 4. Step 2: Not yet splits it into two smaller steps.
      await waitChoices(main, 30000)
      await sleep(1500)
      await press(it, "NotYetButton")
      await sleep(500)
      // small step 1 of 2: Done by pinch
      await waitChoices(main, 30000)
      await sleep(1000)
      await press(it, "DoneButton")
      await waitFor(() => main.isBreathing(), 5000)
      // small step 2 of 2: Done by pinch
      await waitChoices(main, 30000)
      await sleep(1000)
      await press(it, "DoneButton")
      await waitFor(() => main.isBreathing(), 5000)

      // 5. Last step: Done by stepping forward past the step.
      await waitChoices(main, 30000)
      await sleep(1500)
      const stepZ = main.getCurrentStepWorldPosition().z
      await glide(new vec3(pos.x, pos.y, stepZ + 2), level, 3.5)
      await waitFor(() => main.getPhase() === "cards" && !main.isBusy(), 6000)

      // 6. "When and what" cards by the goal: pick one, it stays and the others fade.
      await sleep(3500)
      await press(it, "Card2")
      await sleep(3000)

      // 7. Memory: step back to the start and press the preview Restart; the Lens opens from storage.
      await glide(new vec3(origin.x, origin.y, origin.z), level, 2.5)
      await sleep(1000)
      await press(it, "RestartButton")
      await sleep(5000)
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
