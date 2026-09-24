/* Build curriculum-catalog.js from the local OpenJLPT files plus the project
 * supplement.
 *
 * Why a build step rather than parsing JSON at runtime: the game must work from
 * file://, where fetch() of a sibling JSON is blocked. Every other data file in
 * this project is a script that assigns to `self` for the same reason.
 *
 * Measured facts this script relies on (see PROJECT-HANDOFF.md):
 *   - n2 and n3 do not overlap; 3,577 unique words combined.
 *   - 294 of n2's 295 blank readings are kana headwords that are their own
 *     reading. Excluding them would drop a sixth of the vocabulary.
 *   - Every example sentence contains its headword exactly, so cloze cards
 *     need no fuzzy matching.
 *
 * Usage: node research/build-n2-catalog.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const read = (rel) => JSON.parse(readFileSync(new URL(rel, ROOT), "utf8"));

const KANJI = /[\u4e00-\u9fff]/;
const KANA_ONLY = /^[\u3040-\u30ff\u30fc\u30fb]+$/;

// Hepburn-ish kana to romaji, used only to mint stable ASCII ids.
const ROMA = {
  きゃ:"kya",きゅ:"kyu",きょ:"kyo",しゃ:"sha",しゅ:"shu",しょ:"sho",ちゃ:"cha",ちゅ:"chu",ちょ:"cho",
  にゃ:"nya",にゅ:"nyu",にょ:"nyo",ひゃ:"hya",ひゅ:"hyu",ひょ:"hyo",みゃ:"mya",みゅ:"myu",みょ:"myo",
  りゃ:"rya",りゅ:"ryu",りょ:"ryo",ぎゃ:"gya",ぎゅ:"gyu",ぎょ:"gyo",じゃ:"ja",じゅ:"ju",じょ:"jo",
  びゃ:"bya",びゅ:"byu",びょ:"byo",ぴゃ:"pya",ぴゅ:"pyu",ぴょ:"pyo",
  あ:"a",い:"i",う:"u",え:"e",お:"o",か:"ka",き:"ki",く:"ku",け:"ke",こ:"ko",
  さ:"sa",し:"shi",す:"su",せ:"se",そ:"so",た:"ta",ち:"chi",つ:"tsu",て:"te",と:"to",
  な:"na",に:"ni",ぬ:"nu",ね:"ne",の:"no",は:"ha",ひ:"hi",ふ:"fu",へ:"he",ほ:"ho",
  ま:"ma",み:"mi",む:"mu",め:"me",も:"mo",や:"ya",ゆ:"yu",よ:"yo",
  ら:"ra",り:"ri",る:"ru",れ:"re",ろ:"ro",わ:"wa",を:"o",ん:"n",
  が:"ga",ぎ:"gi",ぐ:"gu",げ:"ge",ご:"go",ざ:"za",じ:"ji",ず:"zu",ぜ:"ze",ぞ:"zo",
  だ:"da",ぢ:"ji",づ:"zu",で:"de",ど:"do",ば:"ba",び:"bi",ぶ:"bu",べ:"be",ぼ:"bo",
  ぱ:"pa",ぴ:"pi",ぷ:"pu",ぺ:"pe",ぽ:"po",っ:"",ー:"",
};
const kataToHira = (s) => s.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
function romaji(kana) {
  const hira = kataToHira(kana);
  let out = "";
  for (let i = 0; i < hira.length; i++) {
    const pair = hira.slice(i, i + 2);
    if (ROMA[pair] !== undefined) { out += ROMA[pair]; i++; continue; }
    out += ROMA[hira[i]] !== undefined ? ROMA[hira[i]] : "";
  }
  return out.replace(/[^a-z]/g, "") || "x";
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  // The source stores lists as Python-style literals.
  try {
    return JSON.parse(value.replace(/'/g, '"'));
  } catch {
    return [];
  }
}

function inferType(meanings) {
  const first = String(meanings[0] || "").toLowerCase();
  if (first.startsWith("to ")) return "verb";
  if (first.startsWith("-") || /\bly\b/.test(first)) return "adverb";
  return "word";
}

const PARTITIONS = ["home-inn", "market", "tea-house", "station", "shrine"];

// A story episode teaches about forty words. Those words are pinned to the
// place that teaches them, because the alternative is writing a market scene
// around whichever words the round-robin happened to deal it - the market
// partition held 血液, 競馬 and 国籍. Coverage is a property of the practice
// pool, not of which forty words a story happens to use, so pinning costs
// nothing and makes the Japanese a great deal better.
const PINNED = new Map();
{
  const table = JSON.parse(readFileSync(new URL("research/authored-targets.json", ROOT), "utf8"));
  for (const partition of PARTITIONS) {
    for (const word of table[partition] || []) {
      if (PINNED.has(word)) throw new Error(`${word} is pinned to two places`);
      PINNED.set(word, partition);
    }
  }
}

/* The two rows the rule above cannot rescue, corrected by hand.
 *
 * Both are kanji headwords, so there is nothing to derive a reading from, and
 * dropping them would take two ordinary N3 words out of the catalogue. The
 * correction is the reading only - the meanings and the examples are the
 * source's own and stay attributed to it.
 *
 *   暖かい  the source gives "あたたか(い)": the reading is right and the
 *           okurigana is in brackets, which no other row does.
 *   賛成    the source gives "Uӣ[い", which is mojibake. さんせい is the
 *           reading, and n3.json's own example 「大賛成です。」 is read
 *           だいさんせい.
 *
 * Anything added here is a claim about the language, so each line carries the
 * evidence for it. A row that cannot be evidenced belongs in the exclusion
 * list instead, where it is visible.
 */
