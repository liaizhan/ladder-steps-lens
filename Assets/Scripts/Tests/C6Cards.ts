// Criterion 6: after the last phrase crumbles, the question and three cards appear by the goal;
// pinching one card keeps it and fades the other two.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep, findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {QUESTION, CARDS} from "../LadderState"
import {getMain, startClimb, waitChoices, waitFor, press, restoreTiming} from "./LadderTestUtil"

@component
export class C6Cards extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const main = getMain()
    const it = new DefaultLeafInteractor()
    try {
      await startClimb(main, it, 0.25)
      for (let i = 0; i < 3; i++) {
        expect(main.getPhase()).toBe("climb")
        expect(findInteractablesByName("Card1", undefined, true).length, "no cards before the goal").toBe(0)
        await waitChoices(main, 6000)
        await press(it, "DoneButton")
        await waitFor(() => !main.isBusy(), 4000)
      }
      // UIKit Button adds its Interactable a frame after the card object, so wait for all three
      const ok = await waitFor(
        () => main.getPhase() === "cards" && findInteractablesByName("Card3", undefined, true).length === 1,
        4000
      )
      expect(ok, "phase cards after the last Done").toBeTruthy()
      // The goal glows fully again once no phrase stands in front of it.
      await waitFor(() => main.getGoalBrightness() > 0.9, 3000)
      expect(main.getGoalBrightness() > 0.9, "goal back to full glow at the cards").toBeTruthy()
      const q = findSceneObjectByName("Question").getComponent("Component.Text") as Text
      expect(q.text).toBe(QUESTION)
      for (let i = 1; i <= 3; i++) {
        expect(findInteractablesByName("Card" + i, undefined, true).length, "Card" + i + " shown").toBe(1)
        const l = findSceneObjectByName("Card" + i + "Label").getComponent("Component.Text") as Text
        expect(l.text).toBe(CARDS[i - 1])
      }
      // Brief: cards "beside the goal, about 100 cm from the user". The Lens puts them 100 cm
      // from the camera on the line toward the goal, so check that distance and that direction.
      const goal = main.getGoalWorldPosition()
      const c2pos = findSceneObjectByName("Card2").getTransform().getWorldPosition()
      const camSo = main.camera ? main.camera : findSceneObjectByName("Camera Object")
      const cam = camSo.getTransform().getWorldPosition()
      const toCard = new vec3(c2pos.x - cam.x, 0, c2pos.z - cam.z)
      const toGoal = new vec3(goal.x - cam.x, 0, goal.z - cam.z)
      const cos = toCard.normalize().dot(toGoal.normalize())
      print("[LadderTest] C6 card2=" + c2pos + " goal=" + goal + " cam=" + cam + " horiz=" + toCard.length.toFixed(1) + " cos=" + cos.toFixed(3))
      expect(toCard.length > 80 && toCard.length < 120, "cards about 100 cm from the user").toBeTruthy()
      expect(cos > 0.95, "cards in the direction of the goal").toBeTruthy()

      await press(it, "Card2")
      await sleep(1300)
      expect(main.getPhase()).toBe("done")
      const kept = findSceneObjectByName("Card2")
      expect(kept.enabled, "chosen card stays").toBe(true)
      expect((kept.getComponent(Button.getTypeName()) as Button).isOn, "chosen card lit").toBe(true)
      expect(findSceneObjectByName("Card1").enabled, "Card1 faded away").toBe(false)
      expect(findSceneObjectByName("Card3").enabled, "Card3 faded away").toBe(false)
      expect(main.getStateJson().indexOf("\"card\":1") >= 0, "card saved").toBeTruthy()
    } finally {
      restoreTiming(main)
    }
  }
}
