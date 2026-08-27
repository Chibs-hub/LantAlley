/* 夕月茶屋, four episodes, in the shared episode contract.
 *
 * The Inn is a room you put right; the market is a stall you count. A teahouse
 * is people: how you speak to them, how closely you watch them, and how much of
 * the work happens before anyone sits down. So these episodes lean on 敬語, on
 * reading a guest's state, and on the order jobs are done in.
 *
 * One evening in order: carrying and serving (お運び), putting the menu and the
 * house language right (品書きを直す), the busy stretch (混み合う夕), and closing
 * the place down (店を閉める).
 */
(function(root){
  "use strict";

  var NOTE1 = "夕月茶屋・第一話「お運び」";
  var NOTE2 = "夕月茶屋・第二話「品書きを直す」";
  var NOTE3 = "夕月茶屋・第三話「混み合う夕」";
  var NOTE4 = "夕月茶屋・第四話「店を閉める」";

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
    "お客様をお待たせしないでください。時間内に答えてください。",
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
    id:"teahouse-e01",
    title:"お運び",
    sourceNote:NOTE1,
    intro:{jp:"コン：「夕月茶屋です。女将さんは一人で切り盛りしていて、夕方は手が回りません。今夜はお運びを手伝ってください。お客様の前に出る仕事ですから、言葉に気をつけて。」", audio:true},
    briefing:{jp:"コン：「これから一時間、お運びをお願いします。お客様の前ですから、丁寧な言葉を使ってください。私の話を聞いてから、時間が始まります。間違えた仕事は、最後にもう一度だけ確認します。」", audio:true, points:RULES},
    days:[
      {day:1, mode:"learn", label:"のれんを出す", questions:[

        q1("teahouse-e01-q01", "quick-response", "w-ukagau", 8,
          {jp:"お客様が席におつきになりました。ご注文を聞きに行きます。何と言いますか。", audio:true},
          {type:"quick-response", options:["注文は何。","もう閉まりました。","お会計をお願いします。","ご注文を伺います。"], correctIndex:3},
          {correct:"丁寧に聞けました。「伺う」は、「聞く」「尋ねる」をへりくだって言う言葉です。",
           incorrect:"お客様の前です。「聞く」をへりくだった言い方にします。"},
          {prompt:"「伺う」はどんな言い方ですか。", options:["へりくだった言い方","くだけた言い方"], correctIndex:0, seconds:5},
          [
            "plain and abrupt - not something said to a guest",
            "the shop has only just opened",
            "asking for the bill before they have ordered",
            "the humble form of asking, which is what a server uses"
          ]),

        q1("teahouse-e01-q02", "listening-task", "w-kyakuseki", 5,
          {jp:"コン：「客席の様子を見てきてください。」どこを見ますか。", audio:true},
          {type:"quick-response", options:["お客様が座る場所","台所の中","店の外の道","二階の倉庫"], correctIndex:0},
          {correct:"見てこられました。「客席」は、お客様が座る場所のことです。",
           incorrect:"「客席」は、お客様が座る場所です。台所ではありません。"},
          {prompt:"「客席」はどこですか。", options:["料理を作る場所","お客様が座る場所"], correctIndex:1, seconds:5},
          [
            "where the guests sit, which is what 客席 names",
            "the kitchen is where the food is made, not where guests sit",
            "the street outside is not part of the shop",
            "the storeroom upstairs holds things, not guests"
          ]),

        q1("teahouse-e01-q03", "listening-task", "v-sosogu", 5,
          {jp:"コン：「お茶を注いでください。」何をしますか。", audio:true},
          {type:"quick-response", options:["茶碗を洗います。","茶碗にお茶を入れます。","お茶の葉を捨てます。","茶碗を運びます。"], correctIndex:1},
          {correct:"注げました。「注ぐ」は、液体を器に流し入れることです。",
           incorrect:"「注ぐ」は、液体を器に流し入れることです。"},
          {prompt:"「注ぐ」はどれのことですか。", options:["器に流し入れる","器を洗う"], correctIndex:0, seconds:5},
          [
            "washing the cup is a different job",
            "pouring the tea into the cup",
            "throwing the leaves out empties rather than fills",
            "carrying it comes after it is poured"
          ])
      ]},

      {day:2, mode:"practice", label:"こぼれる", questions:[

        q1("teahouse-e01-q04", "quick-response", "v-kobosu", 8,
          {jp:"お客様がお茶を畳の上にこぼしてしまいました。お客様は困った顔をしています。何と言いますか。", audio:true},
          {type:"quick-response", options:["こぼしましたね。","お代をいただきます。","すぐにお拭きしますので、そのままで。","気をつけてください。"], correctIndex:2},
          {correct:"お客様に恥をかかせずに片付けられました。「こぼす」は、液体を器の外へ落としてしまうことです。",
           incorrect:"お客様は困っていらっしゃいます。責めずに、こちらが動きます。"},
          {prompt:"「こぼす」はどれのことですか。", options:["器に入れる","液体を外へ落とす"], correctIndex:1, seconds:5},
          [
            "stating what they did helps nobody",
            "charging for it makes an accident worse",
            "taking care of it at once and telling them not to worry",
            "telling a guest to be careful blames them for an accident"
          ]),

        q1("teahouse-e01-q05", "listening-task", "w-zoukin", 5,
          {jp:"コン：「雑巾を持ってきてください。」何を持ってきますか。", audio:true},
          {type:"quick-response", options:["お客様の伝票","新しい茶碗","飲み物","拭くための布"], correctIndex:3},
          {correct:"持ってこられました。「雑巾」は、汚れを拭くための布のことです。",
           incorrect:"「雑巾」は、汚れを拭くための布です。"},
          {prompt:"「雑巾」はどれのことですか。", options:["拭くための布","飲むためのもの"], correctIndex:0, seconds:5},
          [
            "the bill is paperwork, not cleaning",
            "a fresh cup does not dry the tatami",
            "a drink is not what is needed on the floor",
            "the cloth used for wiping up"
          ]),

        q1("teahouse-e01-q06", "listening-task", "v-fuku", 5,
          {jp:"コン：「畳を拭いてください。」何をしますか。", audio:true},
          {type:"quick-response", options:["布でこすってきれいにします。","水をかけます。","そのままにします。","畳を上げます。"], correctIndex:0},
          {correct:"拭けました。「拭く」は、布でこすって汚れや水をとることです。",
           incorrect:"「拭く」は、布でこすって水や汚れをとることです。"},
          {prompt:"「拭く」はどれのことですか。", options:["水をかける","布でこすってとる"], correctIndex:1, seconds:5},
          [
            "wiping it with a cloth, which is what 拭く is",
            "pouring water on makes it wetter",
            "leaving it alone is not doing the job",
            "lifting the tatami is far more than was asked"
          ])
      ]},

      {day:3, mode:"challenge", label:"注文が重なる", questions:[

        q1("teahouse-e01-q07", "reading", "w-kondate", 120,
          {jp:"【今夜の献立】\n茶と菓子　　　　四百円\n茶と菓子と汁物　七百円\n汁物だけ　　　　四百円\n※ 汁物は、火を落とす八時までのご注文に限ります。\n※ 八時を過ぎたお客様には、茶と菓子だけをお出しします。\n※ お値段は変わりません。\n八時十分にいらしたお客様に、お出しできるのはどれですか。"},
          {type:"evidence-choice", options:["汁物だけ","茶と菓子","何もお出しできません","茶と菓子と汁物"], correctIndex:1},
          {correct:"茶と菓子です。八時を過ぎたので、汁物はお出しできません。",
           incorrect:"八時で火を落とします。汁物の入らないものを選びます。"},
          {prompt:"「献立」はどれのことですか。", options:["出すものの組み合わせ","お客様の名前"], correctIndex:0, seconds:5},
          [
            "soup alone is the one thing that has stopped",
            "tea and a sweet: the soup stops at eight",
            "the shop is still serving, just not soup",
            "the soup is off after eight"
          ]),

        q1("teahouse-e01-q08", "listening-task", "w-shoki", 5,
          {jp:"コン：「使い終わった食器を下げてください。」何を下げますか。", audio:true},
          {type:"quick-response", options:["のれん","座布団","使った茶碗や皿","お客様の荷物"], correctIndex:2},
          {correct:"下げられました。「食器」は、食べたり飲んだりするときに使う器のことです。",
           incorrect:"「食器」は、茶碗や皿のような、食事に使う器のことです。"},
          {prompt:"「食器」はどれのことですか。", options:["お客様の荷物","茶碗や皿"], correctIndex:1, seconds:5},
          [
            "the shop curtain stays where it is",
            "the cushions stay for the next guest",
            "the cups and plates that were used",
            "a guest's belongings are never cleared away"
          ]),

        q1("teahouse-e01-q09", "quick-response", "w-tsuika", 8,
          {jp:"お客様：「お茶をもう一つ、お願いします。」すでに一つお出ししています。何と言いますか。", audio:true},
          {type:"quick-response", options:["もうお出ししました。","お一つまでです。","お会計になさいますか。","追加ですね。かしこまりました。"], correctIndex:3},
          {correct:"承れました。「追加」は、あるものにさらに足すことです。",
           incorrect:"もう一つ足すご注文です。それを受けたことを伝えます。"},
          {prompt:"「追加」はどれのことですか。", options:["さらに足すこと","取り消すこと"], correctIndex:0, seconds:5},
          [
            "「we already served you」 refuses a normal request",
            "there is no one-cup rule at this shop",
            "moving to the bill cuts the visit short",
            "an addition to the order, taken politely"
          ]),

        q1("teahouse-e01-q10", "integrated", "w-kyoushuku", 12,
          {jp:"お客様を長くお待たせしてしまいました。お客様は何もおっしゃいません。何と言いますか。", audio:true},
          {type:"quick-response", options:["忙しかったので。","お待たせして恐縮です。","次からお早めに。","お待たせしました。"], correctIndex:1},
          {correct:"きちんとお詫びできました。「恐縮」は、申し訳なく思う気持ちを表す言葉です。",
           incorrect:"長くお待たせしたのですから、申し訳なく思う気持ちを言葉にします。"},
          {prompt:"「恐縮」はどんな気持ちですか。", options:["申し訳なく思う","うれしく思う"], correctIndex:0, seconds:8},
          [
            "explaining that you were busy is an excuse, not an apology",
            "a proper apology for the wait",
            "telling the guest to come earlier blames them",
            "「sorry to keep you」 alone is thin after a long wait"
          ])
      ]}
    ]
  };

  var episode2 = {
    id:"teahouse-e02",
    title:"品書きを直す",
    sourceNote:NOTE2,
    intro:{jp:"コン：「お客様が引きました。女将さんが、品書きと言葉遣いの書き付けを直してほしいそうです。今夜は書く仕事です。」", audio:true},
    briefing:{jp:"コン：「これから、品書きと店の書き付けを正しくしてください。漢字の書き方、言葉の形、文の組み立て、そして文章の中の言葉を選びます。間違えた仕事は、最後にもう一度だけ確認します。」", audio:true, points:WRITTEN_RULES},
    days:[
      {day:1, mode:"learn", label:"品書き", questions:[

        q2("teahouse-e02-q01", "orthography", "w-chawan", 20,
          {jp:"お茶を出す（ちゃわん）の数を書き入れます。（ちゃわん）を漢字で書くと、どれになりますか。"},
          {type:"single-choice", options:["茶碗","茶完","茶腕","茶椀"], correctIndex:0},
          {correct:"「茶碗」です。お茶やごはんを入れる器のことです。",
           incorrect:"器なので、石へんの「碗」を使います。"},
          {prompt:"「茶碗」はどれのことですか。", options:["お茶の葉","お茶を入れる器"], correctIndex:1, seconds:5},
          [
            "茶碗 - the bowl tea or rice is served in",
            "完 is the 完 of 完成, finishing",
            "腕 is the 腕 of an arm",
            "椀 is a wooden bowl; the tea bowl here is written with 碗"
          ]),

        q2("teahouse-e02-q02", "word-formation", "w-eigyou", 20,
          {jp:"今、店は開いています。表の札には何と書きますか。「営業（　　）」の（　　）に入るのはどれですか。"},
          {type:"single-choice", options:["前","済み","切れ","中"], correctIndex:3},
          {correct:"「営業中」です。「中」は、今その最中であることを表します。",
           incorrect:"今まさに開いているのですから、その最中を表す形を選びます。"},
          {prompt:"「中」がついた言葉が表すのはどれですか。", options:["今その最中だ","もう終わった"], correctIndex:0, seconds:8},
          [
            "前 would mean before opening, which is not now",
            "済み would mean the trading is over",
            "切れ is for something that has run out",
            "中 - open right now, the sign a shop hangs while trading"
          ]),

        q2("teahouse-e02-q03", "sentence-building", "w-henkou", 30,
          {jp:"【ご注文の書き付け】\nご注文を変えたいお客様がいらっしゃったときの書き方を決めます。次の文を正しく並べたとき、★に入るのはどれですか。\nお品が　＿　＿　★　＿　変更を承ります。"},
          {type:"sentence-order", options:["出る","いつでも","ご注文の","前でしたら"], correctIndex:2},
          {correct:"「お品が出る前でしたら、いつでもご注文の変更を承ります」となります。★は「ご注文の」です。",
           incorrect:"「出る」「前でしたら」「いつでも」「ご注文の」の順に並びます。★は四番目です。"},
          {prompt:"「変更」はどれのことですか。", options:["そのままにすること","決めたものを変えること"], correctIndex:1, seconds:5},
          [
            "出る comes first, attaching to お品が",
            "いつでも sits third, saying when",
            "ご注文の is at the star, attaching to 変更",
            "前でしたら follows 出る to make the condition"
          ])
      ]},

      {day:2, mode:"practice", label:"言葉を直す", questions:[

        q2("teahouse-e02-q04", "orthography", "w-seiketsu", 20,
          {jp:"台所は（せいけつ）にしておくよう書き入れます。（せいけつ）を漢字で書くと、どれになりますか。"},
          {type:"single-choice", options:["清結","清潔","晴潔","精潔"], correctIndex:1},
          {correct:"「清潔」です。汚れがなく、きれいなことです。",
           incorrect:"汚れがなくきれいなことなので、「清潔」と書きます。"},
          {prompt:"「清潔」はどんな様子ですか。", options:["汚れがなくきれいだ","散らかっている"], correctIndex:0, seconds:5},
          [
            "結 is the 結 of tying or concluding",
            "清潔 - clean, with no dirt on it",
            "晴 is the 晴 of fine weather",
            "精 is the 精 of 精神, spirit"
          ]),

        q2("teahouse-e02-q05", "word-formation", "w-yuge", 20,
          {jp:"熱い汁物から白く立ちのぼるものがあります。それを何と書きますか。「湯（　　）」の（　　）に入るのはどれですか。"},
          {type:"single-choice", options:["気","色","水","湯"], correctIndex:0},
          {correct:"「湯気」です。熱いものから立ちのぼる、白く見えるもののことです。",
           incorrect:"目に見える白いものですが、水ではありません。空気のほうの形を選びます。"},
          {prompt:"「湯気」はどれのことですか。", options:["器の底に残る水","熱いものから立つ白いもの"], correctIndex:1, seconds:5},
          [
            "気 - 湯気, the steam that rises from something hot",
            "色 would make it a colour",
            "水 would make it liquid water, not what rises off it",
            "湯 repeated is not a word"
          ]),

        q2("teahouse-e02-q06", "text-grammar", "w-kotobazukai", 90,
          {jp:"【お客様への（　　）について】\nお客様には、くだけた言い方ではなく、丁寧な（　　）を心がけてください。\n※ 親しいお客様にも、店では同じようにお願いします。\n※ 迷ったときは、女将さんの言い方をまねてください。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["客席","食器","献立","言葉遣い"], correctIndex:3},
          {correct:"「言葉遣い」です。どんな言葉をどう使うか、ということです。",
           incorrect:"丁寧かどうかが問われているのは、言葉の使い方です。"},
          {prompt:"「言葉遣い」はどれのことですか。", options:["言葉の使い方","料理の並べ方"], correctIndex:0, seconds:5},
          [
            "客席 is where they sit",
            "食器 is the tableware, not the speech",
            "献立 is what is served",
            "言葉遣い - how you speak to someone"
          ])
      ]},

      {day:3, mode:"challenge", label:"書き付けを閉じる", questions:[

        q2("teahouse-e02-q07", "sentence-building", "w-junjo", 30,
          {jp:"【お出しする順】\n何から先にお出しするかを書き留めます。次の文を正しく並べたとき、★に入るのはどれですか。\nお茶を　＿　＿　★　＿　順序でお出しします。　"},
          {type:"sentence-order", options:["先に","後から","菓子を","出し"], correctIndex:2},
          {correct:"「お茶を先に出し、菓子を後から出す順序でお出しします」となります。★は「菓子を」です。",
           incorrect:"「先に」「出し」「菓子を」「後から」の順に並びます。★は三番目です。"},
          {prompt:"「順序」はどれのことですか。", options:["いくつあるかということ","どちらが先かということ"], correctIndex:1, seconds:5},
          [
            "先に comes first, saying the tea goes out ahead",
            "後から follows 菓子を, saying the sweet comes later",
            "菓子を sits at the star, opening the second half",
            "出し joins the first clause to the second"
          ]),

        q2("teahouse-e02-q08", "text-grammar", "w-keigo", 90,
          {jp:"【店の決まり】\nお客様には、へりくだった言い方や尊敬の言い方、つまり（　　）をお使いください。\n※ 「見る」は「拝見する」、「聞く」は「伺う」と申します。\n※ 使い方に迷ったときは、そのままお客様に言わず、女将さんにお尋ねください。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["献立","敬語","湯気","順序"], correctIndex:1},
          {correct:"「敬語」です。相手を敬って使う言葉のことです。",
           incorrect:"へりくだった言い方や尊敬の言い方をまとめて言う言葉を選びます。"},
          {prompt:"「敬語」はどれのことですか。", options:["相手を敬って使う言葉","料理の名前"], correctIndex:0, seconds:5},
          [
            "献立 is the menu",
            "敬語 - the respectful language the examples belong to",
            "湯気 is steam",
            "順序 is the order things are done in"
          ]),

        q2("teahouse-e02-q09", "reading", "w-outai", 120,
          {jp:"【お客様の応対について】\n一　お見えになったら、まずお声をかけます\n二　お荷物が多いお客様には、置き場所をお伝えします\n三　お連れ様がいらっしゃるか伺います\n四　ご注文は、お連れ様がおそろいになってから伺います\n※ お一人でお見えのお客様には、三と四は行いません。\n※ お急ぎのお客様には、四を待たずにご注文を伺います。\nお一人でお見えになった、お急ぎのお客様には、何を行いますか。"},
          {type:"evidence-choice", options:["一と二","一と二と三","一だけ","一と二と四"], correctIndex:0},
          {correct:"一と二です。お一人ですから三と四は行わず、お急ぎですからなおさら待ちません。",
           incorrect:"お一人のお客様には三と四を行いません。残るのは一と二です。"},
          {prompt:"「応対」はどれのことですか。", options:["品物を数えること","人に受け答えすること"], correctIndex:1, seconds:5},
          [
            "one and two: three and four are skipped for a single guest",
            "three is skipped for someone on their own",
            "two still applies if they are carrying things",
            "four is skipped twice over here"
          ]),

        q2("teahouse-e02-q10", "listening-task", "w-uketamawaru", 8,
          {jp:"コン：「ご注文はあなたが承ってください。」何をしますか。", audio:true},
          {type:"quick-response", options:["女将さんに伝えます。","お茶を注ぎます。","お客様のご注文をお聞きします。","お会計をします。"], correctIndex:2},
          {correct:"承れました。「承る」は、「聞く」「引き受ける」をへりくだって言う言葉です。",
           incorrect:"「承る」は、こちらがお聞きして引き受けるという意味です。"},
          {prompt:"「承る」はどんな言い方ですか。", options:["相手を高める言い方","へりくだった言い方"], correctIndex:1, seconds:8},
          [
            "passing it to the proprietress is not taking it",
            "pouring tea comes after the order",
            "taking the order yourself, in humble language",
            "the bill comes at the end of the visit"
          ])
      ]}
    ]
  };


  var episode3 = {
    id:"teahouse-e03",
    title:"混み合う夕",
    sourceNote:NOTE3,
    intro:{jp:"コン：「祭りの帰りのお客様で、席が埋まりました。ここからは、お客様の様子をよく見てください。困っていらっしゃる方は、口に出さないことが多いのです。」", audio:true},
    briefing:{jp:"コン：「これから一時間、混んだ店を回します。お客様の様子を見て、先に気づいてください。聞き返す時間はありません。間違えた仕事は、最後にもう一度だけ確認します。」", audio:true, points:RULES},
    days:[
      {day:1, mode:"learn", label:"席が埋まる", questions:[

        q3("teahouse-e03-q01", "quick-response", "w-yousu", 8,
          {jp:"女将さん：「三番のお客様の様子はどうですか。」お客様は茶碗を空にして、何度も戸口のほうをご覧になっています。何と言いますか。", audio:true},
          {type:"quick-response", options:["まだ何も召し上がっていません。","お急ぎのご様子です。","おくつろぎのご様子です。","お休みになっています。"], correctIndex:1},
          {correct:"よく見ていました。「様子」は、外から見て分かるありさまのことです。",
           incorrect:"空の茶碗と戸口を気にするしぐさは、急いでいらっしゃる合図です。"},
          {prompt:"「様子」はどれのことですか。", options:["見て分かるありさま","名前や年齢"], correctIndex:0, seconds:5},
          [
            "the cup is empty, so they have eaten",
            "an empty cup and glances at the door: they are in a hurry",
            "someone relaxed does not keep watching the door",
            "they are wide awake and waiting"
          ]),

        q3("teahouse-e03-q02", "listening-point", "w-taido", 8,
          {jp:"コン：「お客様には、落ち着いた態度で。」何に気をつけますか。", audio:true},
          {type:"quick-response", options:["料理の値段","茶碗の数","振る舞い方","店の広さ"], correctIndex:2},
          {correct:"気をつけられました。「態度」は、人に対する振る舞い方や身構えのことです。",
           incorrect:"「態度」は、人に向かうときの振る舞い方のことです。"},
          {prompt:"「態度」はどれのことですか。", options:["品物の値段","人への振る舞い方"], correctIndex:1, seconds:5},
          [
            "prices are not a manner",
            "counting cups is a task, not a bearing",
            "how you carry yourself towards someone",
            "the size of the shop is not something you control"
          ]),

        q3("teahouse-e03-q03", "quick-response", "w-egao", 8,
          {jp:"女将さん：「お客様の前では笑顔で。」お客様がいらっしゃいました。何をしますか。", audio:true},
          {type:"quick-response", options:["下を向いて待ちます。","黙って席を指します。","急いで台所に入ります。","笑顔でお迎えします。"], correctIndex:3},
          {correct:"よい迎え方でした。「笑顔」は、笑っている顔つきのことです。",
           incorrect:"「笑顔で」と言われています。まず顔を上げて迎えます。"},
          {prompt:"「笑顔」はどれのことですか。", options:["笑っている顔","怒った顔"], correctIndex:0, seconds:5},
          [
            "looking down is the opposite of greeting someone",
            "pointing in silence is not a welcome",
            "disappearing into the kitchen leaves them at the door",
            "meeting them with a smile, which is what was asked"
          ])
      ]},

      {day:2, mode:"practice", label:"好みを聞く", questions:[

        q3("teahouse-e03-q04", "listening-task", "w-shokuyoku", 5,
          {jp:"コン：「あのお客様は食欲がないようです。」どういうことですか。", audio:true},
          {type:"quick-response", options:["食べたい気持ちが起きない","席が気に入らない","急いでいる","お金が足りない"], correctIndex:0},
          {correct:"分かりました。「食欲」は、食べたいと思う気持ちのことです。",
           incorrect:"「食欲」は、食べたいと思う気持ちのことです。"},
          {prompt:"「食欲」はどれのことですか。", options:["払うお金","食べたい気持ち"], correctIndex:1, seconds:5},
          [
            "no appetite: they do not feel like eating",
            "the seat is not what 食欲 is about",
            "being in a hurry is 様子, not appetite",
            "money is a different problem"
          ]),

        q3("teahouse-e03-q05", "quick-response", "w-nigate", 8,
          {jp:"お客様：「甘いものは苦手で。」菓子をお持ちしようとしていました。何と言いますか。", audio:true},
          {type:"quick-response", options:["甘いものしかございません。","では、塩味のものをお持ちしましょうか。","お残しください。","菓子はお出しします。"], correctIndex:1},
          {correct:"よく聞いていました。「苦手」は、うまくできない、あるいは好きになれないことです。",
           incorrect:"甘いものが苦手だとおっしゃっています。別のものをすすめます。"},
          {prompt:"「苦手」はどんな気持ちですか。", options:["好きになれない","とても好きだ"], correctIndex:0, seconds:5},
          [
            "「we only have sweets」 ignores what they just said",
            "offering something savoury instead, having listened",
            "telling them to leave it is not an answer",
            "serving it anyway is not listening at all"
          ]),

        q3("teahouse-e03-q06", "reading", "w-konomi", 120,
          {jp:"【お客様の好みの覚え】\n一番の常連さん　　茶は濃いめ　　菓子は塩味\n二番の常連さん　　茶は薄め　　　菓子は甘いもの\n三番の常連さん　　茶は濃いめ　　菓子はいらない\n※ お連れ様がいらっしゃるときは、お連れ様の分は伺ってからお出しします。\n※ 覚えのないお客様には、必ず伺ってからお出しします。\n一番の常連さんが、お連れ様と二人でいらっしゃいました。すぐにお出しできるのはどれですか。"},
          {type:"evidence-choice", options:["二人分の濃いめの茶","二人分の菓子","濃いめの茶と塩味の菓子を一人分","何もお出しできません"], correctIndex:2},
          {correct:"一人分だけです。お連れ様の分は伺ってからお出しします。",
           incorrect:"覚えがあるのは一番の常連さんの分だけです。お連れ様には伺います。"},
          {prompt:"「好み」はどれのことですか。", options:["その人の名前","その人が好きなやり方"], correctIndex:1, seconds:5},
          [
            "the companion's tea has to be asked about first",
            "the same goes for the sweets",
            "one serving, to the regular whose preference is known",
            "the regular's own order can go out straight away"
          ])
      ]},

      {day:3, mode:"challenge", label:"間違えない", questions:[

        q3("teahouse-e03-q07", "listening-task", "v-kurikaesu", 5,
          {jp:"コン：「ご注文を繰り返してください。」何をしますか。", audio:true},
          {type:"quick-response", options:["もう一度注文を聞きます。","台所へ走ります。","注文を書き直します。","聞いた注文をもう一度言います。"], correctIndex:3},
          {correct:"繰り返せました。「繰り返す」は、同じことをもう一度することです。",
           incorrect:"「繰り返す」は、同じことをもう一度することです。ここでは、聞いた注文をもう一度声に出します。"},
          {prompt:"「繰り返す」はどれのことですか。", options:["同じことをもう一度する","初めてすること"], correctIndex:0, seconds:5},
          [
            "asking again makes them repeat themselves",
            "running to the kitchen skips the check",
            "rewriting it does not let the guest hear it",
            "saying the order back, so the guest can catch a mistake"
          ]),

        q3("teahouse-e03-q08", "quick-response", "v-tashikameru", 8,
          {jp:"伝票の字が読みにくく、菓子が二つか三つか分かりません。何をしますか。", audio:true},
          {type:"quick-response", options:["お客様に確かめます。","多いほうでお出しします。","少ないほうでお出しします。","そのままにします。"], correctIndex:0},
          {correct:"確かめられました。「確かめる」は、はっきりするまで調べたり尋ねたりすることです。",
           incorrect:"どちらか分からないまま出すと、間違いになります。まず確かめます。"},
          {prompt:"「確かめる」はどれのことですか。", options:["そのままにする","はっきりするまで調べる"], correctIndex:1, seconds:5},
          [
            "asking the guest, which is the only way to know",
            "guessing high costs them money they did not agree to",
            "guessing low short-changes their order",
            "leaving it guarantees one of the two mistakes"
          ]),

        q3("teahouse-e03-q09", "listening-point", "w-shinchou", 8,
          {jp:"コン：「熱い汁物ですから、慎重に運んでください。」どう運びますか。", audio:true},
          {type:"quick-response", options:["急いで運びます。","よく気をつけて、ゆっくり運びます。","片手で運びます。","たくさん重ねて運びます。"], correctIndex:1},
          {correct:"慎重に運べました。「慎重」は、注意深く、軽々しく動かないことです。",
           incorrect:"「慎重に」は、注意深くという意味です。急ぐのとは逆です。"},
          {prompt:"「慎重」はどんな様子ですか。", options:["注意深い","思い切りがいい"], correctIndex:0, seconds:5},
          [
            "hurrying is the opposite of being careful",
            "carefully and slowly, which is what 慎重 asks for",
            "one hand with something hot is less careful, not more",
            "stacking them up makes a spill more likely"
          ]),

        q3("teahouse-e03-q10", "integrated", "w-manzoku", 12,
          {jp:"女将さん：「今夜のお客様は満足してくださったでしょうか。」茶碗も皿も空で、お帰りの際に礼を言われました。何と言いますか。", audio:true},
          {type:"quick-response", options:["分かりません。","お客様は召し上がりませんでした。","不満だったようです。","満足していただけたと思います。"], correctIndex:3},
          {correct:"よく見ていました。「満足」は、望みが満たされて不足のない気持ちのことです。",
           incorrect:"空の器と、帰り際のお礼が答えです。"},
          {prompt:"「満足」はどんな気持ちですか。", options:["足りていて不満がない","もの足りない"], correctIndex:0, seconds:8},
          [
            "「I do not know」 ignores what you saw",
            "the dishes were empty, so they did eat",
            "nothing suggests they were unhappy",
            "empty dishes and thanks at the door: they were satisfied"
          ])
      ]}
    ]
  };

  var episode4 = {
    id:"teahouse-e04",
    title:"店を閉める",
    sourceNote:NOTE4,
    intro:{jp:"コン：「のれんを下げました。ここからが長いのです。洗って、乾かして、明日の支度をして、当番を決めて、やっと終わりです。」", audio:true},
    briefing:{jp:"コン：「これから、店じまいと明日の支度をします。順を追ってお願いします。読む問題は長いので、時間も長く取ってあります。間違えた仕事は、最後にもう一度だけ確認します。」", audio:true, points:RULES},
    days:[
      {day:1, mode:"learn", label:"のれんを下げる", questions:[

        q4("teahouse-e04-q01", "quick-response", "w-yogosu", 8,
          {jp:"お客様のお召し物に汁が飛んでしまいました。何と言いますか。", audio:true},
          {type:"quick-response", options:["気をつけてください。","洗えば落ちます。","お召し物を汚してしまい、申し訳ございません。","何もありません。"], correctIndex:2},
          {correct:"すぐにお詫びできました。「汚す」は、きれいなものに汚れをつけてしまうことです。",
           incorrect:"こちらの手で汚してしまったのですから、まずお詫びします。"},
          {prompt:"「汚す」はどれのことですか。", options:["きれいにする","汚れをつけてしまう"], correctIndex:1, seconds:5},
          [
            "telling the guest to be careful blames them for your slip",
            "「it will wash out」 skips the apology",
            "apologising at once for having stained their clothes",
            "pretending nothing happened is worse still"
          ]),

        q4("teahouse-e04-q02", "listening-task", "v-kawakasu", 5,
          {jp:"コン：「洗った布巾を乾かしてください。」何をしますか。", audio:true},
          {type:"quick-response", options:["たたんでしまいます。","水気がなくなるまで干します。","もう一度洗います。","水につけます。"], correctIndex:1},
          {correct:"乾かせました。「乾かす」は、水気をなくすことです。",
           incorrect:"「乾かす」は、水気をなくすことです。ぬれたまましまうと傷みます。"},
          {prompt:"「乾かす」はどれのことですか。", options:["水気をなくす","水にぬらす"], correctIndex:0, seconds:5},
          [
            "folding them away wet is how cloths spoil",
            "hanging them until the water is gone",
            "washing again does not dry anything",
            "soaking them makes them wetter"
          ]),

        q4("teahouse-e04-q03", "listening-task", "v-shimeru", 5,
          {jp:"コン：「その布巾はまだ湿っています。」どういう状態ですか。", audio:true},
          {type:"quick-response", options:["少し水気が残っている","汚れている","からからに乾いている","破れている"], correctIndex:0},
          {correct:"分かりました。「湿る」は、少し水気を含んでいることです。",
           incorrect:"「湿る」は、少し水気が残っている状態のことです。"},
          {prompt:"「湿る」はどんな状態ですか。", options:["すっかり乾いている","少し水気がある"], correctIndex:1, seconds:5},
          [
            "still a little damp, not yet dry",
            "dirty is not the same as damp",
            "bone dry is the state it has not reached",
            "torn is a different problem"
          ])
      ]},

      {day:2, mode:"practice", label:"分けて配る", questions:[

        q4("teahouse-e04-q04", "listening-task", "v-wakeru", 5,
          {jp:"コン：「残った菓子を三人で分けてください。」何をしますか。", audio:true},
          {type:"quick-response", options:["全部一人で食べます。","捨てます。","明日まで置きます。","三つに切り分けます。"], correctIndex:3},
          {correct:"分けられました。「分ける」は、一つのものをいくつかに切り離すことです。",
           incorrect:"「三人で分けて」ですから、三つに切り離します。"},
          {prompt:"「分ける」はどれのことですか。", options:["いくつかに切り離す","一つにまとめる"], correctIndex:0, seconds:5},
          [
            "keeping them all is the opposite of sharing",
            "throwing them out wastes them",
            "leaving them until tomorrow ignores the instruction",
            "splitting them three ways, as asked"
          ]),

        q4("teahouse-e04-q05", "listening-task", "v-kubaru", 5,
          {jp:"コン：「分けた菓子をみんなに配ってください。」何をしますか。", audio:true},
          {type:"quick-response", options:["台所に置いておきます。","女将さんにまとめて渡します。","一人ずつに手渡します。","客席に並べます。"], correctIndex:2},
          {correct:"配れました。「配る」は、一人ずつに行き渡らせることです。",
           incorrect:"「配る」は、それぞれの人に行き渡らせることです。"},
          {prompt:"「配る」はどれのことですか。", options:["一か所に集める","一人ずつに行き渡らせる"], correctIndex:1, seconds:5},
          [
            "leaving them in the kitchen does not reach anyone",
            "giving them all to one person is not distributing",
            "handing one to each person",
            "the guests have gone home"
          ]),

        q4("teahouse-e04-q06", "listening-point", "w-moru", 8,
          {jp:"コン：「明日の分の菓子を、器に盛っておいてください。」何をしますか。", audio:true},
          {type:"quick-response", options:["器を洗っておきます。","器に見よく入れておきます。","菓子を数えます。","菓子を袋に入れます。"], correctIndex:1},
          {correct:"盛れました。「盛る」は、器に食べ物を入れて形を整えることです。",
           incorrect:"「盛る」は、器に食べ物を入れて整えることです。"},
          {prompt:"「盛る」はどれのことですか。", options:["器に入れて整える","器を洗う"], correctIndex:0, seconds:8},
          [
            "washing the dish leaves it empty",
            "arranging them in the dish ready for tomorrow",
            "counting them is not serving them",
            "a bag is not a serving dish"
          ])
      ]},

      {day:3, mode:"challenge", label:"明日の支度", questions:[

        q4("teahouse-e04-q07", "text-grammar", "w-shitaku", 90,
          {jp:"【明日の朝について】\n朝の（　　）は、店を開ける一時間前から始めます。\n※ 火をおこすところからですので、遅れると開店に間に合いません。\n※ 前の晩に器を出しておくと、（　　）が短くて済みます。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["支度","会計","休憩","応対"], correctIndex:0},
          {correct:"「支度」です。何かを始める前に整えておくことです。",
           incorrect:"店を開ける前に整えておくことを表す言葉を選びます。"},
          {prompt:"「支度」はどれのことですか。", options:["終わってから休むこと","前もって整えること"], correctIndex:1, seconds:5},
          [
            "支度 - getting ready before the shop opens",
            "会計 is the money side",
            "休憩 is the break, which is not what happens before opening",
            "応対 is dealing with guests, who have not arrived yet"
          ]),

        q4("teahouse-e04-q08", "text-grammar", "w-junbi", 90,
          {jp:"【祭りの日の（　　）】\n祭りの日は、いつもの倍のお客様がいらっしゃいます。\n※ 器も茶も、いつもの倍を前の日に出しておいてください。\n※ 人手が足りませんので、（　　）が済んでいないと店が回りません。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["変更","追加","休憩","準備"], correctIndex:3},
          {correct:"「準備」です。前もって整えておくことです。",
           incorrect:"前の日に済ませておくことを表す言葉を選びます。"},
          {prompt:"「準備」はどれのことですか。", options:["前もって整えること","後で片付けること"], correctIndex:0, seconds:5},
          [
            "変更 is changing something already decided",
            "追加 is adding to an order",
            "休憩 is a rest, not preparation",
            "準備 - the getting-ready that has to be done the day before"
          ]),

        q4("teahouse-e04-q09", "reading", "w-kyuukei", 120,
          {jp:"【明日の休みの取り方】\n朝の支度　　六時から七時\n店を開ける　七時\n昼の混み　　十一時から一時\n夕の混み　　五時から八時\n※ 休憩は、混み合う時間を外して一時間取ります。\n※ 支度と店を開ける時間には、休憩を入れません。\n※ 二人同時に休憩に入ることはできません。\n休憩を取れるのは、どの時間ですか。"},
          {type:"evidence-choice", options:["五時から八時の間","六時から七時の間","一時から五時の間","十一時から一時の間"], correctIndex:2},
          {correct:"一時から五時の間です。混み合う時間でも、支度の時間でもありません。",
           incorrect:"混み合う時間と支度の時間を外して探します。"},
          {prompt:"「休憩」はどれのことですか。", options:["前もって整えること","途中で休むこと"], correctIndex:1, seconds:5},
          [
            "five to eight is the evening rush",
            "six to seven is the preparation hour, explicitly excluded",
            "between one and five: the quiet stretch between the two rushes",
            "eleven to one is the lunch rush"
          ]),

        q4("teahouse-e04-q10", "integrated", "w-touban", 12,
          {jp:"女将さん：「明日の朝の当番はどなたですか。」書き付けには、あなたの名前が朝の欄にあります。何と言いますか。", audio:true},
          {type:"quick-response", options:["明日の朝は私が当番です。","当番は決まっていません。","誰でもいいと思います。","女将さんだと思います。"], correctIndex:0},
          {correct:"はっきり答えられました。「当番」は、順番でその仕事を受け持つことです。",
           incorrect:"書き付けの朝の欄にあなたの名前があります。そのまま答えます。"},
          {prompt:"「当番」はどれのことですか。", options:["休んでいる人","順番で受け持つ役"], correctIndex:1, seconds:8},
          [
            "you are, and the roster says so",
            "it is decided; your name is on it",
            "「anyone will do」 leaves the morning uncovered",
            "the roster names you, not the proprietress"
          ])
      ]}
    ]
  };

  root.N2TeaHouseEpisodes = {
    key:"tea-house",
    episodes:[episode1, episode2, episode3, episode4]
  };

  root.LanternEpisodeStages = root.LanternEpisodeStages || {};
  root.LanternEpisodeStages["tea-house"] = root.N2TeaHouseEpisodes;
})(typeof self !== "undefined" ? self : this);