/* Kana headwords carrying another word's meanings.
 *
 * The same source rows whose reading column holds a part-of-speech marker
 * also, in five cases, hold the meanings of a kanji homophone rather than of
 * the kana word printed as the headword. The practice layer asks "what does
 * this mean" against that field, so each one was a card teaching a false
 * meaning for a word a beginner already knows:
 *
 *   うん   given as "fortune, luck"   - that is 運. うん on its own is "yeah".
 *   はい   given as "wear, put on"    - that is 佩く. はい on its own is "yes".
 *   しまい given as "sisters"          - that is 姉妹. しまい is "the end".
 *   どう   given as "child, servant"  - that is 童. どう on its own is "how".
 *   ね     given as "value, price"    - that is 値, which is read ね and does
 *          mean value; but the catalogue shows headwords in kana only, so the
 *          card is a bare ね, which a learner reads as the particle. Right
 *          about 値 and unanswerable as asked.
 *
 * Dropped rather than repaired: the headword these meanings belong to is not
 * in the row, and writing it in would be authoring a dictionary entry from a
 * guess. They leave through the exclusion list, where they stay visible.
 *
 * The other twelve rows with the same broken reading column are fine on this
 * count - じゅうたん really is a carpet, しまった really is "damn it" - so they
 * stay, with the reading derived from the headword.
 */
const MEANINGS_BELONG_TO_ANOTHER_WORD = new Map([
  ["うん", "meanings are 運's; うん alone is an interjection"],
  ["はい", "meanings are 佩く's; はい alone is an interjection"],
  ["しまい", "meanings are 姉妹's; しまい is the end of something"],
  ["どう", "meanings are 童's; どう alone is an adverb"],
  ["ね", "meanings are 値's, and a kana-only headword reads as the particle"],
]);

const READING_CORRECTIONS = new Map([
  ["暖かい", "あたたかい"],
  ["賛成", "さんせい"],
]);

/* OpenJLPT examples include imported Tatoeba sentences. They are useful source
 * material, but an example is displayed to learners and therefore needs a
 * separate audience check. Keep the vocabulary rows, remove only examples
 * that are sexual, hostile, or needlessly clinical, and repair the five
 * confirmed wording errors below. */
const REMOVED_EXAMPLES = new Set([
  "精液は瓶詰めにする価値はあるよ。",
  "自慰は狂気に繋がる。",
  "神はゲイだ。",
  "さっさと死ね！",
  "おとといきやがれ！",
  "ふざけるな！",
  "排尿障害があります。",
  "私は患者です。",
  "死体はまだ上がらない。",
  "彼は自殺をした。",
  "おまえは首だ。",
]);
/* Some words are valid N2 vocabulary but cannot be shown in a general-audience
 * game without content or register labels. Keep their dictionary rows and
 * omit every imported example until those labels exist in the learning UI. */
const WORDS_WITHOUT_UNLABELLED_EXAMPLES = new Set(["死体", "自殺", "おまえ", "逮捕"]);
const EXAMPLE_CORRECTIONS = new Map([
  ["子供は子宮に従う。", { ja:"子供は親に従う。", en:"Children obey their parents." }],
  ["今日、東京はとても寒く為るでしょう。", { ja:"今日、東京はとても寒くなるでしょう。", en:"Today, Tokyo will get very cold." }],
  ["私は１０ドル紙幣をなくした。", { ja:"私は１０ドル札をなくした。", en:"I lost a ten-dollar bill." }],
  ["クッキーは５歳未満だ。", { ja:"クッキーはまだ５歳になっていない。", en:"Cookie is not yet five years old." }],
  ["私は教授です、いやもっと正確に言えば、助教授です。", { ja:"私は教授です。いや、もっと正確に言えば助教授です。", en:"I'm a professor, or rather an associate professor, to be exact." }],
  ["結婚が聞いてあきれる！", { ja:"そんな言い訳にはあきれる。", en:"That excuse is unbelievable." }],
  ["血液の循環。", { ja:"血液は体の中を循環している。", en:"Blood circulates through the body." }],
  ["酔っ払っておそく家に帰ったかどで、怒った女房は亭主に食ってかかり、箒で亭主をひっぱたいた。", { ja:"玄関を掃除したあと、箒を物置にしまった。", en:"After cleaning the entryway, I put the broom away in the storage room." }],
  ["誰かに自殺を勧めることは犯罪ですか？", { ja:"初めて来た人には、駅前の案内所を勧めている。", en:"I recommend the information center in front of the station to first-time visitors." }],
  ["その倉庫は麻薬密売者の隠れみのだった。", { ja:"お店の荷物は、裏の倉庫にしまってある。", en:"The shop's supplies are stored in the warehouse behind it." }],
  ["これは戦争犯罪だ。", { ja:"警察は犯罪を防ぐために、夜の見回りをしている。", en:"The police patrol at night to prevent crime." }],
  ["トムはしきりに謝った。", { ja:"宿の主人は、遅れて着いた客にしきりに謝った。", en:"The innkeeper repeatedly apologized to the guest who arrived late." }],
  ["トムは結婚指輪をはめるの？", { ja:"祭りの日は、指輪をはめて出かける。", en:"On festival days, I put on a ring before going out." }],
  ["マイクは笑った。", { ja:"案内所のマイクから、次の電車の知らせが流れた。", en:"An announcement about the next train came over the information desk microphone." }],
  ["トム、マラソンで優勝したよ。", { ja:"町のマラソン大会は、川沿いの道を走る。", en:"The town marathon follows the road along the river." }],
  ["トムはメンバーですか？", { ja:"この清掃隊のメンバーを募集している。", en:"We are recruiting members for this cleanup team." }],
  ["メアリーは、鏡に映る自分の姿に目をやった。", { ja:"池に映る灯りがきれいだ。", en:"The lights reflected in the pond are beautiful." }],
  ["メアリーは艶やかな黒髪をしている。", { ja:"店先には、艶のある漆の器が並んでいる。", en:"Glossy lacquerware is displayed in front of the shop." }],
  ["トムは脳外科医だ。", { ja:"外科の受付は二階です。", en:"The surgery department reception is on the second floor." }],
  ["トムは学部卒だ。", { ja:"大学では、文学部で日本語を学んでいる。", en:"I study Japanese in the faculty of literature at university." }],
  ["トムは感激するだろう。", { ja:"客が喜んでくれて、店主は感激した。", en:"The shopkeeper was moved because the guest was pleased." }],
  ["トムの監督です。", { ja:"映画館で、好きな監督の作品を見た。", en:"I saw a film by my favorite director at the cinema." }],
  ["トムは教養がある。", { ja:"図書館で本を読んで、教養を深めている。", en:"I read at the library to broaden my knowledge." }],
  ["トムは賢い。", { ja:"分からないときに尋ねるのは、賢い選択だ。", en:"Asking when you do not understand is a wise choice." }],
  ["トムは顕微鏡が欲しい。", { ja:"学校の理科室で顕微鏡を使った。", en:"I used a microscope in the school science room." }],
  ["トムは高校の後輩です。", { ja:"店の後輩に仕事を教えている。", en:"I am teaching the work to my junior colleague at the shop." }],
  ["トムは社会的交流が苦手だ。", { ja:"祭りでは、町の人と旅人が交流できる。", en:"At the festival, townspeople and travelers can interact." }],
  ["トムは好き嫌いないよ。", { ja:"好き嫌いをせずに、野菜も食べよう。", en:"Try to eat vegetables without being picky." }],
  ["どうにかしてトムを支える。", { ja:"みんなで宿の準備を支えよう。", en:"Let us all support the inn's preparations." }],
  ["電話が鳴る。スーザンは受話器を取り上げる。", { ja:"電話が鳴ったので、店主が受話器を取り上げた。", en:"The phone rang, so the shopkeeper picked up the receiver." }],
  ["トムと連絡が取れる？", { ja:"駅に着いたら、家族と連絡が取れた。", en:"When I arrived at the station, I was able to contact my family." }],
  ["トムは私の助手です。", { ja:"茶屋の主人の助手として、料理を手伝っている。", en:"I help with cooking as the tea house owner's assistant." }],
  ["トムは承認した。", { ja:"計画は町の会議で承認された。", en:"The plan was approved at the town meeting." }],
  ["トムは消防士だ。", { ja:"消防の訓練が、広場で行われている。", en:"A fire service drill is being held in the square." }],
  ["先生はジョンに賞品を与えた。", { ja:"クイズに正解して、小さな賞品をもらった。", en:"I answered the quiz correctly and received a small prize." }],
  ["トム、そこの醤油取って。", { ja:"焼き魚に醤油を少しかける。", en:"I put a little soy sauce on grilled fish." }],
  ["トムは上級のスノーボーダーだ。", { ja:"上級の授業では、長い会話を練習する。", en:"In the advanced class, we practice long conversations." }],
  ["トムは１０月上旬からここにいます。", { ja:"桜は四月上旬に咲き始める。", en:"Cherry blossoms begin to bloom in early April." }],
  ["トムったら、寝間着のまま授業にきたのよ。", { ja:"寝間着のまま、玄関の外に出ないでね。", en:"Do not go outside the entrance in your pajamas." }],
  ["トムが真っ先に着いた。", { ja:"駅に着いたら、真っ先に案内所へ行こう。", en:"When we arrive at the station, let us go to the information center first." }],
  ["トムは真剣だ。", { ja:"宿の仕事について、真剣に考えている。", en:"I am thinking seriously about my work at the inn." }],
  ["トムは大学進学を決意した。", { ja:"高校を卒業したら、進学するか就職するか考える。", en:"After high school graduation, I will consider further study or work." }],
  ["誓うよ、ジョン。", { ja:"二人は神社で、これからも助け合うと誓った。", en:"The two promised at the shrine to continue helping each other." }],
  ["トムは選択した。", { ja:"二つの道から、一つを選択してください。", en:"Please choose one of the two paths." }],
  ["トムの送別会に行くの？", { ja:"春には、町を出る人の送別会を開く。", en:"In spring, we hold farewell parties for people leaving town." }],
  ["トムはとっても頭がいいって、人々は口を揃える。", { ja:"みんなが口を揃えて、その店の料理をほめた。", en:"Everyone praised the shop's food in unison." }],
  ["トムは体育の先生だ。", { ja:"体育の授業で、校庭を走った。", en:"I ran around the schoolyard in physical education class." }],
  ["トムは反対するかもよ。", { ja:"この提案に対する意見を聞かせてください。", en:"Please share your opinion about this proposal." }],
  ["トムは大学院生です。", { ja:"大学院で、日本語教育について研究している。", en:"I research Japanese-language education in graduate school." }],
  ["トムは地質学を専攻してた。", { ja:"海辺の地質を調べる見学会に参加した。", en:"I joined a field trip to study the geology of the coast." }],
  ["トムとは仲良しよ。", { ja:"市場の店主と茶屋の主人は仲良しだ。", en:"The market shopkeeper and tea house owner are close friends." }],
  ["トムに直接言えよ。", { ja:"分からないことは、店員に直接聞いてください。", en:"Please ask a clerk directly about anything you do not understand." }],
  ["トムの専攻は哲学だ。", { ja:"大学で哲学を学んでいる。", en:"I study philosophy at university." }],
  ["トムは鉄道オタクだ。", { ja:"鉄道で旅をすると、景色をゆっくり楽しめる。", en:"When traveling by rail, you can enjoy the scenery slowly." }],
  ["さぁ、トムの登場です。", { ja:"祭りの舞台に、太鼓の演奏者が登場した。", en:"A taiko performer appeared on the festival stage." }],
  ["もうすぐ、トムの貯金が底を突く。", { ja:"旅の途中で、お金が底を突かないように気をつけよう。", en:"Let us be careful not to run out of money during the trip." }],
  ["トムは呑気でマイペースな性格だ。", { ja:"休日は、川辺で呑気に過ごした。", en:"I spent my day off relaxing by the river." }],
  ["トムはインドの農村事情に詳しい。", { ja:"農村では、季節ごとに違う作物が育つ。", en:"Different crops grow in rural villages each season." }],
  ["トムは馬を売買している。", { ja:"この店では、古い本の売買もしている。", en:"This shop also buys and sells old books." }],
  ["トムって、不潔ね。", { ja:"台所を不潔なままにしないでください。", en:"Please do not leave the kitchen unclean." }],
  ["トムと別れるの？", { ja:"駅で友人との別れを惜しんだ。", en:"I was sad to part with a friend at the station." }],
  ["ビルは編集部員です。", { ja:"町の広報誌を編集する仕事をしている。", en:"I work editing the town newsletter." }],
  ["トムは弓矢で魚を捕るのが好きだ。", { ja:"川で魚を捕るには、地域の決まりを守る。", en:"To catch fish in the river, follow the local rules." }],
  ["トムは幼児です。", { ja:"幼児が遊べる場所は、入口の近くです。", en:"The area where young children can play is near the entrance." }],
  ["トムは蝋燭を吹き消した。", { ja:"停電に備えて、蝋燭を用意しておく。", en:"Keep candles ready in case of a power outage." }],
  ["ビルは論争が巧みだ。", { ja:"町の会議では、計画をめぐる論争が続いた。", en:"A debate over the plan continued at the town meeting." }],
  ["明日トムと話し合うよ。", { ja:"困ったことがあれば、みんなで話し合おう。", en:"If there is a problem, let us discuss it together." }],
  ["トムは贅沢三昧だ。", { ja:"旅先で温泉に入るのは、小さな贅沢だ。", en:"Enjoying a hot spring while traveling is a small luxury." }],
]);

