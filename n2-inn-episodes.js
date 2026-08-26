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
    intro:{jp:"コン：「今夜はお祭りの前の晩です。お客様が次々にいらっしゃいます。」", audio:true},
    // Spoken before the first question: the rules of an episode, in Japanese.
    briefing:{
      jp:"コン：「これから一時間、受付を任せます。お客様を待たせないでください。私の話を聞いてから、時間内に答えてください。聞き取れなかったら、スピーカーを押せばもう一度言います。間違えた仕事は、最後にもう一度だけ確認します。」",
      audio:true,
      points:[
        "お客様は待っています。時間内に答えてください。",
        "音声は最後まで聞いてから、時間が始まります。",
        "読む問題は時間が長く、短い返事は五秒です。",
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

        q("inn-e01-q06", "reading", "w-souji", 18,
          {jp:"貼り紙：「二階の三番と五番はお客様がお帰りになりました。四番はまだご滞在中です。」空いた部屋はどこですか。", audio:false},
          {type:"evidence-choice", options:["三番と五番","四番だけ","二階の全部", "三番だけ"], correctIndex:0},
          {correct:"三番と五番の掃除を始められます。書いてあることだけで判断できました。",
           incorrect:"四番はまだお客様がいらっしゃいます。貼り紙をもう一度読んでください。"},
          {prompt:"部屋をきれいにすることはどれですか。", options:["掃除","案内"], correctIndex:0, seconds:5},
          [
            "the two rooms the notice says the guests have left",
            "四番 is the one still occupied",
            "the notice does not say the whole floor is free",
            "only one of the two rooms the notice says are free"
          ])
      ]},

      {day:3, mode:"challenge", label:"仕上げ", questions:[
        q("inn-e01-q07", "reading", "w-chousei", 25,
          {jp:"予定表：花火は八時。夕食は一時間かかります。お客様は花火を見たいそうです。夕食は何時に始めますか。", audio:false},
          {type:"evidence-choice", options:["七時","八時","九時", "六時"], correctIndex:0},
          {correct:"七時に始めれば花火に間に合います。条件を合わせるのが「調整」です。",
           incorrect:"八時に始めると花火に間に合いません。かかる時間から逆に考えてください。"},
          {prompt:"いくつかの条件を合わせることはどれですか。", options:["調整","調節"], correctIndex:0, seconds:5},
          [
            "one hour before the fireworks, so dinner finishes in time",
            "dinner would still be running when the fireworks start",
            "after the fireworks have already begun",
            "an hour earlier than needed - dinner would end long before the fireworks"
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

  root.N2InnEpisodes = {
    key:"home-inn",
    episodes:[episode1]
  };
})(typeof self !== "undefined" ? self : this);
