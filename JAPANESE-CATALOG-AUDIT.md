# Japanese catalog audit

Scope: all 3,302 shipped OpenJLPT/Tatoeba example sentences in `curriculum-catalog.js` (v422). This is an audit report, not an automatic deletion list.

## Decision rule

- **Remove or rewrite**: incorrect Japanese, fragmentary examples, or content that conflicts with a general-audience learning game.
- **Replace in a later content pass**: grammatically valid but generic corpus dialogue that does not fit Lantern Alley.
- **Keep only with context**: real proverbs, quotations, or specialized language that should not be presented as ordinary conversation.

## High-priority actions

Status: completed in the generated catalog. The N2/N3 vocabulary entries were
kept. Seven examples now use safe, complete situations; `死体`, `自殺`, `おまえ`,
and `逮捕` keep their entries without an example until the learning UI can show
an appropriate content or register label.

| ID | Current example | Finding | Recommended action |
| --- | --- | --- | --- |
| `w-akireru` | 結婚が聞いてあきれる！ | The construction is not idiomatic; an exact-web search produced no credible usage. | Replace with a natural example for あきれる, e.g. そんな言い訳にはあきれる。 |
| `w-junkan`, `w-ketsueki` | 血液の循環。 | Noun fragment, not a usable sentence; it is duplicated for two words. | Replace with a complete sentence, e.g. 血液は全身を循環している。 |
| `w-houki` | 酔っ払っておそく家に帰ったかどで、怒った女房は亭主に食ってかかり、箒で亭主をひっぱたいた。 | Dated gendered labels, drinking, domestic violence, and an unnatural scenario for the game. | Remove example. Keep the word 箒. |
| `v-susumeru` | 誰かに自殺を勧めることは犯罪ですか？ | Explicit suicide scenario; unsuitable for general learner content. | Remove example. |
| `w-souko` | その倉庫は麻薬密売者の隠れみのだった。 | Drug-trafficking scenario; unsuitable for general learner content. | Remove example. |
| `w-shitai` | 死体はまだ上がらない。 | Natural in a rescue/news context, but graphic and context-free. | Remove example. |
| `w-jisatsu` | 彼は自殺をした。 | Grammatically valid but distressing, bare, and context-free. | Remove example. |
| `w-hanzai` | これは戦争犯罪だ。 | Grammatically valid but too intense and context-free. | Replace with a neutral crime-related example or remove. |
| `w-omae` | おまえは首だ。 | Abrupt hostile register; not a model learner line without clear register guidance. | Replace with a neutral, labelled rough-register example or remove. |

## Real Japanese, but not everyday conversation

| ID | Current example | Why it needs context |
| --- | --- | --- |
| `w-korosu`, `w-tetsu` | 寸鉄人を殺す。 | A proverb, not modern conversation; it also needs punctuation and an explanation. The dictionary classifies it as a proverb. |
| `w-kanban` | 良酒は看板を要せず。 | Proverb-like, stiff wording; not an ordinary example sentence. A Japanese brewing reference records the related proverb 良い酒に看板要らぬ. |
| `w-jishin` | 汝自身を知れ。 | Classical quotation/imperative, not a modern conversational model. Imidas identifies it as the Socratic saying Know thyself. |
| `w-nyoubou` | 女房が突然泣き出した。 | Grammatically valid, but 女房 is a marked older/informal spouse term; use 妻 in a neutral course unless the register is being taught. |
| `w-abura` | あたし、低脂肪乳ね。 | Natural speech, but strongly character-voiced and context-free. Keep only if the app labels it as casual feminine speech. |

## Generic corpus examples that did not fit Lantern Alley

Status: completed in the generated catalog. The 58 examples below were
linguistically possible, but used placeholder names and gave the app a generic
Tatoeba feel. They now use game-adjacent locations, staff, guests, and ordinary
town situations. The original lines are retained here as an audit trail only.

