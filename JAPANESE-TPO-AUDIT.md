# Japanese TPO audit - follow-up

Date: 2026-09-18

## Scope

Reviewed the shipped Japanese interface, story text, contextual title dialogue,
and the generated catalog examples. A sentence was not marked only because it
is uncommon or uses N2 vocabulary. It was marked only when it is fragmentary,
needs a register or content label, is dated without explanation, or does not
fit the place and purpose where a learner sees it.

## TPO result for interface and story text

- The title screen no longer uses the contextless `コンが覚えています` line.
  Its text now states the next meaningful action: begin, resume, continue, go
  to the next place, review, or celebrate completion.
- Stage instructions generally state an actor, task, and immediate next action.
  No additional high-priority interface TPO mismatch was found in this pass.
- Progress counts are secondary to Kon's action prompt, so a learner sees why
  the number matters before seeing the number.

## Catalog findings requiring a later editorial pass

### Label or replace: archaic imperative or proverb presentation

These are real Japanese and the vocabulary stays. They should either be
labelled as written, formal, proverb, or quotation language, or receive a
modern contextual example.

- `w-arayuru`: あらゆる機会を利用せよ。
- `w-ichidoni`: 一度に一事をせよ。
- `w-kanban`: 良酒は看板を要せず。
- `w-jishin`: 汝自身を知れ。
- `w-seihoukei`, `w-toubun`: 正方形を２等分せよ。
- `w-teishutsu`, `w-touan`: 答案を提出せよ。

### Replace or label: dated or marked social register

- `w-nyoubou`: 女房が突然泣き出した。 (`女房` is an older/marked spouse term.)
- `w-suchuwadesu`: 彼はスチュワーデスと結婚した。 (outdated job title.)
- `w-uman`: 彼女はウーマンリブ運動の指導者だと言われている。 (historical
  movement term; needs a history context.)
- `v-nasu`: 彼には為すべきことがたくさんあった。 (`為す` is literary.)

### Replace, label as a sign, or omit as a model sentence

- `w-penki`: ペンキ塗りたて注意
- `w-kouji`, `w-douro`: 「道路工事中」
- `w-shouben`: 「小便が琥珀色だと言われたら、脱水症状だ」
- `w-chie`, `w-takara`: 知恵は万代の宝

The first three are signs or clinical text rather than natural conversation;
the last is proverb-like. They can still teach vocabulary if their presentation
type is shown to the learner.

## Not automatically a problem

The scan found 481 examples beginning with `彼`, `彼女`, `これは`, or `それは`.
They are not automatically generic failures: many are legitimate neutral
grammar models. Do not mass-replace them. Review them in small groups only
when they are attached to a game moment or a target word that needs a richer
setting.

## Next safe pass

Add a presentation label field such as `conversation`, `sign`, `proverb`,
`quotation`, `formal-written`, or `sensitive`. Then replace the entries above
only where the game currently presents them as ordinary conversation.
