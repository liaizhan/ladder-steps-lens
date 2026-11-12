# PROMPTS

Every prompt given to the agent while building Ladder Steps, in order. Skill loads that the agent triggered itself are not prompts and are not listed.

## 0. Planning (before the build)

plan-lens interview: 8 questions, about 190 minutes wall clock (21:41 to 00:52, 11 to 12.11.2026), brief approved.

The result is `devpost/design-brief.md` (status: approved).

## 1. Build task (11.11.2026, 19:55 UTC)

Given to the build agent by Aizhan's main Claude Code session, verbatim:

```text
Task (from the session that started this one):
Background (from the session that started this one):
Aizhan is entering the Devpost "Learn AR with SPECS" round 2, submission planned 04.12.2026 (deadline 07.12). The Lens "Ladder Steps" comes from her Ladder method; she is "author of the Ladder method", never "psychologist". Project: Lens Studio 5.23.2, SPECS Base Template, CLAD plugin installed at project level, lens-studio MCP configured in `.mcp.json`. The plan-lens interview is finished and `devpost/design-brief.md` is approved: ladder on the floor from "Me" to a glowing goal, 6 author phrases (pick 3) become steps, box breathing 4-4-4-4 three times, Done by step or pinch makes the phrase crumble, Not yet splits the step, three "today" cards at the goal, return arrow, progress in persistent storage. Judges value a small UI, only the next step visible, big rare buttons, LEAF tests per done criterion, and a build log plus PROMPTS.md in the repo. She does not know Lens Studio and wants the agent to do everything.

Task:
Work in the project root (Lens Studio has this project open). Read `devpost/design-brief.md` and build it for SPECS. Follow the brief closely. Get the basic flow working first, then add detail. Write and run LEAF tests for each done criterion (there are 8), and tell me which pass.

How to work:
- Use CLAD (ls-clad plugin skills and agents) and the Lens Studio MCP tools only. Never curl/fetch/HTTP to Lens Studio (see `AGENTS.md`). Never modify `Cache/`. Do not put the MCP token from `.mcp.json` into git.
- Do not edit `devpost/design-brief.md` (it is approved). If something in it can't be built, say so and ask.
- Keep a build log in `build-log/` (what was done each step, problems, fixes, number of MCP calls if you can count them).
- Create `PROMPTS.md` at the project root and record every prompt given to the agent, starting with this one. Also add the interview line: "plan-lens interview: 8 questions, about 190 minutes wall clock (21:41 to 00:52, 11 to 12.11.2026), brief approved."
- Criterion 8 (memory between sessions) can't be shown in the preview: test it with a LEAF scenario that writes and reads persistent storage, plus the preview-only Restart button from the brief.
- Do not commit or push. Do not enter passwords.
- Talk to Aizhan in Russian, short, without tables and without the characters "—", "→", "·". She is new to Lens Studio: tell her plainly when something needs her (a click in Lens Studio, an approval).

Done when: the Lens runs in Lens Studio preview, LEAF scenarios exist for all 8 criteria with a pass/fail report, `build-log/` and `PROMPTS.md` are filled.

Shared notes folder for this group of sessions (outside the repo; read siblings' notes there, leave hand-over notes or large findings there instead of pasting them into messages): [local notes folder, path removed]
```

## 2. Aizhan, during the build (11.11.2026, about 20:28 UTC)

```text
завис?
```

("Are you stuck?") The agent answered that it was working: the build was ready, LEAF was installed, and the 8 tests were being written.

## 3. Aizhan, after the report (12.11.2026)

```text
Но вот здесь ты делаешь замечания по дизайну, подкорректируй его сразу.
```

("You make design remarks here, fix the design right away.") This was about the design note in the report: the phrase sat about 48 degrees below eye level. The agent raised the current phrase, ring and Done / Not yet to 12 degrees below eye level, kept the steps on the floor, added a thin line from step to phrase and re-ran all 9 LEAF scenarios (all pass). Details in `build-log/BUILD-LOG.md`, section "Design fix".

## 4. Aizhan, after the design fix (12.11.2026)

```text
Проверяй сам.
```

("Check it yourself.") The agent checked the Lens Preview with screenshots and fixed what read badly: the goal dims during a step, the breath cue and the phrase are larger, Done and Not yet no longer fall below the view, the button labels are readable and the breathing ring no longer cuts its label. Details in `build-log/BUILD-LOG.md`, section "Visual check".
