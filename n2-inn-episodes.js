/* Moonview Inn, Episode 1 「宵の一時間」, in the shared episode contract.
 *
 * An episode is not a fourth run at the three days. The days teach five words
 * slowly, with the room in front of you and time to think. An episode is one
 * continuous hour of service: guests arrive, each one is waiting, and every
 * request is answered against a clock. Same inn, different pressure.
 *
 * That is why the questions are timed. The clock is not a quiz gimmick - it is
 * the guest waiting, which is the actual job. For spoken requests the clock
 * starts only when Kon stops talking, so the learner is timed on understanding
 * rather than on listening.
 *
 * The contract's three days become the three parts of the evening, so the shape
 * validates unchanged while reading as one shift.
 */
(function(root){
  "use strict";

  var NOTE = "月見宿・第一話「宵の一時間」";

  // `notes` runs parallel to answer.options: what each choice actually means.
  // Shown when that choice is picked, so a wrong answer teaches the word the
  // learner reached for instead of only saying "not that one".
  function q(id, skill, target, seconds, prompt, answer, feedback, repair, notes){
    return {
      id:id, skill:skill, target:target, slots:[], sourceNote:NOTE,
      seconds:seconds, prompt:prompt, answer:answer, feedback:feedback,
      repair:repair, optionNotes:notes || []
    };
  }

  var episode1 = {
    id:"inn-e01",
    title:"宵の一時間",
    sourceNote:NOTE,
    intro:{jp:"コン：「三日間の練習、お疲れさまでした。今夜はお祭りの前の晩です。お客様が次々にいらっしゃいますから、いよいよ本番です。」", audio:true},
    // Spoken before the first question: the rules of an episode, in Japanese.
    briefing:{
      jp:"コン：「これから一時間、受付を任せます。お客様を待たせないでください。私の話を聞いてから、時間内に答えてください。聞き取れなかったら、スピーカーを押せばもう一度言います。間違えた仕事は、最後にもう一度だけ確認します。」",
      audio:true,
      points:[
        "お客様は待っています。時間内に答えてください。",
        "音声は最後まで聞いてから、時間が始まります。",
        "読む問題は二分あります。短い返事は五秒です。",
        "もう一度聞きたいときは、スピーカーを押してください。",
        "間違えた仕事は、一時間の最後にもう一度出ます。"
      ]
    },
    days:[
      {day:1, mode:"learn", label:"宵の口", questions:[
        q("inn-e01-q01", "quick-response", "w-annai", 8,
          {jp:"二人部屋がひとつ空いています。お客様：「二人ですが、部屋はありますか。」何と言いますか。", audio:true},
          {type:"quick-response", options:["はい、お部屋へご案内します。","いいえ、分かりません。","もう閉まりました。", "お荷物をお預かりします。"], correctIndex:0},
          {correct:"お客様は部屋へ向かいました。「案内する」は、人を連れて行くことです。",
           incorrect:"お客様を待たせてしまいました。まず部屋へご案内します。"},
          {prompt:"「案内する」の意味はどれですか。", options:["連れて行く","片づける"], correctIndex:0, seconds:5},
          [
            "「I will show you to your room」 - guiding the guest there",
            "\"I don’t know\" - leaves the guest standing at the desk",
            "\"We are already closed\" - untrue, the inn is open",
            "holding the luggage - useful later, but it is not an answer to the question asked"
          ]),

        q("inn-e01-q02", "quick-response", "w-chuumon", 8,
          {jp:"お客様：「そろそろ夕食をお願いしたいのですが。」何と言いますか。", audio:true},
          {type:"quick-response", options:["ご注文をうかがいます。","注文は終わりました。","私も知りません。", "お部屋へご案内します。"], correctIndex:0},
          {correct:"注文を受けました。「注文」は、料理や品物を頼むことです。",
           incorrect:"お客様は何も頼めませんでした。まず注文をうかがいます。"},
          {prompt:"料理を頼むことはどれですか。", options:["注文","案内"], correctIndex:0, seconds:5},
          [
            "注文 - taking the guest’s order",
            "\"Orders are finished\" - refuses a guest who can still order",
            "\"I don’t know either\" - gives the guest nothing",
            "案内 - showing them to the room, which has already happened"
          ]),

        q("inn-e01-q03", "listening-task", "v-atatameru-food", 5,
          {jp:"お客様：「このお茶、冷めてしまいました。」", audio:true},
          {type:"single-choice", options:["温めます。","暖めます。","冷やします。", "取り替えます。"], correctIndex:0},
          {correct:"温かいお茶をお出しできました。飲み物には「温める」を使います。",
           incorrect:"「暖める」は部屋や空気に使います。飲み物には「温める」です。"},
          {prompt:"冷めた飲み物はどうしますか。", options:["温める","冷やす"], correctIndex:0, seconds:5},
          [
            "温める - to warm food or drink",
            "暖める - to warm a room or the air, not a drink",
            "冷やす - to chill it, the opposite of what was asked",
            "取り替える - swapping the tea for another cup, which wastes it"
          ])
      ]},

      {day:2, mode:"practice", label:"食事どき", questions:[
        q("inn-e01-q04", "listening-task", "v-torikaeru", 5,
          {jp:"お客様：「タオルが濡れています。」", audio:true},
          {type:"single-choice", options:["新しいタオルに取り替えます。","タオルを温めます。","そのままにします。", "タオルを揃えます。"], correctIndex:0},
          {correct:"新しいタオルをお渡ししました。物を別の物にするのは「取り替える」です。",
           incorrect:"濡れたままでした。同じ種類の新しい物にするのが「取り替える」です。"},
          {prompt:"「取り替える」に近い意味はどれですか。", options:["別の物と交換する","人の代わりをする"], correctIndex:0, seconds:8},
          [
            "取り替える - to swap it for another of the same kind",
            "温める - warming a wet towel does not dry it",
            "leaving it as it is - the guest is still waiting",
            "揃える - lining the towels up neatly, while this one is still wet"
          ]),

        q("inn-e01-q05", "listening-task", "v-soroeru", 5,
          {jp:"お客様：「座布団の大きさがばらばらです。」", audio:true},
          {type:"single-choice", options:["同じ大きさに揃えます。","座布団を片づけます。","座布団を洗います。", "座布団が揃います。"], correctIndex:0},
          {correct:"座布団が同じ大きさになりました。自分の手で同じにするのが「揃える」です。",
           incorrect:"ばらばらのままでした。同じ状態にするのは「揃える」です。"},
          {prompt:"ばらばらの物を同じにすることはどれですか。", options:["揃える","揃う"], correctIndex:0, seconds:5},
          [
            "揃える - to make them match",
            "片づける - clearing them away leaves nowhere to sit",
            "洗う - washing takes hours and fixes nothing",
            "揃う - the cushions matching by themselves, which is not something you do"
          ]),

        q("inn-e01-q06", "reading", "w-souji", 120,
          {jp:"【二階のお知らせ】\n一番　明日の朝十時にご出発\n二番　明日の朝十時にご出発\n三番　先ほどお帰りになりました\n四番　明後日までご滞在\n五番　先ほどお帰りになりました\n六番　工事中（入れません）\n七番　夕方にご到着の予定\n八番　掃除が終わっています\n※お帰りになった部屋だけ、今から掃除します。\n※工事中の部屋と、掃除が終わっている部屋はしません。\n今から掃除をする部屋はどれですか。", audio:false},
          {type:"evidence-choice", options:["三番と五番","一番と二番","三番と五番と六番", "四番と七番"], correctIndex:0},
          {correct:"三番と五番の掃除を始められます。お帰りになった部屋だけを選べました。",
           incorrect:"お帰りになったのは三番と五番だけです。ほかの部屋はまだお客様がいるか、掃除が終わっています。"},
          {prompt:"部屋をきれいにすることはどれですか。", options:["掃除","案内"], correctIndex:0, seconds:5},
          [
            "the two rooms whose guests have already left",
            "these guests do not leave until tomorrow morning",
            "六番 is closed for building work, so it cannot be entered",
            "四番 is still occupied and 七番 has a guest arriving this evening"
          ])
      ]},

      {day:3, mode:"challenge", label:"仕上げ", questions:[
        q("inn-e01-q07", "reading", "w-chousei", 120,
          {jp:"【今夜のご案内】　三番　二名様\n花火　八時から（中庭からご覧になれます）\n夕食　一時間かかります\nお風呂　一時間かかります\n朝食　明日の七時から（一階の広間）\n売店　九時に閉まります\n※お風呂は、夕食が終わってからです。\n※お客様は、花火が始まるまでに夕食とお風呂を終えたいとおっしゃっています。\n夕食は何時に始めればいいですか。", audio:false},
          {type:"evidence-choice", options:["六時","七時","八時", "五時"], correctIndex:0},
          {correct:"六時に始めれば、夕食もお風呂も済ませて花火に間に合います。条件を合わせるのが「調整」です。",
           incorrect:"夕食に一時間、そのあとお風呂に一時間かかります。八時から二時間戻してください。"},
          {prompt:"いくつかの条件を合わせることはどれですか。", options:["調整","調節"], correctIndex:0, seconds:5},
          [
            "two hours before the fireworks: one for dinner, one for the bath",
            "leaves only one hour, so the bath would run into the fireworks",
            "the fireworks would already have started",
            "an hour earlier than needed - everything would finish with time to spare"
          ]),

        q("inn-e01-q08", "listening-point", "w-kakunin", 8,
          {jp:"コン：「三番のお客様は、明日の朝食は要らないとおっしゃっていました。念のため、もう一度……」", audio:true},
          {type:"single-choice", options:["確認します。","注文します。","案内します。", "準備します。"], correctIndex:0},
          {correct:"間違いを防げました。もう一度確かめるのが「確認」です。",
           incorrect:"確かめないままでした。念のため確かめるのは「確認」です。"},
          {prompt:"もう一度確かめることはどれですか。", options:["確認","準備"], correctIndex:0, seconds:5},
          [
            "確認 - checking something once more",
            "注文 - placing an order, but nothing is being ordered",
            "案内 - guiding someone, but nobody needs guiding",
            "準備 - getting things ready, but nothing is being prepared here"
          ]),

        q("inn-e01-q09", "quick-response", "v-hikiukeru", 8,
          {jp:"コン：「明日の朝、駅までお客様を送る仕事があります。お願いできますか。」", audio:true},
          {type:"quick-response", options:["はい、引き受けます。","はい、引き止めます。","はい、引き返します。", "はい、引き出します。"], correctIndex:0},
          {correct:"任せました。責任を持ってやると決めるのが「引き受ける」です。",
           incorrect:"返事になっていません。仕事を自分がやると決めるのが「引き受ける」です。"},
          {prompt:"仕事を自分がやると決めることはどれですか。", options:["引き受ける","引き止める"], correctIndex:0, seconds:5},
          [
            "引き受ける - to take the job on",
            "引き止める - to stop someone from leaving",
            "引き返す - to turn back the way you came",
            "引き出す - to draw something out, such as money"
          ]),

        q("inn-e01-q10", "integrated", "v-kotowaru", 12,
          {jp:"お客様：「今から十人、泊まれますか。」部屋は二つしか空いていません。何と言いますか。", audio:true},
          {type:"quick-response", options:["申し訳ありませんが、お断りします。","はい、大丈夫です。","何も言いません。", "少々お待ちください。"], correctIndex:0},
          {correct:"正直に伝えられました。できないことを丁寧に伝えるのが「断る」です。",
           incorrect:"できない約束をしてしまいました。丁寧に「断る」のも仕事です。"},
          {prompt:"できないと丁寧に伝えることはどれですか。", options:["断る","引き受ける"], correctIndex:0, seconds:5},
          [
            "断る - to refuse politely, which is also part of service",
            "promising rooms that do not exist",
            "saying nothing, which leaves the guest waiting",
            "asking them to wait, which delays an answer that will not change"
          ])
      ]}
    ]
  };


  var NOTE2 = "月見宿・第二話「予約帳」";

  function q2(id, skill, target, seconds, prompt, answer, feedback, repair, notes){
    return {
      id:id, skill:skill, target:target, slots:[], sourceNote:NOTE2,
      seconds:seconds, prompt:prompt, answer:answer, feedback:feedback,
      repair:repair, optionNotes:notes || []
    };
  }

  /* Episode 2 「予約帳」: the morning after, and the four official N2 item types
   * Episode 1 could not carry - 表記, 語形成, 文の組み立て and 文章の文法.
   *
   * They are here rather than in Episode 1 because all four are written
   * Japanese. You cannot hear a spelling, and a sentence you assemble is a
   * sentence you are looking at. Episode 1 is an hour of listening at the
   * counter; this is the paperwork that hour left behind - the book, the
   * notices, the seal - so the item types arrive with the work rather than
   * being bolted onto a shift that was already about speaking.
   *
   * Consequently most prompts here are silent, and the clocks are longer. The
   * exam gives roughly 80 seconds an item, and reading a passage is not a
   * reaction test.
   */
  var episode2 = {
    id:"inn-e02",
    title:"予約帳",
    sourceNote:NOTE2,
    intro:{jp:"コン：「お祭りの夜は終わりました。お客様はまだお休みですが、帳場の仕事は残っています。昨夜は耳の仕事でしたね。今朝は目と手の仕事です。」", audio:true},
    briefing:{
      jp:"コン：「昼までに、この予約帳を正しくしてください。今朝はほとんど声が出ません。漢字の書き方、言葉の形、文の組み立て、そして文章の中の言葉を選びます。読む問題は長いので、時間も長く取ってあります。間違えた仕事は、最後にもう一度だけ確認します。」",
      audio:true,
      points:[
        "今朝は書く仕事です。声はほとんど出ません。",
        "かなで書いてある言葉を、正しい漢字で選びます。",
        "言葉の前や後ろにつく形を選びます。",
        "文を組み立てて、★の場所に入る言葉を選びます。",
        "間違えた仕事は、最後にもう一度出ます。"
      ]
    },
    days:[
      {day:1, mode:"learn", label:"帳場をあける", questions:[

        q2("inn-e02-q01", "orthography", "w-shorui", 20,
          {jp:"帳場の机に、ゆうべの（しょるい）がたまっています。（しょるい）を漢字で書くと、どれになりますか。"},
          {type:"single-choice", options:["署類","書類","諸類","暑類"], correctIndex:1},
          {correct:"「書類」です。書いた紙をまとめて言うときに使います。",
           incorrect:"紙に書いたもののことなので、「書」の字を使います。"},
          {prompt:"「書類」はどれのことですか。", options:["紙に書いたもの","台所の道具"], correctIndex:0, seconds:5},
          [
            "署 is the 署 of 警察署 - an office, not paper",
            "書類 - written papers, the documents on the desk",
            "諸 means various or several, as in 諸国",
            "暑 is the 暑 of hot weather"
          ]),

        q2("inn-e02-q02", "word-formation", "w-houkoku", 20,
          {jp:"ゆうべの部屋のうち、まだ報告を出していないものがあります。「（　　）報告の部屋」の（　　）に入るのはどれですか。"},
          {type:"single-choice", options:["無","未","不","非"], correctIndex:1},
          {correct:"「未報告」です。「未」は、まだそうなっていないことを表します。",
           incorrect:"まだ終わっていない、という意味の形を選びます。"},
          {prompt:"「未」がついた言葉が表すのはどれですか。", options:["まだしていない","二度としない"], correctIndex:0, seconds:8},
          [
            "無 means there is none at all, as in 無料",
            "未 - not yet done, which is what an outstanding report is",
            "不 marks something as lacking or inconvenient, as in 不便",
            "非 marks something as not that kind of thing, as in 非常"
          ]),

        q2("inn-e02-q03", "sentence-building", "w-tsuuchi", 30,
          {jp:"【朝食の時間のお知らせ】\n明日お発ちのお客様に、朝食の時間が変わったことを知らせます。次の文を正しく並べたとき、★に入るのはどれですか。\n明日ご出発のお客様に　＿　＿　★　＿　通知します。"},
          {type:"sentence-order", options:["時間が","ことを","変わった","朝食の"], correctIndex:2},
          {correct:"「朝食の時間が変わったことを通知します」となります。★は「変わった」です。",
           incorrect:"「朝食の」「時間が」「変わった」「ことを」の順に並びます。★は三番目です。"},
          {prompt:"「通知する」はどれのことですか。", options:["知らせる","片づける"], correctIndex:0, seconds:5},
          [
            "時間が is the subject of 変わった, so it belongs second, not at the star",
            "ことを comes last, turning the whole clause into the object",
            "変わった sits third, at the star, saying what happened",
            "朝食の comes first, attaching to 時間"
          ])
      ]},

      {day:2, mode:"practice", label:"書き直し", questions:[

        q2("inn-e02-q04", "orthography", "w-hanko", 20,
          {jp:"帳場の引き出しに、宿の（はんこ）が入っています。（はんこ）を漢字で書くと、どれになりますか。"},
          {type:"single-choice", options:["版子","判子","半子","判紙"], correctIndex:1},
          {correct:"「判子」です。紙に押して、確かにそうだと示すものです。",
           incorrect:"押して確かだと示す道具なので、「判」の字を使います。"},
          {prompt:"「判子」を使うのはどんなときですか。", options:["確かだと示すとき","部屋を掃除するとき"], correctIndex:0, seconds:5},
          [
            "版 is the 版 of a printing plate",
            "判子 - the seal kept in the desk drawer",
            "半 means half",
            "判紙 is not a word; the second character is 子, not 紙"
          ]),

        q2("inn-e02-q05", "word-formation", "w-yuusou", 20,
          {jp:"通知は昨日のうちに出しました。今この通知は、どう書きますか。「郵送（　　）」の（　　）に入るのはどれですか。"},
          {type:"single-choice", options:["中","前","待ち","済み"], correctIndex:3},
          {correct:"「郵送済み」です。「済み」は、もう終わったことを表します。",
           incorrect:"昨日のうちに出したので、もう終わっています。終わったことを表す形を選びます。"},
          {prompt:"「済み」がついた言葉が表すのはどれですか。", options:["もう終わった","これからする"], correctIndex:0, seconds:8},
          [
            "中 would mean it is still on its way, but it went yesterday",
            "前 would mean it has not been sent yet",
            "待ち would mean it is waiting to be sent",
            "済み - already done, which is what sending it yesterday means"
          ]),

        q2("inn-e02-q06", "text-grammar", "w-sakujo", 90,
          {jp:"【帳場の申し送り】\nゆうべのご予約のうち、お取り消しのご連絡があったものは、帳面から（　　）してください。\n※ 線を引くだけでは、次の人にどちらが生きているのか分かりません。\n※ （　　）したご予約は、下の欄に日付とともに残してください。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["記録","郵送","削除","清書"], correctIndex:2},
          {correct:"「削除」です。取り消しの連絡があった予約を、帳面から消します。",
           incorrect:"取り消しの連絡があったのですから、帳面から消す言葉を選びます。"},
          {prompt:"「削除する」はどれのことですか。", options:["消す","送る"], correctIndex:0, seconds:5},
          [
            "記録 would mean writing it down, the opposite of what is asked",
            "郵送 is posting something, which this note is not about",
            "削除 - striking the cancelled booking out of the book",
            "清書 is making a clean copy, which removes nothing"
          ])
      ]},

      {day:3, mode:"challenge", label:"昼までに", questions:[

        q2("inn-e02-q07", "sentence-building", "w-enki", 30,
          {jp:"【催しの日の変更】\n雨のため、明日の催しの日を変えることになりました。次の文を正しく並べたとき、★に入るのはどれですか。\n雨のため、＿　＿　＿　★　ことになりました。"},
          {type:"sentence-order", options:["来週に","延期する","明日の","催しは"], correctIndex:1},
          {correct:"「明日の催しは来週に延期することになりました」となります。★は「延期する」です。",
           incorrect:"「明日の」「催しは」「来週に」「延期する」の順に並びます。★は四番目です。"},
          {prompt:"「延期する」はどれのことですか。", options:["後の日にする","やめてしまう"], correctIndex:0, seconds:8},
          [
            "来週に says when, and belongs third, just before the verb",
            "延期する sits fourth, at the star, before ことになりました",
            "明日の comes first, attaching to 催し",
            "催しは is the topic, so it comes second"
          ]),

        q2("inn-e02-q08", "text-grammar", "w-shitei", 90,
          {jp:"【今日のお客様について】\n本日お着きのお客様の中に、着く時間を（　　）していらっしゃる方が三組あります。\n※ 時間を決めていらっしゃる方の欄には、赤い印をつけてください。\n※ 時間を決めていらっしゃらない方には、こちらから伺います。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["指定","予想","削除","案内"], correctIndex:0},
          {correct:"「指定」です。お客様のほうで時間を決めていらっしゃる、ということです。",
           incorrect:"お客様がご自分で時間を決めていらっしゃるのですから、それを表す言葉を選びます。"},
          {prompt:"「指定する」はどれのことですか。", options:["これと決める","たぶんそうだと思う"], correctIndex:0, seconds:8},
          [
            "指定 - the guest has named the time themselves",
            "予想 is guessing at something not yet decided",
            "削除 is removing something, not deciding it",
            "案内 is showing someone the way"
          ]),

        q2("inn-e02-q09", "reading", "w-manin", 120,
          {jp:"【本日の帳面】\n一番　二名様　ゆうべからご滞在中\n二番　四名様　本日お発ちになりました\n三番　二名様　本日お発ちになりました\n四番　三名様　今夜ご到着の予定\n五番　二名様　今夜ご到着の予定\n六番　四名様　本日お発ちになりました\n※ お発ちになった部屋は、掃除が済み次第、今夜のお客様をお入れできます。\n※ ご滞在中の部屋と、今夜ご到着の予定の部屋は、お入れできません。\n※ 今、四名様のお申し込みが一組あります。\n今夜、この四名様をお入れできる部屋はどれですか。"},
          {type:"evidence-choice", options:["二番と六番","六番だけ","どこにもありません","一番と四番"], correctIndex:0},
          {correct:"二番と六番です。どちらも本日お発ちになった四名様のお部屋です。",
           incorrect:"本日お発ちになった部屋のうち、四名様が入れる大きさのものを選びます。"},
          {prompt:"「満員」はどんなときに使いますか。", options:["もう入れないとき","まだ空いているとき"], correctIndex:0, seconds:8},
          [
            "二番と六番 - both are four-guest rooms whose guests left today",
            "六番だけ misses 二番, which is the same size and also free",
            "どこにもありません would mean the inn is 満員, but two rooms are free",
            "一番 is still occupied and 四番 is expected tonight"
          ]),

        q2("inn-e02-q10", "listening-task", "w-seisho", 8,
          {jp:"コン：「この下書きを、もう一度きれいに書き直してください。」何をしますか。", audio:true},
          {type:"quick-response", options:["削除します。","郵送します。","清書します。","記録します。"], correctIndex:2},
          {correct:"下書きを清書しました。「清書」は、きれいに書き直したもののことです。",
           incorrect:"きれいに書き直すよう頼まれました。それを表す言葉を選びます。"},
          {prompt:"「清書」はどれのことですか。", options:["きれいに書き直したもの","下書きのままのもの"], correctIndex:0, seconds:5},
          [
            "削除 would throw the draft away instead of copying it",
            "郵送 would post the draft as it is",
            "清書 - writing the draft out cleanly, which is what was asked",
            "記録 is writing something down for the first time"
          ])
      ]}
    ]
  };

  root.N2InnEpisodes = {
    key:"home-inn",
    episodes:[episode1, episode2]
  };

  // Every episode stage registers itself here, so adding a location is one
  // file and one script tag rather than a list in app.js to keep in sync.
  root.LanternEpisodeStages = root.LanternEpisodeStages || {};
  root.LanternEpisodeStages["home-inn"] = root.N2InnEpisodes;
})(typeof self !== "undefined" ? self : this);
