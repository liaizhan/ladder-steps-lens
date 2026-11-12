# Build log: Ladder Steps

Lens Studio 5.23.2, SPECS. Built by a Claude Code agent with the CLAD plugin (ls-clad skills) and the Lens Studio MCP tools only. Brief: `devpost/design-brief.md` (approved, not edited). Times are UTC, 11.11.2026.

## Result

The Lens runs in Lens Studio preview. There is one LEAF scenario for each of the 8 done criteria, plus one IK reach scenario. All 9 pass in preview, both one at a time and in a full back-to-back run, and again after the visual check of 12.11.2026.

| Criterion | LEAF scenario | Result |
|---|---|---|
| 1. Ladder lies ahead and rises, "Me" at the bottom, goal glowing at about 110 cm, fixed floor height; current phrase 12 degrees below eye level, joined to its step by a thin line | `C1 ladder geometry` | PASS |
| 2. Six tiles, pinch three, each highlights, they become the steps in the order chosen | `C2 pick three tiles` | PASS |
| 3. Ring guides three breathing rounds, Done and Not yet only after the third | `C3 breathing rounds` | PASS |
| 4. Done makes the phrase crumble and wakes the next step | `C4 Done crumbles` | PASS |
| 5. Not yet splits the step, so the ladder has one more step | `C5 Not yet splits` | PASS |
| 6. After the last phrase, the question and three cards show; one pinch keeps one card and fades two | `C6 goal cards` | PASS |
| 7. Turning away shows an arrow that points back to the current step | `C7 return arrow` | PASS |
| 8. Progress saved to persistent storage; after Restart the ladder opens where the user stopped and names the step | `C8 persistent storage` | PASS |
| Extra: hand reach to tiles and Done with an IK hand | `IK reach tiles and Done` | PASS |

Every criterion has a test. Two parts have no test:
- In criterion 4, "Done by stepping forward" is in the code (`LadderMain.ts`, the camera passes the step) but no scenario checks it. The pinch on Done carries the tests, as the brief says.
- In criterion 8, memory between real sessions (closing and reopening the Lens on glasses) can't run in preview. C8 writes and reads persistent storage, then uses the preview-only Restart button.

## Files

- `Assets/Scripts/LadderState.ts`: pure state, the six phrases, the question, the cards, the note, and save, load and parse under the key `ladderSteps.v1`. Also the Not yet split.
- `Assets/Scripts/LadderUI.ts`: UI Kit buttons for the 6 tiles, Done and Not yet, the 3 cards and the preview-only Restart button.
- `Assets/Scripts/LadderMain.ts`: the flow. Pick, ladder on the floor, breathing ring, crumble, split, goal cards, return arrow, step forward, save and restore. Inspector settings include breath seconds (4), rounds (3), the STAND-IN floor height (150 cm below the eyes), clear saved progress on start (off) and show Restart (on).
- `Assets/Scripts/Tests/`: `C1Geometry.ts` to `C8Storage.ts`, `IKReach.ts`, the shared helpers in `LadderTestUtil.ts` and `LeafIndex.ts`.
- Scene: a `LadderSteps` object carries LadderMain and LadderUI, and a root `LeafIndex` object carries the test index.

## Steps

1. **19:56 Check the project.** I loaded the router, field notes and project init skills. I read the scene with VirtualScene and checked the packages: SIK 0.18.0 and SpectaclesUIKit were present. I also checked the Preview Panel config. The camera already had DeviceTracking in World mode.
2. **20:02 to 20:17 Write the Lens.** I read the UI Kit patterns and wrote the three scripts. Everything is built from code at start: a cube mesh with one Unlit material cloned per color, light text on a dark plate (the display is additive), and UI Kit buttons for every pinch.
3. **20:18 to 20:19 Put the Lens in the scene.** Recompiled, then created the material and the `LadderSteps` object with VirtualScene, then wired the script inputs. The first run had no errors, and a runtime capture showed the tiles.
4. **20:21 to 20:27 Install LEAF.** LEAF v4 installed (the install call timed out but the package landed). It does not match SIK 0.18.0, so I installed the compatible LEAF v2.0.2. It landed as "Leaf 2", so I removed v4 with the Editor API and renamed v2 to "Leaf". The build compiled clean.
5. **20:28 to 20:37 Write the tests.** I read the LEAF v2 API, checked LadderMain's public methods, wrote 9 scenarios, added the `LeafIndex` object and saved the project. All 9 scenarios registered.
6. **20:37 to 20:48 Run and fix.** Ran each scenario and fixed the failures, listed below.
7. **20:49 to 20:50 Full run.** Ran all 9 back to back, all PASS.
8. **20:51 Write this log and `PROMPTS.md`.**

