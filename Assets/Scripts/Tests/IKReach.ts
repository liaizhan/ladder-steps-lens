// Reachability: an IK avatar pinches a phrase tile and the Done button the way a real user would.
// A trigger that fails to converge or times out is a real placement finding, not a test bug.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findInteractableByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {createIKInteractor} from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar"
import {getMain, waitFor, restoreTiming, choiceButtonsReady} from "./LadderTestUtil"

@component
export class IKReach extends Scenario {
  private readonly ik = createIKInteractor()

  // Same LEAF quirk as press(): the Lens removes the third tile and the Done row inside their own
  // press callbacks; only that exact "Object is null" case on a destroyed target is accepted.
  private async ikPress(target: any, name: string): Promise<void> {
    try {
      await this.ik.trigger(target)
    } catch (e) {
      if (isNull(target) && ("" + e).indexOf("Object is null") >= 0) {
        print("[LadderTest] IK " + name + " was removed by its own press; trigger completed")
        return
      }
      throw e
    }
  }

  async run(): Promise<void> {
    await sleep(1500)
    const main = getMain()
    try {
      main.breathPhaseSeconds = 0.25
      main.clearProgress()
      await sleep(500)
      for (const n of ["Tile2", "Tile4", "Tile6"]) {
        const t = findInteractableByName(n, undefined, true)
        expect(t !== undefined, n + " found").toBeTruthy()
        await this.ikPress(t, n)
        await sleep(300)
      }
      expect(main.getChosen()).toEqual([1, 3, 5])
      const ok = await waitFor(() => main.getPhase() === "climb" && main.areChoicesVisible() && choiceButtonsReady(), 10000)
      expect(ok, "climb + choices").toBeTruthy()
      const done = findInteractableByName("DoneButton", undefined, true)
      const before = main.getCurrentIndex()
      await this.ikPress(done, "DoneButton")
      await sleep(300)
      expect(main.getCurrentIndex(), "IK Done advanced the step").toBe(before + 1)
    } finally {
      restoreTiming(main)
    }
  }
}
