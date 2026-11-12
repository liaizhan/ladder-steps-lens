# Devpost submission draft: Ladder Steps

Draft, 12.11.2026. Not submitted. Links in [brackets] are filled in before Submit.

**Project name:** Ladder Steps

**Tagline:** Stand at the bottom of your own ladder, breathe through the words that hold you back, and walk to your goal across your floor.

## Who it's for

People, most of them women, who know what they want but feel stuck between where they are now and where they want to be. I am the author of the Ladder method, and Ladder Steps is one exercise from it, built for Spectacles.

## What it does

You start with six large tiles. Each holds a phrase that people often heard as children and believed, such as "You will never make it" or "Rich people are bad people." You pinch the three that sound most like you.

The three tiles become steps. The ladder lies ahead of you and rises away from you: "Me" at the bottom, your goal glowing at the far end at about eye level.

On each step:
1. Only the current phrase shows, 12 degrees below eye level, joined to its step by a thin line.
2. A small ring of light guides three rounds of box breathing: 4 seconds in, 4 hold, 4 out, 4 hold.
3. After the third round, two buttons appear: Done and Not yet.
4. Done makes the phrase crumble and wakes the next step. Not yet splits the step in two, so you can slow down instead of forcing it.

When the last phrase crumbles, the goal glows fully and asks: "What can I do for myself today to get closer to my goal?" You pinch one of three cards, such as "Today: do one thing I usually put off." The card stays by your goal.

Your progress stays on the device. Next time, the ladder opens on the step where you stopped and names it: "You stopped at: Rich people are bad people."

If you turn away, a small arrow points back to your current step.

## Why the obstacles are phrases

In the Ladder method, a phrase becomes a lasting belief when three things meet: the child heard it alone, it touched something vital (safety, the bond with a parent, self-worth), and it came as a surprise. Ladder Steps does not process any of this. It shows the phrase, gives you a pause to breathe, and marks that you worked with it.

## Why AR

- On a phone, the ladder is a picture you scroll past. With Spectacles, you stand in front of it in your own room and see your goal ahead of you.
- Your hands and body stay free. You climb step by step and answer with a pinch.
- The view is about 37 by 32 degrees, so a whole ladder never fits at once. Only the current step shows text, the steps rise a little so the path stays in view, and the arrow brings you back if you look away.

## How the skill pack helped me plan

The plan-lens skill interviewed me in Claude Code: 8 questions over about 190 minutes. It turned my idea into an approved design brief with 8 done criteria, each one checkable in the Lens Studio preview.

The interview changed the Lens in three ways:
- The obstacles became phrases other people said, which is how I work in the Ladder method, instead of general labels like "no time."
- Every Done can also be a pinch, so the demo never depends on detecting a step in the preview.
- A preview-only Restart button shows the "open where you stopped" moment, because memory between sessions can't run in the preview.

The brief is `devpost/design-brief.md`.

## How I built it

Claude Code built the Lens in Lens Studio 5.23.2 with CLAD and the Lens Studio MCP, using Spectacles Interaction Kit and UI Kit for every pinch.

- 145 Lens Studio MCP calls, counted from the session transcript.
- 9 LEAF scenarios: one for each of the 8 done criteria, plus one where an IK hand reaches the tiles and Done. All 9 pass in the preview.
- The tests found one real bug: the card you kept went dark. It is fixed.
- After the build, I asked for one design fix: the phrase sat about 48 degrees below eye level. It now sits at 12 degrees, where you see it with a level head.
- A visual check of the preview made the phrase and breath cue larger and moved Done and Not yet up, because they fell below the bottom edge of the view.

Every prompt is in `PROMPTS.md`, and every step, problem and fix is in `build-log/BUILD-LOG.md`.

## What the preview proves and what it doesn't

Logic proven in the preview: the ladder layout, picking 3 of 6 tiles, the breathing rounds, Done and Not yet, the goal cards, the return arrow, and saving and reopening progress.

Feel unproven, because only real Spectacles can show it:
- The ladder on a real floor. The preview has no floor, so the ladder stands at a fixed height, 150 cm below the eyes.
- Done by a real step forward. The code is there, but the tests use the pinch.
- Real hand tracking, text readability on the display, and comfort over time.

## What I learned

The narrow view shaped every decision. My first Lens put the phrase where you would have to look down, and the buttons fell outside the view. I learned to design around where the eyes rest, to show one thing at a time, and to say clearly which parts a test proves and which parts only real glasses can.

## Note

Ladder Steps is a self-reflection exercise from the Ladder method. It is not therapy and does not replace working with a specialist.

**Built with:** Lens Studio, CLAD, Lens Studio MCP, LEAF, Spectacles Interaction Kit, Spectacles UI Kit, Claude Code, Devpost Learn skill pack (plan-lens)

**Video:** [YouTube link]

**Repository:** [GitHub link]