- `w-shikirini` (しきりに): トムはしきりに謝った。
- `w-hameru` (はめる): トムは結婚指輪をはめるの？
- `w-maiku` (マイク): マイクは笑った。
- `w-marason` (マラソン): トム、マラソンで優勝したよ。
- `w-menba` (メンバー): トムはメンバーですか？
- `v-utsuru` (映る): メアリーは、鏡に映る自分の姿に目をやった。
- `w-tsuya` (艶): メアリーは艶やかな黒髪をしている。
- `w-geka` (外科): トムは脳外科医だ。
- `w-gakubu` (学部): トムは学部卒だ。
- `w-kangeki` (感激): トムは感激するだろう。
- `w-kantoku` (監督): トムの監督です。
- `w-kyouyou` (教養): トムは教養がある。
- `w-kashikoi` (賢い): トムは賢い。
- `w-kenbikyou` (顕微鏡): トムは顕微鏡が欲しい。
- `w-kouhai` (後輩): トムは高校の後輩です。
- `w-kouryuu` (交流): トムは社会的交流が苦手だ。
- `w-sukikirai` (好き嫌い): トムは好き嫌いないよ。
- `v-sasaeru` (支える): どうにかしてトムを支える。
- `v-toriageru` (取り上げる): 電話が鳴る。スーザンは受話器を取り上げる。
- `v-toreru` (取れる): トムと連絡が取れる？
- `w-joshu` (助手): トムは私の助手です。
- `w-shounin-2` (承認): トムは承認した。
- `w-shoubou` (消防): トムは消防士だ。
- `w-shouhin-2` (賞品): 先生はジョンに賞品を与えた。
- `w-shouyu` (醤油): トム、そこの醤油取って。
- `w-joukyuu` (上級): トムは上級のスノーボーダーだ。
- `w-joujun` (上旬): トムは１０月上旬からここにいます。
- `w-nemaki-2` (寝間着): トムったら、寝間着のまま授業にきたのよ。
- `w-masaki` (真っ先): トムが真っ先に着いた。
- `w-shinken` (真剣): トムは真剣だ。
- `w-shingaku` (進学): トムは大学進学を決意した。
- `v-chikau` (誓う): 誓うよ、ジョン。
- `w-sentaku` (選択): トムは選択した。
- `w-soubetsu` (送別): トムの送別会に行くの？
- `v-soroeru` (揃える): トムはとっても頭がいいって、人々は口を揃える。
- `w-taiiku` (体育): トムは体育の先生だ。
- `v-taisuru` (対する): トムは反対するかもよ。
- `w-taiho` (逮捕): トムが逮捕された。
- `w-daigakuin` (大学院): トムは大学院生です。
- `w-chishitsu` (地質): トムは地質学を専攻してた。
- `w-nakayoshi` (仲良し): トムとは仲良しよ。
- `w-chokusetsu` (直接): トムに直接言えよ。
- `w-tetsugaku` (哲学): トムの専攻は哲学だ。
- `w-tetsudou` (鉄道): トムは鉄道オタクだ。
- `w-toujou` (登場): さぁ、トムの登場です。
- `w-tsuku` (突く): もうすぐ、トムの貯金が底を突く。
- `w-nonki` (呑気): トムは呑気でマイペースな性格だ。
- `w-nouson` (農村): トムはインドの農村事情に詳しい。
- `w-baibai` (売買): トムは馬を売買している。
- `w-fuketsu` (不潔): トムって、不潔ね。
- `w-wakare` (別れ): トムと別れるの？
- `w-henshuu` (編集): ビルは編集部員です。
- `v-toru` (捕る): トムは弓矢で魚を捕るのが好きだ。
- `w-youji` (幼児): トムは幼児です。
- `w-rousoku` (蝋燭): トムは蝋燭を吹き消した。
- `w-ronsou` (論争): ビルは論争が巧みだ。
- `v-hanashiau` (話し合う): 明日トムと話し合うよ。
- `w-zeitaku` (贅沢): トムは贅沢三昧だ。

## TPO review rule for all learner-facing Japanese

