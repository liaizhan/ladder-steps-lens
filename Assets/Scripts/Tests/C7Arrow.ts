// Criterion 7: when the user turns away so the current step is out of view, a small arrow
// appears and points back to it. Simulates the head turn by yawing the camera 90 degrees.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep, nextFrame, findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {getMain, startClimb, restoreTiming} from "./LadderTestUtil"

@component
export class C7Arrow extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const main = getMain()
    const it = new DefaultLeafInteractor()
    const camSo = main.camera ? main.camera : findSceneObjectByName("Camera Object")
    const camT = camSo.getTransform()
    const rot0 = camT.getLocalRotation()
    // In preview DeviceTracking rewrites the camera pose every frame, so a scripted head turn
    // would be undone. Pause it for this scenario only and restore it in finally.
    const tracking = camSo.getComponent("Component.DeviceTracking")
    const trackingWas = tracking ? tracking.enabled : false
    if (tracking) tracking.enabled = false
    try {
      await startClimb(main, it, 4)
      await sleep(300)
      // After the design fix the current phrase floats about 12 degrees below eye level, so a
      // LEVEL head facing the step must see it with no arrow. Face the step horizontally.
      const focus = findSceneObjectByName("StepFocus")
      const camPos = camT.getWorldPosition()
      const back = camPos.sub(focus.getTransform().getWorldPosition())
      back.y = 0
      const look = quat.lookAt(back.normalize(), vec3.up())
      let quiet = false
      for (let f = 0; f < 40; f++) {
        camT.setWorldRotation(look)
        await nextFrame()
        if (!main.isArrowVisible()) {
          quiet = true
          break
        }
      }
      {
        const loc = camT.getInvertedWorldTransform().multiplyPoint(focus.getTransform().getWorldPosition())
        print("[LadderTest] C7 aim local=" + loc + " camRot=" + camT.getWorldRotation() + " want=" + look)
      }
      expect(quiet, "no arrow with a level head facing the step").toBe(true)
      const lookLocal = camT.getLocalRotation()
      const turned = quat.angleAxis(Math.PI / 2, vec3.up()).multiply(lookLocal)
      let shown = false
      for (let f = 0; f < 40; f++) {
        camT.setLocalRotation(turned)
        await nextFrame()
        if (main.isArrowVisible()) {
          shown = true
          break
        }
      }
      expect(shown, "arrow appears when turned away").toBe(true)
      const arrow = findSceneObjectByName("ReturnArrow")
      expect(arrow.enabled, "ReturnArrow enabled").toBe(true)
      // arrow points toward the step: turned left (+yaw) means the step is to the right (+x in camera space)
      const lp = arrow.getTransform().getLocalPosition()
      expect(lp.x > 0, "arrow on the side of the step (x=" + lp.x.toFixed(1) + ")").toBeTruthy()
      let hidden = false
      for (let f = 0; f < 40; f++) {
        camT.setLocalRotation(lookLocal)
        await nextFrame()
        if (!main.isArrowVisible()) {
          hidden = true
          break
        }
      }
      expect(hidden, "arrow hides when the step is back in view").toBe(true)
    } finally {
      camT.setLocalRotation(rot0)
      if (tracking) tracking.enabled = trackingWas
      restoreTiming(main)
    }
  }
}
