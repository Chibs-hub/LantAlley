/* 灯守神社, four episodes, in the shared episode contract.
 *
 * The shrine is the only place in the alley where the work is done for other
 * people rather than sold to them, and where getting it wrong is a matter of
 * respect rather than money. So these episodes lean on set phrases, on rules
 * that are followed because they are the rules, and on who is responsible for
 * what.
 *
 * One night in order: the eve of the festival (宵宮), the notices that govern it
 * (立て札), the festival itself (太鼓が鳴る), and the clearing up that lasts
 * until dawn (後始末).
 */
(function(root){
  "use strict";

  var NOTE1 = "灯守神社・第一話「宵宮」";
  var NOTE2 = "灯守神社・第二話「立て札」";
  var NOTE3 = "灯守神社・第三話「太鼓が鳴る」";
  var NOTE4 = "灯守神社・第四話「後始末」";

  function make(note){
    return function(id, skill, target, seconds, prompt, answer, feedback, repair, notes){
      return {
        id:id, skill:skill, target:target, slots:[], sourceNote:note,
        seconds:seconds, prompt:prompt, answer:answer, feedback:feedback,
        repair:repair, optionNotes:notes || []
      };
    };
  }

  var q1 = make(NOTE1);
  var q2 = make(NOTE2);
  var q3 = make(NOTE3);
  var q4 = make(NOTE4);

  var RULES = [
    "お参りの方をお待たせしないでください。時間内に答えてください。",
    "音声は最後まで聞いてから、時間が始まります。",
    "読む問題は二分あります。短い返事は五秒です。",
    "もう一度聞きたいときは、スピーカーを押してください。",
    "間違えた仕事は、最後にもう一度出ます。"
  ];

  var WRITTEN_RULES = [
    "今は書く仕事です。声はほとんど出ません。",
    "かなで書いてある言葉を、正しい漢字で選びます。",
    "言葉の前や後ろにつく形を選びます。",
    "文を組み立てて、★の場所に入る言葉を選びます。",
    "間違えた仕事は、最後にもう一度出ます。"
  ];

  var episode1 = {
    id:"shrine-e01",
    title:"宵宮",
    sourceNote:NOTE1,
    intro:{jp:"コン：「灯守神社です。今夜が祭りの宵宮、前の晩です。宮司さんは一人で、灯りも飾りもまだ半分です。日が暮れるまでに間に合わせましょう。」", audio:true},
    briefing:{jp:"コン：「これから一時間、宵宮の支度を手伝ってください。お参りの方も見えますから、丁寧に。私の話を聞いてから、時間が始まります。間違えた仕事は、最後にもう一度だけ確認します。」", audio:true, points:RULES},
    days:[
      {day:1, mode:"learn", label:"日が暮れる", questions:[

        q1("shrine-e01-q01", "quick-response", "w-matsuri", 8,
          {jp:"お参りの方：「明日は何かあるのですか。」明日は年に一度の大きな行事です。何と言いますか。", audio:true},
          {type:"quick-response", options:["明日は祭りでございます。","何もございません。","分かりません。","もう終わりました。"], correctIndex:0},
          {correct:"伝えられました。「祭り」は、神社などで行う、決まった日の催しのことです。",
           incorrect:"明日は年に一度の大きな催しです。そのままお伝えします。"},
          {prompt:"「祭り」はどれのことですか。", options:["毎日の仕事","決まった日の催し"], correctIndex:1, seconds:5},
          [
            "tomorrow is the festival, said plainly and politely",
            "「nothing at all」 when the whole shrine is being decorated",
            "「I do not know」 when you are setting it up",
            "it has not happened yet"
          ]),

        q1("shrine-e01-q02", "listening-task", "w-kazari", 5,
          {jp:"コン：「飾りを鳥居に付けてください。」何を付けますか。", audio:true},
          {type:"quick-response", options:["お参りの方の荷物","掃除の道具","石段の石","きれいに見せるための物"], correctIndex:3},
          {correct:"付けられました。「飾り」は、きれいに見せるために付ける物のことです。",
           incorrect:"「飾り」は、きれいに見せるために付ける物のことです。"},
          {prompt:"「飾り」はどれのことですか。", options:["きれいに見せる物","掃除の道具"], correctIndex:0, seconds:5},
          [
            "a visitor's belongings are not decorations",
            "cleaning tools are for the sweeping later",
            "the stones of the steps stay where they are",
            "the decorations that go up for the festival"
          ]),

        q1("shrine-e01-q03", "listening-task", "v-tsukeru-2", 5,
          {jp:"コン：「石段の明かりを点けてください。」何をしますか。", audio:true},
          {type:"quick-response", options:["明かりを数えます。","明かりを消します。","明かりがつくようにします。","明かりを片付けます。"], correctIndex:2},
          {correct:"点けられました。「点ける」は、火や明かりがつくようにすることです。",
           incorrect:"「点ける」は、明かりをつけることです。消すのとは逆です。"},
          {prompt:"「点ける」はどれのことですか。", options:["消す","つくようにする"], correctIndex:1, seconds:5},
          [
            "counting them is not lighting them",
            "putting them out is the opposite",
            "switching the lights on, which is what 点ける means",
            "clearing them away is for after the festival"
          ])
      ]},

      {day:2, mode:"practice", label:"灯りが並ぶ", questions:[

        q1("shrine-e01-q04", "listening-point", "w-akari", 8,
          {jp:"コン：「石段の明かりが一つ足りません。」何が足りませんか。", audio:true},
          {type:"quick-response", options:["お参りの方","道を照らす灯り","掃除の道具","飾りの紙"], correctIndex:1},
          {correct:"分かりました。「明かり」は、あたりを照らす光のことです。",
           incorrect:"「明かり」は、あたりを照らす光のことです。"},
          {prompt:"「明かり」はどれのことですか。", options:["あたりを照らす光","音を出すもの"], correctIndex:0, seconds:5},
          [
            "a worshipper is a person, not a light",
            "one of the lights along the steps",
            "cleaning tools are not lights",
            "decorative paper does not light the way"
          ]),

        q1("shrine-e01-q05", "listening-task", "w-suzu", 5,
          {jp:"コン：「鈴の綱を短くしてください。」何に付いている綱ですか。", audio:true},
          {type:"quick-response", options:["振ると鳴るもの","明かりのもの","飾りの紙","掃除の道具"], correctIndex:0},
          {correct:"分かりました。「鈴」は、振ると音の鳴る小さな道具のことです。",
           incorrect:"「鈴」は、振ると鳴るもののことです。"},
          {prompt:"「鈴」はどれのことですか。", options:["あたりを照らすもの","振ると鳴るもの"], correctIndex:1, seconds:5},
          [
            "the bell worshippers ring at the front of the shrine",
            "the lights are lit, not rung",
            "the paper decorations make no sound",
            "cleaning tools are not rung either"
          ]),

        q1("shrine-e01-q06", "quick-response", "v-ogamu", 8,
          {jp:"お参りの方：「作法が分かりません。」まず何をしていただきますか。", audio:true},
          {type:"quick-response", options:["お帰りいただきます。","お金をいただきます。","並んでお待ちいただきます。","手を合わせて拝んでいただきます。"], correctIndex:3},
          {correct:"教えられました。「拝む」は、手を合わせて頭を下げ、敬うことです。",
           incorrect:"作法をお尋ねです。まず手を合わせることをお伝えします。"},
          {prompt:"「拝む」はどれのことですか。", options:["手を合わせて敬う","お金を数える"], correctIndex:0, seconds:5},
          [
            "sending them away answers nothing",
            "asking for money is not the custom being asked about",
            "queueing is not the act of worship itself",
            "putting the hands together and bowing, which is the form"
          ])
      ]},

      {day:3, mode:"challenge", label:"宵の口", questions:[

        q1("shrine-e01-q07", "reading", "w-gyouji", 120,
          {jp:"【明日の行事】\n朝　七時　　　　お清め\n昼　十二時　　　太鼓\n夕　五時　　　　行列\n夜　八時　　　　火を焚きます\n※ 雨のときは、行列だけを取りやめます。\n※ ほかの行事は、雨でもそのまま行います。\n※ 取りやめた行事は、後の日に行いません。\n明日が雨のとき、行わない行事はどれですか。"},
          {type:"evidence-choice", options:["太鼓","火を焚くこと","行列","お清め"], correctIndex:2},
          {correct:"行列です。雨のときは行列だけを取りやめます。",
           incorrect:"雨のときに取りやめると書いてあるものを選びます。"},
          {prompt:"「行事」はどれのことですか。", options:["毎日の掃除","決まった日に行う催し"], correctIndex:1, seconds:5},
          [
            "the drums go ahead in the rain",
            "the fire is lit whatever the weather",
            "the procession, the one thing rain cancels",
            "the purification happens either way"
          ]),

        q1("shrine-e01-q08", "reading", "w-teiin", 120,
          {jp:"【行列にお入りになる方へ】\n定員　四十名\n今のお申し込み　三十八名\n※ 定員を超えたお申し込みはお受けできません。\n※ ご家族は、まとめて一組としてお受けします。\n※ 途中でお取り消しがあっても、繰り上げはいたしません。\n三名のご家族から、お申し込みがありました。どうなりますか。"},
          {type:"evidence-choice", options:["三名ともお受けします","お受けできません","二名だけお受けします","一名だけお受けします"], correctIndex:1},
          {correct:"お受けできません。三名を足すと定員の四十名を超えてしまいます。",
           incorrect:"ご家族はまとめて一組です。三十八名に三名を足すと四十一名になります。"},
          {prompt:"「定員」はどれのことですか。", options:["受け入れられる人数","かかるお金"], correctIndex:0, seconds:5},
          [
            "taking all three would exceed the forty",
            "38 plus 3 is 41, over the limit, and families are taken as one group",
            "the family cannot be split; they are taken as one",
            "the same rule prevents taking just one"
          ]),

        q1("shrine-e01-q09", "listening-task", "w-negai", 5,
          {jp:"コン：「お参りの方の願いを札に書いていただきます。」何を書いていただきますか。", audio:true},
          {type:"quick-response", options:["こうなってほしいと思うこと","お住まいの町","お使いになったお金","お帰りの時刻"], correctIndex:0},
          {correct:"分かりました。「願い」は、こうなってほしいと思う気持ちのことです。",
           incorrect:"「願い」は、こうなってほしいと思うことです。"},
          {prompt:"「願い」はどれのことですか。", options:["もう済んだこと","こうなってほしいこと"], correctIndex:1, seconds:5},
          [
            "what they hope for, written on the tablet",
            "an address is not a wish",
            "money spent is not a wish either",
            "the time they leave is not what goes on the tablet"
          ]),

        q1("shrine-e01-q10", "integrated", "w-kansha", 12,
          {jp:"宮司さん：「今日はよく働いてくれました。」あなたも宮司さんに助けられました。何と言いますか。", audio:true},
          {type:"quick-response", options:["当たり前のことです。","もう帰ります。","こちらこそ、感謝しております。","何もしていません。"], correctIndex:2},
          {correct:"きちんと返せました。「感謝」は、ありがたいと思う気持ちのことです。",
           incorrect:"こちらも助けられたのですから、ありがたいと思う気持ちを返します。"},
          {prompt:"「感謝」はどんな気持ちですか。", options:["申し訳なく思う","ありがたいと思う"], correctIndex:1, seconds:8},
          [
            "「it is only natural」 brushes the thanks aside",
            "announcing you are leaving ignores what was said",
            "returning the thanks, which is what the moment asks for",
            "「I did nothing」 is not true and refuses the thanks"
          ])
      ]}
    ]
  };

  var episode2 = {
    id:"shrine-e02",
    title:"立て札",
    sourceNote:NOTE2,
    intro:{jp:"コン：「明日の朝までに、立て札と申し込みの紙を直します。神社の札は何年も立ったままになりますから、字を間違えると長く残ります。」", audio:true},
    briefing:{jp:"コン：「これから、立て札と紙を正しくしてください。漢字の書き方、言葉の形、文の組み立て、そして文章の中の言葉を選びます。間違えた仕事は、最後にもう一度だけ確認します。」", audio:true, points:WRITTEN_RULES},
    days:[
      {day:1, mode:"learn", label:"札を書く", questions:[

        q2("shrine-e02-q01", "orthography", "w-kuiki", 20,
          {jp:"火を焚く（くいき）に入らないよう、札を立てます。（くいき）を漢字で書くと、どれになりますか。"},
          {type:"single-choice", options:["苦域","九域","区城","区域"], correctIndex:3},
          {correct:"「区域」です。区切られた、決まった範囲のことです。",
           incorrect:"区切られた範囲のことなので、「区域」と書きます。"},
          {prompt:"「区域」はどれのことですか。", options:["区切られた範囲","建物の名前"], correctIndex:0, seconds:5},
          [
            "苦 is the 苦 of hardship",
            "九 is the number nine",
            "城 is the 城 of a castle",
            "区域 - the marked-off area around the fire"
          ]),

        q2("shrine-e02-q02", "word-formation", "w-keseki", 20,
          {jp:"明日の行列に出られない方の欄です。札には何と書きますか。「（　　）席」の（　　）に入るのはどれですか。"},
          {type:"single-choice", options:["欠","出","不","無"], correctIndex:0},
          {correct:"「欠席」です。「欠」は、そこにいないことを表します。",
           incorrect:"出られないほうです。「出席」と対になる形を選びます。"},
          {prompt:"「欠席」はどれのことですか。", options:["出ること","出ないこと"], correctIndex:1, seconds:5},
          [
            "欠 - 欠席, not attending, the pair to 出席",
            "出 gives 出席, attending, which is the opposite",
            "不 marks something as lacking, but 不席 is not a word",
            "無 means there is none of it, and 無席 is not a word either"
          ]),

        q2("shrine-e02-q03", "sentence-building", "v-musubu", 30,
          {jp:"【お札の結び方】\nお参りの方に、札をどこへ結んでいただくかを書きます。次の文を正しく並べたとき、★に入るのはどれですか。\nお書きになった札は　＿　＿　★　＿　お結びください。"},
          {type:"sentence-order", options:["竹の枝に","奥にある","一枚ずつ","境内の"], correctIndex:1},
          {correct:"「境内の奥にある竹の枝に一枚ずつお結びください」となります。★は「奥にある」です。",
           incorrect:"「境内の」「奥にある」「竹の枝に」「一枚ずつ」の順に並びます。★は二番目です。"},
          {prompt:"「結ぶ」はどれのことですか。", options:["ひもなどでつなぐ","紙を折る"], correctIndex:0, seconds:5},
          [
            "竹の枝に is where they go, and comes third",
            "奥にある sits at the star, attaching to 竹の枝",
            "一枚ずつ comes last, saying one at a time",
            "境内の opens the sentence"
          ])
      ]},

      {day:2, mode:"practice", label:"申し込みの紙", questions:[

        q2("shrine-e02-q04", "orthography", "w-take", 20,
          {jp:"札を結ぶ（たけ）の場所を書き入れます。（たけ）を漢字で書くと、どれになりますか。"},
          {type:"single-choice", options:["筑","丈","竹","武"], correctIndex:2},
          {correct:"「竹」です。境内の奥に生えている、節のある細長い植物です。",
           incorrect:"境内に生えている植物なので、「竹」と書きます。"},
          {prompt:"「竹」はどれのことですか。", options:["石でできたもの","節のある細長い植物"], correctIndex:1, seconds:5},
          [
            "筑 appears in place names, not here",
            "丈 is 丈, a measure of length",
            "竹 - the bamboo at the back of the grounds",
            "武 is the 武 of martial things"
          ]),

        q2("shrine-e02-q05", "word-formation", "w-dairi", 20,
          {jp:"宮司さんの代わりに出る方のことです。札には何と書きますか。「代（　　）」の（　　）に入るのはどれですか。"},
          {type:"single-choice", options:["当","表","役","理"], correctIndex:3},
          {correct:"「代理」です。本人の代わりを務める人のことです。",
           incorrect:"本人の代わりを務める人を表す形を選びます。"},
          {prompt:"「代理」はどれのことですか。", options:["本人の代わりの人","いちばん上の人"], correctIndex:0, seconds:5},
          [
            "当 gives 当番, being on duty by rota",
            "表 gives 代表, the one who represents a group - not a stand-in",
            "役 gives 代役, which is used of an actor's replacement",
            "理 - 代理, standing in for someone who cannot attend"
          ]),

        q2("shrine-e02-q06", "text-grammar", "w-kimari", 120,
          {jp:"【境内での（　　）】\n火のそばでは走らないでください。これは昔からの（　　）です。\n※ 小さなお子様も、手をつないでお通りください。\n※ 守れない方には、境内をお出ましいただくことがあります。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["決まり","感謝","飾り","願い"], correctIndex:0},
          {correct:"「決まり」です。守るように定められたことです。",
           incorrect:"守るように定められたことを表す言葉を選びます。"},
          {prompt:"「決まり」はどれのことですか。", options:["きれいに見せる物","守るように定めたこと"], correctIndex:1, seconds:5},
          [
            "決まり - the rule that is to be kept",
            "感謝 is gratitude",
            "飾り is a decoration",
            "願い is a wish"
          ])
      ]},

      {day:3, mode:"challenge", label:"紙を閉じる", questions:[

        q2("shrine-e02-q07", "sentence-building", "w-teian", 30,
          {jp:"【氏子の皆様へ】\n行列の順をどう決めるか、集まりでお諮りします。次の文を正しく並べたとき、★に入るのはどれですか。\n行列の順につきましては　＿　＿　★　＿　提案がございます。"},
          {type:"sentence-order", options:["集まりの席で","宮司より","申し上げたい","明日の"], correctIndex:1},
          {correct:"「明日の集まりの席で宮司より申し上げたい提案がございます」となります。★は「宮司より」です。",
           incorrect:"「明日の」「集まりの席で」「宮司より」「申し上げたい」の順に並びます。★は三番目です。"},
          {prompt:"「提案」はどれのことですか。", options:["こうしてはどうかと出す案","決まったこと"], correctIndex:0, seconds:5},
          [
            "集まりの席で says where, and comes second",
            "宮司より sits at the star, saying who it comes from",
            "申し上げたい comes last, attaching to 提案",
            "明日の opens the sentence, attaching to 集まり"
          ]),

        q2("shrine-e02-q08", "text-grammar", "w-kyoka", 120,
          {jp:"【火を焚くことについて】\n境内で火を焚くには、町の（　　）が要ります。\n※ （　　）のない火は、たとえ小さくても焚けません。\n※ 今年の分は、先月のうちに受けてあります。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["提案","感謝","許可","飾り"], correctIndex:2},
          {correct:"「許可」です。してもよいと認めてもらうことです。",
           incorrect:"町から受けるもので、これがないと焚けません。認めてもらうことを表す言葉を選びます。"},
          {prompt:"「許可」はどれのことですか。", options:["してはいけないこと","してもよいと認めること"], correctIndex:1, seconds:5},
          [
            "提案 is a proposal, not a permission",
            "感謝 is gratitude",
            "許可 - the town's permission, without which no fire is lit",
            "飾り is a decoration"
          ]),

        q2("shrine-e02-q09", "reading", "w-jun", 120,
          {jp:"【行列の順】\n一　太鼓\n二　子どもたち\n三　氏子の皆様\n四　宮司\n※ 子どもたちは、必ず大人にはさまれて歩きます。\n※ 太鼓は、いちばん前から動きません。\n※ 宮司は、いちばん後ろから動きません。\n子どもたちが二番のままでよいのは、どんなときですか。"},
          {type:"evidence-choice", options:["前も後ろも子どものとき","前が宮司のとき","いつでもよい","前が太鼓で、後ろが氏子のとき"], correctIndex:3},
          {correct:"前が太鼓、後ろが氏子のときです。子どもたちは大人にはさまれます。",
           incorrect:"子どもたちは大人にはさまれて歩きます。前と後ろの両方を見ます。"},
          {prompt:"「順」はどれのことですか。", options:["どちらが先かということ","どこにあるかということ"], correctIndex:0, seconds:5},
          [
            "children on both sides breaks the rule",
            "the priest never moves from the back",
            "the rule has to be checked, not assumed",
            "drums ahead and parishioners behind: adults on both sides"
          ]),

        q2("shrine-e02-q10", "listening-task", "w-uchiawase", 8,
          {jp:"コン：「明日の朝、氏子の皆様と打合せがあります。」何がありますか。", audio:true},
          {type:"quick-response", options:["掃除の時間","前もって相談する集まり","火を焚く支度","お参りの行事"], correctIndex:1},
          {correct:"分かりました。「打合せ」は、前もって相談して決めておくことです。",
           incorrect:"「打合せ」は、前もって相談して決めておく集まりのことです。"},
          {prompt:"「打合せ」はどれのことですか。", options:["前もって相談すること","終わってから片付けること"], correctIndex:0, seconds:8},
          [
            "cleaning is a different job",
            "a meeting to settle things in advance",
            "preparing the fire is not a discussion",
            "a worship event is not a planning meeting"
          ])
      ]}
    ]
  };


  var episode3 = {
    id:"shrine-e03",
    title:"太鼓が鳴る",
    sourceNote:NOTE3,
    intro:{jp:"コン：「祭りが始まりました。境内は人でいっぱいです。太鼓が鳴っていると、私の声も聞き取りにくくなります。最後までよく聞いてください。」", audio:true},
    briefing:{jp:"コン：「これから一時間、祭りの最中を回します。人が多い場所ですから、決められた通りに動いてください。間違えた仕事は、最後にもう一度だけ確認します。」", audio:true, points:RULES},
    days:[
      {day:1, mode:"learn", label:"太鼓が始まる", questions:[

        q3("shrine-e03-q01", "listening-task", "w-taiko", 5,
          {jp:"コン：「太鼓の前を空けてください。」何の前を空けますか。", audio:true},
          {type:"quick-response", options:["息を吹いて鳴らすもの","振って鳴らすもの","ばちで打って鳴らすもの","字を書いた札"], correctIndex:2},
          {correct:"空けられました。「太鼓」は、ばちで打って鳴らす道具のことです。",
           incorrect:"「太鼓」は、ばちで打って鳴らすもののことです。"},
          {prompt:"「太鼓」はどれのことですか。", options:["吹いて鳴らすもの","打って鳴らすもの"], correctIndex:1, seconds:5},
          [
            "something you blow is the 笛",
            "something you shake is the 鈴",
            "the drum, struck with sticks",
            "a written tablet makes no sound at all"
          ]),

        q3("shrine-e03-q02", "listening-task", "w-fue", 5,
          {jp:"コン：「笛の方はもう見えていますか。」何を持った方ですか。", audio:true},
          {type:"quick-response", options:["振って鳴らすもの","息を吹いて鳴らすもの","火を焚く道具","ばちで打つもの"], correctIndex:1},
          {correct:"分かりました。「笛」は、息を吹いて鳴らす細長い道具のことです。",
           incorrect:"「笛」は、息を吹いて鳴らすもののことです。打つのは「太鼓」です。"},
          {prompt:"「笛」はどれのことですか。", options:["吹いて鳴らすもの","打って鳴らすもの"], correctIndex:0, seconds:5},
          [
            "the bell is shaken",
            "the flute, sounded with the breath",
            "fire tools are not instruments",
            "the drum is struck, not blown"
          ]),

        q3("shrine-e03-q03", "listening-point", "v-hibiku", 8,
          {jp:"コン：「太鼓の音が境内じゅうに響いています。」どういうことですか。", audio:true},
          {type:"quick-response", options:["音が広がって伝わっている","音が小さくなっている","音が止まっている","音が聞こえない"], correctIndex:0},
          {correct:"分かりました。「響く」は、音が広がって伝わることです。",
           incorrect:"「響く」は、音が広がって伝わることです。"},
          {prompt:"「響く」はどれのことですか。", options:["音が消える","音が広がって伝わる"], correctIndex:1, seconds:5},
          [
            "the sound carrying across the whole grounds",
            "growing quieter is the opposite",
            "a stopped drum makes no sound to carry",
            "if it could not be heard it would not be 響く"
          ])
      ]},

      {day:2, mode:"practice", label:"人が集まる", questions:[

        q3("shrine-e03-q04", "quick-response", "w-shuugou", 8,
          {jp:"氏子の方：「何時にどこへ行けばいいですか。」行列は五時に鳥居の前からです。何と言いますか。", audio:true},
          {type:"quick-response", options:["どこでも構いません。","もう終わりました。","お決まりではありません。","五時に鳥居の前へご集合ください。"], correctIndex:3},
          {correct:"伝えられました。「集合」は、決めた時と場所に集まることです。",
           incorrect:"時と場所が決まっています。そのままお伝えします。"},
          {prompt:"「集合」はどれのことですか。", options:["決めた時と場所に集まる","ばらばらに帰る"], correctIndex:0, seconds:5},
          [
            "「anywhere is fine」 when a place has been set",
            "the procession has not happened yet",
            "it is decided, and you know it",
            "five o'clock at the gate, which is what was arranged"
          ]),

        q3("shrine-e03-q05", "listening-task", "w-ichi-2", 5,
          {jp:"コン：「決められた位置に立ってください。」何をしますか。", audio:true},
          {type:"quick-response", options:["好きな場所に立ちます。","座って待ちます。","決まった場所に立ちます。","境内を出ます。"], correctIndex:2},
          {correct:"立てました。「位置」は、そのものがあるべき場所のことです。",
           incorrect:"「決められた位置」ですから、決まっている場所に立ちます。"},
          {prompt:"「位置」はどれのことですか。", options:["かかる時間","あるべき場所"], correctIndex:1, seconds:5},
          [
            "「wherever you like」 ignores that it was decided",
            "sitting down is not standing in position",
            "standing in the spot that was assigned",
            "leaving the grounds abandons the post"
          ]),

        q3("shrine-e03-q06", "reading", "w-seigen", 120,
          {jp:"【境内にお入りになる方へ】\n一度にお入りいただける人数　二百名\n今、境内にいらっしゃる方　　百九十名\n※ 二百名を超えないよう、入り口で制限をいたします。\n※ お出になった方の数だけ、新たにお入りいただけます。\n※ お子様も一名として数えます。\n大人二名とお子様一名の組がお待ちです。この組をお入れした後、まだ何名お入りいただけますか。"},
          {type:"evidence-choice", options:["三名","七名","十名","お入りいただけません"], correctIndex:1},
          {correct:"七名です。百九十名にこの組の三名を足して百九十三名ですから、二百名まであと七名です。",
           incorrect:"お子様も一名と数えます。百九十名にこの組の三名を足してから、二百名との差を出します。"},
          {prompt:"「制限」はどれのことですか。", options:["ここまでと決めること","いくらでも入れること"], correctIndex:0, seconds:5},
          [
            "three is the size of the waiting group, not what is left after them",
            "193 inside once the group is in, so seven more may enter",
            "ten is the room before this group is let in, not after",
            "there is room, so nobody is turned away"
          ])
      ]},

      {day:3, mode:"challenge", label:"火が近い", questions:[

        q3("shrine-e03-q07", "reading", "w-buji", 120,
          {jp:"【火を焚く間のお願い】\n火のそば　　三歩より内側には入らないでください\n風の強い日　火を焚く時間を短くします\n※ 火の粉が飛んだときは、すぐに知らせてください。\n※ お子様は、必ず大人が手を引いてください。\n※ 無事に終わるまで、係の者は持ち場を離れません。\n係の者が持ち場を離れてよいのは、いつですか。"},
          {type:"evidence-choice", options:["火が無事に終わってから","火の粉が飛んだとき","風が強くなったとき","お子様が来たとき"], correctIndex:0},
          {correct:"無事に終わってからです。それまで係は持ち場を離れません。",
           incorrect:"「無事に終わるまで離れません」と書いてあります。"},
          {prompt:"「無事」はどんな様子ですか。", options:["けがをした","何事もない"], correctIndex:1, seconds:5},
          [
            "only once the fire has safely finished",
            "flying sparks are a reason to stay and report",
            "strong wind shortens the fire, not the watch",
            "children arriving is a reason for more care, not less"
          ]),

        q3("shrine-e03-q08", "quick-response", "v-shitagau", 8,
          {jp:"お参りの方が、火の近くに入ろうとしています。係の者が止めています。何と言いますか。", audio:true},
          {type:"quick-response", options:["お好きにどうぞ。","私には分かりません。","早くお入りください。","係の指示に従ってください。"], correctIndex:3},
          {correct:"止められました。「従う」は、決まりや指示のとおりにすることです。",
           incorrect:"係が止めています。指示のとおりにしていただくよう伝えます。"},
          {prompt:"「従う」はどれのことですか。", options:["指示のとおりにする","自分で決める"], correctIndex:0, seconds:5},
          [
            "「as you like」 next to an open fire is not safe",
            "「I do not know」 when a marshal is right there",
            "waving them in is the opposite of what is needed",
            "asking them to follow the marshal's instruction"
          ]),

        q3("shrine-e03-q09", "listening-point", "w-tantou", 8,
          {jp:"コン：「あなたは鈴の担当です。」何をしますか。", audio:true},
          {type:"quick-response", options:["札を配ります。","太鼓を打ちます。","鈴の世話を受け持ちます。","火を焚きます。"], correctIndex:2},
          {correct:"分かりました。「担当」は、その仕事を受け持つことです。",
           incorrect:"「鈴の担当」ですから、鈴の世話を受け持ちます。"},
          {prompt:"「担当」はどれのことですか。", options:["見ているだけ","その仕事を受け持つ"], correctIndex:1, seconds:5},
          [
            "handing out tablets is a different post",
            "the drum is someone else's charge",
            "taking charge of the bell, which is what was assigned",
            "the fire has its own marshal"
          ]),

        q3("shrine-e03-q10", "integrated", "w-sekinin", 12,
          {jp:"鈴の綱が切れました。あなたの担当です。宮司さん：「どうしましたか。」何と言いますか。", audio:true},
          {type:"quick-response", options:["私の担当です。責任を持って直します。","気づきませんでした。","私は関わっていません。","誰かが切ったようです。"], correctIndex:0},
          {correct:"引き受けられました。「責任」は、自分がしたことの結果を引き受けることです。",
           incorrect:"あなたの担当です。人のせいにせず、直すと伝えます。"},
          {prompt:"「責任」はどれのことですか。", options:["人に任せること","結果を引き受けること"], correctIndex:1, seconds:8},
          [
            "owning the post and undertaking to put it right",
            "「I did not notice」 when it was yours to watch",
            "denying involvement in your own charge",
            "blaming an unknown someone dodges the post"
          ])
      ]}
    ]
  };

  var episode4 = {
    id:"shrine-e04",
    title:"後始末",
    sourceNote:NOTE4,
    intro:{jp:"コン：「火が落ちました。人も帰りました。ここからは、私たちだけの仕事です。灰を片付けて、境内を掃いて、夜が明けるまでに元へ戻します。」", audio:true},
    briefing:{jp:"コン：「これから、後始末をします。火のあとは、冷めるまで触れません。順を守ってください。読む問題は長いので、時間も長く取ってあります。間違えた仕事は、最後にもう一度だけ確認します。」", audio:true, points:RULES},
    days:[
      {day:1, mode:"learn", label:"火が落ちる", questions:[

        q4("shrine-e04-q01", "listening-task", "v-moyasu", 5,
          {jp:"コン：「古い札を燃やしてください。」何をしますか。", audio:true},
          {type:"quick-response", options:["水につけます。","火にくべて焼きます。","結び直します。","しまっておきます。"], correctIndex:1},
          {correct:"燃やせました。「燃やす」は、火をつけて焼くことです。",
           incorrect:"「燃やす」は、火をつけて焼くことです。"},
          {prompt:"「燃やす」はどれのことですか。", options:["火をつけて焼く","水につける"], correctIndex:0, seconds:5},
          [
            "soaking them does the opposite",
            "putting them in the fire, which is what 燃やす is",
            "retying them keeps them as they are",
            "storing them away is not burning them"
          ]),

        q4("shrine-e04-q02", "listening-point", "w-honoo", 8,
          {jp:"コン：「炎が高くなってきました。」何が高くなっていますか。", audio:true},
          {type:"quick-response", options:["立ちのぼる白い煙","積んだ灰","燃えて立ちのぼる火","石段"], correctIndex:2},
          {correct:"分かりました。「炎」は、燃えて立ちのぼる火そのもののことです。",
           incorrect:"「炎」は、燃え立つ火そのもののことです。煙とは違います。"},
          {prompt:"「炎」はどれのことですか。", options:["燃えた後の粉","燃え立つ火"], correctIndex:1, seconds:5},
          [
            "smoke is 煙, which is not the flame",
            "ash is what is left afterwards",
            "the flame itself, rising as it burns",
            "the stone steps do not rise"
          ]),

        q4("shrine-e04-q03", "listening-task", "w-kemuri", 5,
          {jp:"コン：「煙のほうへ立たないでください。」何を避けますか。", audio:true},
          {type:"quick-response", options:["燃えた後に残る粉","鈴の音","燃え立つ火","燃えるときに出る白いもの"], correctIndex:3},
          {correct:"避けられました。「煙」は、物が燃えるときに立ちのぼる白いもののことです。",
           incorrect:"「煙」は、燃えるときに立ちのぼるもののことです。火そのものは「炎」です。"},
          {prompt:"「煙」はどれのことですか。", options:["燃えるときに立つもの","燃え立つ火"], correctIndex:0, seconds:5},
          [
            "what is left behind is 灰",
            "the bell has nothing to do with it",
            "the flame itself is 炎",
            "the smoke that rises as things burn"
          ])
      ]},

      {day:2, mode:"practice", label:"灰を片付ける", questions:[

        q4("shrine-e04-q04", "listening-task", "w-hai", 5,
          {jp:"コン：「灰は冷めてから集めてください。」何を集めますか。", audio:true},
          {type:"quick-response", options:["燃えた後に残る粉","燃え立つ火","立ちのぼる煙","古い札"], correctIndex:0},
          {correct:"分かりました。「灰」は、物が燃えた後に残る粉のことです。",
           incorrect:"「灰」は、燃えた後に残る粉のことです。"},
          {prompt:"「灰」はどれのことですか。", options:["これから燃やすもの","燃えた後に残る粉"], correctIndex:1, seconds:5},
          [
            "the ash left once the fire has burnt down",
            "the flame is 炎, and it has gone out",
            "the smoke is 煙",
            "the old tablets were what was burnt"
          ]),

        q4("shrine-e04-q05", "listening-task", "v-haku", 5,
          {jp:"コン：「石段を掃いてください。」何をしますか。", audio:true},
          {type:"quick-response", options:["水で流します。","ほうきでごみを寄せます。","布で拭きます。","石を並べ直します。"], correctIndex:1},
          {correct:"掃けました。「掃く」は、ほうきでごみを寄せて取ることです。",
           incorrect:"「掃く」は、ほうきを使ってごみを寄せることです。布で拭くのとは違います。"},
          {prompt:"「掃く」はどれのことですか。", options:["ほうきで寄せる","布で拭く"], correctIndex:0, seconds:5},
          [
            "washing it down with water is a different job",
            "sweeping with a broom, which is what 掃く means",
            "wiping with a cloth is 拭く",
            "rearranging the stones is not cleaning"
          ]),

        q4("shrine-e04-q06", "quick-response", "v-chirakaru", 8,
          {jp:"宮司さん：「境内はどうなっていますか。」紙や竹があちこちに落ちています。何と言いますか。", audio:true},
          {type:"quick-response", options:["もう片付きました。","何も落ちていません。","まだ散らかっています。","掃く物がありません。"], correctIndex:2},
          {correct:"正直に伝えられました。「散らかる」は、物があちこちに乱れて落ちている状態です。",
           incorrect:"紙や竹が落ちています。まだ整っていないと伝えます。"},
          {prompt:"「散らかる」はどんな様子ですか。", options:["きちんと整っている","物が乱れて落ちている"], correctIndex:1, seconds:5},
          [
            "「it is done」 is not true yet",
            "there is paper and bamboo everywhere",
            "still a mess, which is what is actually on the ground",
            "there is plenty to sweep"
          ])
      ]},

      {day:3, mode:"challenge", label:"夜が明ける", questions:[

        q4("shrine-e04-q07", "text-grammar", "w-kaisan", 120,
          {jp:"【後始末の終わりについて】\n持ち場の片付けがすべて済んでから、（　　）といたします。\n※ 一つでも残っている持ち場があるうちは、（　　）いたしません。\n※ 早く済んだ方は、残っている持ち場を手伝ってください。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["集合","担当","制限","解散"], correctIndex:3},
          {correct:"「解散」です。集まっていた人が別れて帰ることです。",
           incorrect:"集まっていた人が別れて帰ることを表す言葉を選びます。"},
          {prompt:"「解散」はどれのことですか。", options:["別れて帰ること","集まること"], correctIndex:0, seconds:5},
          [
            "集合 is gathering, which happened at the start",
            "担当 is being in charge of something",
            "制限 is a limit on numbers",
            "解散 - breaking up and going home once everything is done"
          ]),

        q4("shrine-e04-q08", "text-grammar", "w-yoake", 120,
          {jp:"【明日の朝について】\n灰の片付けは、（　　）を待ってから行います。\n※ 暗いうちは、残り火が見えず危ないためです。\n※ 明るくなってから、係の者二名で行います。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["夜明け","深夜","日暮れ","昼過ぎ"], correctIndex:0},
          {correct:"「夜明け」です。夜が明けて明るくなるころのことです。",
           incorrect:"暗いうちは危ないと書いてあります。明るくなるころを選びます。"},
          {prompt:"「夜明け」はいつのことですか。", options:["日が沈むころ","夜が明けるころ"], correctIndex:1, seconds:5},
          [
            "夜明け - daybreak, when the embers become visible",
            "深夜 is the middle of the night, still dark",
            "日暮れ is dusk, when it gets dark",
            "昼過ぎ is the afternoon, long after they need to start"
          ]),

        q4("shrine-e04-q09", "reading", "w-dentou", 120,
          {jp:"【この祭りについて】\nこの祭りは三百年続いています。\n火を焚くこと、札を竹に結ぶこと、太鼓を先頭に歩くこと。\nこの三つは、始まったころから変わっていません。\n※ 灯りを電気にしたのは、五十年前からです。\n※ 行列の道は、町の造りが変わるたびに変えてきました。\n※ 変えていないものだけを「伝統」と呼んでいます。\nこの神社が「伝統」と呼んでいるのはどれですか。"},
          {type:"evidence-choice", options:["灯りと行列の道","火と札と太鼓","行列の道だけ","すべて"], correctIndex:1},
          {correct:"火と札と太鼓です。この三つだけが変わっていません。",
           incorrect:"変えていないものだけを「伝統」と呼ぶ、と書いてあります。"},
          {prompt:"「伝統」はどれのことですか。", options:["昔から変えずに続けてきたこと","今年から始めたこと"], correctIndex:0, seconds:5},
          [
            "the lights and the route are both things that changed",
            "the fire, the tablets and the drums - the three that never changed",
            "the route has been changed many times",
            "two of the items have changed"
          ]),

        q4("shrine-e04-q10", "integrated", "w-yakume", 12,
          {jp:"宮司さん：「灯守という名は、何を守る者という意味だと思いますか。」境内の灯りを絶やさぬよう見ているのが、あなたの仕事でした。何と言いますか。", audio:true},
          {type:"quick-response", options:["名前だけのものだと思います。","分かりません。","火を焚く者のことだと思います。","灯りを絶やさぬよう見るのが役目だと思います。"], correctIndex:3},
          {correct:"よく考えました。「役目」は、その人が受け持つべき務めのことです。",
           incorrect:"あなたがしてきた仕事がそのまま答えです。灯りを見ているのが役目です。"},
          {prompt:"「役目」はどれのことですか。", options:["受け持つべき務め","もらえるお金"], correctIndex:0, seconds:8},
          [
            "「just a name」 dismisses the question",
            "「I do not know」 after a night of doing exactly that",
            "tending the fire was someone else's post",
            "keeping the lights from going out - the job you have been doing"
          ])
      ]}
    ]
  };

  root.N2ShrineEpisodes = {
    key:"shrine",
    episodes:[episode1, episode2, episode3, episode4]
  };

  root.LanternEpisodeStages = root.LanternEpisodeStages || {};
  root.LanternEpisodeStages["shrine"] = root.N2ShrineEpisodes;
})(typeof self !== "undefined" ? self : this);
