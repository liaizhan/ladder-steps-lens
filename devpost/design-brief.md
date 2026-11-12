---
status: approved
---

# Design brief: Ladder Steps

<!-- Filled in by plan-lens from the learner's interview. Use the learner's words. Mark any value they didn't choose as (default). -->

**Author:** Aizhan, author of the Ladder method.
**Who it's for:** people, most of them women, who know what they want but feel stuck between where they are now and where they want to be.

**Note:** Ladder Steps is a self-reflection exercise from the Ladder method by its author. It helps you notice the words that stand between you and your goal. It is not therapy and does not replace working with a specialist.

## The one spatial moment
You stand at the bottom of a ladder that runs away from you across your floor. At the bottom is "Me", at your current stage of life; at the far end your goal glows. Between you and the goal stand words other people once said that you believed, often as a child, like "You will never make it." On each step you take three slow breathing rounds, allow yourself not to believe the phrase, and when it no longer carries an emotional charge, it crumbles and the next step wakes up. At the goal you feel that everything is in your hands, you can do it, and you choose one thing to do for yourself today.

Why the obstacles are phrases (the author's method): a phrase becomes a traumatic belief when three things meet. Isolation: the child heard it alone, with no one to share it with. Drama: it touched something vital, like safety, the bond with mom, or self-worth. Surprise: it came unexpectedly, with no time to prepare or make sense of it. The Lens does not process trauma; it shows the phrases, gives a pause, and marks that you worked with them.

## Why it belongs on glasses
- Uses: draws in the world; leaves your body free.
- Why it's better than the phone or laptop version: on a phone the ladder is a picture you scroll past. With glasses you stand in front of it in your own room, see your goal ahead of you, and climb toward it step by step with your hands and body free.

## Product or overlay
- Type: product: the ladder is the experience.
- What the real version would sense: the floor of the user's room (WorldQueryModule), so the ladder lies on it. The user's forward step onto the next step.
- Stand-in for the preview: the preview has no real floor, so the ladder stands at a fixed floor height (default: 150 cm below eye level). Every "Done" can also be given by a pinch on a big Done button, so the flow never depends on detecting a step.

## Where things live
- Where the user is looking during the main task: slightly down and ahead, at the current step and its phrase. Only the current step shows text.
- Phrase picker: 6 large tiles in a 2 x 3 grid, about 100 cm in front of the user, a little below eye level (default), each tile about 30 x 15 cm (default). Shown once at the start.
- Ladder: lies on the floor and rises away from the user. The first step, "Me", is about 60 cm in front of the user's feet (default). Steps are about 60 cm wide and 40 cm apart (default). Each step rises a little higher than the last (default: 8 cm), so the whole path stays inside the narrow view.
- Goal: at the far end of the ladder, glowing, at about 110 cm high (eye level, from the plan). Labelled "Your goal" (default).
- Phrase on the current step: light text floating about 30 cm above the step, facing the user, about 40 cm wide (default).
- Breathing ring: a small ring of light about 15 cm wide, just above the current phrase (default).
- Done and Not yet buttons: two big buttons under the current phrase, about 12 x 6 cm each (default).
- Cards at the goal: the question "What can I do for myself today to get closer to my goal?" and three cards beside the goal, about 100 cm from the user, each about 25 x 12 cm (default).
- Return arrow: a small arrow at the edge of the view that points to the current step when it is out of view.

## Hands and input
- Choose phrases: pinch 3 of the 6 tiles. A chosen tile highlights; after the third pick the tiles fly to the floor and become the steps.
- Done: step forward onto the next step, or pinch the Done button.
- Not yet: pinch the Not yet button. The step splits into two smaller steps.
- Choose today's action: pinch one of the three cards.
- Targets are big and highlight when aimed at.
- Voice: none. No typing anywhere.
- Preview-only Restart button (small, off to the side, clearly labelled for the demo) that restarts the Lens from the beginning without clearing saved progress, so the "open where you stopped" behaviour can be shown.

## When things show
- Phrase tiles: show at the start, hide after the third pick.
- Ladder: appears when the three phrases are chosen; stays lit after the goal is reached.
- Phrase on a step: shows only on the current step; crumbles after Done.
- Breathing ring: shows when the user reaches a step and guides three breathing rounds: 4 s breathe in, 4 s hold, 4 s breathe out, 4 s hold (about 48 s in all). The ring grows on the in-breath, stays on the hold, shrinks on the out-breath (default). It fades after the third round, then Done and Not yet appear.
- Next step: wakes up (lights up) after the previous phrase crumbles.
- Question and cards: show when the last phrase crumbles and the path to the goal is clear; the two cards not chosen fade after a pick, the chosen one stays by the goal.
- On next launch: the ladder opens on the step where the user stopped and names it (for example: "You stopped at: Rich people are bad people").
- If something needs attention out of view: a small arrow points back to the current step.

### Content
Phrases on the tiles (the author's six, shown in English):
1. "You will never make it."
2. "Other people are better than you."
3. "Don't stick out. Be like everyone else."
4. "Rich people are bad people."
5. "Don't take risks. A bird in the hand is worth two in the bush."
6. "First finish your studies, then live and enjoy life."

Question at the goal: "What can I do for myself today to get closer to my goal?"

Cards (pick any one; what matters is doing it today):
1. "Today: write three small steps toward my goal and do the first one right away."
2. "Today: write down one real piece of progress."
3. "Today: do one thing I usually put off."

## Done criteria
Each one can be checked in Lens Studio's preview.
1. The ladder lies ahead and rises away from the user: "Me" at the bottom, the goal glowing at the far end at about 110 cm. In the preview, with no real floor, it stands at the fixed floor height.
2. Six large tiles with the author's phrases are shown; pinching three of them highlights each one, and after the third pick they become the three steps of the ladder in the order chosen.
3. On the current step, a small ring of light guides three breathing rounds (4 s in, 4 s hold, 4 s out, 4 s hold), and Done and Not yet appear only after the third round.
4. Done (pinch on the Done button, or moving forward onto the next step) makes the phrase crumble and wakes up the next step.
5. Not yet splits the current step into two smaller steps, so the ladder has one more step than before.
6. After the last phrase crumbles, the question and three cards appear by the goal; pinching one card keeps it and fades the other two.
7. When the user turns away so the current step is out of view, a small arrow appears and points back to it.
8. Progress is saved to persistent storage (chosen phrases, current step, split steps, chosen card). After the preview Restart button, the ladder opens on the step where the user stopped and names it. A LEAF scenario writes progress to storage and reads it back.

## Out of scope
- Video work-throughs on each phrase or at the goal (next version).
- An AI guide that talks with the user about the situation (next version).
- Typing your own phrase or goal; voice input.
- Processing trauma or any therapy. The Lens shows phrases, gives a pause, and marks the work.
- Real floor detection in the preview.
- Sharing a ladder with another person.

## Risks and open questions
- Memory between sessions can't be shown in Lens Studio's preview. It is checked by a LEAF scenario that writes and reads persistent storage, and shown with the preview-only Restart button.
- Floor detection (WorldQueryModule) only works on real glasses; in the preview the ladder stands at a fixed height. Feel unproven.
- "Done" by stepping forward is only approximated in the preview by moving the camera; the pinch on Done carries the demo and the tests.
- The topic is sensitive: the phrases can bring up painful memories. The Lens is framed as a self-reflection exercise, not therapy, and Not yet lets the user slow down instead of forcing a step.
- The view is narrow (about 37 x 32 degrees), so the whole ladder can't be seen at once; the rising steps and the return arrow are there to keep the current step in view. Comfort over time is feel unproven.
- How a split step shows its phrase (default: both smaller steps carry the same phrase, and it crumbles fully only after the second one is Done).

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
