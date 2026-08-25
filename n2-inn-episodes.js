/* Moonview Inn, Episode 1 "First guests", in the shared episode contract.
 *
 * The legacy `n2-home-inn-stage.js` still drives the playable game. This file
 * is the same story expressed in the new 3-3-4 format, validated by
 * learning-content.js, so the contract is proven against real content before
 * the controller is switched over.
 *
 * Every prompt is distinct: reusing one across phases lets a learner answer
 * from memory of the screen rather than from the Japanese.
 */
(function(root){
  "use strict";

  var NOTE = "月見宿・第一話「最初のお客様」";

  function q(id, skill, target, prompt, answer, feedback, repair, extra){
    var question = {
      id:id, skill:skill, target:target, slots:[], sourceNote:NOTE,
      prompt:prompt, answer:answer, feedback:feedback, repair:repair
    };
    Object.keys(extra || {}).forEach(function(key){ question[key] = extra[key]; });
    return question;
  }

  var episode1 = {
    id:"inn-e01",
    title:"First guests",
    sourceNote:NOTE,
    intro:{jp:"コン：「もうすぐ最初のお客様が来ます。お祭りの間、よろしくお願いします。」", audio:true},
    days:[
      {day:1, mode:"learn", questions:[
        q("inn-e01-d1-q01", "kanji", "v-soroeru",
          {jp:"「座布団を揃えてください。」の「揃えて」は、どう読みますか。", audio:true},
          {type:"single-choice", options:["そろえて","ととのえて","あつめて"], correctIndex:0},
          {correct:"はい、「揃える」は「そろえる」と読みます。",
           incorrect:"「整えて（ととのえて）」とは別の言葉です。「揃える」は「そろえる」と読みます。"},
          {prompt:"「揃える」の読み方はどれですか。", options:["そろえる","ととのえる"], correctIndex:0, seconds:5}),

        q("inn-e01-d1-q02", "vocabulary", "v-atatameru-food",
          {jp:"冷めたお茶を、もう一度（　）ください。", audio:true},
          {type:"single-choice", options:["温めて","暖めて","冷やして"], correctIndex:0},
          {correct:"そうです。飲み物や食べ物には「温める」を使います。",
           incorrect:"「暖める」は空気や部屋に使う言葉です。飲み物には「温める」を使います。"},
          {prompt:"飲み物に使うのはどちらですか。", options:["温める","暖める"], correctIndex:0, seconds:5}),

        q("inn-e01-d1-q03", "vocabulary-action", "v-torikaeru",
          {jp:"古いタオルを洗濯かごに入れて、新しいタオルに取り替えてください。", audio:true},
          {type:"ordered-action", steps:["towel-old:laundry","towel-new:rack"]},
          {correct:"ありがとうございます。新しいタオルになりました。",
           incorrect:"先に古いタオルを洗濯かごに入れてから、新しいタオルを掛けてください。"},
          {prompt:"「取り替える」に一番近い意味はどれですか。", options:["別の物と交換する","人の代わりをする"], correctIndex:0, seconds:8})
      ]},

      {day:2, mode:"practice", questions:[
        q("inn-e01-d2-q04", "vocabulary-action", "v-soroeru",
          {jp:"二つのマットに、同じ大きさの座布団を二枚ずつ揃えてください。", audio:true},
          {type:"direct-action", mechanic:"arrange"},
          {correct:"はい、大きさが揃いました。",
           incorrect:"文の中で、何を同じにするのか確認してください。今日は色ではありません。"},
          {prompt:"「大きさを揃える」の意味はどれですか。", options:["同じ大きさにする","大きさを測る"], correctIndex:0, seconds:8}),

        q("inn-e01-d2-q05", "vocabulary", "w-junbi",
          {jp:"お客様が来る前に、部屋の（　）をしておきます。", audio:true},
          {type:"single-choice", options:["準備","案内","確認"], correctIndex:0},
          {correct:"そうです。前もってしておくことを「準備」と言います。",
           incorrect:"「案内」はお客様を連れて行くことです。前もってしておくのは「準備」です。"},
          {prompt:"前もってしておくことはどれですか。", options:["準備","案内"], correctIndex:0, seconds:5}),

        q("inn-e01-d2-q06", "reading", "w-chousei",
          {jp:"予定表：電車は14時。駅まで1時間。掃除は2時間必要。次のお客様は15時。いちばん遅いチェックアウトは何時ですか。", audio:false},
          {type:"evidence-choice", options:["13時","14時","12時"], correctIndex:0},
          {correct:"はい、13時なら電車にも掃除にも間に合います。",
           incorrect:"電車の時間だけでは決められません。掃除の時間も一緒に考えてください。"},
          {prompt:"「調整する」に近い意味はどれですか。", options:["条件に合わせて決める","温度を上げる"], correctIndex:0, seconds:12})
      ]},

      {day:3, mode:"challenge", questions:[
        q("inn-e01-d3-q07", "listening-task", "v-atatameru-food",
          {jp:"お茶をコンロでもう一度温めてください。", audio:true},
          {type:"direct-action", mechanic:"warm"},
          {correct:"ありがとうございます。お茶が温まりました。",
           incorrect:"頼まれた物と、温める場所をもう一度聞いてください。"},
          {prompt:"お茶はどこで温めますか。", options:["コンロ","洗濯かご"], correctIndex:0, seconds:5}),

        q("inn-e01-d3-q08", "listening-point", "w-souji",
          {jp:"音声を聞いて、コンが今いちばん急いでいる仕事を選んでください。", audio:true},
          {type:"single-choice", options:["掃除","案内","確認"], correctIndex:0},
          {correct:"はい、次のお客様が来る前に掃除を終える必要があります。",
           incorrect:"もう一度聞いてください。コンは「次のお客様が来る前に」と言っています。"},
          {prompt:"部屋をきれいにすることはどれですか。", options:["掃除","案内"], correctIndex:0, seconds:5}),

        q("inn-e01-d3-q09", "quick-response", "v-hikiukeru",
          {jp:"「その仕事を引き受けました。」と同じ意味の文はどれですか。", audio:true},
          {type:"quick-response", options:["その仕事をやると約束しました。","その仕事を断りました。","その仕事を手伝ってもらいました。"], correctIndex:0},
          {correct:"そうです。「引き受ける」は責任を持ってやると決めることです。",
           incorrect:"「引き受ける」は断ることではありません。自分がやると決めることです。"},
          {prompt:"「引き受ける」の意味はどれですか。", options:["自分がやると決める","人にやってもらう"], correctIndex:0, seconds:8}),

        q("inn-e01-d3-q10", "integrated", "w-annai",
          {jp:"お客様が玄関に着きました。次にすることはどれですか。", audio:true},
          {type:"single-choice", options:["部屋へ案内します。","洗濯を始めます。","電球を代えます。"], correctIndex:0},
          {correct:"はい、まずお客様を部屋へ案内します。",
           incorrect:"お客様を待たせないでください。まず部屋へ案内します。"},
          {prompt:"「案内する」の意味はどれですか。", options:["連れて行く","取り替える"], correctIndex:0, seconds:8})
      ]}
    ]
  };

  root.N2InnEpisodes = {
    key:"home-inn",
    episodes:[episode1]
  };
})(typeof self !== "undefined" ? self : this);
