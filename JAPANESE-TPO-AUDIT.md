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

---

# Follow-up pass - 2026-09-18, v424

A second pass over the *authored* Japanese (the Inn's 40 teaching cards, its
episode prompts, and the interface) rather than the generated catalog, plus a
reachability check on the catalog findings above.

## Errors found and fixed

Each was verified against a source, not asserted from memory.

| # | Where | Was | Now | Why |
|---|---|---|---|---|
| 1 | 案内 teaching card | お客様を…までご案内**してください** | …へご案内**ください** | `ご〜してください` puts 謙譲語 on the listener. `ご案内する` is the speaker's own action, so a request drops the `する`. Documented alongside `ご確認してください` / `お伝えしてください`. The sentence also now shows the `へ` its pattern names. |
| 2 | inn-e04-q08 notice | 茶屋か神社を**ご案内してください** | **ご案内ください** | Same error, second site. |
| 3 | 事情 teaching card | お発ちになるお客様が**います** | **いらっしゃいます** | An honorific verb cannot share a subject with a plain one. The 指定 card beside it already did this correctly. |
| 4 | 納める teaching card | お布団はたたんで押し入れに**納めて** | 今月分の**宿泊税**を…役所に**納めて** | 納める is pay / supply / accept - the catalog teaches it on 税金を納める. A futon into a closet is 収める at best and しまう in practice, so the card taught a sense the word does not carry. |
| 5 | 判子 / 浴衣 cards | patterns 判子を押す / 浴衣を貸す over sentences showing 出す / お返しになる | 判子 sentence now presses it; 浴衣 pattern corrected to 浴衣を返す | A card's pattern has to appear in the sentence under it. 浴衣's sentence is the deliberate keigo fix from "Fix remaining Inn teaching Japanese" and was left alone. |
| 6 | Pet shelf | `1匹いる` for the うぐいす | `1羽いる` | Birds take 羽. Pets carry their own `counter` now. |
| 7 | Dinner task | Ｃ/Ｄ and Ａ/Ｂ in Kon's setup, C/D and A/B on the task screen | half-width in both | The learner was asked to match a letter that was not the same character. |

`お辞儀してください` is **not** error 1 and was left alone: the `お` is part of
the word, not the honorific prefix.

Pinned by new tests in `n2-inn-japanese.test.mjs`, including one that fails on
any full-width Latin letter or digit in the Inn's Japanese.

## Which catalog findings actually reach a learner

The list above says to review entries "only when they are attached to a game
moment". They are, but not all of them. A catalog example is shown in exactly
one place: the cloze card in `catalog-practice.js`, which needs the word to
appear in its own example, to carry kanji, and not to be run into by a
preceding kanji. **2235 of 3574** catalog items clear that and produce a cloze.

Of the 18 entries flagged above, **11 reach the learner and 7 never do**:

| Reaches the learner | Never shown |
|---|---|
| 一度に `（　　）一事をせよ。` **(home-inn)** | あらゆる |
| 為す `彼には（　　）べきことがたくさんあった。` **(home-inn)** | 自身 (preceded by 汝, so the blank is refused) |
| 看板 `良酒は（　　）を要せず。` | スチュワーデス |
| 正方形 `（　　）を２等分せよ。` | ウーマン |
| 等分 `正方形を２（　　）せよ。` | ペンキ |
| 提出 `答案を（　　）せよ。` | 工事 |
| 答案 `（　　）を提出せよ。` | 宝 |
| 女房 `（　　）が突然泣き出した。` | |
| 道路 `「（　　）工事中」` | |
| 小便 `「（　　）が琥珀色だと言われたら、脱水症状だ」` | |
| 知恵 `（　　）は万代の宝` | |

Only **two** are in `home-inn`, the one finished place every learner plays
first: 一度に and 為す. Those two are the whole of the high-priority set.

A sweep of all 2235 reachable cloze prompts for the same patterns found **16**
in total, so the problem is bounded rather than systemic. The sweep also turned
up one the inspection pass missed:

- `w-nagai` 永い: `われわれは一度だけ死ぬ、そしてそんなにも（　　）間死ぬ。`

Several of the sweep's other hits are false positives worth not acting on:
`国立`, `付近`, `夜間` all contain 禁止 but are ordinary modern Japanese, and
`代名詞`, `彫る`, `剃刀`, `溜息` are normal conversation that merely happens to
be quoted.

## Not touched: 106 orphaned voice lines

`audio-index.js` indexes 620 clips. **106 of them key text that no longer
exists anywhere in the source** - the line was edited after the clip was cut.
Both dinner-group lines are among them, diverging on `食事処は` vs `食事処には`,
which is why `pwa.test.mjs`'s two clip assertions fail. That count is identical
before and after this pass. Audio generation is on hold, so this is reported
rather than fixed.