function curatedExamples(canonical, value) {
  if (WORDS_WITHOUT_UNLABELLED_EXAMPLES.has(canonical)) return [];
  return parseList(value)
    .filter((example) => example && example.ja && !REMOVED_EXAMPLES.has(example.ja))
    .slice(0, 1)
    .map((example) => ({ ...example, ...(EXAMPLE_CORRECTIONS.get(example.ja) || {}) }));
}

const excluded = [];
const byWord = new Map();

for (const file of ["research/openjlpt/n2.json", "research/openjlpt/n3.json"]) {
  const level = file.includes("n2") ? "N2" : "N3";
  for (const record of read(file)) {
    const raw = String(record.word || "").trim();
    if (!raw) { excluded.push({ word: "(blank)", reason: "record has no word" }); continue; }

    const meanings = parseList(record.meanings).map(String).filter((m) => m.trim());
    if (!meanings.length) { excluded.push({ word: raw, reason: "record has no meaning" }); continue; }

    const parts = raw.split("/").map((p) => p.trim()).filter(Boolean);
    const canonical = parts[0];
    const aliases = parts.slice(1);

    let reading = String(record.reading || "").trim();
    let derivedReading = false;

    /* A reading that is not kana is not a reading.
     *
     * Nineteen source rows carry something else in that column. Most are a
     * part-of-speech marker that leaked out of a neighbouring field - 「うん」
     * is recorded as "（感）", 「だいいち」 as "（副）" - and a few are a gloss
     * rather than a reading: 「じゅうたん」 is given as "（カーペット）".
     * Seventeen of the nineteen are kana headwords, so they fall through to
     * the derivation below and end up reading as themselves, which is right.
     *
     * Taking the column at its word instead put those strings in front of
     * learners: the practice layer asked what 賛成 is read as and marked
     * さんせい wrong, because the answer it held was "Uӣ[い".
     */
    if (MEANINGS_BELONG_TO_ANOTHER_WORD.has(canonical)) {
      excluded.push({ word: canonical, reason: MEANINGS_BELONG_TO_ANOTHER_WORD.get(canonical) });
      continue;
    }

    let readingRepaired = false;
    if (reading && !KANA_ONLY.test(reading)) {
      reading = READING_CORRECTIONS.get(canonical) || "";
      readingRepaired = true;
    }

    if (!reading && KANA_ONLY.test(canonical)) { reading = canonical; derivedReading = true; }
    if (!reading) {
      const reason = KANJI.test(canonical)
        ? "kanji headword with no reading"
        : "headword carries an annotation, so it is neither plain kana nor a kanji word";
      excluded.push({ word: canonical, reason });
      continue;
    }

    if (byWord.has(canonical)) continue;
    byWord.set(canonical, {
      canonical, reading, aliases, meanings,
      examples: curatedExamples(canonical, record.examples),
      level, source: "openjlpt", reviewed: false, derivedReading, readingRepaired,
      hasKanji: KANJI.test(canonical),
      type: inferType(meanings),
    });
  }
}

