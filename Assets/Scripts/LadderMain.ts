// Ladder Steps main flow: phrase pick -> ladder on the floor -> breathing on each step ->
// Done / Not yet -> goal cards. Saves progress to persistent storage and reopens where the user stopped.
//
// STAND-IN (preview only): there is no real floor in the preview, so the ladder stands at a fixed
// floor height of `floorBelowEyes` cm (default 150) below the camera's start height.
// On glasses the real version would place the ladder on the floor found by WorldQueryModule.

import animate from "SpectaclesInteractionKit.lspkg/Utils/animate"
import {LadderUI, makeText, roleSize, LIGHT_TEXT} from "./LadderUI"
import {
  CARDS,
  LadderData,
  NOTE,
  PHRASES,
  Phase,
  QUESTION,
  clearData,
  freshData,
  loadData,
  saveData,
  splitStep,
  stepsFromChosen
} from "./LadderState"

type CancelFn = () => void

const COL_FUTURE = new vec4(0.25, 0.3, 0.42, 1)
const COL_CURRENT = new vec4(0.6, 0.85, 1, 1)
const COL_DONE = new vec4(1, 0.75, 0.4, 1)
const COL_ME = new vec4(0.75, 0.7, 1, 1)
const COL_GOAL = new vec4(1, 0.9, 0.55, 1)
const COL_RING = new vec4(0.6, 0.95, 1, 1)
const COL_ARROW = new vec4(1, 0.85, 0.5, 1)
const COL_TETHER = new vec4(0.3, 0.42, 0.5, 1)
const PHRASE_WIDTH = 56
const PHRASE_SIZE_BOOST = 1.6
// After breathing the ring is gone, so the phrase rises into its place and Done / Not yet sit right under it.
// At the old spot (12 cm under the phrase) the buttons were 17 degrees below eye level, past the bottom edge
// of the Specs view (about 16 degrees), and their labels were cut off (visual check, 12.11.2026).
const PHRASE_RISE_Y = 14
const CHOICE_ROW_Y = 5
// Breathing ring scale. At 0.6 the ring line cut through "Breathe out" (visual check, 12.11.2026), so the
// smallest ring now leaves room for the label.
const RING_MIN = 0.72
const RING_MAX = 1.12
// Done / Not yet labels read a little smaller than the phrase (x1.6), so the phrase stays the main thing.
const CHOICE_LABEL_BOOST = 1.3
const COL_HALO = new vec4(1, 0.85, 0.5, 0.7)
const COL_GOAL_LABEL = new vec4(1, 0.92, 0.7, 1)

const STEP_W = 60
const STEP_H = 4
const STEP_D = 30
const STEP_GAP = 40
const STEP_RISE = 8
const FIRST_STEP_Z = 60
const PHRASE_ABOVE = 30
const GOAL_HEIGHT = 110

// ---------- mesh helpers (MeshBuilder, CCW winding) ----------
function newBuilder(): MeshBuilder {
  const mb = new MeshBuilder([
    {name: "position", components: 3},
    {name: "normal", components: 3, normalized: true},
    {name: "texture0", components: 2}
  ])
  mb.topology = MeshTopology.Triangles
  mb.indexType = MeshIndexType.UInt16
  return mb
}

function addQuad(mb: MeshBuilder, base: number, c: vec3, u: vec3, v: vec3, n: vec3): number {
  const p0 = c.sub(u).sub(v)
  const p1 = c.add(u).sub(v)
  const p2 = c.add(u).add(v)
  const p3 = c.sub(u).add(v)
  mb.appendVerticesInterleaved([
    p0.x, p0.y, p0.z, n.x, n.y, n.z, 0, 0,
    p1.x, p1.y, p1.z, n.x, n.y, n.z, 1, 0,
    p2.x, p2.y, p2.z, n.x, n.y, n.z, 1, 1,
    p3.x, p3.y, p3.z, n.x, n.y, n.z, 0, 1
  ])
  mb.appendIndices([base, base + 1, base + 2, base, base + 2, base + 3])
  return base + 4
}

// Unit box (1 x 1 x 1) centered at the origin; scale it with the transform.
function boxMesh(): RenderMesh {
  const mb = newBuilder()
  let b = 0
  const h = 0.5
  b = addQuad(mb, b, new vec3(h, 0, 0), new vec3(0, 0, -h), new vec3(0, h, 0), new vec3(1, 0, 0))
  b = addQuad(mb, b, new vec3(-h, 0, 0), new vec3(0, 0, h), new vec3(0, h, 0), new vec3(-1, 0, 0))
  b = addQuad(mb, b, new vec3(0, h, 0), new vec3(h, 0, 0), new vec3(0, 0, -h), new vec3(0, 1, 0))
  b = addQuad(mb, b, new vec3(0, -h, 0), new vec3(h, 0, 0), new vec3(0, 0, h), new vec3(0, -1, 0))
  b = addQuad(mb, b, new vec3(0, 0, h), new vec3(h, 0, 0), new vec3(0, h, 0), new vec3(0, 0, 1))
  b = addQuad(mb, b, new vec3(0, 0, -h), new vec3(-h, 0, 0), new vec3(0, h, 0), new vec3(0, 0, -1))
  mb.updateMesh()
  return mb.getMesh()
}

// Unit plane in XY facing +Z.
function planeMesh(): RenderMesh {
  const mb = newBuilder()
  addQuad(mb, 0, vec3.zero(), new vec3(0.5, 0, 0), new vec3(0, 0.5, 0), new vec3(0, 0, 1))
  mb.updateMesh()
  return mb.getMesh()
}