## Problems and fixes

1. **LEAF v4 does not work with SIK 0.18.0.** Fixed by downgrading to LEAF v2.0.2, which depends on the same SIK. SIK was not touched.
2. **VirtualScene `_addComponents` gotcha.** Script inputs that point at components can only be wired after a recompile, and they must point at the component's id, not its SceneObject's. Fixed by a two-phase apply: create first, then recompile, then wire.
3. **UI Kit adds the Interactable one frame late (C3).** The Lens marks the buttons as shown on the frame it creates them, but UI Kit adds their Interactable one frame later, so a test that looked right away found nothing. This is test timing, not a Lens bug. Fixed in the test helpers by waiting until the button's Interactable exists.
4. **LEAF and destroyed buttons.** When a callback destroys the button that was just pressed (the tiles after the third pick, Done when it crumbles), LEAF throws "Object is null" after the press already worked. The helpers accept only that exact error, and only when the target really is destroyed. The IK test got the same wrapper (`ikPress`). LEAF code was not changed.
5. **Breathing takes 48 s per step.** Tests set 0.25 s per phase and put 4 s back in `finally`. The 4-4-4-4 rhythm and the 3 rounds are checked through the ring's phase order and scale, not wall time.
6. **C4 failed at first** with "Exception in HostFunction: Object is null". I added debug marks to the test to find the line. It was the destroyed-button case from problem 4: Done crumbles away inside its own press. Fixed in the test helpers only.
7. **C6, real Lens bug: the chosen card went dark.** When keeping a card, the code set it `inactive`. That reset its toggle, so the kept card looked unchosen. Fixed in `LadderUI.ts`: the kept card stays on, and only its interactable and collider are turned off.
8. **C6, test fix.** The card placement check measured straight-line distance from the camera. Cards stand beside the goal at about 100 cm horizontally but lower than the eyes, so the test now checks horizontal distance (80 to 120 cm) and direction toward the goal.
9. **C7: the arrow would not hide while "looking at the step".** There were two causes:
   - The current phrase sat about 48 degrees below eye level with the brief's defaults, so a level camera did not see it. At first the test aimed the camera down at the step. After the design fix below (12.11.2026) the test uses a level camera that faces the step, the way a user stands.
   - In preview, DeviceTracking rewrites the camera pose every frame, so the test's head turns were undone. The test now pauses DeviceTracking and puts it back in `finally`.
   No Lens code was changed.
10. **IK test: "Object is null" from the cursor update.** This is the same destroyed-button case as problem 4, and it got the same narrow wrapper.

No Lens code was changed to make a test pass. The only Lens fix (problem 7) was a real bug a user would have seen.

## Logic proven / feel unproven

**Logic proven** (tests and preview):
- Ladder layout and the rise per step, the goal at about 110 cm and the stand-in floor at 150 cm.
- Picking 3 of 6 tiles, highlighting and the step order.
- The breathing phases, the 3 rounds, and Done and Not yet showing only after the third round.
- The crumble, waking the next step, and the Not yet split, where both halves carry the phrase and it crumbles fully only after the second half.
- The goal question and cards, and keeping one card.
- The return arrow showing, pointing and hiding.
- Saving, reading back, Restart reopening on the step where the user stopped, and the "You stopped at" text.
- An IK hand reaches the tiles and Done.

**Feel unproven** (only real glasses can tell):
- The ladder lying on a real floor (WorldQueryModule is not used in preview).
- Done by a real step forward.
- Real hand tracking and pinch comfort.
- Text readability on the additive display.
- Comfort over time in the narrow view.