for (const item of read("research/n2-supplement.json").items) {
  byWord.set(item.canonical, {
    canonical: item.canonical, reading: item.reading, aliases: item.aliases || [],
    meanings: item.meanings, examples: item.examples || [], level: "N2",
    source: "project", reviewed: false, derivedReading: false,
    hasKanji: KANJI.test(item.canonical), type: item.type, id: item.id, note: item.note,
  });
}

// Stable ids. Sorting first keeps ids identical between runs.
const items = [...byWord.values()].sort((a, b) => a.canonical.localeCompare(b.canonical, "ja"));
const used = new Set();

/* An id derived from a reading can be claimed by two words, and the loser
 * takes a "-2" suffix. Which one loses is decided by the order they are named
 * in, and an id is not cosmetic: authored questions name their target by id,
 * and so does every learner's saved progress.
 *
 * 灰 and はい are both read はい. はい carried a broken reading until this
 * build repaired it, so it never competed, and 灰 - the word a shrine question
 * teaches - has always held `w-hai`. Naming the repaired row in sorted order
 * would hand it `w-hai` and quietly turn that question into one about "yes".
 *
 * So a row whose reading this build had to repair is named last. It cannot
 * take an id another word already answers to, and every id that existed
 * before the repair is still the same id afterwards. The repaired rows are
 * the only ones that gain a name they did not have.
 */
