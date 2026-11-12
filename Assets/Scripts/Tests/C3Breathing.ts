// Criterion 3: a ring guides three breathing rounds (in, hold, out, hold), and Done / Not yet
// appear only after the third round. Test speeds the phase to 0.5 s (Lens default 4 s = 48 s total).
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep, findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {getMain, startClimb, waitFor, restoreTiming, choiceButtonsReady} from "./LadderTestUtil"

@component
export class C3Breathing extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const main = getMain()
    const it = new DefaultLeafInteractor()
    const ph = 0.5
    try {
      expect(main.breathRounds, "three rounds").toBe(3)
      await startClimb(main, it, ph)
      const t0 = getTime()
      expect(main.isBreathing(), "breathing starts on the step").toBe(true)
      expect(main.areChoicesVisible(), "no Done / Not yet while breathing").toBe(false)
      const ring = findSceneObjectByName("BreathRing")
      expect(ring !== undefined, "BreathRing exists").toBeTruthy()
      const label = findSceneObjectByName("BreathLabel").getComponent("Component.Text") as Text
      // sample ring scale and label through the rounds
      let minS = 99
      let maxS = 0
      const seen: {[k: string]: boolean} = {}
      while (main.isBreathing() && getTime() - t0 < ph * 12 + 2) {
        const s = ring.getTransform().getLocalScale().x
        minS = Math.min(minS, s)
        maxS = Math.max(maxS, s)
        seen[label.text] = true
        expect(findInteractablesByName("DoneButton", undefined, true).length, "Done hidden during breathing").toBe(0)
        await sleep(50)
      }
      expect(maxS - minS > 0.3, "ring grows and shrinks").toBeTruthy()
      expect(seen["Breathe in\n1/3"] === true, "round 1 shown").toBeTruthy()
      expect(seen["Breathe out\n2/3"] === true, "round 2 shown").toBeTruthy()
      expect(seen["Hold\n3/3"] === true, "round 3 shown").toBeTruthy()
      const ok = await waitFor(() => main.areChoicesVisible(), 3000)
      expect(ok, "Done / Not yet appear after the third round").toBeTruthy()
      const elapsed = getTime() - t0
      expect(elapsed >= ph * 12 - 0.1, "choices not before 3 full rounds (" + elapsed.toFixed(2) + " s)").toBeTruthy()
      const ready = await waitFor(() => choiceButtonsReady(), 1000, 20)
      expect(ready, "Done and Not yet are pinchable").toBeTruthy()
    } finally {
      restoreTiming(main)
    }
  }
}