Before a string is shown, check its time, place, and occasion (TPO): who is
speaking, to whom, what has just happened, and why this wording belongs on that
screen. A grammatically correct sentence still fails review if it leaves its
object, speaker, or situation unstated.

Title-screen follow-up: `こんが覚えています` is not suitable as a standalone
status line. It does not say what Kon remembers or why. Replace it only after
the title screen decides whether it is a welcome, a progress state, or a story
prompt. A concrete progress line could be `こんは、あなたの言葉を覚えています。`
if that is the intended meaning; otherwise use a welcome that matches the
screen's role.

## Sensitive-topic examples needing editorial review

These 33 examples are not automatically wrong. They are grouped because medical, violence, death, alcohol, drugs, or war can be a tone mismatch for a general-audience game. The high-priority rows above are the strongest removal candidates.

- `w-ichi` (いち): 傷ついちゃった？
- `w-i` (胃): 胃が痛みます。
- `w-yakedo` (火傷): 火傷しなかった？
- `v-susumeru` (勧める): 誰かに自殺を勧めることは犯罪ですか？
- `w-kanja` (患者): 患者は退院した。
- `w-kanban` (看板): 良酒は看板を要せず。
- `w-kata` (型): 血液型何型？
- `w-ketsueki` (血液): 血液の循環。
- `v-mimau` (見舞う): 彼らは私を見舞うためにその病院に来てくれた。
- `v-korosu` (殺す): 寸鉄人を殺す。
- `w-shitai` (死体): 死体はまだ上がらない。
- `w-jisatsu` (自殺): 彼は自殺をした。
- `w-shujutsu` (手術): 手術は待てない。
- `w-sake` (酒): 彼は禁酒した。
- `w-sakaba` (酒場): 彼はその酒場で歯医者に成りすましていた。
- `w-junkan` (循環): 血液の循環。
- `w-kizu` (傷): 霜で花が傷んだ。
- `v-you` (酔う): 彼は酔うと手がつけられない。
- `w-yoparai` (酔っ払い): この酔っ払い！
- `w-aojiroi` (青白い): 病気ですか。顔が青白いよ。
- `w-souko` (倉庫): その倉庫は麻薬密売者の隠れみのだった。
- `w-shimo` (霜): 霜で花が傷んだ。
- `w-taiin` (退院): 患者は退院した。
- `w-dankai` (段階): 病気はまだ初期の段階です。
- `w-itami` (痛み): 心が痛みます。
- `w-tetei` (徹底): 殺菌処理を徹底します。
- `w-tetsu` (鉄): 寸鉄人を殺す。
- `w-hanzai` (犯罪): これは戦争犯罪だ。
- `v-arawasu-3` (表す): 酒は本心を表す。
- `v-abareru` (暴れる): お酒を飲んで暴れる人とは一緒に飲みに行きたくない。
- `w-mada` (未だ): 戦争は未だに続いている。
- `w-rengou` (連合): 戦争は連合軍の勝利に終わった。
- `w-houki` (箒): 酔っ払っておそく家に帰ったかどで、怒った女房は亭主に食ってかかり、箒で亭主をひっぱたいた。

## Web checks used for uncertain cases

- 寸鉄人を殺す: https://dictionary.goo.ne.jp/word/%E5%AF%B8%E9%89%84%E4%BA%BA%E3%82%92%E6%AE%BA%E3%81%99/
- 汝自らを知れ: https://imidas.jp/proverb/detail/X-02-C-21-A-0005.html
- 酒に関することわざ: https://www.jstage.jst.go.jp/article/jbrewsocjapan1915/75/11/75_11_910/_pdf
- 血液循環: https://kotobank.jp/word/%E8%A1%80%E6%B6%B2%E5%BE%AA%E7%92%B0-59527

## Recommendation

Do not remove N2 vocabulary simply because it is uncommon. Remove or replace the example sentence when it is inappropriate, generic, fragmentary, archaic without a label, or does not model the target word in a realistic context. The next safe implementation pass is to replace the high-priority rows, then rewrite the placeholder-name lines into Lantern Alley scenes.
