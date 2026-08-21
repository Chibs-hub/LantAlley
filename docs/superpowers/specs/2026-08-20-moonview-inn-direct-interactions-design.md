# Moonview Inn Direct Interactions Design

## Goal

Turn Moonview Inn from a multiple-choice vocabulary quiz into a small interactive environment where the player demonstrates five N2 actions. Keep the Alley Entrance and Moonview Inn on the open-world map; remove undeveloped destinations from the current build.

## Learning Scope

Each stage teaches five N2 focus words:

- 揃える: arrange matching items.
- 代える: replace one item with another.
- 暖める: warm an object deliberately.
- 調整: coordinate conditions such as schedules.
- 引受る: accept responsibility for a task.

Every word uses a verified N2 near-miss:

- 揃える / 整う
- 代える / 代る
- 暖める / 暖まる
- 調整 / 調節
- 引受る / 引き止める

Near-misses must be plausible but unambiguously wrong in the presented context. Feedback explains the semantic or grammatical distinction.

## Player Experience

Moonview Inn uses one illustrated tatami-room scene. Props and controls change for each encounter while the room remains visually stable. The fox and guest react after the player's action. Correct actions advance automatically after a short reaction. Incorrect actions show a visible consequence, explain the relevant distinction, and reset only the current mechanic.

The first implementation uses HTML, CSS, emoji, and simple shapes. Future raster assets may replace these visuals without changing the interaction contracts.

## Interaction Mechanics

### Arrange: 揃える

The player places two futons and two pillows into matching floor outlines. An item snaps into place only when dropped on its correct target. A completed matching set succeeds. Scattered or unmatched placement demonstrates the near-miss and resets misplaced items.

### Replace: 代える

The player first moves the used towel into a laundry basket, then places a clean towel on the rack. Placing both towels on the rack or moving only the clean towel does not complete the sequence. This makes replacement a two-step action instead of a word choice.

### Warm: 暖める

The player holds a heater control while a temperature gauge rises. Releasing inside the warm target band succeeds. Releasing too early leaves the tea cold; holding too long overheats it. The mechanic distinguishes deliberately warming something from something becoming warm by itself.

### Coordinate: 調整

The player drags two arrival cards along a timeline until their time ranges no longer overlap and both remain inside business hours. Temperature controls are not used because 調節 would also be valid in that context.

### Undertake: 引受る

The player hears an innkeeper request, chooses an appropriate Japanese acceptance response, then carries the luggage to the marked guest room. Selecting a refusal or trying to stop the guest demonstrates a related but wrong action. Both dialogue and physical follow-through are required.

## Learning Phases

### Learn

Each mechanic is demonstrated once with outlines, English meaning, romaji, and a short visual cue. The player then performs it. Learn does not remove lives.

### Practice

Each focus word appears twice in changed conditions, for ten interleaved encounters. English action labels are removed. Written Japanese blanks the target expression so the answer is not copied from the prompt. Correct answers advance automatically. Incorrect actions give immediate corrective feedback and remain available for retry.

### Challenge

The five mechanics appear twice in a fixed shuffled order, for ten encounters. Instructions are Japanese audio only on the first attempt; romaji, English meanings, outlines, and hints are hidden. The first attempt is scored. Passing requires at least eight correct answers and at least one success for every focus word.

If mastery is not reached, only missed mechanics appear in focused review. The complete challenge then repeats. Learn awards bronze, Practice awards silver, and Challenge mastery awards gold.

## State and Persistence

The game stores, per developed location:

- highest completed phase;
- current phase and encounter index;
- challenge score and correctly recalled words;
- missed challenge mechanics awaiting review;
- awarded medal.

Leaving Moonview Inn and returning resumes at the current phase. Reset Journey clears this state. Existing visited and starred data remain readable; a starred Moonview Inn maps to gold mastery.

## Input and Accessibility

All mechanics support mouse, touch, and keyboard:

- draggable items are also selectable with Enter or Space;
- arrow keys move a selected item or control;
- Enter confirms placement or releases a held control;
- focus indicators remain visible;
- controls have action-oriented accessible labels;
- touch targets are at least 44 by 44 CSS pixels;
- reduced-motion users receive state changes without decorative movement;
- no instruction depends on color alone.

## Architecture

`n2-home-inn-stage.js` owns vocabulary, phase data, near-miss explanations, mechanic definitions, and pure scoring/display helpers.

A new `moonview-inn-interactions.js` owns reusable interaction state and pure completion rules for arrange, replace, warm, coordinate, and undertake. It exposes a browser global for the current single-file application and remains directly testable with Node.

`lantern-alley.html` owns rendering, input event wiring, speech, character reactions, phase transitions, map presentation, and persistence. Existing entrance behavior remains unchanged.

## Error Handling

Invalid drops return the item to its prior position. Incomplete sequences remain playable. Unsupported speech synthesis leaves Japanese text and a replay control available during Learn and Practice. Corrupt saved progress is ignored and replaced with safe defaults. A missing interaction definition shows a readable message and a return-to-map control instead of a blank scene.

## Verification

Automated tests cover:

- each mechanic's success and failure boundaries;
- one N2 near-miss per Practice and Challenge item;
- target words hidden from Practice prompts;
- automatic advancement only after correct completion;
- challenge mastery and focused review;
- phase and progress serialization;
- only Alley Entrance and Moonview Inn appearing on the map;
- preservation of entrance behavior.

Manual visual verification covers mouse, keyboard, touch-sized controls, reduced motion, scene stability, feedback readability, and the full Learn to Practice to Challenge path.