## Design fix: phrase at eye height (12.11.2026, asked for by Aizhan)

**Problem.** With the brief's defaults (floor 150 cm below the eyes, phrase 30 cm above the step), the current phrase, the breathing ring and Done / Not yet sat about 48 degrees below eye level. The brief says "slightly down and ahead". A user looking straight ahead saw the return arrow instead of the phrase.

**Fix.** Aizhan asked to fix it right away ("Но вот здесь ты делаешь замечания по дизайну, подкорректируй его сразу"). The brief file was not edited; this is a deliberate change from its "30 cm above the step" default.
- The steps stay on the floor. Only the current phrase, the ring and Done / Not yet rise to 12 degrees below eye level, standing over their step.
- A thin grey-blue line joins the step to its phrase, so it stays clear which step the phrase belongs to.
- 12 degrees, because the return arrow shows past 14 degrees. With a level head the phrase is in view and the arrow stays hidden.
- The phrase never goes lower than 30 cm above its step (the old rule), so on a short ladder nothing changes.
- New Inspector setting on LadderMain: `phraseGazeDown` (slider 5 to 45 degrees, default 12).

**Gotcha.** Lens Studio recompiled when the file was saved, while the default was still 18, and wrote 18 into the scene. A later change of the default in code did not reach the scene, and C1 failed with "18.0 deg". Fixed by setting the scene value to 12 with VirtualScene and saving the project.

**Tests.** C1 now checks the gaze angle (12.0 degrees in the log), that the phrase stands over its step and that the line exists. C7 now checks that a level head facing the step sees no arrow. All 9 scenarios pass again after the fix.

## Visual check (12.11.2026, Aizhan: «Проверяй сам.»)

I looked at the Lens Preview step by step with panel screenshots (640 px) and fixed what read badly. The brief file was not edited.

1. **Goal too bright during a step.** The glowing goal behind the phrase pulled the eye away. Now it dims to 0.3 while a step is active and comes back to full glow at the goal cards. The "Your goal" label fades out fully.
2. **Breath cue hard to read.** The label is 1.6x larger and on two lines: the phase name, then the round ("Breathe in" over "1/3").
3. **Phrase too small.** The current phrase is 1.6x larger and 56 cm wide.
4. **Done and Not yet cut off.** They sat about 17 degrees below the eyes, past the bottom edge of the Specs view (about 16 degrees), so half the buttons were missing. Now, after the third breathing round, the phrase rises into the ring's place (0.45 s) and the buttons appear right under it.
5. **Button labels tiny and half hidden.** The labels sat inside the 1 cm button body. They now sit at z 0.6, in front of the face, and are sized by their distance from the eyes (Headline1, x1.3), a little smaller than the phrase.
6. **Ring cut through the breath label.** At its smallest (0.6) the ring line crossed "Breathe out". The ring now breathes between 0.72 and 1.12, so the smallest ring still holds the label.

**Tests updated** for the new look, not to hide a bug: C1 checks that the goal dims during a step, C3 reads the two-line labels ("Breathe in\n1/3"), C6 checks that the goal glows fully again at the cards.

## MCP calls

145 Lens Studio MCP calls in total, counted from the session transcript (67 for the build, 16 for the design fix, 62 for the visual check):

| Tool | Calls |
|---|---|
| run_leaf_scenario | 57 |
| RecompileTypeScriptTool | 24 |
| CapturePanelScreenshotTool | 21 |
| QueryRuntimeSceneTool | 10 |
| ExecuteEditorCode | 9 |
| VirtualScene | 9 |
| SearchLensStudioAssetLibrary | 3 |
| ListInstalledPackagesTool | 2 |
| RunAndCollectLogsTool | 2 |
| CaptureRuntimeViewTool | 2 |
| InstallLensStudioPackage | 2 |
| ListAllPanels | 1 |
| PreviewPanelTool | 1 |
| open_leaf_panel | 1 |
| list_leaf_scenarios | 1 |

No curl, fetch or HTTP calls to Lens Studio. `Cache/` was not changed. `.mcp.json` (holds the MCP token) is in `.gitignore`. Nothing was committed or pushed.
