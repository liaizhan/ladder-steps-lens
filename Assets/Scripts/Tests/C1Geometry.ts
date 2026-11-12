// Criterion 1: the ladder lies ahead and rises away from the user: "Me" at the bottom,
// the goal glowing at the far end at about 110 cm above the fixed preview floor (150 cm below eyes).
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep, findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {getMain, startClimb, restoreTiming} from "./LadderTestUtil"

@component
export class C1Geometry extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const main = getMain()
    const it = new DefaultLeafInteractor()
    try {
      await startClimb(main, it, 4)
      const o = main.getOrigin()
      const floorY = o.y - main.floorBelowEyes
      expect(main.floorBelowEyes, "fixed preview floor 150 cm below eyes").toBe(150)

      const me = findSceneObjectByName("Step_Me")
      expect(me !== undefined, "Step_Me exists").toBeTruthy()
      const mePos = me.getTransform().getWorldPosition()
      expect(o.z - mePos.z, "Me is about 60 cm ahead").toBeCloseTo(60, -1)
      expect(mePos.y - floorY, "Me lies on the floor").toBeLessThan(5)
      const meLabel = findSceneObjectByName("MeLabel").getComponent("Component.Text") as Text
      expect(meLabel.text).toBe("Me")

      const n = main.getStepCount()
      expect(n).toBe(3)
      let prev = mePos
      for (let i = 0; i < n; i++) {
        const p = main.getStepWorldPosition(i)
        expect(p.z < prev.z, "step " + (i + 1) + " is farther away").toBeTruthy()
        expect(p.y > prev.y, "step " + (i + 1) + " is higher").toBeTruthy()
        expect(prev.z - p.z, "steps about 40 cm apart").toBeCloseTo(40, -1)
        prev = p
      }

      // Design fix (Aizhan, 12.11.2026): the current phrase floats at a comfortable gaze angle
      // above its step instead of 30 cm over the floor step (~48 degrees down with the defaults).
      const focus = findSceneObjectByName("StepFocus")
      expect(focus !== undefined, "StepFocus exists").toBeTruthy()
      const fp = focus.getTransform().getWorldPosition()
      const s1p = main.getStepWorldPosition(0)
      const horiz = Math.sqrt((fp.x - o.x) * (fp.x - o.x) + (fp.z - o.z) * (fp.z - o.z))
      const down = (Math.atan2(o.y - fp.y, horiz) * 180) / Math.PI
      print("[LadderTest] C1 phrase gaze down=" + down.toFixed(1) + " deg")
      expect(down, "phrase about 12 degrees below eye level").toBeCloseTo(main.phraseGazeDown, 0)
      expect(down < 14, "phrase inside the arrow-free view with a level head").toBeTruthy()
      expect(Math.abs(fp.z - s1p.z) < 1, "phrase stands over its step").toBeTruthy()
      expect(findSceneObjectByName("StepTether") !== undefined, "thin line joins step and phrase").toBeTruthy()

      const goal = main.getGoalWorldPosition()
      expect(goal.z < prev.z, "goal at the far end").toBeTruthy()
      expect(goal.y - floorY, "goal about 110 cm high").toBeCloseTo(110, -1)
      expect(findSceneObjectByName("GoalHalo") !== undefined, "goal halo (glow) exists").toBeTruthy()
      const gl = findSceneObjectByName("GoalLabel").getComponent("Component.Text") as Text
      expect(gl.text).toBe("Your goal")
      // Glow pulses: goal scale changes over time.
      const g = findSceneObjectByName("Goal").getTransform()
      const s1 = g.getLocalScale().x
      await sleep(400)
      const s2 = g.getLocalScale().x
      expect(Math.abs(s1 - s2) > 0.001, "goal glow pulses").toBeTruthy()
      // Visual check (12.11.2026): the phrase stands in front of the goal on the same line of
      // sight, so the goal dims while a step is active (and glows fully again for the cards).
      expect(main.isStepActive(), "a step is active").toBeTruthy()
      await sleep(1200)
      print("[LadderTest] C1 goal brightness during step=" + main.getGoalBrightness().toFixed(2))
      expect(main.getGoalBrightness() < main.goalDimWhileClimbing + 0.1, "goal dims behind the active phrase").toBeTruthy()
    } finally {
      restoreTiming(main)
    }
  }
}
