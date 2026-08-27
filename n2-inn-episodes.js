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
          {type:"quick-response", options:["いいえ、分かりません。","もう閉まりました。","はい、お部屋へご案内します。","お荷物をお預かりします。"], correctIndex:2},
          {correct:"お客様は部屋へ向かいました。「案内する」は、人を連れて行くことです。",
           incorrect:"お客様を待たせてしまいました。まず部屋へご案内します。"},
          {prompt:"「案内する」の意味はどれですか。", options:["片づける","連れて行く"], correctIndex:1, seconds:5},
          [
            "\"I don’t know\" - leaves the guest standing at the desk",
            "\"We are already closed\" - untrue, the inn is open",
            "「I will show you to your room」 - guiding the guest there",
            "holding the luggage - useful later, but it is not an answer to the question asked"
          ]),

        q("inn-e01-q02", "quick-response", "w-chuumon", 8,
          {jp:"お客様：「そろそろ夕食をお願いしたいのですが。」何と言いますか。", audio:true},
          {type:"quick-response", options:["注文は終わりました。","ご注文をうかがいます。","私も知りません。","お部屋へご案内します。"], correctIndex:1},
          {correct:"注文を受けました。「注文」は、料理や品物を頼むことです。",
           incorrect:"お客様は何も頼めませんでした。まず注文をうかがいます。"},
          {prompt:"料理を頼むことはどれですか。", options:["注文","案内"], correctIndex:0, seconds:5},
          [
            "\"Orders are finished\" - refuses a guest who can still order",
            "注文 - taking the guest’s order",
            "\"I don’t know either\" - gives the guest nothing",
            "案内 - showing them to the room, which has already happened"
          ]),

        q("inn-e01-q03", "listening-task", "v-atatameru-food", 5,
          {jp:"お客様：「このお茶、冷めてしまいました。」", audio:true},
          {type:"single-choice", options:["温めます。","冷やします。","暖めます。","取り替えます。"], correctIndex:0},
          {correct:"温かいお茶をお出しできました。飲み物には「温める」を使います。",
           incorrect:"「暖める」は部屋や空気に使います。飲み物には「温める」です。"},
          {prompt:"冷めた飲み物はどうしますか。", options:["冷やす","温める"], correctIndex:1, seconds:5},
          [
            "温める - to warm food or drink",
            "冷やす - to chill it, the opposite of what was asked",
            "暖める - to warm a room or the air, not a drink",
            "取り替える - swapping the tea for another cup, which wastes it"
          ])
      ]},

      {day:2, mode:"practice", label:"食事どき", questions:[
        q("inn-e01-q04", "listening-task", "v-torikaeru", 5,
          {jp:"お客様：「タオルが濡れています。」", audio:true},
          {type:"single-choice", options:["そのままにします。","タオルを温めます。","タオルを揃えます。","新しいタオルに取り替えます。"], correctIndex:3},
          {correct:"新しいタオルをお渡ししました。物を別の物にするのは「取り替える」です。",
           incorrect:"濡れたままでした。同じ種類の新しい物にするのが「取り替える」です。"},
          {prompt:"「取り替える」に近い意味はどれですか。", options:["別の物と交換する","人の代わりをする"], correctIndex:0, seconds:8},
          [
            "leaving it as it is - the guest is still waiting",
            "温める - warming a wet towel does not dry it",
            "揃える - lining the towels up neatly, while this one is still wet",
            "取り替える - to swap it for another of the same kind"
          ]),

        q("inn-e01-q05", "listening-task", "v-soroeru", 5,
          {jp:"お客様：「座布団の大きさがばらばらです。」", audio:true},
          {type:"single-choice", options:["座布団を片づけます。","座布団を洗います。","同じ大きさに揃えます。","座布団が揃います。"], correctIndex:2},
          {correct:"座布団が同じ大きさになりました。自分の手で同じにするのが「揃える」です。",
           incorrect:"ばらばらのままでした。同じ状態にするのは「揃える」です。"},
          {prompt:"ばらばらの物を同じにすることはどれですか。", options:["揃う","揃える"], correctIndex:1, seconds:5},
          [
            "片づける - clearing them away leaves nowhere to sit",
            "洗う - washing takes hours and fixes nothing",
            "揃える - to make them match",
            "揃う - the cushions matching by themselves, which is not something you do"
          ]),

        q("inn-e01-q06", "reading", "w-souji", 120,
          {jp:"【二階のお知らせ】\n一番　明日の朝十時にご出発\n二番　明日の朝十時にご出発\n三番　先ほどお帰りになりました\n四番　明後日までご滞在\n五番　先ほどお帰りになりました\n六番　工事中（入れません）\n七番　夕方にご到着の予定\n八番　掃除が終わっています\n※お帰りになった部屋だけ、今から掃除します。\n※工事中の部屋と、掃除が終わっている部屋はしません。\n今から掃除をする部屋はどれですか。", audio:false},
          {type:"evidence-choice", options:["一番と二番","三番と五番","三番と五番と六番","四番と七番"], correctIndex:1},
          {correct:"三番と五番の掃除を始められます。お帰りになった部屋だけを選べました。",
           incorrect:"お帰りになったのは三番と五番だけです。ほかの部屋はまだお客様がいるか、掃除が終わっています。"},
          {prompt:"部屋をきれいにすることはどれですか。", options:["掃除","案内"], correctIndex:0, seconds:5},
          [
            "these guests do not leave until tomorrow morning",
            "the two rooms whose guests have already left",
            "六番 is closed for building work, so it cannot be entered",
            "四番 is still occupied and 七番 has a guest arriving this evening"
          ])
      ]},

      {day:3, mode:"challenge", label:"仕上げ", questions:[
        q("inn-e01-q07", "reading", "w-chousei", 120,
          {jp:"【今夜のご案内】　三番　二名様\n花火　八時から（中庭からご覧になれます）\n夕食　一時間かかります\nお風呂　一時間かかります\n朝食　明日の七時から（一階の広間）\n売店　九時に閉まります\n※お風呂は、夕食が終わってからです。\n※お客様は、花火が始まるまでに夕食とお風呂を終えたいとおっしゃっています。\n夕食は何時に始めればいいですか。", audio:false},
          {type:"evidence-choice", options:["六時","七時","八時","五時"], correctIndex:0},
          {correct:"六時に始めれば、夕食もお風呂も済ませて花火に間に合います。条件を合わせるのが「調整」です。",
           incorrect:"夕食に一時間、そのあとお風呂に一時間かかります。八時から二時間戻してください。"},
          {prompt:"いくつかの条件を合わせることはどれですか。", options:["調節","調整"], correctIndex:1, seconds:5},
          [
            "two hours before the fireworks: one for dinner, one for the bath",
            "leaves only one hour, so the bath would run into the fireworks",
            "the fireworks would already have started",
            "an hour earlier than needed - everything would finish with time to spare"
          ]),

        q("inn-e01-q08", "listening-point", "w-kakunin", 8,
          {jp:"コン：「三番のお客様は、明日の朝食は要らないとおっしゃっていました。念のため、もう一度……」", audio:true},
          {type:"single-choice", options:["注文します。","準備します。","案内します。","確認します。"], correctIndex:3},
          {correct:"間違いを防げました。もう一度確かめるのが「確認」です。",
           incorrect:"確かめないままでした。念のため確かめるのは「確認」です。"},
          {prompt:"もう一度確かめることはどれですか。", options:["確認","準備"], correctIndex:0, seconds:5},
          [
            "注文 - placing an order, but nothing is being ordered",
            "準備 - getting things ready, but nothing is being prepared here",
            "案内 - guiding someone, but nobody needs guiding",
            "確認 - checking something once more"
          ]),

        q("inn-e01-q09", "quick-response", "v-hikiukeru", 8,
          {jp:"コン：「明日の朝、駅までお客様を送る仕事があります。お願いできますか。」", audio:true},
          {type:"quick-response", options:["はい、引き返します。","はい、引き止めます。","はい、引き受けます。","はい、引き出します。"], correctIndex:2},
          {correct:"任せました。責任を持ってやると決めるのが「引き受ける」です。",
           incorrect:"返事になっていません。仕事を自分がやると決めるのが「引き受ける」です。"},
          {prompt:"仕事を自分がやると決めることはどれですか。", options:["引き止める","引き受ける"], correctIndex:1, seconds:5},
          [
            "引き返す - to turn back the way you came",
            "引き止める - to stop someone from leaving",
            "引き受ける - to take the job on",
            "引き出す - to draw something out, such as money"
          ]),

        q("inn-e01-q10", "integrated", "v-kotowaru", 12,
          {jp:"お客様：「今から十人、泊まれますか。」部屋は二つしか空いていません。何と言いますか。", audio:true},
          {type:"quick-response", options:["申し訳ありませんが、お断りします。","はい、大丈夫です。","何も言いません。","少々お待ちください。"], correctIndex:0},
          {correct:"正直に伝えられました。できないことを丁寧に伝えるのが「断る」です。",
           incorrect:"できない約束をしてしまいました。丁寧に「断る」のも仕事です。"},
          {prompt:"できないと丁寧に伝えることはどれですか。", options:["引き受ける","断る"], correctIndex:1, seconds:5},
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
          {type:"single-choice", options:["不","無","未","非"], correctIndex:2},
          {correct:"「未報告」です。「未」は、まだそうなっていないことを表します。",
           incorrect:"まだ終わっていない、という意味の形を選びます。"},
          {prompt:"「未」がついた言葉が表すのはどれですか。", options:["二度としない","まだしていない"], correctIndex:1, seconds:8},
          [
            "不 marks something as lacking or inconvenient, as in 不便",
            "無 means there is none at all, as in 無料",
            "未 - not yet done, which is what an outstanding report is",
            "非 marks something as not that kind of thing, as in 非常"
          ]),

        q2("inn-e02-q03", "sentence-building", "w-tsuuchi", 30,
          {jp:"【朝食の時間のお知らせ】\n明日お発ちのお客様に、朝食の時間が変わったことを知らせます。次の文を正しく並べたとき、★に入るのはどれですか。\n明日ご出発のお客様に　＿　＿　★　＿　通知します。"},
          {type:"sentence-order", options:["ことを","時間が","朝食の","変わった"], correctIndex:3},
          {correct:"「朝食の時間が変わったことを通知します」となります。★は「変わった」です。",
           incorrect:"「朝食の」「時間が」「変わった」「ことを」の順に並びます。★は三番目です。"},
          {prompt:"「通知する」はどれのことですか。", options:["知らせる","片づける"], correctIndex:0, seconds:5},
          [
            "ことを comes last, turning the whole clause into the object",
            "時間が is the subject of 変わった, so it belongs second, not at the star",
            "朝食の comes first, attaching to 時間",
            "変わった sits third, at the star, saying what happened"
          ])
      ]},

      {day:2, mode:"practice", label:"書き直し", questions:[

        q2("inn-e02-q04", "orthography", "w-hanko", 20,
          {jp:"帳場の引き出しに、宿の（はんこ）が入っています。（はんこ）を漢字で書くと、どれになりますか。"},
          {type:"single-choice", options:["判子","判紙","半子","版子"], correctIndex:0},
          {correct:"「判子」です。紙に押して、確かにそうだと示すものです。",
           incorrect:"押して確かだと示す道具なので、「判」の字を使います。"},
          {prompt:"「判子」を使うのはどんなときですか。", options:["部屋を掃除するとき","確かだと示すとき"], correctIndex:1, seconds:5},
          [
            "判子 - the seal kept in the desk drawer",
            "判紙 is not a word; the second character is 子, not 紙",
            "半 means half",
            "版 is the 版 of a printing plate"
          ]),

        q2("inn-e02-q05", "word-formation", "w-yuusou", 20,
          {jp:"通知は昨日のうちに出しました。今この通知は、どう書きますか。「郵送（　　）」の（　　）に入るのはどれですか。"},
          {type:"single-choice", options:["中","済み","前","待ち"], correctIndex:1},
          {correct:"「郵送済み」です。「済み」は、もう終わったことを表します。",
           incorrect:"昨日のうちに出したので、もう終わっています。終わったことを表す形を選びます。"},
          {prompt:"「済み」がついた言葉が表すのはどれですか。", options:["もう終わった","これからする"], correctIndex:0, seconds:8},
          [
            "中 would mean it is still on its way, but it went yesterday",
            "済み - already done, which is what sending it yesterday means",
            "前 would mean it has not been sent yet",
            "待ち would mean it is waiting to be sent"
          ]),

        q2("inn-e02-q06", "text-grammar", "w-sakujo", 90,
          {jp:"【帳場の申し送り】\nゆうべのご予約のうち、お取り消しのご連絡があったものは、帳面から（　　）してください。\n※ 線を引くだけでは、次の人にどちらが生きているのか分かりません。\n※ （　　）したご予約は、下の欄に日付とともに残してください。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["記録","郵送","削除","清書"], correctIndex:2},
          {correct:"「削除」です。取り消しの連絡があった予約を、帳面から消します。",
           incorrect:"取り消しの連絡があったのですから、帳面から消す言葉を選びます。"},
          {prompt:"「削除する」はどれのことですか。", options:["送る","消す"], correctIndex:1, seconds:5},
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
          {type:"sentence-order", options:["来週に","明日の","催しは","延期する"], correctIndex:3},
          {correct:"「明日の催しは来週に延期することになりました」となります。★は「延期する」です。",
           incorrect:"「明日の」「催しは」「来週に」「延期する」の順に並びます。★は四番目です。"},
          {prompt:"「延期する」はどれのことですか。", options:["後の日にする","やめてしまう"], correctIndex:0, seconds:8},
          [
            "来週に says when, and belongs third, just before the verb",
            "明日の comes first, attaching to 催し",
            "催しは is the topic, so it comes second",
            "延期する sits fourth, at the star, before ことになりました"
          ]),

        q2("inn-e02-q08", "text-grammar", "w-shitei", 90,
          {jp:"【今日のお客様について】\n本日お着きのお客様の中に、着く時間を（　　）していらっしゃる方が三組あります。\n※ 時間を決めていらっしゃる方の欄には、赤い印をつけてください。\n※ 時間を決めていらっしゃらない方には、こちらから伺います。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["指定","予想","削除","案内"], correctIndex:0},
          {correct:"「指定」です。お客様のほうで時間を決めていらっしゃる、ということです。",
           incorrect:"お客様がご自分で時間を決めていらっしゃるのですから、それを表す言葉を選びます。"},
          {prompt:"「指定する」はどれのことですか。", options:["たぶんそうだと思う","これと決める"], correctIndex:1, seconds:8},
          [
            "指定 - the guest has named the time themselves",
            "予想 is guessing at something not yet decided",
            "削除 is removing something, not deciding it",
            "案内 is showing someone the way"
          ]),

        q2("inn-e02-q09", "reading", "w-manin", 120,
          {jp:"【本日の帳面】\n一番　二名様　ゆうべからご滞在中\n二番　四名様　本日お発ちになりました\n三番　二名様　本日お発ちになりました\n四番　三名様　今夜ご到着の予定\n五番　二名様　今夜ご到着の予定\n六番　四名様　本日お発ちになりました\n※ お発ちになった部屋は、掃除が済み次第、今夜のお客様をお入れできます。\n※ ご滞在中の部屋と、今夜ご到着の予定の部屋は、お入れできません。\n※ 今、四名様のお申し込みが一組あります。\n今夜、この四名様をお入れできる部屋はどれですか。"},
          {type:"evidence-choice", options:["一番と四番","二番と六番","どこにもありません","六番だけ"], correctIndex:1},
          {correct:"二番と六番です。どちらも本日お発ちになった四名様のお部屋です。",
           incorrect:"本日お発ちになった部屋のうち、四名様が入れる大きさのものを選びます。"},
          {prompt:"「満員」はどんなときに使いますか。", options:["もう入れないとき","まだ空いているとき"], correctIndex:0, seconds:8},
          [
            "一番 is still occupied and 四番 is expected tonight",
            "二番と六番 - both are four-guest rooms whose guests left today",
            "どこにもありません would mean the inn is 満員, but two rooms are free",
            "六番だけ misses 二番, which is the same size and also free"
          ]),

        q2("inn-e02-q10", "listening-task", "w-seisho", 8,
          {jp:"コン：「この下書きを、もう一度きれいに書き直してください。」何をしますか。", audio:true},
          {type:"quick-response", options:["削除します。","郵送します。","記録します。","清書します。"], correctIndex:3},
          {correct:"下書きを清書しました。「清書」は、きれいに書き直したもののことです。",
           incorrect:"きれいに書き直すよう頼まれました。それを表す言葉を選びます。"},
          {prompt:"「清書」はどれのことですか。", options:["きれいに書き直したもの","下書きのままのもの"], correctIndex:0, seconds:5},
          [
            "削除 would throw the draft away instead of copying it",
            "郵送 would post the draft as it is",
            "記録 is writing something down for the first time",
            "清書 - writing the draft out cleanly, which is what was asked"
          ])
      ]}
    ]
  };


  var NOTE3 = "月見宿・第三話「戻り客」";
  var NOTE4 = "月見宿・第四話「宿を閉じる」";

  function q3(id, skill, target, seconds, prompt, answer, feedback, repair, notes){
    return {
      id:id, skill:skill, target:target, slots:[], sourceNote:NOTE3,
      seconds:seconds, prompt:prompt, answer:answer, feedback:feedback,
      repair:repair, optionNotes:notes || []
    };
  }

  function q4(id, skill, target, seconds, prompt, answer, feedback, repair, notes){
    return {
      id:id, skill:skill, target:target, slots:[], sourceNote:NOTE4,
      seconds:seconds, prompt:prompt, answer:answer, feedback:feedback,
      repair:repair, optionNotes:notes || []
    };
  }

  var INN_RULES = [
    "お客様は待っています。時間内に答えてください。",
    "音声は最後まで聞いてから、時間が始まります。",
    "読む問題は二分あります。短い返事は五秒です。",
    "もう一度聞きたいときは、スピーカーを押してください。",
    "間違えた仕事は、最後にもう一度出ます。"
  ];

  /* Episode 3 「戻り客」: the festival ends and the guests come back wet, tired
   * and later than they said. Episodes 1 and 2 were a shift and a desk; this is
   * what happens when the book and the people disagree.
   */
  var episode3 = {
    id:"inn-e03",
    title:"戻り客",
    sourceNote:NOTE3,
    intro:{jp:"コン：「お祭りが終わりました。お客様が一度に戻っていらっしゃいます。雨に降られた方、帳面より遅い方、いろいろです。書いてあるとおりにはいきません。」", audio:true},
    briefing:{jp:"コン：「これから一時間、戻っていらっしゃるお客様をお迎えします。帳面と違うことが必ず起こります。そのときは、紙より目の前の方を見てください。間違えた仕事は、最後にもう一度だけ確認します。」", audio:true, points:INN_RULES},
    days:[
      {day:1, mode:"learn", label:"戸口に立つ", questions:[

        q3("inn-e03-q01", "listening-task", "w-yuka", 5,
          {jp:"コン：「玄関の床が濡れています。」どこが濡れていますか。", audio:true},
          {type:"quick-response", options:["足で踏む平らな面","天井","戸の外の道","二階の窓"], correctIndex:0},
          {correct:"分かりました。「床」は、部屋の中で足を乗せる平らな面のことです。",
           incorrect:"「床」は、足で踏む平らな面のことです。"},
          {prompt:"「床」はどれのことですか。", options:["上を覆う面","足で踏む平らな面"], correctIndex:1, seconds:5},
          [
            "the floor, the flat surface underfoot",
            "the ceiling is overhead, not underfoot",
            "the road outside is not the floor of the entrance",
            "a window upstairs is neither"
          ]),

        q3("inn-e03-q02", "listening-task", "v-shiku", 5,
          {jp:"コン：「お布団を敷いてください。」何をしますか。", audio:true},
          {type:"quick-response", options:["たたんで押し入れにしまいます。","外に干します。","洗います。","畳の上に広げて寝られるようにします。"], correctIndex:3},
          {correct:"敷けました。「敷く」は、平らに広げて置くことです。",
           incorrect:"「敷く」は、平らに広げて置くことです。しまうのとは逆です。"},
          {prompt:"「敷く」はどれのことですか。", options:["平らに広げて置く","たたんでしまう"], correctIndex:0, seconds:5},
          [
            "folding it away is the opposite action",
            "airing it is a daytime job",
            "washing it is a different job again",
            "spreading it out on the tatami to sleep on"
          ]),

        q3("inn-e03-q03", "listening-point", "w-kigen-2", 8,
          {jp:"コン：「あのお客様は機嫌がよくないようです。」何が分かりましたか。", audio:true},
          {type:"quick-response", options:["お帰りの時刻","お召し物の色","気持ちの具合","持ち物の数"], correctIndex:2},
          {correct:"よく見ていました。「機嫌」は、そのときの気分や気持ちの具合のことです。",
           incorrect:"「機嫌」は、そのときの気持ちの具合のことです。"},
          {prompt:"「機嫌」はどれのことですか。", options:["持ち物の数","気持ちの具合"], correctIndex:1, seconds:5},
          [
            "the time they came back is a fact, not a feeling",
            "the colour of their clothes says nothing about mood",
            "their mood, which is what 機嫌 describes",
            "how much they are carrying is not a mood"
          ])
      ]},

      {day:2, mode:"practice", label:"帳面と違う", questions:[

        q3("inn-e03-q04", "quick-response", "v-kasanaru", 8,
          {jp:"同じ時刻に、三組のお客様がお戻りになりました。手は二つしかありません。何と言いますか。", audio:true},
          {type:"quick-response", options:["三組はお受けできません。","順にご案内しますので、少々お待ちください。","後からいらしてください。","一度にお入りください。"], correctIndex:1},
          {correct:"落ち着いて捌けました。「重なる」は、同じところに二つ以上が合わさることです。",
           incorrect:"三組が重なりました。お断りせず、順にご案内すると伝えます。"},
          {prompt:"「重なる」はどんな様子ですか。", options:["同じところに合わさる","ばらばらに離れる"], correctIndex:0, seconds:5},
          [
            "turning away guests who are already staying here",
            "one at a time, and asking them to wait a moment",
            "sending them back out into the rain",
            "all at once is exactly what two hands cannot manage"
          ]),

        q3("inn-e03-q05", "listening-task", "v-atsukau", 5,
          {jp:"コン：「割れやすい物ですから、丁寧に扱ってください。」何をしますか。", audio:true},
          {type:"quick-response", options:["気をつけて手で持ちます。","投げて渡します。","急いで運びます。","高く積み上げます。"], correctIndex:0},
          {correct:"丁寧に扱えました。「扱う」は、物や人をある仕方で取り持つことです。",
           incorrect:"「丁寧に扱う」は、気をつけて手で持つということです。"},
          {prompt:"「扱う」はどれのことですか。", options:["数を数える","ある仕方で取り持つ"], correctIndex:1, seconds:5},
          [
            "handling it carefully in the hands",
            "throwing it is not handling it at all",
            "hurrying with something fragile is the opposite",
            "stacking it high risks the breakage"
          ]),

        q3("inn-e03-q06", "reading", "w-kizu", 120,
          {jp:"【お預かり品の記録】\n一番　傘　　　　傷なし\n二番　風呂敷　　角に小さな傷\n三番　箱　　　　ふたに大きな傷\n※ 傷のあるお預かり品は、お返しの前に必ずお客様にお伝えします。\n※ 小さな傷でも、お伝えするところは同じです。\n※ 傷のない品については、何も申し上げません。\nお伝えするのは、どのお客様ですか。"},
          {type:"evidence-choice", options:["三番だけ","一番と三番","三組とも","二番と三番"], correctIndex:3},
          {correct:"二番と三番です。傷の大きさにかかわらずお伝えします。",
           incorrect:"小さな傷でもお伝えします。傷のない品だけは何も申し上げません。"},
          {prompt:"「傷」はどれのことですか。", options:["ついてしまった痛み跡","品物の値段"], correctIndex:0, seconds:5},
          [
            "the small mark on room two's cloth counts too",
            "room one's umbrella has no damage at all",
            "room one has nothing to report",
            "rooms two and three: any damage is reported, however small"
          ])
      ]},

      {day:3, mode:"challenge", label:"夜が更ける", questions:[

        q3("inn-e03-q07", "reading", "w-taizai", 120,
          {jp:"【今夜のご滞在】\n一番　二名様　　今夜まで\n二番　四名様　　明日まで\n三番　二名様　　今夜まで\n四番　三名様　　明後日まで\n※ 今夜までのお客様には、明日の朝、お発ちの支度をしていただきます。\n※ 明日以降もご滞在のお客様には、お布団をそのままにしておきます。\n※ お発ちの支度をお願いした部屋には、朝、札を掛けます。\n朝、札を掛けるのはどの部屋ですか。"},
          {type:"evidence-choice", options:["二番と四番","一番だけ","一番と三番","四部屋すべて"], correctIndex:2},
          {correct:"一番と三番です。今夜までのお客様に、お発ちの支度をお願いします。",
           incorrect:"今夜までのお客様の部屋を探します。明日以降の方はそのままです。"},
          {prompt:"「滞在」はどれのことですか。", options:["出かけていくこと","ある所にとどまること"], correctIndex:1, seconds:5},
          [
            "rooms two and four stay on, so their bedding is left out",
            "room three leaves tonight as well",
            "rooms one and three: the two staying only tonight",
            "half the rooms are staying longer"
          ]),

        q3("inn-e03-q08", "quick-response", "w-jijou", 8,
          {jp:"お客様：「急な用ができて、朝早く発ちたいのです。」朝食は八時からです。何と言いますか。", audio:true},
          {type:"quick-response", options:["八時までお待ちください。","ご事情は承りました。お早めにお出しできます。","朝食はお出しできません。","明日は無理です。"], correctIndex:1},
          {correct:"合わせられました。「事情」は、そうなっている訳や、その人の置かれた具合のことです。",
           incorrect:"急な用があるというご事情です。こちらが合わせられると伝えます。"},
          {prompt:"「事情」はどれのことですか。", options:["そうなっている訳","品物の値段"], correctIndex:0, seconds:5},
          [
            "making them wait ignores what they just explained",
            "acknowledging the reason and moving breakfast earlier",
            "refusing breakfast is more than the situation calls for",
            "「impossible」 when it is merely earlier than usual"
          ]),

        q3("inn-e03-q09", "listening-task", "w-sewa", 5,
          {jp:"コン：「小さなお子様のお世話をお願いします。」何をしますか。", audio:true},
          {type:"quick-response", options:["そばにいて面倒を見ます。","部屋の鍵を渡します。","帳面に名前を書きます。","お金を数えます。"], correctIndex:0},
          {correct:"お世話ができました。「世話」は、人の面倒を見て助けることです。",
           incorrect:"「世話をする」は、そばにいて面倒を見ることです。"},
          {prompt:"「世話」はどれのことですか。", options:["紙に書くこと","人の面倒を見ること"], correctIndex:1, seconds:5},
          [
            "staying with the child and looking after them",
            "handing over a key is not looking after anyone",
            "writing a name in the book is paperwork",
            "counting money is a different job"
          ]),

        q3("inn-e03-q10", "integrated", "v-azukaru", 12,
          {jp:"お客様が財布を置いて出ていかれました。帳場でお預かりします。女将さん：「どうしますか。」何と言いますか。", audio:true},
          {type:"quick-response", options:["中を数えて帳面に書きます。","お帰りまでそのままにします。","お預かりして、中は見ずに帳面に残します。","私が持っておきます。"], correctIndex:2},
          {correct:"正しい預かり方でした。「預かる」は、人の物をそのまま責任をもって保つことです。",
           incorrect:"人の物です。中を改めず、預かったことだけを残します。"},
          {prompt:"「預かる」はどれのことですか。", options:["自分の物にする","人の物を責任をもって保つ"], correctIndex:1, seconds:8},
          [
            "counting the contents means going through someone's wallet",
            "leaving it where it lies is not keeping it safe",
            "take it into safekeeping and record it without opening it",
            "keeping it personally is not the inn keeping it"
          ])
      ]}
    ]
  };

  /* Episode 4 「宿を閉じる」: the last morning. Everyone leaves, the building is
   * put back the way it was found, and the season ends. The Inn's four episodes
   * run evening, the morning after, the night the festival ends, and this.
   */
  var episode4 = {
    id:"inn-e04",
    title:"宿を閉じる",
    sourceNote:NOTE4,
    intro:{jp:"コン：「今日でお祭りは終わりです。お客様が発たれたら、宿は冬まで閉めます。最後の日ですから、来たときより整えて出ましょう。」", audio:true},
    briefing:{jp:"コン：「これから、お見送りと戸締まりをします。順を守ってください。読む問題は長いので、時間も長く取ってあります。間違えた仕事は、最後にもう一度だけ確認します。」", audio:true, points:INN_RULES},
    days:[
      {day:1, mode:"learn", label:"お見送り", questions:[

        q4("inn-e04-q01", "quick-response", "w-miokuru", 8,
          {jp:"お客様が玄関を出ていかれます。何をしますか。", audio:true},
          {type:"quick-response", options:["帳面をつけます。","すぐに戸を閉めます。","部屋の掃除を始めます。","姿が見えなくなるまでお見送りします。"], correctIndex:3},
          {correct:"見送れました。「見送る」は、行く人を見届けることです。",
           incorrect:"「見送る」は、行く人の姿を見届けることです。すぐ戸を閉めるのとは違います。"},
          {prompt:"「見送る」はどれのことですか。", options:["行く人を見届ける","来る人を迎える"], correctIndex:0, seconds:5},
          [
            "the books can wait a moment",
            "shutting the door at once cuts the farewell short",
            "cleaning can start after they have gone",
            "watching until they are out of sight"
          ]),

        q4("inn-e04-q02", "listening-task", "w-kagi", 5,
          {jp:"コン：「裏の戸の鍵を掛けてください。」何を使いますか。", audio:true},
          {type:"quick-response", options:["戸を開かなくする道具","戸を拭く布","戸を外す道具","戸に貼る札"], correctIndex:0},
          {correct:"掛けられました。「鍵」は、戸を開かないようにするための道具です。",
           incorrect:"「鍵を掛ける」は、戸が開かないようにすることです。"},
          {prompt:"「鍵」はどれのことですか。", options:["戸を拭くための布","戸を開かなくする道具"], correctIndex:1, seconds:5},
          [
            "the key that locks the door",
            "a cloth is for wiping, not locking",
            "taking the door off is not locking it",
            "a paper notice does not hold a door shut"
          ]),

        q4("inn-e04-q03", "listening-point", "w-nokori", 8,
          {jp:"コン：「残りのお部屋はいくつですか。」六部屋のうち四部屋が済んでいます。何と言いますか。", audio:true},
          {type:"quick-response", options:["残りは四部屋です。","残りは二部屋です。","残りはありません。","六部屋すべてです。"], correctIndex:1},
          {correct:"数えられました。「残り」は、まだ済んでいない分のことです。",
           incorrect:"六部屋のうち四部屋が済んでいますから、まだ二部屋あります。"},
          {prompt:"「残り」はどれのことですか。", options:["まだ済んでいない分","もう済んだ分"], correctIndex:0, seconds:5},
          [
            "four is the number finished, not the number left",
            "two: six rooms less the four already done",
            "there are still rooms to do",
            "four of the six are already done"
          ])
      ]},

      {day:2, mode:"practice", label:"部屋を戻す", questions:[

        q4("inn-e04-q04", "listening-task", "v-osameru-2", 5,
          {jp:"コン：「お布団を押し入れに納めてください。」何をしますか。", audio:true},
          {type:"quick-response", options:["畳の上に広げます。","外に干します。","きちんと入れてしまいます。","洗います。"], correctIndex:2},
          {correct:"納められました。「納める」は、あるべき所にきちんと入れることです。",
           incorrect:"「納める」は、あるべき所にきちんと入れることです。広げるのとは逆です。"},
          {prompt:"「納める」はどれのことですか。", options:["外に広げる","あるべき所に入れる"], correctIndex:1, seconds:5},
          [
            "spreading them out is 敷く, the opposite job",
            "airing them outside is a different task",
            "putting them away properly in the cupboard",
            "washing them is not putting them away"
          ]),

        q4("inn-e04-q05", "quick-response", "v-modosu", 8,
          {jp:"女将さん：「お部屋はどうなりましたか。」机も座布団も、最初にあった場所へ動かしました。何と言いますか。", audio:true},
          {type:"quick-response", options:["新しく並べ替えました。","少し変えてみました。","まだ手つかずです。","元の場所へ戻しました。"], correctIndex:3},
          {correct:"伝えられました。「戻す」は、元にあった状態や場所へ返すことです。",
           incorrect:"最初にあった場所へ動かしたのですから、元へ戻したと伝えます。"},
          {prompt:"「戻す」はどれのことですか。", options:["元の場所へ返す","新しい場所へ移す"], correctIndex:0, seconds:5},
          [
            "rearranging it is the opposite of restoring it",
            "changing it is not what was asked for",
            "it has in fact been done",
            "back where it started, which is what you did"
          ]),

        q4("inn-e04-q06", "text-grammar", "w-kyakuma", 90,
          {jp:"【閉める前の見回りについて】\n戸締まりの後、（　　）を一部屋ずつ見て回ってください。\n※ お客様がお使いになった部屋だけで結構です。\n※ 台所と帳場は、女将さんがご覧になります。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["客間","玄関","台所","帳場"], correctIndex:0},
          {correct:"「客間」です。お客様がお使いになる部屋のことです。",
           incorrect:"お客様がお使いになった部屋だけ、と書いてあります。"},
          {prompt:"「客間」はどれのことですか。", options:["料理を作る部屋","客が使う部屋"], correctIndex:1, seconds:5},
          [
            "客間 - the guest rooms, which is what you are asked to walk",
            "玄関 is the entrance, not a room a guest stays in",
            "台所 is the kitchen, which the proprietress checks",
            "帳場 is the front desk, also hers"
          ])
      ]},

      {day:3, mode:"challenge", label:"鍵を返す", questions:[

        q4("inn-e04-q07", "text-grammar", "w-kanryou", 90,
          {jp:"【鍵をお返しになる前に】\nすべての部屋の見回りが（　　）してから、鍵をお返しください。\n※ 途中でお返しになると、残りの部屋に入れなくなります。\n※ （　　）した部屋の数は、帳面に残してください。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["中止","完了","変更","開始"], correctIndex:1},
          {correct:"「完了」です。すっかり終わることです。",
           incorrect:"すべて終わってから返す、という流れです。終わることを表す言葉を選びます。"},
          {prompt:"「完了」はどれのことですか。", options:["すっかり終わること","途中でやめること"], correctIndex:0, seconds:5},
          [
            "中止 is stopping part-way, which the note forbids",
            "完了 - fully finished, which is when the keys go back",
            "変更 is changing something already decided",
            "開始 is starting, not finishing"
          ]),

        q4("inn-e04-q08", "reading", "v-tomeru", 120,
          {jp:"【冬の間について】\n宿は今日から冬まで閉めます。\n※ 冬の間は、どなたもお泊めできません。\n※ 急な用でいらした方には、茶屋か神社をご案内してください。\n※ 荷物だけなら、帳場でお預かりできます。\n冬の間に、荷物を持った方がいらしたら、何ができますか。"},
          {type:"evidence-choice", options:["お泊めします","何もできません","荷物をお預かりします","お部屋だけお貸しします"], correctIndex:2},
          {correct:"荷物のお預かりです。お泊めすることはできません。",
           incorrect:"泊めることはできませんが、荷物だけなら預かれると書いてあります。"},
          {prompt:"「泊める」はどれのことですか。", options:["荷物を運ぶ","人を夜まで置く"], correctIndex:1, seconds:5},
          [
            "nobody can be lodged over the winter",
            "there is one thing that can still be done",
            "luggage can still be taken in at the desk",
            "lending a room is the same as lodging them"
          ]),

        q4("inn-e04-q09", "reading", "w-yukata", 120,
          {jp:"【お貸ししたものの覚え】\n一番　浴衣　二枚　　お返しあり\n二番　浴衣　四枚　　お返しあり\n三番　浴衣　二枚　　お返しなし\n四番　浴衣　三枚　　お返しあり\n※ お返しのない分は、お客様のご住所へお便りを出します。\n※ お返しのあった分は、洗ってから納めます。\n※ 数が合わない部屋があれば、女将さんにお伝えします。\nお便りを出すのはどの部屋ですか。"},
          {type:"evidence-choice", options:["二番と四番","どの部屋にも出しません","一番","三番"], correctIndex:3},
          {correct:"三番です。お返しのない分について、お便りを出します。",
           incorrect:"お返しのなかった部屋を探します。"},
          {prompt:"「浴衣」はどれのことですか。", options:["宿で着る薄い着物","足に履くもの"], correctIndex:0, seconds:5},
          [
            "rooms two and four both returned theirs",
            "one room has not returned them",
            "room one returned theirs",
            "room three, the one that did not return them"
          ]),

        q4("inn-e04-q10", "integrated", "w-tsutomeru-2", 12,
          {jp:"コン：「この宿で、あなたは何を務めましたか。」三日間の練習と、三つの夜の仕事がありました。何と言いますか。", audio:true},
          {type:"quick-response", options:["何もしていません。","お客様の立場で先に動く役を務めました。","部屋の数を数えました。","早く終わらせました。"], correctIndex:1},
          {correct:"よく分かっています。「務める」は、役目を引き受けて果たすことです。",
           incorrect:"どの仕事も、お客様の立場で先に動くことでした。それを務めたと言えます。"},
          {prompt:"「務める」はどれのことですか。", options:["役目を引き受けて果たす","そばで見ている"], correctIndex:0, seconds:8},
          [
            "「nothing」 after three days and three nights of it",
            "the part you filled: moving first, from the guest's side",
            "counting rooms was a task, not the role",
            "speed was never what the work was about"
          ])
      ]}
    ]
  };

  root.N2InnEpisodes = {
    key:"home-inn",
    episodes:[episode1, episode2, episode3, episode4]
  };

  // Every episode stage registers itself here, so adding a location is one
  // file and one script tag rather than a list in app.js to keep in sync.
  root.LanternEpisodeStages = root.LanternEpisodeStages || {};
  root.LanternEpisodeStages["home-inn"] = root.N2InnEpisodes;
})(typeof self !== "undefined" ? self : this);
