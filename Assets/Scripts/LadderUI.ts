// Ladder Steps UI module: every pinchable control is a UIKit Button laid out with GridLayout.
// Panels: phrase tiles (2 x 3), Done / Not yet row, goal cards (3 in a row), preview Restart button.
// LadderMain owns the flow and calls into this module.

import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {GridLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Grid/GridLayout"
import {GridItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Grid/GridItem"
import {GridAlign} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Grid/GridTypes"
import animate from "SpectaclesInteractionKit.lspkg/Utils/animate"

// ---- Typography (one type scale, size + weight together) ----
const FONT_SIZE_SCALE = 1.0
export type TextRole =
  | "Title1"
  | "Title2"
  | "HeadlineXL"
  | "Headline1"
  | "Headline2"
  | "Subheadline"
  | "Button"
  | "Callout"
  | "Body"
  | "Caption"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  Title1: {size: 105, weight: 700},
  Title2: {size: 93, weight: 700},
  HeadlineXL: {size: 62, weight: 700},
  Headline1: {size: 54, weight: 700},
  Headline2: {size: 48, weight: 700},
  Subheadline: {size: 41, weight: 700},
  Button: {size: 39, weight: 500},
  Callout: {size: 39, weight: 700},
  Body: {size: 39, weight: 500},
  Caption: {size: 38, weight: 500}
}
export function roleSize(role: TextRole, distanceCm = 110): number {
  return TYPE_SCALE[role].size * FONT_SIZE_SCALE * (distanceCm / 110)
}
export function applyTextRole(t: Text, role: TextRole, distanceCm = 110): void {
  t.size = roleSize(role, distanceCm)
  ;(t as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

export const LIGHT_TEXT = new vec4(0.97, 0.95, 0.9, 1)

// Plain light text on an object. width/height in cm. wrap=true for multi-line phrases.
export function makeText(
  parent: SceneObject,
  name: string,
  value: string,
  role: TextRole,
  distanceCm: number,
  width: number,
  height: number,
  wrap: boolean,
  color: vec4 = LIGHT_TEXT
): Text {
  const so = global.scene.createSceneObject(name)
  so.setParent(parent)
  const t = so.createComponent("Component.Text") as Text
  t.depthTest = true
  t.text = value
  applyTextRole(t, role, distanceCm)
  t.horizontalAlignment = HorizontalAlignment.Center
  t.verticalAlignment = VerticalAlignment.Center
  t.horizontalOverflow = wrap ? HorizontalOverflow.Wrap : HorizontalOverflow.Overflow
  t.verticalOverflow = VerticalOverflow.Overflow
  t.layoutRect = Rect.create(-width / 2, width / 2, -height / 2, height / 2)
  t.textFill.color = color
  return t
}

function child(parent: SceneObject | null, name: string, local: vec3): SceneObject {
  const so = global.scene.createSceneObject(name)
  if (parent) so.setParent(parent)
  so.getTransform().setLocalPosition(local)
  return so
}

@component
export class LadderUI extends BaseScriptComponent {
  @ui.label("Ladder Steps UI: tiles, Done / Not yet, cards, Restart")
  @ui.separator
  @ui.group_start("Settings")
  @input
  @hint("Phrase tile size in cm (width, height)")
  tileSize: vec2 = new vec2(30, 15)
  @input
  @hint("Done / Not yet button size in cm")
  choiceSize: vec2 = new vec2(12, 6)
  @input
  @hint("Goal card size in cm")
  cardSize: vec2 = new vec2(25, 12)
  @input
  @hint("Gap between tiles and cards in cm")
  gap: number = 3
  @ui.group_end
  private tileButtons: Button[] = []
  private cardButtons: Button[] = []

  onAwake(): void {}

  // One UIKit Button with a raw Text label in front of its face. The button body is 1 cm deep and centered, so the label sits at +0.6 cm, clear of its front (12.11.2026). size is set before Button init.
  private makeButton(
    parent: SceneObject,
    name: string,
    label: string,
    size: vec2,
    role: TextRole,
    toggle: boolean,
    onPress: () => void,
    labelDistanceCm = 100
  ): {btn: Button; item: GridItem; label: Text} {
    const so = global.scene.createSceneObject(name)
    so.setParent(parent)
    const btn = so.createComponent(Button.getTypeName()) as Button
    btn.size = new vec3(size.x, size.y, 1)
    if (toggle) {
      ;(btn as unknown as {_toggleable: boolean})._toggleable = true
    }
    const labelSo = child(so, name + "Label", new vec3(0, 0, 0.6))
    const t = labelSo.createComponent("Component.Text") as Text
    t.depthTest = true
    t.text = label
    applyTextRole(t, role, labelDistanceCm)
    t.horizontalAlignment = HorizontalAlignment.Center
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Wrap
    t.verticalOverflow = VerticalOverflow.Overflow
    t.layoutRect = Rect.create(-(size.x - 1.5) / 2, (size.x - 1.5) / 2, -(size.y - 1) / 2, (size.y - 1) / 2)
    t.textFill.color = LIGHT_TEXT
    const item = so.createComponent(GridItem.getTypeName()) as GridItem
    item.overrideWidth = size.x
    item.overrideHeight = size.y
    btn.onTriggerUp.add(() => onPress())
    return {btn: btn, item: item, label: t}
  }

  private makeGrid(
    host: SceneObject,
    cols: number,
    rows: number,
    cell: vec2,
    gap: number,
    items: GridItem[]
  ): GridLayout {
    const grid = host.createComponent(GridLayout.getTypeName()) as GridLayout
    grid.onInitialized.add(() => {
      grid.width = cols * cell.x + (cols - 1) * gap
      grid.height = rows * cell.y + (rows - 1) * gap
      grid.templateColumns = "repeat(" + cols + ", 1fr)"
      grid.templateRows = "repeat(" + rows + ", 1fr)"
      grid.gap = gap
      grid.justifyItems = GridAlign.Center
      grid.alignItems = GridAlign.Center
      grid.addItems(items)
    })
    return grid
  }

  // Panel root: Canvas (Hierarchy sort) + Content child at +0.6 cm.
  private makePanel(name: string, parent: SceneObject | null, local: vec3): {root: SceneObject; content: SceneObject} {
    const root = child(parent, name, local)
    root.createComponent("Component.Canvas")
    const content = child(root, name + "Content", new vec3(0, 0, 0.6))
    return {root: root, content: content}
  }

  // ---------- Phrase tiles ----------
  buildTiles(
    worldPos: vec3,
    phrases: string[],
    header: string,
    note: string,
    onPick: (i: number) => void
  ): SceneObject {
    const panel = this.makePanel("PhraseTiles", null, worldPos)
    const gridHost = child(panel.content, "TileGrid", vec3.zero())
    const items: GridItem[] = []
    this.tileButtons = []
    for (let i = 0; i < phrases.length; i++) {
      const idx = i
      const b = this.makeButton(gridHost, "Tile" + (i + 1), phrases[i], this.tileSize, "Body", true, () => onPick(idx))
      this.tileButtons.push(b.btn)
      items.push(b.item)
    }
    this.makeGrid(gridHost, 2, 3, this.tileSize, this.gap, items)
    const gridH = 3 * this.tileSize.y + 2 * this.gap
    const w = 2 * this.tileSize.x + this.gap
    makeText(panel.content, "TilesHeader", header, "Headline2", 100, w, 6, true).sceneObject
      .getTransform()
      .setLocalPosition(new vec3(0, gridH / 2 + 5, 0))
    makeText(panel.content, "TilesNote", note, "Caption", 70, w, 8, true, new vec4(0.85, 0.85, 0.8, 1)).sceneObject
      .getTransform()
      .setLocalPosition(new vec3(0, -gridH / 2 - 5.5, 0))
    return panel.root
  }

  setTileOn(i: number, on: boolean): void {
    const b = this.tileButtons[i]
    if (!b) return
    try {
      b.isOn = on
    } catch (e) {
      print("[LadderUI] isOn failed: " + e)
    }
  }

  setTileInactive(i: number, inactive: boolean): void {
    const b = this.tileButtons[i]
    if (b) b.inactive = inactive
  }

  tileWorldPosition(i: number): vec3 {
    const b = this.tileButtons[i]
    return b ? b.getTransform().getWorldPosition() : vec3.zero()
  }

  clearTileRefs(): void {
    this.tileButtons = []
  }

  // ---------- Done / Not yet ----------
  // distanceCm: how far the row is from the eyes, so the labels read about as large as the phrase above them.
  // At the old fixed 100 cm with Callout they were 2.5x smaller than the phrase (visual check, 12.11.2026).
  buildChoiceRow(parent: SceneObject, local: vec3, onDone: () => void, onNotYet: () => void, distanceCm = 110): SceneObject {
    const panel = this.makePanel("ChoiceRow", parent, local)
    const gridHost = child(panel.content, "ChoiceGrid", vec3.zero())
    const done = this.makeButton(gridHost, "DoneButton", "Done", this.choiceSize, "Headline1", false, onDone, distanceCm)
    const notYet = this.makeButton(gridHost, "NotYetButton", "Not yet", this.choiceSize, "Headline1", false, onNotYet, distanceCm)
    this.makeGrid(gridHost, 2, 1, this.choiceSize, 4, [done.item, notYet.item])
    return panel.root
  }

  // ---------- Goal cards ----------
  buildCards(worldPos: vec3, question: string, cards: string[], onPick: (i: number) => void): SceneObject {
    const panel = this.makePanel("GoalCards", null, worldPos)
    const w = cards.length * this.cardSize.x + (cards.length - 1) * this.gap
    makeText(panel.content, "Question", question, "Headline2", 100, w, 6, true).sceneObject
      .getTransform()
      .setLocalPosition(new vec3(0, this.cardSize.y / 2 + 6, 0))
    const gridHost = child(panel.content, "CardGrid", vec3.zero())
    const items: GridItem[] = []
    this.cardButtons = []
    for (let i = 0; i < cards.length; i++) {
      const idx = i
      const b = this.makeButton(gridHost, "Card" + (i + 1), cards[i], this.cardSize, "Body", true, () => onPick(idx))
      this.cardButtons.push(b.btn)
      items.push(b.item)
    }
    this.makeGrid(gridHost, cards.length, 1, this.cardSize, this.gap, items)
    return panel.root
  }

  // Keep card `keep` (lit), fade the other two out, then slide the kept card to the center.
  keepCard(keep: number, instant: boolean): void {
    for (let i = 0; i < this.cardButtons.length; i++) {
      const b = this.cardButtons[i]
      if (i === keep) {
        // Keep it lit. Do NOT use `inactive` here: UIKit switches to the inactive state,
        // which resets isOn to false and the chosen card goes dark. Block re-presses instead.
        b.isOn = true
        if (b.interactable) b.interactable.enabled = false
        if (b.collider) b.collider.enabled = false
        continue
      }
      b.inactive = true
      const so = b.sceneObject
      if (instant) {
        so.enabled = false
        continue
      }
      const label = so.getChild(0).getComponent("Component.Text") as Text
      animate({
        duration: 0.8,
        easing: "ease-out-quad",
        update: (t: number) => {
          b.opacity = 1 - t
          if (label) {
            const c = label.textFill.color
            label.textFill.color = new vec4(c.x, c.y, c.z, 1 - t)
          }
        },
        ended: () => {
          so.enabled = false
        }
      })
    }
  }

  cardWorldPosition(i: number): vec3 {
    const b = this.cardButtons[i]
    return b ? b.getTransform().getWorldPosition() : vec3.zero()
  }

  cardCount(): number {
    return this.cardButtons.length
  }

  clearCardRefs(): void {
    this.cardButtons = []
  }

  // ---------- Preview-only Restart ----------
  buildRestart(worldPos: vec3, onRestart: () => void): SceneObject {
    const panel = this.makePanel("RestartDemo", null, worldPos)
    const b = this.makeButton(panel.content, "RestartButton", "Restart (demo)", new vec2(14, 5), "Caption", false, onRestart)
    b.label.textFill.color = new vec4(1, 0.85, 0.55, 1)
    makeText(panel.content, "RestartHint", "preview only, keeps saved progress", "Caption", 45, 18, 3, true, new vec4(0.8, 0.8, 0.75, 1)).sceneObject
      .getTransform()
      .setLocalPosition(new vec3(0, -4.5, 0))
    return panel.root
  }
}