const nameFirst = items.filter((item) => !item.readingRepaired);
const nameAfter = items.filter((item) => item.readingRepaired);
for (const item of items) if (item.id) used.add(item.id);
for (const item of [...nameFirst, ...nameAfter]) {
  if (item.id) continue;
  const prefix = item.type === "verb" ? "v" : "w";
  let id = `${prefix}-${romaji(item.reading)}`;
  let n = 2;
  while (used.has(id)) id = `${prefix}-${romaji(item.reading)}-${n++}`;
  item.id = id;
  used.add(item.id);
}

items.forEach((item, index) => {
  // Round-robin so every location gets a comparable mix rather than one
  // location absorbing every word starting with the same kana - except for
  // the words a story episode actually teaches, which belong to their place.
  item.partition = PINNED.get(item.canonical) || PARTITIONS[index % PARTITIONS.length];
});

// `readingRepaired` decides naming order and says nothing about the word, so
// it does not travel into the shipped catalogue.
for (const item of items) delete item.readingRepaired;

/* Sense numbers are the source dictionary's markup, not part of a meaning:
 * 見送る's gloss read "(1) to see off" on the learner's screen. Stripped
 * after ids are minted, because the type - and so the id prefix - is inferred
 * from the raw first meaning and every save names words by id. */
for (const item of items) item.meanings = item.meanings.map((m) => m.replace(/^\(\d+\)\s*/, ""));