function ringMesh(inner: number, outer: number, segments: number): RenderMesh {
  const mb = newBuilder()
  const verts: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    const cx = Math.cos(a)
    const cy = Math.sin(a)
    verts.push(cx * inner, cy * inner, 0, 0, 0, 1, i / segments, 0)
    verts.push(cx * outer, cy * outer, 0, 0, 0, 1, i / segments, 1)
  }
  for (let i = 0; i < segments; i++) {
    const in0 = i * 2
    const out0 = i * 2 + 1
    const in1 = i * 2 + 2
    const out1 = i * 2 + 3
    idx.push(in0, out0, out1, in0, out1, in1)
  }
  mb.appendVerticesInterleaved(verts)
  mb.appendIndices(idx)
  mb.updateMesh()
  return mb.getMesh()
}

function octaMesh(): RenderMesh {
  const mb = newBuilder()
  const p = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1]
  ]
  const verts: number[] = []
  for (const v of p) verts.push(v[0], v[1], v[2], v[0], v[1], v[2], 0.5, 0.5)
  mb.appendVerticesInterleaved(verts)
  mb.appendIndices([0, 2, 4, 4, 2, 1, 1, 2, 5, 5, 2, 0, 4, 3, 0, 1, 3, 4, 5, 3, 1, 0, 3, 5])
  mb.updateMesh()
  return mb.getMesh()
}

