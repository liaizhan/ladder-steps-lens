// Criterion 5: Not yet splits the current step into two smaller steps (one more step than before).
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep, findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {parseData, readRaw} from "../LadderState"
import {getMain, startClimb, waitChoices, press, restoreTiming} from "./LadderTestUtil"

@component
export class C5NotYet extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const main = getMain()
    const it = new DefaultLeafInteractor()
    try {
      await startClimb(main, it, 0.25)
      await waitChoices(main, 6000)
      const before = main.getStepCount()
      const idx = main.getCurrentIndex()
      const phraseBefore = main.getCurrentPhrase()
      await press(it, "NotYetButton")
      await sleep(300)
      expect(main.getStepCount(), "one more step").toBe(before + 1)
      expect(main.getCurrentIndex(), "still on the same place").toBe(idx)
      expect(main.getCurrentPhrase(), "both halves carry the same phrase").toBe(phraseBefore)
      const d = parseData(readRaw())
      expect(d.steps[idx].part).toBe(1)
      expect(d.steps[idx + 1].part).toBe(2)
      expect(findSceneObjectByName("Step1_part1") !== undefined, "Step1_part1 built").toBeTruthy()
      expect(findSceneObjectByName("Step2_part2") !== undefined, "Step2_part2 built").toBeTruthy()
      const s1 = findSceneObjectByName("Step1_part1").getTransform().getLocalScale().x
      const s3 = findSceneObjectByName("Step3").getTransform().getLocalScale().x
      expect(s1 < s3, "split steps are smaller").toBeTruthy()
      expect(main.isBreathing(), "breathing restarts on the smaller step").toBe(true)
    } finally {
      restoreTiming(main)
    }
  }
}