/* The sense a place's story uses, named first.
 *
 * Every screen that glosses a word shows its first meaning, and for these the
 * source's first meaning is one the Inn never uses: 確認 as "affirmation",
 * 傷 as "wound" beside a scratched box, 客間 as "parlor", 浴衣 as "bathrobe".
 * The other senses are kept after it. 納める is paying what is owed, the
 * sense its card and Episode 4 both use - not "to obtain". */
const SENSE_FIRST = new Map([
  ["w-kakunin", ["confirmation", "checking", "affirmation"]],
  ["v-osameru-2", ["to pay (a tax or fee)", "to supply", "to accept", "to obtain", "to reap"]],
  ["w-sakujo", ["deletion", "striking out", "erasure", "elimination"]],
  ["w-kizu", ["damage", "scratch", "wound", "injury"]],
  ["v-kasanaru", ["to coincide (at the same time)", "to overlap", "to be piled up"]],
  ["w-kyakuma", ["guest room", "parlor"]],
  ["w-nokori", ["the rest", "what remains", "remnant", "left-over"]],
  ["w-yukata", ["yukata (light cotton kimono)", "informal summer kimono"]],
  ["w-kigen-2", ["mood", "temper", "humour"]],
  ["w-shitei", ["specifying", "setting (a time or place)", "designation"]],
]);
for (const item of items) {
  if (SENSE_FIRST.has(item.id)) item.meanings = SENSE_FIRST.get(item.id);
}

const payload = { items, excluded };
writeFileSync(
  new URL("curriculum-catalog.js", ROOT),
  `/* GENERATED by research/build-n2-catalog.mjs. Do not edit by hand. */\n` +
  `(function(root){\n  "use strict";\n  var DATA = ${JSON.stringify(payload)};\n` +
  readFileSync(new URL("research/catalog-api.js", ROOT), "utf8") +
  `\n  root.LanternCurriculumCatalog = API;\n})(typeof self !== "undefined" ? self : this);\n`,
  "utf8",
);

console.log(`items ${items.length}  excluded ${excluded.length}  supplement ${items.filter((i) => i.source === "project").length}`);