// Arrow pointing +X in the XY plane.
function arrowMesh(): RenderMesh {
  const mb = newBuilder()
  mb.appendVerticesInterleaved([
    3, 0, 0, 0, 0, 1, 1, 0.5,
    -1.5, 1.8, 0, 0, 0, 1, 0, 1,
    -1.5, -1.8, 0, 0, 0, 1, 0, 0
  ])
  mb.appendIndices([0, 1, 2])
  mb.updateMesh()
  return mb.getMesh()
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

@component
export class LadderMain extends BaseScriptComponent {
  @ui.label("Ladder Steps: main flow (pick, climb, breathe, goal cards, saved progress)")
  @ui.separator
  @ui.group_start("Wiring")
  @input
  @hint("Unlit material, cloned per object for its color")
  material: Material
  @input
  @hint("LadderUI component (tiles, Done / Not yet, cards, Restart)")
  ui: LadderUI
  @input
  @hint("The scene Camera object (used for billboarding, the return arrow and stepping forward)")
  camera: SceneObject
  @ui.group_end
  @ui.group_start("Settings")
  @input
  @hint("Seconds per breathing phase (in, hold, out, hold). 4 = brief default")
  breathPhaseSeconds: number = 4
  @input
  @hint("Breathing rounds per step")
  breathRounds: number = 3
  @input
  @hint("STAND-IN: floor height below the camera start, in cm (no real floor in the preview)")
  floorBelowEyes: number = 150
  @input
  @hint("Gaze angle in degrees below eye level for the current phrase, breathing ring and Done / Not yet. The step stays on the floor; a thin line joins it to its phrase. 12 = in view with a level head (the return arrow shows past 14). Design fix approved by Aizhan, 12.11.2026")
  @widget(new SliderWidget(5, 45, 1))
  phraseGazeDown: number = 12

  @input
  @hint("How bright the goal stays while a step is being worked (1 = full glow). The phrase, ring and Done / Not yet stand in front of the goal on the same line of sight (the view is only about 37 x 32 degrees), so the goal dims while a step is active and glows fully again for the cards. Design fix from Aizhan's visual check, 12.11.2026")
  @widget(new SliderWidget(0.1, 1, 0.05))
  goalDimWhileClimbing: number = 0.3
  @input
  @hint("Clear saved progress on start (off = reopen where the user stopped)")
  clearSavedOnStart: boolean = false
  @input
  @hint("Show the preview-only Restart (demo) button")
  showRestartButton: boolean = true
  @ui.group_end

  private data: LadderData = freshData()
  private origin: vec3 = vec3.zero()
  private camT: Transform | null = null
  private gen = 0
  private cancels: CancelFn[] = []

  private boxM: RenderMesh
  private planeM: RenderMesh
  private ringM: RenderMesh
  private octaM: RenderMesh
  private arrowM: RenderMesh

  // runtime roots
  private tilesRoot: SceneObject | null = null
  private ladderRoot: SceneObject | null = null
  private stepObjs: SceneObject[] = []
  private stepMats: Material[] = []
  private goalObj: SceneObject | null = null
  private goalMat: Material | null = null
  private haloMat: Material | null = null
  private goalLabel: Text | null = null
  private goalBright = 1
  private billboards: SceneObject[] = []
  private focus: SceneObject | null = null
  private phraseText: Text | null = null
  private ringObj: SceneObject | null = null
  private ringMat: Material | null = null
  private breathLabel: Text | null = null
  private choiceRow: SceneObject | null = null
  private cardsRoot: SceneObject | null = null
  private banner: SceneObject | null = null
  private restartRoot: SceneObject | null = null
  private arrowObj: SceneObject | null = null

  private breathing = false
  private breathStart = 0
  private choicesVisible = false
  private busy = false
  private arrowVisible = false
  private built = false

  onAwake(): void {
    this.boxM = boxMesh()
    this.planeM = planeMesh()
    this.ringM = ringMesh(6.4, 7.5, 64)
    this.octaM = octaMesh()
    this.arrowM = arrowMesh()
    this.createEvent("OnStartEvent").bind(() => this.start())
    this.createEvent("UpdateEvent").bind(() => this.tick())
  }

  // ================= public API (buttons + LEAF tests) =================
  getPhase(): Phase {
    return this.data.phase
  }
  getStepCount(): number {
    return this.data.steps.length
  }
  getCurrentIndex(): number {
    return this.data.current
  }
  getChosen(): number[] {
    return this.data.chosen.slice()
  }
  getCurrentPhrase(): string {
    const s = this.data.steps[this.data.current]
    return s ? PHRASES[s.p] : ""
  }
  areChoicesVisible(): boolean {
    return this.choicesVisible
  }
  isBreathing(): boolean {
    return this.breathing
  }
  isArrowVisible(): boolean {
    return this.arrowVisible
  }
  isBusy(): boolean {
    return this.busy
  }
  getStateJson(): string {
    return JSON.stringify(this.data)
  }
  getBannerText(): string {
    if (!this.banner || isNull(this.banner)) return ""
    const t = this.banner.getComponent("Component.Text") as Text
    return t ? t.text : ""
  }
  /** 1 = full glow; drops toward goalDimWhileClimbing while a step is active. */
  getGoalBrightness(): number {
    return this.goalBright
  }
  isStepActive(): boolean {
    return this.data.phase === "climb" && this.focus !== null && !isNull(this.focus)
  }
  getGoalWorldPosition(): vec3 {
    return this.goalObj ? this.goalObj.getTransform().getWorldPosition() : vec3.zero()
  }
  getStepWorldPosition(i: number): vec3 {
    return this.stepPos(i + 1)
  }
  getCurrentStepWorldPosition(): vec3 {
    return this.stepPos(this.data.current + 1)
  }
  getOrigin(): vec3 {
    return this.origin
  }

  pickPhrase(i: number): boolean {
    if (this.data.phase !== "pick" || this.busy) return false
    if (i < 0 || i >= PHRASES.length) return false
    if (this.data.chosen.indexOf(i) >= 0) {
      this.forceTileOn(i)
      return false
    }
    if (this.data.chosen.length >= 3) return false
    this.data.chosen.push(i)
    this.forceTileOn(i)
    saveData(this.data)
    if (this.data.chosen.length === 3) {
      this.busy = true
      this.later(0.6, () => this.flyTilesToLadder())
    }
    return true
  }

  pressDone(): boolean {
    if (this.data.phase !== "climb" || !this.choicesVisible || this.busy) return false
    const s = this.data.steps[this.data.current]
    if (!s) return false
    this.hideChoices()
    s.done = true
    const full = s.part !== 1
    this.busy = true
    this.crumblePhrase(full)
    this.data.current++
    saveData(this.data)
    this.colorSteps()
    const g = this.gen
    this.later(1.3, () => {
      if (g !== this.gen) return
      this.busy = false
      if (this.data.current >= this.data.steps.length) {
        this.reachGoal()
      } else {
        this.wakeStep(this.data.current)
        this.enterStep()
      }
    })
    return true
  }

  pressNotYet(): boolean {
    if (this.data.phase !== "climb" || !this.choicesVisible || this.busy) return false
    this.hideChoices()
    const i = this.data.current
    if (splitStep(this.data, i)) {
      saveData(this.data)
      this.buildLadder()
      this.wakeStep(i)
    }
    this.enterStep()
    return true
  }

  pickCard(i: number): boolean {
    if (this.data.phase !== "cards" || this.busy) return false
    if (i < 0 || i >= CARDS.length) return false
    this.data.card = i
    this.data.phase = "done"
    saveData(this.data)
    this.busy = true
    this.ui.keepCard(i, false)
    const g = this.gen
    this.later(0.9, () => {
      if (g !== this.gen) return
      this.moveKeptCardToGoal(i, false)
    })
    return true
  }

  // Preview-only: rebuild the Lens from saved progress (does NOT clear it).
  restart(): void {
    this.teardown()
    const d = loadData()
    this.data = d ? d : freshData()
    this.boot(true)
  }

  // Test helper: wipe saved progress and start over at the phrase picker.
  clearProgress(): void {
    clearData()
    this.teardown()
    this.data = freshData()
    this.boot(false)
  }

  // ================= boot / teardown =================
  private start(): void {
    if (!this.material) {
      print("[LadderMain] ERROR: material input is not set")
    }
    if (!this.ui) {
      this.ui = this.sceneObject.createComponent(LadderUI.getTypeName()) as LadderUI
    }
    this.camT = this.findCamera()
    const cp = this.camT ? this.camT.getWorldPosition() : vec3.zero()
    this.origin = new vec3(cp.x, cp.y, cp.z)
    if (this.clearSavedOnStart) clearData()
    const d = loadData()
    this.data = d ? d : freshData()
    this.makeArrow()
    if (this.showRestartButton) {
      this.restartRoot = this.ui.buildRestart(this.o(34, -22, -95), () => this.restart())
      this.restartRoot.getTransform().setWorldRotation(this.faceOriginRot(this.o(34, -22, -95)))
    }
    this.built = true
    this.boot(d !== null)
  }

  private boot(fromSave: boolean): void {
    this.busy = false
    const d = this.data
    if (d.phase === "pick" || d.chosen.length < 3 || d.steps.length === 0) {
      d.phase = "pick"
      d.steps = []
      d.current = 0
      d.card = -1
      if (d.chosen.length >= 3) d.chosen = []
      this.showTiles()
      return
    }
    this.buildLadder()
    if (d.phase === "climb") {
      if (d.current >= d.steps.length) {
        this.reachGoal()
        return
      }
      this.wakeStep(d.current)
      if (fromSave) this.showBanner("You stopped at: " + this.getCurrentPhrase())
      this.enterStep()
      return
    }
    if (d.phase === "cards") {
      this.colorSteps()
      this.showCards()
      return
    }
    // done
    this.colorSteps()
    this.showCards()
    if (d.card >= 0) {
      this.ui.keepCard(d.card, true)
      this.moveKeptCardToGoal(d.card, true)
    }
    if (fromSave) this.showBanner("Your step for today: " + CARDS[Math.max(0, d.card)])
  }

  private teardown(): void {
    this.gen++
    for (const c of this.cancels) {
      try {
        c()
      } catch (e) {}
    }
    this.cancels = []
    this.breathing = false
    this.choicesVisible = false
    this.busy = false
    this.destroyObj(this.tilesRoot)
    this.tilesRoot = null
    this.destroyObj(this.ladderRoot)
    this.ladderRoot = null
    this.stepObjs = []
    this.stepMats = []
    this.goalObj = null
    this.destroyObj(this.focus)
    this.focus = null
    this.phraseText = null
    this.ringObj = null
    this.breathLabel = null
    this.choiceRow = null
    this.destroyObj(this.cardsRoot)
    this.cardsRoot = null
    this.destroyObj(this.banner)
    this.banner = null
    this.billboards = []
    if (this.ui) {
      this.ui.clearTileRefs()
      this.ui.clearCardRefs()
    }
  }

  // ================= phrase tiles =================
  private showTiles(): void {
    const pos = this.o(0, -12, -100)
    this.tilesRoot = this.ui.buildTiles(
      pos,
      PHRASES,
      "Pick three phrases you once believed",
      NOTE,
      (i: number) => this.pickPhrase(i)
    )
    this.tilesRoot.getTransform().setWorldRotation(this.faceOriginRot(pos))
    const restore = this.data.chosen.slice()
    if (restore.length > 0) {
      this.later(0.2, () => {
        for (const i of restore) this.ui.setTileOn(i, true)
      })
    }
  }

  private forceTileOn(i: number): void {
    // The toggle flips on its own trigger; force it on a moment later so a chosen tile stays lit.
    const g = this.gen
    this.later(0.05, () => {
      if (g === this.gen) this.ui.setTileOn(i, true)
    })
  }

  private flyTilesToLadder(): void {
    const g = this.gen
    this.data.steps = stepsFromChosen(this.data.chosen)
    this.data.current = 0
    this.data.phase = "climb"
    saveData(this.data)
    const ghosts: SceneObject[] = []
    const froms: vec3[] = []
    for (let k = 0; k < 3; k++) {
      froms.push(this.ui.tileWorldPosition(this.data.chosen[k]))
    }
    this.destroyObj(this.tilesRoot)
    this.tilesRoot = null
    this.ui.clearTileRefs()
    for (let k = 0; k < 3; k++) {
      const ghost = global.scene.createSceneObject("TileGhost" + (k + 1))
      ghost.getTransform().setWorldPosition(froms[k])
      ghost.getTransform().setWorldRotation(this.faceOriginRot(froms[k]))
      const q = global.scene.createSceneObject("GhostQuad")
      q.setParent(ghost)
      q.getTransform().setLocalScale(new vec3(30, 15, 1))
      this.meshOn(q, this.planeM, new vec4(0.6, 0.85, 1, 0.35))
      const t = makeText(ghost, "GhostText", PHRASES[this.data.chosen[k]], "Body", 100, 28, 13, true)
      t.sceneObject.getTransform().setLocalPosition(new vec3(0, 0, 0.3))
      ghosts.push(ghost)
    }
    this.buildLadder()
    if (this.ladderRoot) this.ladderRoot.enabled = false
    for (let k = 0; k < 3; k++) {
      const ghost = ghosts[k]
      const from = froms[k]
      const to = this.stepPos(k + 1).add(new vec3(0, 6, 0))
      this.track(
        animate({
          duration: 1.1 + k * 0.15,
          easing: "ease-in-out-quad",
          update: (t: number) => {
            if (isNull(ghost)) return
            const p = vec3.lerp(from, to, t)
            p.y += Math.sin(t * Math.PI) * 12
            ghost.getTransform().setWorldPosition(p)
            const s = lerp(1, 0.4, t)
            ghost.getTransform().setLocalScale(new vec3(s, s, s))
          },
          ended: () => {
            if (!isNull(ghost)) ghost.destroy()
          }
        })
      )
    }
    this.later(1.5, () => {
      if (g !== this.gen) return
      for (const gh of ghosts) if (!isNull(gh)) gh.destroy()
      if (this.ladderRoot) this.ladderRoot.enabled = true
      this.busy = false
      this.wakeStep(0)
      this.enterStep()
    })
  }

  // ================= ladder =================
  // Ladder index 0 = "Me", 1..n = phrase steps, goal after the last step.
  // Phrase, ring and Done / Not yet float at a comfortable gaze angle above their step
  // (never lower than PHRASE_ABOVE over the step itself).
  private focusPos(ladderIndex: number): vec3 {
    const step = this.stepPos(ladderIndex)
    const dist = FIRST_STEP_Z + STEP_GAP * ladderIndex
    const gazeY = this.origin.y - Math.tan((this.phraseGazeDown * Math.PI) / 180) * dist
    return new vec3(step.x, Math.max(step.y + PHRASE_ABOVE, gazeY), step.z)
  }

  // Thin light line from the top of the step up to the bottom of its Done / Not yet row.
  private makeTether(focus: SceneObject, ladderIndex: number): void {
    const top = this.stepPos(ladderIndex).y + STEP_H / 2
    const bottom = focus.getTransform().getWorldPosition().y - 18
    const h = bottom - top
    if (h < 4) return
    const line = global.scene.createSceneObject("StepTether")
    line.setParent(focus)
    line.getTransform().setLocalPosition(new vec3(0, -18 - h / 2, 0))
    line.getTransform().setLocalScale(new vec3(0.4, h, 0.4))
    this.meshOn(line, this.boxM, COL_TETHER)
  }

  private stepPos(ladderIndex: number): vec3 {
    return this.o(0, -this.floorBelowEyes + STEP_H / 2 + STEP_RISE * ladderIndex, -FIRST_STEP_Z - STEP_GAP * ladderIndex)
  }

  private goalPos(): vec3 {
    const n = this.data.steps.length
    return this.o(0, -this.floorBelowEyes + GOAL_HEIGHT, -FIRST_STEP_Z - STEP_GAP * (n + 1))
  }

  private buildLadder(): void {
    this.destroyObj(this.ladderRoot)
    this.billboards = this.billboards.filter((b) => !isNull(b) && this.focus !== null && b.getParent() === this.focus)
    this.stepObjs = []
    this.stepMats = []
    const root = global.scene.createSceneObject("LadderRoot")
    this.ladderRoot = root
    // "Me"
    const me = this.makeStep(root, "Step_Me", 0, 1, 1, COL_ME)
    const meLabel = makeText(root, "MeLabel", "Me", "Headline1", 120, 30, 8, false)
    meLabel.sceneObject.getTransform().setWorldPosition(this.stepPos(0).add(new vec3(0, 9, 0)))
    this.billboards.push(meLabel.sceneObject)
    void me
    for (let i = 0; i < this.data.steps.length; i++) {
      const s = this.data.steps[i]
      const w = s.part === 0 ? 1 : 0.85
      const dd = s.part === 0 ? 1 : 0.6
      const so = this.makeStep(root, "Step" + (i + 1) + (s.part ? "_part" + s.part : ""), i + 1, w, dd, COL_FUTURE)
      this.stepObjs.push(so)
    }
    // goal
    const goal = global.scene.createSceneObject("Goal")
    goal.setParent(root)
    goal.getTransform().setWorldPosition(this.goalPos())
    goal.getTransform().setLocalScale(new vec3(10, 13, 10))
    this.goalMat = this.meshOn(goal, this.octaM, COL_GOAL)
    this.goalObj = goal
    const halo = global.scene.createSceneObject("GoalHalo")
    halo.setParent(root)
    halo.getTransform().setWorldPosition(this.goalPos())
    halo.getTransform().setLocalScale(new vec3(2.6, 2.6, 2.6))
    this.haloMat = this.meshOn(halo, this.ringM, COL_HALO)
    this.billboards.push(halo)
    const gl = makeText(root, "GoalLabel", "Your goal", "Headline1", 220, 40, 8, false, COL_GOAL_LABEL)
    gl.sceneObject.getTransform().setWorldPosition(this.goalPos().add(new vec3(0, 24, 0)))
    this.goalLabel = gl
    this.billboards.push(gl.sceneObject)
    this.colorSteps()
  }

  private makeStep(root: SceneObject, name: string, ladderIndex: number, wScale: number, dScale: number, col: vec4): SceneObject {
    const so = global.scene.createSceneObject(name)
    so.setParent(root)
    so.getTransform().setWorldPosition(this.stepPos(ladderIndex))
    so.getTransform().setLocalScale(new vec3(STEP_W * wScale, STEP_H, STEP_D * dScale))
    const mat = this.meshOn(so, this.boxM, col)
    if (ladderIndex > 0) this.stepMats.push(mat)
    return so
  }

  private colorSteps(): void {
    for (let i = 0; i < this.stepMats.length; i++) {
      const s = this.data.steps[i]
      let c = COL_FUTURE
      if (s && s.done) c = COL_DONE
      else if (i === this.data.current && this.data.phase === "climb") c = COL_CURRENT
      this.stepMats[i].mainPass.baseColor = c
    }
  }

  private wakeStep(i: number): void {
    this.colorSteps()
    const so = this.stepObjs[i]
    if (!so) return
    const base = so.getTransform().getLocalScale()
    this.track(
      animate({
        duration: 0.6,
        easing: "ease-out-back",
        update: (t: number) => {
          if (isNull(so)) return
          const k = 1 + Math.sin(t * Math.PI) * 0.15
          so.getTransform().setLocalScale(new vec3(base.x * k, base.y * (1 + Math.sin(t * Math.PI)), base.z * k))
        }
      })
    )
  }

  // ================= step focus: phrase, breathing ring, Done / Not yet =================
  private enterStep(): void {
    const s = this.data.steps[this.data.current]
    if (!s) return
    this.destroyObj(this.focus)
    const focus = global.scene.createSceneObject("StepFocus")
    this.focus = focus
    focus.getTransform().setWorldPosition(this.focusPos(this.data.current + 1))
    this.billboards.push(focus)
    this.makeTether(focus, this.data.current + 1)
    const dist = this.camT ? this.camT.getWorldPosition().distance(focus.getTransform().getWorldPosition()) : 150
    let label = PHRASES[s.p]
    if (s.part === 1) label = PHRASES[s.p] + "\n(small step 1 of 2)"
    if (s.part === 2) label = PHRASES[s.p] + "\n(small step 2 of 2)"
    this.phraseText = makeText(focus, "StepPhrase", label, "Headline1", Math.max(110, dist), PHRASE_WIDTH, 14, true)
    // The phrase is the main thing on screen, so it reads larger than the breathing cue (visual check, 12.11.2026).
    this.phraseText.size = this.phraseText.size * PHRASE_SIZE_BOOST
    // ring
    const ring = global.scene.createSceneObject("BreathRing")
    ring.setParent(focus)
    ring.getTransform().setLocalPosition(new vec3(0, 16, 0))
    ring.getTransform().setLocalScale(new vec3(RING_MIN, RING_MIN, RING_MIN))
    this.ringMat = this.meshOn(ring, this.ringM, COL_RING)
    this.ringObj = ring
    const bl = makeText(focus, "BreathLabel", "", "Headline2", Math.max(110, dist), 30, 8, false, new vec4(0.8, 0.95, 1, 1))
    bl.sceneObject.getTransform().setLocalPosition(new vec3(0, 16, 0.2))
    // Breathing cue is the one thing to read during the 48 s of breathing, so it fills the ring (visual check, 12.11.2026).
    bl.size = bl.size * 1.6
    this.breathLabel = bl
    this.choiceRow = null
    this.choicesVisible = false
    this.breathing = true
    this.breathStart = getTime()
    this.colorSteps()
  }

  private tickBreathing(): void {
    if (!this.breathing || !this.ringObj || isNull(this.ringObj)) return
    const ph = Math.max(0.05, this.breathPhaseSeconds)
    const el = getTime() - this.breathStart
    const total = ph * 4 * this.breathRounds
    if (el >= total) {
      this.breathing = false
      this.finishBreathing()
      return
    }
    const round = Math.floor(el / (ph * 4))
    const inRound = el - round * ph * 4
    const phase = Math.floor(inRound / ph)
    const t = (inRound - phase * ph) / ph
    let s = RING_MIN
    let name = "Breathe in"
    if (phase === 0) {
      s = lerp(RING_MIN, RING_MAX, t)
      name = "Breathe in"
    } else if (phase === 1) {
      s = RING_MAX
      name = "Hold"
    } else if (phase === 2) {
      s = lerp(RING_MAX, RING_MIN, t)
      name = "Breathe out"
    } else {
      s = RING_MIN
      name = "Hold"
    }
    this.ringObj.getTransform().setLocalScale(new vec3(s, s, s))
    if (this.breathLabel) this.breathLabel.text = name + "\n" + (round + 1) + "/" + this.breathRounds
  }

  private finishBreathing(): void {
    const ring = this.ringObj
    const mat = this.ringMat
    const lbl = this.breathLabel
    const g = this.gen
    this.track(
      animate({
        duration: 0.6,
        easing: "ease-out-quad",
        update: (t: number) => {
          if (mat) mat.mainPass.baseColor = new vec4(COL_RING.x, COL_RING.y, COL_RING.z, 1 - t)
          if (lbl && !isNull(lbl)) {
            const c = lbl.textFill.color
            lbl.textFill.color = new vec4(c.x, c.y, c.z, 1 - t)
          }
        },
        ended: () => {
          if (g !== this.gen) return
          if (ring && !isNull(ring)) ring.enabled = false
          if (lbl && !isNull(lbl)) lbl.sceneObject.enabled = false
          this.showChoices()
        }
      })
    )
  }

  private showChoices(): void {
    if (!this.focus || isNull(this.focus)) return
    const pt = this.phraseText
    const g = this.gen
    const build = () => {
      if (g !== this.gen || !this.focus || isNull(this.focus)) return
      const dist = this.camT ? this.camT.getWorldPosition().distance(this.focus.getTransform().getWorldPosition()) : 150
      this.choiceRow = this.ui.buildChoiceRow(
        this.focus,
        new vec3(0, CHOICE_ROW_Y, 0),
        () => this.pressDone(),
        () => this.pressNotYet(),
        Math.max(110, dist) * CHOICE_LABEL_BOOST
      )
      this.choicesVisible = true
    }
    if (!pt || isNull(pt)) {
      build()
      return
    }
    const ptT = pt.sceneObject.getTransform()
    const y0 = ptT.getLocalPosition().y
    this.track(
      animate({
        duration: 0.45,
        easing: "ease-out-quad",
        update: (t: number) => {
          if (!isNull(pt)) ptT.setLocalPosition(new vec3(0, lerp(y0, PHRASE_RISE_Y, t), 0))
        },
        ended: () => build()
      })
    )
  }

  private hideChoices(): void {
    this.choicesVisible = false
    this.destroyObj(this.choiceRow)
    this.choiceRow = null
  }

  // Words of the phrase fall and fade. full=false (first half of a split step) drops only half the words.
  private crumblePhrase(full: boolean): void {
    const focus = this.focus
    const pt = this.phraseText
    if (!focus || isNull(focus) || !pt) return
    const words = pt.text.split("\n")[0].split(" ")
    const size = pt.size
    // crumbs start where the phrase is now (it rises when Done / Not yet show)
    const baseY = pt.sceneObject.getTransform().getLocalPosition().y
    pt.sceneObject.enabled = false
    const charW = size * 0.028
    const maxW = PHRASE_WIDTH
    // lay words out in rows roughly like the wrapped text
    const rows: string[][] = [[]]
    let rowW = 0
    for (const w of words) {
      const ww = (w.length + 1) * charW
      if (rowW + ww > maxW && rows[rows.length - 1].length > 0) {
        rows.push([])
        rowW = 0
      }
      rows[rows.length - 1].push(w)
      rowW += ww
    }
    const lineH = size * 0.09
    let wi = 0
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r]
      const total = row.reduce((a, w) => a + (w.length + 1) * charW, 0)
      let x = -total / 2
      const y = ((rows.length - 1) / 2 - r) * lineH
      for (const w of row) {
        const ww = (w.length + 1) * charW
        const t = makeText(focus, "Crumb" + wi, w, "Headline1", 110, ww + 2, lineH, false)
        t.size = size
        const so = t.sceneObject
        const start = new vec3(x + ww / 2, baseY + y, 0)
        so.getTransform().setLocalPosition(start)
        x += ww
        const falls = full || wi % 2 === 0
        wi++
        if (!falls) {
          // stays a moment, dimmed, then fades (the phrase is weakened, not gone)
          this.track(
            animate({
              duration: 1.2,
              easing: "linear",
              update: (k: number) => {
                if (isNull(so)) return
                t.textFill.color = new vec4(LIGHT_TEXT.x, LIGHT_TEXT.y, LIGHT_TEXT.z, 1 - k)
              }
            })
          )
          continue
        }
        const dx = (Math.random() - 0.5) * 10
        const spin = (Math.random() - 0.5) * 2.5
        const delay = Math.random() * 0.25
        this.track(
          animate({
            duration: 1.2,
            easing: "ease-in-quad",
            update: (k: number) => {
              if (isNull(so)) return
              const kk = Math.max(0, (k - delay) / (1 - delay))
              so.getTransform().setLocalPosition(start.add(new vec3(dx * kk, -32 * kk, 0)))
              so.getTransform().setLocalRotation(quat.angleAxis(spin * kk, vec3.forward()))
              t.textFill.color = new vec4(LIGHT_TEXT.x, LIGHT_TEXT.y * (1 - 0.3 * kk), LIGHT_TEXT.z * (1 - 0.5 * kk), 1 - kk)
            }
          })
        )
      }
    }
  }

  // ================= goal cards =================
  private reachGoal(): void {
    this.data.phase = "cards"
    saveData(this.data)
    this.destroyObj(this.focus)
    this.focus = null
    this.colorSteps()
    this.showCards()
  }

  private cardsPos(): vec3 {
    const cam = this.camT ? this.camT.getWorldPosition() : this.origin
    const goal = this.goalPos()
    let dir = new vec3(goal.x - cam.x, 0, goal.z - cam.z)
    if (dir.length < 1) dir = new vec3(0, 0, -1)
    dir = dir.normalize()
    return new vec3(cam.x + dir.x * 100, cam.y - 8, cam.z + dir.z * 100)
  }

  private showCards(): void {
    const pos = this.cardsPos()
    this.cardsRoot = this.ui.buildCards(pos, QUESTION, CARDS, (i: number) => this.pickCard(i))
    this.cardsRoot.getTransform().setWorldRotation(this.faceCameraRot(pos))
  }

  private moveKeptCardToGoal(i: number, instant: boolean): void {
    const root = this.cardsRoot
    if (!root || isNull(root)) return
    const cardSo = this.findChildDeep(root, "Card" + (i + 1))
    const target = this.goalPos().add(new vec3(0, -26, 28))
    const from = root.getTransform().getWorldPosition()
    const fromScale = root.getTransform().getLocalScale().x
    const cardFromX = cardSo ? cardSo.getTransform().getLocalPosition().x : 0
    const apply = (t: number) => {
      if (isNull(root)) return
      const p = vec3.lerp(from, target, t)
      root.getTransform().setWorldPosition(p)
      const s = lerp(fromScale, 1.25, t)
      root.getTransform().setLocalScale(new vec3(s, s, s))
      root.getTransform().setWorldRotation(this.faceCameraRot(p))
      if (cardSo && !isNull(cardSo)) {
        const lp = cardSo.getTransform().getLocalPosition()
        cardSo.getTransform().setLocalPosition(new vec3(lerp(cardFromX, 0, t), lp.y, lp.z))
      }
    }
    if (instant) {
      apply(1)
      this.busy = false
      return
    }
    const g = this.gen
    this.track(
      animate({
        duration: 1.4,
        easing: "ease-in-out-quad",
        update: apply,
        ended: () => {
          if (g === this.gen) this.busy = false
        }
      })
    )
  }

  // ================= banner ("You stopped at: ...") =================
  private showBanner(text: string): void {
    this.destroyObj(this.banner)
    const pos = this.o(0, -4, -100)
    const t = makeText(global.scene.getRootObject(0), "StoppedAtBanner", text, "Headline2", 100, 60, 10, true, new vec4(1, 0.92, 0.7, 1))
    const so = t.sceneObject
    so.setParent(null)
    so.getTransform().setWorldPosition(pos)
    so.getTransform().setWorldRotation(this.faceOriginRot(pos))
    this.banner = so
    const g = this.gen
    this.later(8, () => {
      if (g !== this.gen || isNull(so)) return
      this.track(
        animate({
          duration: 1,
          easing: "linear",
          update: (k: number) => {
            if (isNull(so)) return
            t.textFill.color = new vec4(1, 0.92, 0.7, 1 - k)
          },
          ended: () => {
            if (!isNull(so)) so.enabled = false
          }
        })
      )
    })
  }

  // ================= return arrow =================
  private makeArrow(): void {
    if (!this.camT) return
    const a = global.scene.createSceneObject("ReturnArrow")
    a.setParent(this.camT.getSceneObject())
    a.getTransform().setLocalPosition(new vec3(0, 0, -60))
    a.getTransform().setLocalScale(new vec3(0.9, 0.9, 0.9))
    this.meshOn(a, this.arrowM, COL_ARROW)
    a.enabled = false
    this.arrowObj = a
  }

  private arrowTarget(): vec3 | null {
    const p = this.data.phase
    if (p === "pick") return this.tilesRoot && !isNull(this.tilesRoot) ? this.tilesRoot.getTransform().getWorldPosition() : null
    if (p === "climb") return this.focus && !isNull(this.focus) ? this.focus.getTransform().getWorldPosition() : null
    if (p === "cards") return this.cardsRoot && !isNull(this.cardsRoot) ? this.cardsRoot.getTransform().getWorldPosition() : null
    return null
  }

  private tickArrow(): void {
    if (!this.arrowObj || !this.camT) return
    const target = this.arrowTarget()
    let show = false
    if (target) {
      const local = this.camT.getInvertedWorldTransform().multiplyPoint(target)
      const lateral = Math.sqrt(local.x * local.x + local.y * local.y)
      const angle = Math.atan2(lateral, -local.z) * (180 / Math.PI)
      if (angle > 14) {
        show = true
        let dx = local.x
        let dy = local.y
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len < 0.001) {
          dx = 0
          dy = -1
        } else {
          dx /= len
          dy /= len
        }
        this.arrowObj.getTransform().setLocalPosition(new vec3(dx * 11, dy * 11, -60))
        this.arrowObj.getTransform().setLocalRotation(quat.angleAxis(Math.atan2(dy, dx), vec3.forward()))
      }
    }
    if (show !== this.arrowVisible) {
      this.arrowVisible = show
      this.arrowObj.enabled = show
    }
  }

  // ================= frame loop =================
  private tick(): void {
    if (!this.built) return
    const camPos = this.camT ? this.camT.getWorldPosition() : this.origin
    this.billboards = this.billboards.filter((b) => !isNull(b))
    for (const b of this.billboards) {
      const p = b.getTransform().getWorldPosition()
      const dir = camPos.sub(p)
      dir.y = 0
      if (dir.length > 0.01) b.getTransform().setWorldRotation(quat.lookAt(dir.normalize(), vec3.up()))
    }
    this.tickBreathing()
    this.tickArrow()
    if (this.goalObj && !isNull(this.goalObj)) {
      const t = getTime()
      const k = 1 + Math.sin(t * 2.2) * 0.08
      this.goalObj.getTransform().setLocalScale(new vec3(10 * k, 13 * k, 10 * k))
      this.goalObj.getTransform().setLocalRotation(quat.angleAxis(t * 0.6, vec3.up()))
      // Dim the goal while a step's phrase stands in front of it, full glow otherwise.
      const target = this.isStepActive() ? this.goalDimWhileClimbing : 1
      this.goalBright += (target - this.goalBright) * Math.min(1, getDeltaTime() * 3)
      const b = this.goalBright
      if (this.goalMat) {
        const glow = (0.85 + Math.sin(t * 2.2) * 0.15) * b
        this.goalMat.mainPass.baseColor = new vec4(COL_GOAL.x * glow, COL_GOAL.y * glow, COL_GOAL.z * glow, 1)
      }
      if (this.haloMat) this.haloMat.mainPass.baseColor = new vec4(COL_HALO.x * b, COL_HALO.y * b, COL_HALO.z * b, COL_HALO.w)
      if (this.goalLabel && !isNull(this.goalLabel)) {
        // The label sits inside the breathing ring's line of sight, so it fades out fully during a step.
        const dim = this.goalDimWhileClimbing
        const lk = dim < 0.999 ? Math.max(0, Math.min(1, (b - dim) / (1 - dim))) : 1
        this.goalLabel.textFill.color = new vec4(COL_GOAL_LABEL.x * lk, COL_GOAL_LABEL.y * lk, COL_GOAL_LABEL.z * lk, lk)
      }
    }
    // Done by stepping forward: the user's head moves past the current step (preview: move the camera).
    if (this.data.phase === "climb" && this.choicesVisible && !this.busy && this.camT) {
      const stepZ = this.stepPos(this.data.current + 1).z
      if (camPos.z <= stepZ + 5) this.pressDone()
    }
  }

  // ================= small helpers =================
  private o(x: number, y: number, z: number): vec3 {
    return new vec3(this.origin.x + x, this.origin.y + y, this.origin.z + z)
  }

  private faceOriginRot(pos: vec3): quat {
    const dir = this.origin.sub(pos)
    dir.y = 0
    return quat.lookAt(dir.length > 0.01 ? dir.normalize() : vec3.forward(), vec3.up())
  }

  private faceCameraRot(pos: vec3): quat {
    const cam = this.camT ? this.camT.getWorldPosition() : this.origin
    const dir = cam.sub(pos)
    dir.y = 0
    return quat.lookAt(dir.length > 0.01 ? dir.normalize() : vec3.forward(), vec3.up())
  }

  private meshOn(so: SceneObject, mesh: RenderMesh, col: vec4): Material {
    const rmv = so.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rmv.mesh = mesh
    const mat = this.material.clone()
    mat.mainPass.baseColor = col
    try {
      mat.mainPass.twoSided = true
    } catch (e) {}
    rmv.mainMaterial = mat
    return mat
  }

  private later(seconds: number, fn: () => void): void {
    const ev = this.createEvent("DelayedCallbackEvent")
    ev.bind(() => {
      fn()
      this.removeEvent(ev)
    })
    ev.reset(seconds)
  }

  private track(c: CancelFn): void {
    this.cancels.push(c)
    if (this.cancels.length > 400) this.cancels.splice(0, 200)
  }

  private destroyObj(so: SceneObject | null): void {
    if (so && !isNull(so)) so.destroy()
  }

  private findChildDeep(root: SceneObject, name: string): SceneObject | null {
    for (let i = 0; i < root.getChildrenCount(); i++) {
      const c = root.getChild(i)
      if (c.name === name) return c
      const f = this.findChildDeep(c, name)
      if (f) return f
    }
    return null
  }

  private findCamera(): Transform | null {
    if (this.camera) return this.camera.getTransform()
    for (let i = 0; i < global.scene.getRootObjectsCount(); i++) {
      const r = global.scene.getRootObject(i)
      if (r.getComponent("Component.Camera")) return r.getTransform()
    }
    print("[LadderMain] no camera found")
    return null
  }
}

// keep roleSize referenced for consumers that import from here
export {roleSize}
