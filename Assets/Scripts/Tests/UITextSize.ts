// UI text size: on every screen of the Lens each visible text is at least MIN_DEG tall for the
// user's eyes, and a button label stays inside its button plate. Added after the v1 demo video,
// where tile and card labels were about 0.46 degrees and hard to read (13.11.2026).
// Measures from a level head at the start position, the way a user stands in front of the Lens.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep, findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {getMain, startClimb, waitChoices, waitFor, press, restoreTiming} from "./LadderTestUtil"

const MIN_DEG = 0.55
// World height of the em square in cm per unit of Text.size at world scale 1.
const EM_CM_PER_SIZE = 1 / 43.886
// How far a label may poke past its plate edge, in cm (the plate has a rounded border).
const PLATE_SLACK = 0.3
// Scene roots that hold Lens text. Test and LEAF overlay objects are left out on purpose.
const ROOTS = ["PhraseTiles", "LadderRoot", "StepFocus", "GoalCards", "StoppedAtBanner", "RestartDemo"]

function enabledInHierarchy(so: SceneObject): boolean {
  let o: SceneObject | null = so
  while (o) {
    if (!o.enabled) return false
    o = o.getParent()
  }
  return true
}

function collectTexts(so: SceneObject, out: Text[]): void {
  if (!so.enabled) return
  for (const t of so.getComponents("Component.Text") as Text[]) out.push(t)
  for (let i = 0; i < so.getChildrenCount(); i++) collectTexts(so.getChild(i), out)
}

// Extent of a text's world box in the local space of `frame` (x and y half sizes around frame's origin).
function boxIn(frame: Transform, t: Text): {x0: number; x1: number; y0: number; y1: number} {
  const inv = frame.getInvertedWorldTransform()
  const a = t.worldAabbMin()
  const b = t.worldAabbMax()
  const r = {x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9}
  for (const x of [a.x, b.x])
    for (const y of [a.y, b.y])
      for (const z of [a.z, b.z]) {
        const l = inv.multiplyPoint(new vec3(x, y, z))
        r.x0 = Math.min(r.x0, l.x)
        r.x1 = Math.max(r.x1, l.x)
        r.y0 = Math.min(r.y0, l.y)
        r.y1 = Math.max(r.y1, l.y)
      }
  return r
}

// Checks one screen. Returns failure lines (empty when the screen passes) and prints every text.
function checkScreen(screen: string, camPos: vec3): string[] {
  const fails: string[] = []
  let seen = 0
  for (let i = 0; i < global.scene.getRootObjectsCount(); i++) {
    const root = global.scene.getRootObject(i)
    if (ROOTS.indexOf(root.name) < 0 || !root.enabled) continue
    const texts: Text[] = []
    collectTexts(root, texts)
    for (const t of texts) {
      const so = t.sceneObject
      if (!t.enabled || !enabledInHierarchy(so)) continue
      if (!t.text || t.text.trim().length === 0) continue
      if (t.textFill.color.w < 0.5) continue
      seen++
      const T = so.getTransform()
      const em = t.size * EM_CM_PER_SIZE * T.getWorldScale().y
      const dist = camPos.distance(T.getWorldPosition())
      const deg = (2 * Math.atan(em / (2 * dist)) * 180) / Math.PI
      let line = "[LadderTest] UI " + screen + " " + so.name + " size=" + t.size.toFixed(1) + " dist=" + dist.toFixed(0) + " deg=" + deg.toFixed(2)
      if (deg < MIN_DEG) fails.push(screen + ": " + so.name + " is " + deg.toFixed(2) + " deg")
      // A button label must stay inside its plate.
      const parent = so.getParent()
      const btn = parent ? (parent.getComponent(Button.getTypeName()) as Button) : null
      if (btn) {
        const size = btn.size
        const box = boxIn(parent.getTransform(), t)
        const hx = size.x / 2 + PLATE_SLACK
        const hy = size.y / 2 + PLATE_SLACK
        line += " box=[" + box.x0.toFixed(1) + "," + box.x1.toFixed(1) + "]x[" + box.y0.toFixed(1) + "," + box.y1.toFixed(1) + "] plate=" + size.x.toFixed(1) + "x" + size.y.toFixed(1)
        if (box.x0 < -hx || box.x1 > hx || box.y0 < -hy || box.y1 > hy) fails.push(screen + ": " + so.name + " spills out of its plate")
      }
      print(line)
    }
  }
  if (seen === 0) fails.push(screen + ": no visible text found")
  return fails
}

