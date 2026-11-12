// Criterion 2: six tiles with the author's phrases; pinching three highlights each one,
// and after the third pick they become the three ladder steps in the order chosen.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep, findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {PHRASES, parseData, readRaw} from "../LadderState"
import {getMain, press, waitFor, restoreTiming} from "./LadderTestUtil"

function tileButton(n: number): Button {
  const so = findSceneObjectByName("Tile" + n)
  return so.getComponent(Button.getTypeName()) as Button
}

@component
export class C2PickTiles extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const main = getMain()
    const it = new DefaultLeafInteractor()
    try {
      main.clearProgress()
      await sleep(300)
      expect(main.getPhase()).toBe("pick")
      for (let i = 1; i <= 6; i++) {
        expect(findInteractablesByName("Tile" + i, undefined, true).length, "Tile" + i + " is pinchable").toBe(1)
        const label = findSceneObjectByName("Tile" + i + "Label").getComponent("Component.Text") as Text
        expect(label.text).toBe(PHRASES[i - 1])
      }
      // pick in a non-sorted order: 4, 1, 6
      await press(it, "Tile4")
      await sleep(200)
      expect(tileButton(4).isOn, "Tile4 highlighted").toBe(true)
      expect(tileButton(1).isOn, "Tile1 not highlighted yet").toBe(false)
      await press(it, "Tile1")
      await sleep(200)
      expect(tileButton(1).isOn, "Tile1 highlighted").toBe(true)
      await press(it, "Tile6")
      await sleep(100)
      expect(main.getChosen()).toEqual([3, 0, 5])
      const ok = await waitFor(() => main.getPhase() === "climb" && !main.isBusy(), 5000)
      expect(ok, "tiles became the ladder").toBeTruthy()
      expect(findInteractablesByName("Tile1", undefined, true).length, "tiles hidden after third pick").toBe(0)
      expect(main.getStepCount()).toBe(3)
      const d = parseData(readRaw())
      expect(d.steps[0].p).toBe(3)
      expect(d.steps[1].p).toBe(0)
      expect(d.steps[2].p).toBe(5)
      expect(main.getCurrentPhrase()).toBe(PHRASES[3])
    } finally {
      restoreTiming(main)
    }
  }
}
