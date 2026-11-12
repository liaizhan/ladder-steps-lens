// Criterion 4: Done (pinch) makes the phrase crumble and wakes up the next step.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep, findSceneObjectByName, findSceneObjectsByName} from "Leaf.lspkg/Utils/common/Utils"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {PHRASES} from "../LadderState"
import {getMain, startClimb, waitChoices, waitFor, press, restoreTiming} from "./LadderTestUtil"

@component
export class C4Done extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const main = getMain()
    const it = new DefaultLeafInteractor()
    try {
      await startClimb(main, it, 0.25)
      await waitChoices(main, 6000)
      const before = main.getCurrentIndex()
      const phrase = findSceneObjectByName("StepPhrase")
      expect(phrase.enabled, "phrase shown before Done").toBe(true)
      // The pinch itself takes time, so watch for the crumble while the press runs.
      let sawCrumb = false
      let sawHidden = false
      const pressing = press(it, "DoneButton")
      await waitFor(
        () => {
          if (findSceneObjectsByName("Crumb0").some((o) => !isNull(o))) sawCrumb = true
          if (isNull(phrase) || !phrase.enabled) sawHidden = true
          return sawCrumb && sawHidden
        },
        3000,
        16
      )
      await pressing
      expect(sawHidden, "whole phrase hidden (crumbling)").toBeTruthy()
      expect(sawCrumb, "crumb words falling").toBeTruthy()
      expect(main.getCurrentIndex(), "current step advanced by one").toBe(before + 1)
      const ok = await waitFor(() => main.isBreathing(), 4000)
      expect(ok, "next step woke up and breathing started").toBeTruthy()
      expect(main.getCurrentPhrase(), "next phrase shown").toBe(PHRASES[2])
      const live = () => findSceneObjectsByName("StepPhrase").filter((o) => !isNull(o) && o.isEnabledInHierarchy)
      const shown = await waitFor(() => live().length === 1, 2000)
      expect(shown, "one live phrase on the next step").toBeTruthy()
      const p2 = live()[0].getComponent("Component.Text") as Text
      expect(p2.text, "next step phrase text").toBe(PHRASES[2])
    } finally {
      restoreTiming(main)
    }
  }
}