@component
export class UITextSize extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const main = getMain()
    const it = new DefaultLeafInteractor()
    const camSo = main.camera ? main.camera : findSceneObjectByName("Camera Object")
    const camT = camSo.getTransform()
    const pos0 = camT.getWorldPosition()
    const rot0 = camT.getWorldRotation()
    const tracking = camSo.getComponent("Component.DeviceTracking")
    const trackingWas = tracking ? tracking.enabled : false
    if (tracking) tracking.enabled = false
    const fails: string[] = []
    const level = () => {
      camT.setWorldPosition(main.getOrigin())
      camT.setWorldRotation(quat.lookAt(new vec3(0, 0, 1), vec3.up()))
    }
    try {
      level()
      // 1. pick screen: header, six tiles, note, preview Restart
      main.breathPhaseSeconds = 4
      main.clearProgress()
      await sleep(800)
      expect(main.getPhase()).toBe("pick")
      fails.push(...checkScreen("pick", camT.getWorldPosition()))
      // 2. breathing: phrase, breathing cue, Me and goal labels
      await startClimb(main, it, 4)
      level()
      await waitFor(() => main.isBreathing(), 3000)
      await sleep(600)
      fails.push(...checkScreen("breathing", camT.getWorldPosition()))
      // 3. Done / Not yet under the phrase (short breathing for speed)
      main.breathPhaseSeconds = 0.3
      await waitChoices(main, 15000)
      await sleep(500)
      fails.push(...checkScreen("choices", camT.getWorldPosition()))
      // 4. "You stopped at" banner after a restart in the middle of the climb
      main.restart()
      await sleep(1200)
      level()
      expect(main.getBannerText().indexOf("You stopped at") === 0, "stopped-at banner shown").toBeTruthy()
      fails.push(...checkScreen("stopped-at", camT.getWorldPosition()))
      // 5. goal question and three cards
      for (let k = 0; k < 6 && main.getPhase() === "climb"; k++) {
        await waitChoices(main, 15000)
        main.pressDone()
        await waitFor(() => !main.isBusy(), 6000)
        await sleep(300)
      }
      const cardsUp = await waitFor(() => main.getPhase() === "cards" && findSceneObjectByName("Card3") !== undefined, 8000)
      expect(cardsUp, "cards shown").toBeTruthy()
      await sleep(800)
      fails.push(...checkScreen("cards", camT.getWorldPosition()))
      // 6. kept card near the goal, then "Your step for today" banner after a restart
      await press(it, "Card2")
      await waitFor(() => !main.isBusy(), 6000)
      await sleep(500)
      fails.push(...checkScreen("kept-card", camT.getWorldPosition()))
      main.restart()
      await sleep(1200)
      level()
      expect(main.getBannerText().indexOf("Your step for today") === 0, "step-for-today banner shown").toBeTruthy()
      fails.push(...checkScreen("step-for-today", camT.getWorldPosition()))
      for (const f of fails) print("[LadderTest] UI FAIL " + f)
      expect(fails.length, "texts below " + MIN_DEG + " deg or outside their plate: " + fails.join("; ")).toBe(0)
    } finally {
      camT.setWorldPosition(pos0)
      camT.setWorldRotation(rot0)
      if (tracking) tracking.enabled = trackingWas
      restoreTiming(main)
      main.clearProgress()
    }
  }
}
