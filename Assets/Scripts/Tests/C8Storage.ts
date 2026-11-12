// Criterion 8: progress is saved to persistent storage (chosen phrases, current step, split steps,
// chosen card); after the preview Restart button the ladder opens on the saved step and names it.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {STORAGE_KEY, PHRASES, parseData, readRaw, saveData, freshData} from "../LadderState"
import {getMain, startClimb, waitChoices, waitFor, press, restoreTiming} from "./LadderTestUtil"

@component
export class C8Storage extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const main = getMain()
    const it = new DefaultLeafInteractor()
    try {
      // 1. Raw write + read of persistent storage.
      const probe = freshData()
      probe.chosen = [1, 2, 3]
      saveData(probe)
      const back = global.persistentStorageSystem.store.getString(STORAGE_KEY)
      expect(back).toBe(JSON.stringify(probe))
      expect(parseData(back).chosen).toEqual([1, 2, 3])

      // 2. Play: pick 1,3,5, Done on step 1, Not yet on step 2 (split).
      await startClimb(main, it, 0.25)
      await waitChoices(main, 6000)
      await press(it, "DoneButton")
      await waitFor(() => main.isBreathing(), 4000)
      await waitChoices(main, 6000)
      await press(it, "NotYetButton")
      await sleep(300)
      const saved = parseData(readRaw())
      expect(saved !== null, "progress saved").toBeTruthy()
      expect(saved.chosen).toEqual([0, 2, 4])
      expect(saved.current).toBe(1)
      expect(saved.steps.length).toBe(4)
      expect(saved.steps[0].done).toBe(true)
      expect(saved.steps[1].part).toBe(1)
      expect(saved.steps[2].part).toBe(2)
      expect(readRaw()).toBe(main.getStateJson())

      // 3. Preview Restart button: rebuilds from storage without clearing it.
      await press(it, "RestartButton")
      await sleep(400)
      expect(main.getPhase()).toBe("climb")
      expect(main.getCurrentIndex(), "opens on the saved step").toBe(1)
      expect(main.getStepCount(), "split steps kept").toBe(4)
      const banner = main.getBannerText()
      expect(banner, "names the step").toBe("You stopped at: " + PHRASES[2])
      expect(readRaw(), "storage not cleared by Restart").toBe(main.getStateJson())

      // 4. Chosen card is saved too.
      main.clearProgress()
      const done = freshData()
      done.phase = "done"
      done.chosen = [0, 2, 4]
      done.steps = [{p: 0, part: 0, done: true}, {p: 2, part: 0, done: true}, {p: 4, part: 0, done: true}]
      done.current = 3
      done.card = 2
      saveData(done)
      await press(it, "RestartButton")
      await sleep(400)
      expect(main.getPhase()).toBe("done")
      expect(main.getBannerText().indexOf("Your step for today: ") === 0, "names today's card").toBeTruthy()
    } finally {
      restoreTiming(main)
      main.clearProgress()
    }
  }
}
