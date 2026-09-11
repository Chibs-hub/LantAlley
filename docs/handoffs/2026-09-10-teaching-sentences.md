# The 160 sentences still to write

Rewritten 2026-09-10, alongside v347. The Inn is finished; the four places
after it are not.

Every episode opens on a word board that names the hour's ten words and marks
the ones the learner has never met as はじめて. The Moonview Inn now teaches
all forty of its words - five on Day 1, thirty-five across its four shifts,
taught a block at a time inside the hour they are needed. The other four
places teach none of theirs: the board names a word as new and the next screen
asks about it under a timer.

| Place | Words with a teaching card | Still to write |
|---|---|---|
| Moonview Inn | 40 | 0 |
| Market | 0 | 40 |
| Tea house | 0 | 40 |
| Station | 0 | 40 |
| Shrine | 0 | 40 |

The engine is generic and finished. A place gets its teaching step by gaining
a `TEACHING` map and a `getTeaching`; `teachBlockIfNeeded` in app.js already
runs the cards for whichever of an hour's words have an entry, block by block,
and needs nothing per place. So this file is the only thing between the other
four places and what the Inn has.

## What a sentence has to do

Two of these are load-bearing rather than preferences. A test enforces both.

- **At least 12 characters.** The catalogue's examples run to a median of nine,
  which is what this replaces: nine characters is a phrase, and a phrase cannot
  show the grammar N2 tests. `MIN_SENTENCE` in `word-teaching.js` is the floor,
  not the target.
- **The sentence must contain the word.** `locate()` matches the authored form
  or a stem of at least two characters, so a conjugated 揃えて matches 揃える.
  **A two-character dictionary form has no usable stem** - 断る leaves only 断,
  and 戻す only 戻 - so if the natural sentence conjugates it, set `focus` to
  the form that actually appears (`focus:"お断り"`, `focus:"戻して"`) and the
  card highlights that instead. Eight of the Inn's forty needed this.

And two that no test can check but the step depends on:

- **A `pattern` is required.** 〜を揃える, 〜を〜に取り替える, 判子を押す. It is
  the part of an N2 word that makes it usable and the part no picture and no
  gloss can carry. A noun's pattern is its collocation, not a case frame.
- **A `target`, the catalogue id.** The card reads its reading and gloss from
  the catalogue, and the check draws its wrong answers from every other word
  the place teaches - so a missing id does not fail, it silently shrinks the
  pool. That was a real bug: before the ids went on the entries, every card in
  the Inn drew its three distractors from the same five Day 1 words.

Three cautions from writing the forty. The catalogue's example is sometimes not
about the word at all - it taught 揃える through an idiom meaning to speak in
unison, and 調整 by tuning a clarinet - so read it before reusing it. The
sentence should sit in the place that teaches it, and in the same scene its
question does: the Inn's 判子 sentence is about the drawer at the front desk
because that is where its question happens. And two words of a place must not
share a gloss, or one card offers the same answer twice with one marked wrong;
a test now checks that for the Inn.

## Where they go

Beside the stage's own data, in a `TEACHING` map keyed by the catalogue's
canonical form, reached by `getTeaching(focusWord)` - see
`n2-home-inn-stage.js`, which is the worked example for all of this. A stage
may also export `getTeachingOrder()` to teach in a different order from the one
it asks in; without one, the shift rotates each block's list so the first word
taught is not the first asked.

**Every sentence in the game so far is a draft by a non-native writer.** The
repository owner is a native speaker and reviews the Japanese directly.

## Moonview Inn - done

Every word all four shifts ask about has a teaching card.

## Market - 40 words still to write

### Episode 1 - 宵の値段 (10 words)

- **値段** (ねだん) - price  `w-nedan`
  - catalogue: 値段聞いた？  [6 chars]
  - sentence:
  - pattern:
- **量る** (はかる) - to measure  `v-hakaru-3`
  - catalogue: 今日から毎日体重量ることにした。  [16 chars]
  - sentence:
  - pattern:
- **袋** (ふくろ) - bag  `w-fukuro`
  - catalogue: 手袋してる？  [6 chars]
  - sentence:
  - pattern:
- **両替** (りょうがえ) - change  `w-ryougae`
  - catalogue: 両替所はどこですか。  [10 chars]
  - sentence:
  - pattern:
- **勘定** (かんじょう) - calculation  `w-kanjou`
  - catalogue: 勘定は勘定。  [6 chars]
  - sentence:
  - pattern:
- **合計** (ごうけい) - sum total  `w-goukei`
  - catalogue: 合計は100だ。  [8 chars]
  - sentence:
  - pattern:
- **順番** (じゅんばん) - turn (in line)  `w-junban`
  - catalogue: やっと順番がきた。  [9 chars]
  - sentence:
  - pattern:
- **売り切れ** (うりきれ) - sold-out  `w-urikire`
  - catalogue: 全部売り切れです。  [9 chars]
  - sentence:
  - pattern:
- **支払う** (しはらう) - to pay  `v-shiharau`
  - catalogue: 小切手で支払う。  [8 chars]
  - sentence:
  - pattern:
- **現金** (げんきん) - cash  `w-genkin`
  - catalogue: 現金な人ね。  [6 chars]
  - sentence:
  - pattern:

### Episode 2 - 品書き (10 words)

- **商品** (しょうひん) - commodity  `w-shouhin`
  - catalogue: 商品に触れるな。  [8 chars]
  - sentence:
  - pattern:
- **配達** (はいたつ) - delivery  `w-haitatsu`
  - catalogue: 配達は有料ですか。  [9 chars]
  - sentence:
  - pattern:
- **交換** (こうかん) - exchange  `w-koukan`
  - catalogue: 誰と誰を交換する？  [9 chars]
  - sentence:
  - pattern:
- **倉庫** (そうこ) - storehouse  `w-souko`
  - catalogue: その倉庫は麻薬密売者の隠れみのだった。  [19 chars]
  - sentence:
  - pattern:
- **有料** (ゆうりょう) - admission-paid  `w-yuuryou`
  - catalogue: 配達は有料ですか。  [9 chars]
  - sentence:
  - pattern:
- **番地** (ばんち) - house number  `w-banchi`
  - catalogue: アウグスタ通りの３３７番地に住んでいます。  [21 chars]
  - sentence:
  - pattern:
- **予算** (よさん) - estimate  `w-yosan`
  - catalogue: 予算案は上院を通過した。  [12 chars]
  - sentence:
  - pattern:
- **割引** (わりびき) - discount  `w-waribiki`
  - catalogue: 学生割引はありますか。  [11 chars]
  - sentence:
  - pattern:
- **計算** (けいさん) - calculation  `w-keisan`
  - catalogue: 計算機使えば。  [7 chars]
  - sentence:
  - pattern:
- **種類** (しゅるい) - variety  `w-shurui`
  - catalogue: これは珍しい種類の魚です。  [13 chars]
  - sentence:
  - pattern:

### Episode 3 - 人の波 (10 words)

- **混雑** (こんざつ) - confusion  `w-konzatsu`
  - catalogue: 食堂は混雑していた。  [10 chars]
  - sentence:
  - pattern:
- **行列** (ぎょうれつ) - (1) line  `w-gyouretsu`
  - catalogue: 大行列だな。  [6 chars]
  - sentence:
  - pattern:
- **勧める** (すすめる) - to recommend  `v-susumeru`
  - catalogue: 誰かに自殺を勧めることは犯罪ですか？  [18 chars]
  - sentence:
  - pattern:
- **選択** (せんたく) - selection  `w-sentaku`
  - catalogue: トムは選択した。  [8 chars]
  - sentence:
  - pattern:
- **新鮮** (しんせん) - fresh  `w-shinsen`
  - catalogue: 朝は空気が新鮮だ。  [9 chars]
  - sentence:
  - pattern:
- **豊富** (ほうふ) - abundance  `w-houfu`
  - catalogue: 食物は豊富にある。  [9 chars]
  - sentence:
  - pattern:
- **不足** (ふそく) - insufficiency  `w-fusoku`
  - catalogue: 彼は経験不足だ。  [8 chars]
  - sentence:
  - pattern:
- **抱える** (かかえる) - to hold or carry under or in the arms  `v-kakaeru`
  - catalogue: そのことが我々が抱える問題に新しい面を加える。  [23 chars]
  - sentence:
  - pattern:
- **担ぐ** (かつぐ) - to shoulder  `v-katsugu`
  - catalogue: 俺は家族全員に見送られながら、旅支度を整えたザックを担ぐ。  [29 chars]
  - sentence:
  - pattern:
- **重たい** (おもたい) - heavy  `w-omotai`
  - catalogue: このテーブルは重たい。  [11 chars]
  - sentence:
  - pattern:

### Episode 4 - 店じまい (10 words)

- **余る** (あまる) - to remain  `v-amaru`
  - catalogue: 身に余る栄光。  [7 chars]
  - sentence:
  - pattern:
- **詰める** (つめる) - to pack  `v-tsumeru`
  - catalogue: 彼らは出資を切り詰めるでしょう。  [16 chars]
  - sentence:
  - pattern:
- **積む** (つむ) - to pile up  `v-tsumu`
  - catalogue: 一隻の船に全部を積む冒険をするな。  [17 chars]
  - sentence:
  - pattern:
- **片付く** (かたづく) - to put in order  `v-katazuku`
  - catalogue: 明日までには仕事は片付くよ。  [14 chars]
  - sentence:
  - pattern:
- **破片** (はへん) - fragment  `w-hahen`
  - catalogue: 鏡の破片が床に散乱していた。  [14 chars]
  - sentence:
  - pattern:
- **次第** (しだい) - (1) order  `w-shidai`
  - catalogue: 君次第だよ。  [6 chars]
  - sentence:
  - pattern:
- **払い込む** (はらいこむ) - to deposit  `v-haraikomu`
  - catalogue: (none)  [6 chars]
  - sentence:
  - pattern:
- **程度** (ていど) - degree  `w-teido`
  - catalogue: それは程度の問題です。  [11 chars]
  - sentence:
  - pattern:
- **会計** (かいけい) - account  `w-kaikei`
  - catalogue: 会計監査があった。  [9 chars]
  - sentence:
  - pattern:
- **売れる** (うれる) - to be sold  `v-ureru`
  - catalogue: 傘が良く売れる。  [8 chars]
  - sentence:
  - pattern:

## Tea house - 40 words still to write

### Episode 1 - お運び (10 words)

- **伺う** (うかがう) - (hon) to visit  `w-ukagau`
  - catalogue: あすスミスさんのお宅に伺うことになっている。  [22 chars]
  - sentence:
  - pattern:
- **客席** (きゃくせき) - guest seating  `w-kyakuseki`
  - catalogue: 観客席の最前列に席を予約したわ。  [16 chars]
  - sentence:
  - pattern:
- **注ぐ** (そそぐ) - to pour (into)  `v-sosogu`
  - catalogue: 火に油を注ぐだけだ。  [10 chars]
  - sentence:
  - pattern:
- **こぼす** (こぼす) - to spill  `v-kobosu`
  - catalogue: 僕はもう君がぐちをこぼすのを聞き飽きている。  [22 chars]
  - sentence:
  - pattern:
- **雑巾** (ぞうきん) - house-cloth  `w-zoukin`
  - catalogue: 雑巾とタオルを一緒くたにしてはいけない。  [20 chars]
  - sentence:
  - pattern:
- **拭く** (ふく) - to wipe  `v-fuku`
  - catalogue: 窓を拭くの忘れないでね。  [12 chars]
  - sentence:
  - pattern:
- **献立** (こんだて) - menu  `w-kondate`
  - catalogue: それほど多くの人々のための料理の献立を考えるのはむずかしい。  [30 chars]
  - sentence:
  - pattern:
- **食器** (しょっき) - tableware  `w-shoki`
  - catalogue: 食器を洗おう。  [7 chars]
  - sentence:
  - pattern:
- **追加** (ついか) - addition  `w-tsuika`
  - catalogue: 新しい例文を追加した。  [11 chars]
  - sentence:
  - pattern:
- **恐縮** (きょうしゅく) - shame  `w-kyoushuku`
  - catalogue: ご親切に恐縮しております。  [13 chars]
  - sentence:
  - pattern:

### Episode 2 - 品書きを直す (10 words)

- **茶碗** (ちゃわん) - rice bowl  `w-chawan`
  - catalogue: その茶碗にはひびがある。  [12 chars]
  - sentence:
  - pattern:
- **営業** (えいぎょう) - business  `w-eigyou`
  - catalogue: 私は営業部です。  [8 chars]
  - sentence:
  - pattern:
- **変更** (へんこう) - change  `w-henkou`
  - catalogue: 文を変更しました。  [9 chars]
  - sentence:
  - pattern:
- **清潔** (せいけつ) - clean  `w-seiketsu`
  - catalogue: 私は清潔だ。  [6 chars]
  - sentence:
  - pattern:
- **湯気** (ゆげ) - steam  `w-yuge`
  - catalogue: 薬缶から湯気が立っている。  [13 chars]
  - sentence:
  - pattern:
- **言葉遣い** (ことばづかい) - speech  `w-kotobazukai`
  - catalogue: 言葉遣いの綺麗な人が好きです。  [15 chars]
  - sentence:
  - pattern:
- **順序** (じゅんじょ) - order  `w-junjo`
  - catalogue: 何をするにも順序を踏んでやりなさい。  [18 chars]
  - sentence:
  - pattern:
- **敬語** (けいご) - honorific  `w-keigo`
  - catalogue: 日本語には敬語があります。  [13 chars]
  - sentence:
  - pattern:
- **応対** (おうたい) - receiving  `w-outai`
  - catalogue: その客の応対は私がします。  [13 chars]
  - sentence:
  - pattern:
- **承る** (うけたまわる) - (hum) to hear  `w-uketamawaru`
  - catalogue: (none)  [6 chars]
  - sentence:
  - pattern:

### Episode 3 - 混み合う夕 (10 words)

- **様子** (ようす) - aspect  `w-yousu`
  - catalogue: 様子を見て来て。  [8 chars]
  - sentence:
  - pattern:
- **態度** (たいど) - attitude  `w-taido`
  - catalogue: 彼は態度が粗野だ。  [9 chars]
  - sentence:
  - pattern:
- **笑顔** (えがお) - smiling face  `w-egao`
  - catalogue: 笑顔！笑顔！  [6 chars]
  - sentence:
  - pattern:
- **食欲** (しょくよく) - appetite (for food)  `w-shokuyoku`
  - catalogue: 彼は食欲旺盛だ。  [8 chars]
  - sentence:
  - pattern:
- **苦手** (にがて) - poor (at)  `w-nigate`
  - catalogue: 猫が苦手なの。  [7 chars]
  - sentence:
  - pattern:
- **好み** (このみ) - liking  `w-konomi`
  - catalogue: 好みの問題だ。  [7 chars]
  - sentence:
  - pattern:
- **繰り返す** (くりかえす) - to repeat  `v-kurikaesu`
  - catalogue: 歴史は繰り返す。  [8 chars]
  - sentence:
  - pattern:
- **確かめる** (たしかめる) - to ascertain  `v-tashikameru`
  - catalogue: 私は事の真相を確かめるつもりだ。  [16 chars]
  - sentence:
  - pattern:
- **慎重** (しんちょう) - discretion  `w-shinchou`
  - catalogue: 彼は慎重な選手だ。  [9 chars]
  - sentence:
  - pattern:
- **満足** (まんぞく) - satisfaction  `w-manzoku`
  - catalogue: それで満足？  [6 chars]
  - sentence:
  - pattern:

### Episode 4 - 店を閉める (10 words)

- **汚す** (よごす) - (1) to disgrace  `w-yogosu`
  - catalogue: いくつかの工場は環境を汚す。  [14 chars]
  - sentence:
  - pattern:
- **乾かす** (かわかす) - to dry (clothes  `v-kawakasu`
  - catalogue: 洗濯物を乾かす時間だ。  [11 chars]
  - sentence:
  - pattern:
- **湿る** (しめる) - to be wet  `v-shimeru`
  - catalogue: (none)  [6 chars]
  - sentence:
  - pattern:
- **分ける** (わける) - to divide  `v-wakeru`
  - catalogue: 私は音楽を聞き分ける力がない。  [15 chars]
  - sentence:
  - pattern:
- **配る** (くばる) - to distribute  `v-kubaru`
  - catalogue: あなたが配る番です。  [10 chars]
  - sentence:
  - pattern:
- **盛る** (もる) - (1) to serve (food  `w-moru`
  - catalogue: お刺身を盛るお皿は、どれにする？  [16 chars]
  - sentence:
  - pattern:
- **支度** (したく) - preparation  `w-shitaku`
  - catalogue: 冬支度は万端です！  [9 chars]
  - sentence:
  - pattern:
- **準備** (じゅんび) - preparation  `w-junbi`
  - catalogue: 準備できてる？  [7 chars]
  - sentence:
  - pattern:
- **休憩** (きゅうけい) - rest  `w-kyuukei`
  - catalogue: 休憩したい？  [6 chars]
  - sentence:
  - pattern:
- **当番** (とうばん) - being on duty  `w-touban`
  - catalogue: 誰が当番ですか。  [8 chars]
  - sentence:
  - pattern:

## Station - 40 words still to write

### Episode 1 - 終電まで (10 words)

- **乗客** (じょうきゃく) - passenger  `w-joukyaku`
  - catalogue: 乗客は何人ですか。  [9 chars]
  - sentence:
  - pattern:
- **改札** (かいさつ) - examination of tickets  `w-kaisatsu`
  - catalogue: 改札口で切符をお見せください。  [15 chars]
  - sentence:
  - pattern:
- **方角** (ほうがく) - direction  `w-hougaku`
  - catalogue: セントラルパークはどの方角でしょうか？  [19 chars]
  - sentence:
  - pattern:
- **上り** (のぼり) - up-train (going to Tokyo)  `w-nobori`
  - catalogue: 車は上り坂にかかった。  [11 chars]
  - sentence:
  - pattern:
- **下り** (くだり) - down-train (going away from Tokyo)  `w-kudari`
  - catalogue: 幕が下りた。  [6 chars]
  - sentence:
  - pattern:
- **発車** (はっしゃ) - departure of a vehicle  `w-hasha-2`
  - catalogue: 発車ホームはどちらですか。  [13 chars]
  - sentence:
  - pattern:
- **時刻** (じこく) - instant  `w-jikoku`
  - catalogue: 現在の時刻は？  [7 chars]
  - sentence:
  - pattern:
- **最終** (さいしゅう) - last  `w-saishuu`
  - catalogue: この決定は最終的だ。  [10 chars]
  - sentence:
  - pattern:
- **乗車** (じょうしゃ) - taking a train  `w-jousha`
  - catalogue: ご乗車願います！  [8 chars]
  - sentence:
  - pattern:
- **下車** (げしゃ) - alighting  `w-gesha`
  - catalogue: 次の駅で下車します。  [10 chars]
  - sentence:
  - pattern:

### Episode 2 - 窓口の書き付け (10 words)

- **線路** (せんろ) - line  `w-senro`
  - catalogue: 毎朝線路を横切る。  [9 chars]
  - sentence:
  - pattern:
- **片道** (かたみち) - one-way (trip)  `w-katamichi`
  - catalogue: 運賃は片道1ドルです。  [11 chars]
  - sentence:
  - pattern:
- **手続き** (てつづき) - procedure  `w-tetsuzuki`
  - catalogue: 彼に手続きを説明した。  [11 chars]
  - sentence:
  - pattern:
- **窓口** (まどぐち) - ticket window  `w-madoguchi`
  - catalogue: 会計の窓口はどこですか。  [12 chars]
  - sentence:
  - pattern:
- **通勤** (つうきん) - commuting to work  `w-tsuukin`
  - catalogue: 電車通勤です。  [7 chars]
  - sentence:
  - pattern:
- **記入** (きにゅう) - entry  `w-kinyuu`
  - catalogue: 事務員は原簿に記入した。  [12 chars]
  - sentence:
  - pattern:
- **提出** (ていしゅつ) - presentation  `w-teishutsu`
  - catalogue: 答案を提出せよ。  [8 chars]
  - sentence:
  - pattern:
- **申し込む** (もうしこむ) - to apply for  `v-moushikomu`
  - catalogue: 奨学金を申し込むつもりだよ。  [14 chars]
  - sentence:
  - pattern:
- **日程** (にってい) - agenda  `w-nitei`
  - catalogue: 日程は後日決定いたします。  [13 chars]
  - sentence:
  - pattern:
- **相談** (そうだん) - consultation  `w-soudan`
  - catalogue: 私は姉に相談した。  [9 chars]
  - sentence:
  - pattern:

### Episode 3 - 放送が鳴る (10 words)

- **放送** (ほうそう) - broadcast  `w-housou-2`
  - catalogue: 絶賛放送中！  [6 chars]
  - sentence:
  - pattern:
- **知らせ** (しらせ) - notice  `w-shirase`
  - catalogue: 私に知らせて。  [7 chars]
  - sentence:
  - pattern:
- **逆** (ぎゃく) - reverse  `w-gyaku`
  - catalogue: 帝国の逆襲。  [6 chars]
  - sentence:
  - pattern:
- **間隔** (かんかく) - space  `w-kankaku-2`
  - catalogue: 陣痛の間隔はどれくらいですか。  [15 chars]
  - sentence:
  - pattern:
- **遅刻** (ちこく) - lateness  `w-chikoku`
  - catalogue: 遅刻したね。  [6 chars]
  - sentence:
  - pattern:
- **向かい** (むかい) - facing  `w-mukai`
  - catalogue: 中心街に向かいます。  [10 chars]
  - sentence:
  - pattern:
- **深夜** (しんや) - late at night  `w-shinya`
  - catalogue: 会議は深夜まで続いた。  [11 chars]
  - sentence:
  - pattern:
- **通学** (つうがく) - commuting to school  `w-tsuugaku`
  - catalogue: 彼は徒歩通学だ。  [8 chars]
  - sentence:
  - pattern:
- **確実** (かくじつ) - certainty  `w-kakujitsu`
  - catalogue: 絶対確実だ。  [6 chars]
  - sentence:
  - pattern:
- **案外** (あんがい) - unexpectedly  `w-angai`
  - catalogue: 案外、この本は読みやすいね。  [14 chars]
  - sentence:
  - pattern:

### Episode 4 - 忘れ物 (10 words)

- **預ける** (あずける) - to give into custody  `v-azukeru`
  - catalogue: フロントに預けるといいよ。  [13 chars]
  - sentence:
  - pattern:
- **座席** (ざせき) - seat  `w-zaseki`
  - catalogue: 座席へ戻ろう。  [7 chars]
  - sentence:
  - pattern:
- **届く** (とどく) - to reach  `v-todoku`
  - catalogue: 天井に手が届くんだよ。  [11 chars]
  - sentence:
  - pattern:
- **係** (かかり) - official  `w-kakari`
  - catalogue: 無関係です。  [6 chars]
  - sentence:
  - pattern:
- **付近** (ふきん) - neighbourhood  `w-fukin`
  - catalogue: この付近は駐車禁止です。  [12 chars]
  - sentence:
  - pattern:
- **禁止** (きんし) - prohibition  `w-kinshi`
  - catalogue: 立ち入り禁止。  [7 chars]
  - sentence:
  - pattern:
- **当日** (とうじつ) - appointed day  `w-toujitsu`
  - catalogue: 当日券はありますか。  [10 chars]
  - sentence:
  - pattern:
- **計画** (けいかく) - plan  `w-keikaku`
  - catalogue: 計画はできた。  [7 chars]
  - sentence:
  - pattern:
- **到着** (とうちゃく) - arrival  `w-touchaku`
  - catalogue: 到着します。  [6 chars]
  - sentence:
  - pattern:
- **出発** (しゅっぱつ) - departure  `w-shupatsu`
  - catalogue: 早く出発しよう。  [8 chars]
  - sentence:
  - pattern:

## Shrine - 40 words still to write

### Episode 1 - 宵宮 (10 words)

- **祭** (まつり) - festival  `w-matsuri`
  - catalogue: 祭が終わった。  [7 chars]
  - sentence:
  - pattern:
- **飾り** (かざり) - decoration  `w-kazari`
  - catalogue: 彼は飾り気の無い人だ。  [11 chars]
  - sentence:
  - pattern:
- **点ける** (つける) - to turn on  `v-tsukeru-2`
  - catalogue: (none)  [6 chars]
  - sentence:
  - pattern:
- **明かり** (あかり) - lamplight  `w-akari`
  - catalogue: 明かりを消して。  [8 chars]
  - sentence:
  - pattern:
- **鈴** (すず) - bell  `w-suzu`
  - catalogue: 鈴木と申します。  [8 chars]
  - sentence:
  - pattern:
- **拝む** (おがむ) - to worship  `v-ogamu`
  - catalogue: (none)  [6 chars]
  - sentence:
  - pattern:
- **行事** (ぎょうじ) - event  `w-gyouji`
  - catalogue: これは重要な行事です。  [11 chars]
  - sentence:
  - pattern:
- **定員** (ていいん) - fixed number of regular personnel  `w-teiin`
  - catalogue: このエレベーターの定員は１０人だ。  [17 chars]
  - sentence:
  - pattern:
- **願い** (ねがい) - desire  `w-negai`
  - catalogue: 星に願いを。  [6 chars]
  - sentence:
  - pattern:
- **感謝** (かんしゃ) - thanks  `w-kansha`
  - catalogue: 俺に感謝しろよ。  [8 chars]
  - sentence:
  - pattern:

### Episode 2 - 立て札 (10 words)

- **区域** (くいき) - limits  `w-kuiki`
  - catalogue: ここは立入禁止区域です。  [12 chars]
  - sentence:
  - pattern:
- **欠席** (けっせき) - absence  `w-keseki`
  - catalogue: 会を欠席した。  [7 chars]
  - sentence:
  - pattern:
- **結ぶ** (むすぶ) - to tie  `v-musubu`
  - catalogue: 彼の努力は実を結ぶだろう。  [13 chars]
  - sentence:
  - pattern:
- **竹** (たけ) - bamboo  `w-take`
  - catalogue: 林に竹が目立つ。  [8 chars]
  - sentence:
  - pattern:
- **代理** (だいり) - representation  `w-dairi`
  - catalogue: 彼は父親の代理をした。  [11 chars]
  - sentence:
  - pattern:
- **決まり** (きまり) - settlement  `w-kimari`
  - catalogue: これで決まりだ。  [8 chars]
  - sentence:
  - pattern:
- **提案** (ていあん) - proposal  `w-teian`
  - catalogue: 提案があります。  [8 chars]
  - sentence:
  - pattern:
- **許可** (きょか) - permission  `w-kyoka`
  - catalogue: 許可が必要ですか？  [9 chars]
  - sentence:
  - pattern:
- **順** (じゅん) - order  `w-jun`
  - catalogue: 万事順調だ。  [6 chars]
  - sentence:
  - pattern:
- **打合せ** (うちあわせ) - business meeting  `w-uchiawase`
  - catalogue: (none)  [6 chars]
  - sentence:
  - pattern:

### Episode 3 - 太鼓が鳴る (10 words)

- **太鼓** (たいこ) - drum  `w-taiko`
  - catalogue: 太鼓の音が聞こえる。  [10 chars]
  - sentence:
  - pattern:
- **笛** (ふえ) - flute  `w-fue`
  - catalogue: 合図の笛がなった。  [9 chars]
  - sentence:
  - pattern:
- **響く** (ひびく) - to resound  `v-hibiku`
  - catalogue: 彼はいいね。打てば響くようにすぐ動いてくれるよ。  [24 chars]
  - sentence:
  - pattern:
- **集合** (しゅうごう) - gathering  `w-shuugou`
  - catalogue: 日曜日に集合しよう。  [10 chars]
  - sentence:
  - pattern:
- **位置** (いち) - place  `w-ichi-2`
  - catalogue: 彼の正位置はサードだ。  [11 chars]
  - sentence:
  - pattern:
- **制限** (せいげん) - restriction  `w-seigen`
  - catalogue: 制限はありません。  [9 chars]
  - sentence:
  - pattern:
- **無事** (ぶじ) - safety  `w-buji`
  - catalogue: 無事に便りなし。  [8 chars]
  - sentence:
  - pattern:
- **従う** (したがう) - to abide (by the rules)  `v-shitagau`
  - catalogue: 子供は子宮に従う。  [9 chars]
  - sentence:
  - pattern:
- **担当** (たんとう) - (in) charge  `w-tantou`
  - catalogue: 担当は私です。  [7 chars]
  - sentence:
  - pattern:
- **責任** (せきにん) - duty  `w-sekinin`
  - catalogue: 私の責任です。  [7 chars]
  - sentence:
  - pattern:

### Episode 4 - 後始末 (10 words)

- **燃やす** (もやす) - to burn  `v-moyasu`
  - catalogue: 石炭や石油やガスを燃やすと、様々なガスが発生する。  [25 chars]
  - sentence:
  - pattern:
- **炎** (ほのお) - flame  `w-honoo`
  - catalogue: 船が炎上した。  [7 chars]
  - sentence:
  - pattern:
- **煙** (けむり) - smoke  `w-kemuri`
  - catalogue: 煙でむせた。  [6 chars]
  - sentence:
  - pattern:
- **灰** (はい) - ash  `w-hai`
  - catalogue: 灰色が好き。  [6 chars]
  - sentence:
  - pattern:
- **掃く** (はく) - to sweep  `v-haku`
  - catalogue: 台所をきれいに掃くのを忘れないように。  [19 chars]
  - sentence:
  - pattern:
- **散らかる** (ちらかる) - to be in disorder  `v-chirakaru`
  - catalogue: (none)  [6 chars]
  - sentence:
  - pattern:
- **解散** (かいさん) - breakup  `w-kaisan`
  - catalogue: 議会は解散した。  [8 chars]
  - sentence:
  - pattern:
- **夜明け** (よあけ) - dawn  `w-yoake`
  - catalogue: 夜明け前が一番暗い。  [10 chars]
  - sentence:
  - pattern:
- **伝統** (でんとう) - tradition  `w-dentou`
  - catalogue: これは家族の伝統です。  [11 chars]
  - sentence:
  - pattern:
- **役目** (やくめ) - duty  `w-yakume`
  - catalogue: 私の役目も終わりかな。  [11 chars]
  - sentence:
  - pattern:
