# The 190 sentences still to write

Rewritten 2026-09-10, alongside v346. Supersedes the 195-word list written for v339.

Every episode in the game opens on a word board that names the hour's ten
words and marks the ones the learner has never met as はじめて. Ten of those
words are taught before the questions start; **190 are not**, and for those the
board still names a word as new and then asks about it under a timer.

| Place | Words with a teaching card | Still to write |
|---|---|---|
| Moonview Inn | 10 (the three days' five, plus Episode 1's five new) | 30 |
| Market | 0 | 40 |
| Tea house | 0 | 40 |
| Station | 0 | 40 |
| Shrine | 0 | 40 |

The engine is done and generic: `startTeaching(loc, entries, handover)` runs the
cards over any list of words, and the episode word board already calls it for
whichever of its words have an entry. A place gets its teaching step by
gaining a `TEACHING` map and a `getTeaching`, nothing more. So this file is the
only thing between the other four places and the same step the Inn has.

## What a sentence has to do

Two of these are load-bearing rather than preferences. A test enforces both.

- **At least 12 characters.** The catalogue's examples run to a median of nine,
  which is what this replaces: nine characters is a phrase, and a phrase cannot
  show the grammar N2 tests. `MIN_SENTENCE` in `word-teaching.js` is the floor,
  not the target.
- **The sentence must contain the word.** `locate()` matches the authored form
  or a stem of at least two characters, so a conjugated 揃えて matches 揃える.
  **A two-character dictionary form has no usable stem** - 断る leaves only 断 -
  so if the natural sentence conjugates it, set `focus` to the form that
  actually appears (`focus:"お断り"`) and the card highlights that instead.

And one that is not enforceable but is the reason the step exists:

- **A `pattern` is required.** 〜を揃える, 〜を〜に取り替える. It is the part of
  an N2 word that makes it usable and the part no picture and no gloss can
  carry.

Three cautions from writing the first ten. The catalogue's example is sometimes
not about the word at all - it taught 揃える through an idiom meaning to speak
in unison, and 調整 by tuning a clarinet - so read it before reusing it. The
sentence should sit in the place that teaches it: an inn word in an inn, a
station word on a platform. And the wrong answers on each card are drawn from
every word the place teaches, so a place with only three entries offers thin
distractors; a full set of ten per episode is what makes the check work.

## Where they go

Beside the stage's own data, in a `TEACHING` map keyed by the catalogue's
canonical form, reached by `getTeaching(focusWord)` - see
`n2-home-inn-stage.js`. A stage that also wants its cards taught in a
different order from its questions exports `getTeachingOrder()`; without one
the episode board rotates the list so the first word taught is not the first
asked.

**Every sentence in the game so far is a draft by a non-native writer.** The
repository owner is a native speaker and reviews the Japanese directly.

## Moonview Inn - 30 words still to write

### Episode 2 - 予約帳 (10 words)

- **書類** (しょるい) - documents
  - catalogue: 私は書類に署名した。  [10 chars]
  - sentence:
  - pattern:
- **報告** (ほうこく) - report
  - catalogue: 報告書をよく調べた。  [10 chars]
  - sentence:
  - pattern:
- **通知** (つうち) - notice
  - catalogue: 通知表はどこなの？  [9 chars]
  - sentence:
  - pattern:
- **判子** (はんこ) - seal (used for signature)
  - catalogue: 私たちの生活には判子が必需品です。  [17 chars]
  - sentence:
  - pattern:
- **郵送** (ゆうそう) - mailing
  - catalogue: 本は郵送しますね。  [9 chars]
  - sentence:
  - pattern:
- **削除** (さくじょ) - elimination
  - catalogue: この文は削除しなさい。  [11 chars]
  - sentence:
  - pattern:
- **延期** (えんき) - postponement
  - catalogue: 決定は延期された。  [9 chars]
  - sentence:
  - pattern:
- **指定** (してい) - designation
  - catalogue: 指定席はありますか。  [10 chars]
  - sentence:
  - pattern:
- **満員** (まんいん) - full house
  - catalogue: バスは満員だった。  [9 chars]
  - sentence:
  - pattern:
- **清書** (せいしょ) - clean copy
  - catalogue: マユコは原稿の清書をした。  [13 chars]
  - sentence:
  - pattern:

### Episode 3 - 戻り客 (10 words)

- **床** (ゆか) - floor
  - catalogue: 床に伏せろ！  [6 chars]
  - sentence:
  - pattern:
- **敷く** (しく) - to spread out
  - catalogue: 私は、ポーチに敷く木製のデッキパネルを購入したいと思います。  [30 chars]
  - sentence:
  - pattern:
- **機嫌** (きげん) - humour
  - catalogue: 機嫌悪いの？  [6 chars]
  - sentence:
  - pattern:
- **重なる** (かさなる) - to be piled up
  - catalogue: 不幸は重なるものだ。  [10 chars]
  - sentence:
  - pattern:
- **扱う** (あつかう) - to handle
  - catalogue: 最高の品を扱う。  [8 chars]
  - sentence:
  - pattern:
- **傷** (きず) - wound
  - catalogue: 霜で花が傷んだ。  [8 chars]
  - sentence:
  - pattern:
- **滞在** (たいざい) - stay
  - catalogue: ご滞在の目的は。  [8 chars]
  - sentence:
  - pattern:
- **事情** (じじょう) - circumstances
  - catalogue: 事情はこの通りです。  [10 chars]
  - sentence:
  - pattern:
- **世話** (せわ) - looking after
  - catalogue: 大きなお世話だ。  [8 chars]
  - sentence:
  - pattern:
- **預かる** (あずかる) - to keep in custody
  - catalogue: 銀行は人の金を預かる。  [11 chars]
  - sentence:
  - pattern:

### Episode 4 - 宿を閉じる (10 words)

- **見送る** (みおくる) - (1) to see off
  - catalogue: 彼らを見送る必要は無い。  [12 chars]
  - sentence:
  - pattern:
- **鍵** (かぎ) - key
  - catalogue: 鍵がないと。  [6 chars]
  - sentence:
  - pattern:
- **残り** (のこり) - remnant
  - catalogue: 残りはとっておけ。  [9 chars]
  - sentence:
  - pattern:
- **納める** (おさめる) - to obtain
  - catalogue: 税金を納めるのは私たちの義務だと思っています。  [23 chars]
  - sentence:
  - pattern:
- **戻す** (もどす) - to restore
  - catalogue: 戻す寸前だった。  [8 chars]
  - sentence:
  - pattern:
- **客間** (きゃくま) - parlor
  - catalogue: 客間に通された。  [8 chars]
  - sentence:
  - pattern:
- **完了** (かんりょう) - completion
  - catalogue: よし！掃討完了！  [8 chars]
  - sentence:
  - pattern:
- **泊める** (とめる) - to give shelter to
  - catalogue: 一晩彼を泊めることができる。  [14 chars]
  - sentence:
  - pattern:
- **浴衣** (ゆかた) - bathrobe
  - catalogue: この浴衣欲しいな。  [9 chars]
  - sentence:
  - pattern:
- **務める** (つとめる) - (1) to serve
  - catalogue: 日本には猫が駅長を務める駅がある。  [17 chars]
  - sentence:
  - pattern:

## Market - 40 words still to write

### Episode 1 - 宵の値段 (10 words)

- **値段** (ねだん) - price
  - catalogue: 値段聞いた？  [6 chars]
  - sentence:
  - pattern:
- **量る** (はかる) - to measure
  - catalogue: 今日から毎日体重量ることにした。  [16 chars]
  - sentence:
  - pattern:
- **袋** (ふくろ) - bag
  - catalogue: 手袋してる？  [6 chars]
  - sentence:
  - pattern:
- **両替** (りょうがえ) - change
  - catalogue: 両替所はどこですか。  [10 chars]
  - sentence:
  - pattern:
- **勘定** (かんじょう) - calculation
  - catalogue: 勘定は勘定。  [6 chars]
  - sentence:
  - pattern:
- **合計** (ごうけい) - sum total
  - catalogue: 合計は100だ。  [8 chars]
  - sentence:
  - pattern:
- **順番** (じゅんばん) - turn (in line)
  - catalogue: やっと順番がきた。  [9 chars]
  - sentence:
  - pattern:
- **売り切れ** (うりきれ) - sold-out
  - catalogue: 全部売り切れです。  [9 chars]
  - sentence:
  - pattern:
- **支払う** (しはらう) - to pay
  - catalogue: 小切手で支払う。  [8 chars]
  - sentence:
  - pattern:
- **現金** (げんきん) - cash
  - catalogue: 現金な人ね。  [6 chars]
  - sentence:
  - pattern:

### Episode 2 - 品書き (10 words)

- **商品** (しょうひん) - commodity
  - catalogue: 商品に触れるな。  [8 chars]
  - sentence:
  - pattern:
- **配達** (はいたつ) - delivery
  - catalogue: 配達は有料ですか。  [9 chars]
  - sentence:
  - pattern:
- **交換** (こうかん) - exchange
  - catalogue: 誰と誰を交換する？  [9 chars]
  - sentence:
  - pattern:
- **倉庫** (そうこ) - storehouse
  - catalogue: その倉庫は麻薬密売者の隠れみのだった。  [19 chars]
  - sentence:
  - pattern:
- **有料** (ゆうりょう) - admission-paid
  - catalogue: 配達は有料ですか。  [9 chars]
  - sentence:
  - pattern:
- **番地** (ばんち) - house number
  - catalogue: アウグスタ通りの３３７番地に住んでいます。  [21 chars]
  - sentence:
  - pattern:
- **予算** (よさん) - estimate
  - catalogue: 予算案は上院を通過した。  [12 chars]
  - sentence:
  - pattern:
- **割引** (わりびき) - discount
  - catalogue: 学生割引はありますか。  [11 chars]
  - sentence:
  - pattern:
- **計算** (けいさん) - calculation
  - catalogue: 計算機使えば。  [7 chars]
  - sentence:
  - pattern:
- **種類** (しゅるい) - variety
  - catalogue: これは珍しい種類の魚です。  [13 chars]
  - sentence:
  - pattern:

### Episode 3 - 人の波 (10 words)

- **混雑** (こんざつ) - confusion
  - catalogue: 食堂は混雑していた。  [10 chars]
  - sentence:
  - pattern:
- **行列** (ぎょうれつ) - (1) line
  - catalogue: 大行列だな。  [6 chars]
  - sentence:
  - pattern:
- **勧める** (すすめる) - to recommend
  - catalogue: 誰かに自殺を勧めることは犯罪ですか？  [18 chars]
  - sentence:
  - pattern:
- **選択** (せんたく) - selection
  - catalogue: トムは選択した。  [8 chars]
  - sentence:
  - pattern:
- **新鮮** (しんせん) - fresh
  - catalogue: 朝は空気が新鮮だ。  [9 chars]
  - sentence:
  - pattern:
- **豊富** (ほうふ) - abundance
  - catalogue: 食物は豊富にある。  [9 chars]
  - sentence:
  - pattern:
- **不足** (ふそく) - insufficiency
  - catalogue: 彼は経験不足だ。  [8 chars]
  - sentence:
  - pattern:
- **抱える** (かかえる) - to hold or carry under or in the arms
  - catalogue: そのことが我々が抱える問題に新しい面を加える。  [23 chars]
  - sentence:
  - pattern:
- **担ぐ** (かつぐ) - to shoulder
  - catalogue: 俺は家族全員に見送られながら、旅支度を整えたザックを担ぐ。  [29 chars]
  - sentence:
  - pattern:
- **重たい** (おもたい) - heavy
  - catalogue: このテーブルは重たい。  [11 chars]
  - sentence:
  - pattern:

### Episode 4 - 店じまい (10 words)

- **余る** (あまる) - to remain
  - catalogue: 身に余る栄光。  [7 chars]
  - sentence:
  - pattern:
- **詰める** (つめる) - to pack
  - catalogue: 彼らは出資を切り詰めるでしょう。  [16 chars]
  - sentence:
  - pattern:
- **積む** (つむ) - to pile up
  - catalogue: 一隻の船に全部を積む冒険をするな。  [17 chars]
  - sentence:
  - pattern:
- **片付く** (かたづく) - to put in order
  - catalogue: 明日までには仕事は片付くよ。  [14 chars]
  - sentence:
  - pattern:
- **破片** (はへん) - fragment
  - catalogue: 鏡の破片が床に散乱していた。  [14 chars]
  - sentence:
  - pattern:
- **次第** (しだい) - (1) order
  - catalogue: 君次第だよ。  [6 chars]
  - sentence:
  - pattern:
- **払い込む** (はらいこむ) - to deposit
  - catalogue: (none)  [6 chars]
  - sentence:
  - pattern:
- **程度** (ていど) - degree
  - catalogue: それは程度の問題です。  [11 chars]
  - sentence:
  - pattern:
- **会計** (かいけい) - account
  - catalogue: 会計監査があった。  [9 chars]
  - sentence:
  - pattern:
- **売れる** (うれる) - to be sold
  - catalogue: 傘が良く売れる。  [8 chars]
  - sentence:
  - pattern:

## Tea house - 40 words still to write

### Episode 1 - お運び (10 words)

- **伺う** (うかがう) - (hon) to visit
  - catalogue: あすスミスさんのお宅に伺うことになっている。  [22 chars]
  - sentence:
  - pattern:
- **客席** (きゃくせき) - guest seating
  - catalogue: 観客席の最前列に席を予約したわ。  [16 chars]
  - sentence:
  - pattern:
- **注ぐ** (そそぐ) - to pour (into)
  - catalogue: 火に油を注ぐだけだ。  [10 chars]
  - sentence:
  - pattern:
- **こぼす** (こぼす) - to spill
  - catalogue: 僕はもう君がぐちをこぼすのを聞き飽きている。  [22 chars]
  - sentence:
  - pattern:
- **雑巾** (ぞうきん) - house-cloth
  - catalogue: 雑巾とタオルを一緒くたにしてはいけない。  [20 chars]
  - sentence:
  - pattern:
- **拭く** (ふく) - to wipe
  - catalogue: 窓を拭くの忘れないでね。  [12 chars]
  - sentence:
  - pattern:
- **献立** (こんだて) - menu
  - catalogue: それほど多くの人々のための料理の献立を考えるのはむずかしい。  [30 chars]
  - sentence:
  - pattern:
- **食器** (しょっき) - tableware
  - catalogue: 食器を洗おう。  [7 chars]
  - sentence:
  - pattern:
- **追加** (ついか) - addition
  - catalogue: 新しい例文を追加した。  [11 chars]
  - sentence:
  - pattern:
- **恐縮** (きょうしゅく) - shame
  - catalogue: ご親切に恐縮しております。  [13 chars]
  - sentence:
  - pattern:

### Episode 2 - 品書きを直す (10 words)

- **茶碗** (ちゃわん) - rice bowl
  - catalogue: その茶碗にはひびがある。  [12 chars]
  - sentence:
  - pattern:
- **営業** (えいぎょう) - business
  - catalogue: 私は営業部です。  [8 chars]
  - sentence:
  - pattern:
- **変更** (へんこう) - change
  - catalogue: 文を変更しました。  [9 chars]
  - sentence:
  - pattern:
- **清潔** (せいけつ) - clean
  - catalogue: 私は清潔だ。  [6 chars]
  - sentence:
  - pattern:
- **湯気** (ゆげ) - steam
  - catalogue: 薬缶から湯気が立っている。  [13 chars]
  - sentence:
  - pattern:
- **言葉遣い** (ことばづかい) - speech
  - catalogue: 言葉遣いの綺麗な人が好きです。  [15 chars]
  - sentence:
  - pattern:
- **順序** (じゅんじょ) - order
  - catalogue: 何をするにも順序を踏んでやりなさい。  [18 chars]
  - sentence:
  - pattern:
- **敬語** (けいご) - honorific
  - catalogue: 日本語には敬語があります。  [13 chars]
  - sentence:
  - pattern:
- **応対** (おうたい) - receiving
  - catalogue: その客の応対は私がします。  [13 chars]
  - sentence:
  - pattern:
- **承る** (うけたまわる) - (hum) to hear
  - catalogue: (none)  [6 chars]
  - sentence:
  - pattern:

### Episode 3 - 混み合う夕 (10 words)

- **様子** (ようす) - aspect
  - catalogue: 様子を見て来て。  [8 chars]
  - sentence:
  - pattern:
- **態度** (たいど) - attitude
  - catalogue: 彼は態度が粗野だ。  [9 chars]
  - sentence:
  - pattern:
- **笑顔** (えがお) - smiling face
  - catalogue: 笑顔！笑顔！  [6 chars]
  - sentence:
  - pattern:
- **食欲** (しょくよく) - appetite (for food)
  - catalogue: 彼は食欲旺盛だ。  [8 chars]
  - sentence:
  - pattern:
- **苦手** (にがて) - poor (at)
  - catalogue: 猫が苦手なの。  [7 chars]
  - sentence:
  - pattern:
- **好み** (このみ) - liking
  - catalogue: 好みの問題だ。  [7 chars]
  - sentence:
  - pattern:
- **繰り返す** (くりかえす) - to repeat
  - catalogue: 歴史は繰り返す。  [8 chars]
  - sentence:
  - pattern:
- **確かめる** (たしかめる) - to ascertain
  - catalogue: 私は事の真相を確かめるつもりだ。  [16 chars]
  - sentence:
  - pattern:
- **慎重** (しんちょう) - discretion
  - catalogue: 彼は慎重な選手だ。  [9 chars]
  - sentence:
  - pattern:
- **満足** (まんぞく) - satisfaction
  - catalogue: それで満足？  [6 chars]
  - sentence:
  - pattern:

### Episode 4 - 店を閉める (10 words)

- **汚す** (よごす) - (1) to disgrace
  - catalogue: いくつかの工場は環境を汚す。  [14 chars]
  - sentence:
  - pattern:
- **乾かす** (かわかす) - to dry (clothes
  - catalogue: 洗濯物を乾かす時間だ。  [11 chars]
  - sentence:
  - pattern:
- **湿る** (しめる) - to be wet
  - catalogue: (none)  [6 chars]
  - sentence:
  - pattern:
- **分ける** (わける) - to divide
  - catalogue: 私は音楽を聞き分ける力がない。  [15 chars]
  - sentence:
  - pattern:
- **配る** (くばる) - to distribute
  - catalogue: あなたが配る番です。  [10 chars]
  - sentence:
  - pattern:
- **盛る** (もる) - (1) to serve (food
  - catalogue: お刺身を盛るお皿は、どれにする？  [16 chars]
  - sentence:
  - pattern:
- **支度** (したく) - preparation
  - catalogue: 冬支度は万端です！  [9 chars]
  - sentence:
  - pattern:
- **準備** (じゅんび) - preparation
  - catalogue: 準備できてる？  [7 chars]
  - sentence:
  - pattern:
- **休憩** (きゅうけい) - rest
  - catalogue: 休憩したい？  [6 chars]
  - sentence:
  - pattern:
- **当番** (とうばん) - being on duty
  - catalogue: 誰が当番ですか。  [8 chars]
  - sentence:
  - pattern:

## Station - 40 words still to write

### Episode 1 - 終電まで (10 words)

- **乗客** (じょうきゃく) - passenger
  - catalogue: 乗客は何人ですか。  [9 chars]
  - sentence:
  - pattern:
- **改札** (かいさつ) - examination of tickets
  - catalogue: 改札口で切符をお見せください。  [15 chars]
  - sentence:
  - pattern:
- **方角** (ほうがく) - direction
  - catalogue: セントラルパークはどの方角でしょうか？  [19 chars]
  - sentence:
  - pattern:
- **上り** (のぼり) - up-train (going to Tokyo)
  - catalogue: 車は上り坂にかかった。  [11 chars]
  - sentence:
  - pattern:
- **下り** (くだり) - down-train (going away from Tokyo)
  - catalogue: 幕が下りた。  [6 chars]
  - sentence:
  - pattern:
- **発車** (はっしゃ) - departure of a vehicle
  - catalogue: 発車ホームはどちらですか。  [13 chars]
  - sentence:
  - pattern:
- **時刻** (じこく) - instant
  - catalogue: 現在の時刻は？  [7 chars]
  - sentence:
  - pattern:
- **最終** (さいしゅう) - last
  - catalogue: この決定は最終的だ。  [10 chars]
  - sentence:
  - pattern:
- **乗車** (じょうしゃ) - taking a train
  - catalogue: ご乗車願います！  [8 chars]
  - sentence:
  - pattern:
- **下車** (げしゃ) - alighting
  - catalogue: 次の駅で下車します。  [10 chars]
  - sentence:
  - pattern:

### Episode 2 - 窓口の書き付け (10 words)

- **線路** (せんろ) - line
  - catalogue: 毎朝線路を横切る。  [9 chars]
  - sentence:
  - pattern:
- **片道** (かたみち) - one-way (trip)
  - catalogue: 運賃は片道1ドルです。  [11 chars]
  - sentence:
  - pattern:
- **手続き** (てつづき) - procedure
  - catalogue: 彼に手続きを説明した。  [11 chars]
  - sentence:
  - pattern:
- **窓口** (まどぐち) - ticket window
  - catalogue: 会計の窓口はどこですか。  [12 chars]
  - sentence:
  - pattern:
- **通勤** (つうきん) - commuting to work
  - catalogue: 電車通勤です。  [7 chars]
  - sentence:
  - pattern:
- **記入** (きにゅう) - entry
  - catalogue: 事務員は原簿に記入した。  [12 chars]
  - sentence:
  - pattern:
- **提出** (ていしゅつ) - presentation
  - catalogue: 答案を提出せよ。  [8 chars]
  - sentence:
  - pattern:
- **申し込む** (もうしこむ) - to apply for
  - catalogue: 奨学金を申し込むつもりだよ。  [14 chars]
  - sentence:
  - pattern:
- **日程** (にってい) - agenda
  - catalogue: 日程は後日決定いたします。  [13 chars]
  - sentence:
  - pattern:
- **相談** (そうだん) - consultation
  - catalogue: 私は姉に相談した。  [9 chars]
  - sentence:
  - pattern:

### Episode 3 - 放送が鳴る (10 words)

- **放送** (ほうそう) - broadcast
  - catalogue: 絶賛放送中！  [6 chars]
  - sentence:
  - pattern:
- **知らせ** (しらせ) - notice
  - catalogue: 私に知らせて。  [7 chars]
  - sentence:
  - pattern:
- **逆** (ぎゃく) - reverse
  - catalogue: 帝国の逆襲。  [6 chars]
  - sentence:
  - pattern:
- **間隔** (かんかく) - space
  - catalogue: 陣痛の間隔はどれくらいですか。  [15 chars]
  - sentence:
  - pattern:
- **遅刻** (ちこく) - lateness
  - catalogue: 遅刻したね。  [6 chars]
  - sentence:
  - pattern:
- **向かい** (むかい) - facing
  - catalogue: 中心街に向かいます。  [10 chars]
  - sentence:
  - pattern:
- **深夜** (しんや) - late at night
  - catalogue: 会議は深夜まで続いた。  [11 chars]
  - sentence:
  - pattern:
- **通学** (つうがく) - commuting to school
  - catalogue: 彼は徒歩通学だ。  [8 chars]
  - sentence:
  - pattern:
- **確実** (かくじつ) - certainty
  - catalogue: 絶対確実だ。  [6 chars]
  - sentence:
  - pattern:
- **案外** (あんがい) - unexpectedly
  - catalogue: 案外、この本は読みやすいね。  [14 chars]
  - sentence:
  - pattern:

### Episode 4 - 忘れ物 (10 words)

- **預ける** (あずける) - to give into custody
  - catalogue: フロントに預けるといいよ。  [13 chars]
  - sentence:
  - pattern:
- **座席** (ざせき) - seat
  - catalogue: 座席へ戻ろう。  [7 chars]
  - sentence:
  - pattern:
- **届く** (とどく) - to reach
  - catalogue: 天井に手が届くんだよ。  [11 chars]
  - sentence:
  - pattern:
- **係** (かかり) - official
  - catalogue: 無関係です。  [6 chars]
  - sentence:
  - pattern:
- **付近** (ふきん) - neighbourhood
  - catalogue: この付近は駐車禁止です。  [12 chars]
  - sentence:
  - pattern:
- **禁止** (きんし) - prohibition
  - catalogue: 立ち入り禁止。  [7 chars]
  - sentence:
  - pattern:
- **当日** (とうじつ) - appointed day
  - catalogue: 当日券はありますか。  [10 chars]
  - sentence:
  - pattern:
- **計画** (けいかく) - plan
  - catalogue: 計画はできた。  [7 chars]
  - sentence:
  - pattern:
- **到着** (とうちゃく) - arrival
  - catalogue: 到着します。  [6 chars]
  - sentence:
  - pattern:
- **出発** (しゅっぱつ) - departure
  - catalogue: 早く出発しよう。  [8 chars]
  - sentence:
  - pattern:

## Shrine - 40 words still to write

### Episode 1 - 宵宮 (10 words)

- **祭** (まつり) - festival
  - catalogue: 祭が終わった。  [7 chars]
  - sentence:
  - pattern:
- **飾り** (かざり) - decoration
  - catalogue: 彼は飾り気の無い人だ。  [11 chars]
  - sentence:
  - pattern:
- **点ける** (つける) - to turn on
  - catalogue: (none)  [6 chars]
  - sentence:
  - pattern:
- **明かり** (あかり) - lamplight
  - catalogue: 明かりを消して。  [8 chars]
  - sentence:
  - pattern:
- **鈴** (すず) - bell
  - catalogue: 鈴木と申します。  [8 chars]
  - sentence:
  - pattern:
- **拝む** (おがむ) - to worship
  - catalogue: (none)  [6 chars]
  - sentence:
  - pattern:
- **行事** (ぎょうじ) - event
  - catalogue: これは重要な行事です。  [11 chars]
  - sentence:
  - pattern:
- **定員** (ていいん) - fixed number of regular personnel
  - catalogue: このエレベーターの定員は１０人だ。  [17 chars]
  - sentence:
  - pattern:
- **願い** (ねがい) - desire
  - catalogue: 星に願いを。  [6 chars]
  - sentence:
  - pattern:
- **感謝** (かんしゃ) - thanks
  - catalogue: 俺に感謝しろよ。  [8 chars]
  - sentence:
  - pattern:

### Episode 2 - 立て札 (10 words)

- **区域** (くいき) - limits
  - catalogue: ここは立入禁止区域です。  [12 chars]
  - sentence:
  - pattern:
- **欠席** (けっせき) - absence
  - catalogue: 会を欠席した。  [7 chars]
  - sentence:
  - pattern:
- **結ぶ** (むすぶ) - to tie
  - catalogue: 彼の努力は実を結ぶだろう。  [13 chars]
  - sentence:
  - pattern:
- **竹** (たけ) - bamboo
  - catalogue: 林に竹が目立つ。  [8 chars]
  - sentence:
  - pattern:
- **代理** (だいり) - representation
  - catalogue: 彼は父親の代理をした。  [11 chars]
  - sentence:
  - pattern:
- **決まり** (きまり) - settlement
  - catalogue: これで決まりだ。  [8 chars]
  - sentence:
  - pattern:
- **提案** (ていあん) - proposal
  - catalogue: 提案があります。  [8 chars]
  - sentence:
  - pattern:
- **許可** (きょか) - permission
  - catalogue: 許可が必要ですか？  [9 chars]
  - sentence:
  - pattern:
- **順** (じゅん) - order
  - catalogue: 万事順調だ。  [6 chars]
  - sentence:
  - pattern:
- **打合せ** (うちあわせ) - business meeting
  - catalogue: (none)  [6 chars]
  - sentence:
  - pattern:

### Episode 3 - 太鼓が鳴る (10 words)

- **太鼓** (たいこ) - drum
  - catalogue: 太鼓の音が聞こえる。  [10 chars]
  - sentence:
  - pattern:
- **笛** (ふえ) - flute
  - catalogue: 合図の笛がなった。  [9 chars]
  - sentence:
  - pattern:
- **響く** (ひびく) - to resound
  - catalogue: 彼はいいね。打てば響くようにすぐ動いてくれるよ。  [24 chars]
  - sentence:
  - pattern:
- **集合** (しゅうごう) - gathering
  - catalogue: 日曜日に集合しよう。  [10 chars]
  - sentence:
  - pattern:
- **位置** (いち) - place
  - catalogue: 彼の正位置はサードだ。  [11 chars]
  - sentence:
  - pattern:
- **制限** (せいげん) - restriction
  - catalogue: 制限はありません。  [9 chars]
  - sentence:
  - pattern:
- **無事** (ぶじ) - safety
  - catalogue: 無事に便りなし。  [8 chars]
  - sentence:
  - pattern:
- **従う** (したがう) - to abide (by the rules)
  - catalogue: 子供は子宮に従う。  [9 chars]
  - sentence:
  - pattern:
- **担当** (たんとう) - (in) charge
  - catalogue: 担当は私です。  [7 chars]
  - sentence:
  - pattern:
- **責任** (せきにん) - duty
  - catalogue: 私の責任です。  [7 chars]
  - sentence:
  - pattern:

### Episode 4 - 後始末 (10 words)

- **燃やす** (もやす) - to burn
  - catalogue: 石炭や石油やガスを燃やすと、様々なガスが発生する。  [25 chars]
  - sentence:
  - pattern:
- **炎** (ほのお) - flame
  - catalogue: 船が炎上した。  [7 chars]
  - sentence:
  - pattern:
- **煙** (けむり) - smoke
  - catalogue: 煙でむせた。  [6 chars]
  - sentence:
  - pattern:
- **灰** (はい) - ash
  - catalogue: 灰色が好き。  [6 chars]
  - sentence:
  - pattern:
- **掃く** (はく) - to sweep
  - catalogue: 台所をきれいに掃くのを忘れないように。  [19 chars]
  - sentence:
  - pattern:
- **散らかる** (ちらかる) - to be in disorder
  - catalogue: (none)  [6 chars]
  - sentence:
  - pattern:
- **解散** (かいさん) - breakup
  - catalogue: 議会は解散した。  [8 chars]
  - sentence:
  - pattern:
- **夜明け** (よあけ) - dawn
  - catalogue: 夜明け前が一番暗い。  [10 chars]
  - sentence:
  - pattern:
- **伝統** (でんとう) - tradition
  - catalogue: これは家族の伝統です。  [11 chars]
  - sentence:
  - pattern:
- **役目** (やくめ) - duty
  - catalogue: 私の役目も終わりかな。  [11 chars]
  - sentence:
  - pattern:
