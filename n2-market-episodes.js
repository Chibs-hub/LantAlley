/* 灯り市, four episodes, in the shared episode contract.
 *
 * The Inn is service you can see: a room, objects, a guest in front of you.
 * The market is service you have to count - prices, weights, change, a queue -
 * so its episodes lean on numbers and on reading what is written on a board.
 *
 * The four episodes are one evening in order: the stall opens (宵の値段), the
 * goods list is put right (品書き), the crowd arrives (人の波), and the stall
 * closes (店じまい). Each is ten questions in the contract's 3-3-4 shape.
 *
 * Written item types - 表記, 語形成, 文の組み立て, 文章の文法 - live in 品書き
 * for the same reason they live in the Inn's 予約帳: you cannot hear a spelling.
 */
(function(root){
  "use strict";

  var NOTE1 = "灯り市・第一話「宵の値段」";
  var NOTE2 = "灯り市・第二話「品書き」";
  var NOTE3 = "灯り市・第三話「人の波」";
  var NOTE4 = "灯り市・第四話「店じまい」";

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

  var episode1 = {
    id:"market-e01",
    title:"宵の値段",
    sourceNote:NOTE1,
    intro:{jp:"コン：「灯り市へようこそ。ここは夕方から夜だけの市です。店主は数を数えるのが忙しくて、手が足りません。今夜は値段と勘定の仕事です。」", audio:true},
    briefing:{
      jp:"コン：「これから一時間、店番を手伝ってください。お客様は急いでいますから、時間内に答えてください。私の話を聞いてから、時間が始まります。読む問題は長いので、二分あります。間違えた仕事は、最後にもう一度だけ確認します。」",
      audio:true,
      points:[
        "お客様は急いでいます。時間内に答えてください。",
        "音声は最後まで聞いてから、時間が始まります。",
        "読む問題は二分あります。短い返事は五秒です。",
        "もう一度聞きたいときは、スピーカーを押してください。",
        "間違えた仕事は、一時間の最後にもう一度出ます。"
      ]
    },
    days:[
      {day:1, mode:"learn", label:"店を開ける", questions:[

        q1("market-e01-q01", "quick-response", "w-nedan", 8,
          {jp:"この果実は一つ二百円です。お客様：「これはいくらですか。」何と言いますか。", audio:true},
          {type:"quick-response", options:["値段は分かりません。","値段は一つ二百円です。","もう終わりました。","重さを量ります。"], correctIndex:1},
          {correct:"お客様に値段が伝わりました。「値段」は、その品物がいくらかということです。",
           incorrect:"いくらかと聞かれています。値段をそのまま伝えます。"},
          {prompt:"「値段」はどれのことですか。", options:["いくらか","どこにあるか"], correctIndex:0, seconds:5},
          [
            "\"I do not know\" - the price is written on the stall",
            "the price, said plainly, which is what was asked for",
            "\"we are finished\" - the market has only just opened",
            "weighing it answers a different question"
          ]),

        q1("market-e01-q02", "listening-task", "v-hakaru-3", 5,
          {jp:"コン：「その果実の重さを量ってください。」何をしますか。", audio:true},
          {type:"quick-response", options:["値段を書きます。","袋に入れます。","はかりに載せます。","棚に戻します。"], correctIndex:2},
          {correct:"重さが分かりました。「量る」は、はかりで重さを調べることです。",
           incorrect:"重さを調べるよう頼まれました。はかりを使います。"},
          {prompt:"「量る」はどれのことですか。", options:["きれいに洗う","重さを調べる"], correctIndex:1, seconds:5},
          [
            "writing the price comes after the weight is known",
            "bagging it skips the weighing",
            "putting it on the scale, which is how weight is measured",
            "putting it back does not measure anything"
          ]),

        q1("market-e01-q03", "listening-task", "w-fukuro", 5,
          {jp:"コン：「お客様に袋をお渡ししてください。」何を渡しますか。", audio:true},
          {type:"quick-response", options:["お金","はかり","値段の札","物を入れる袋"], correctIndex:3},
          {correct:"袋をお渡ししました。「袋」は、物を入れて持ち帰るものです。",
           incorrect:"「袋」は、買った物を入れて持ち帰るものです。"},
          {prompt:"「袋」はどれのことですか。", options:["物を入れるもの","重さを調べるもの"], correctIndex:0, seconds:5},
          [
            "money is not what was asked for",
            "the scale stays at the stall",
            "the price tag is not something a customer carries goods in",
            "the bag the shopping goes home in"
          ])
      ]},

      {day:2, mode:"practice", label:"勘定台", questions:[

        q1("market-e01-q04", "quick-response", "w-ryougae", 8,
          {jp:"お客様：「一万円しかありません。」二百円の品物です。何と言いますか。", audio:true},
          {type:"quick-response", options:["両替してまいります。","そのままお受けします。","お売りできません。","重さを量ります。"], correctIndex:0},
          {correct:"小さいお金に替えてきます。「両替」は、お金を別の額のお金に替えることです。",
           incorrect:"釣り銭が足りません。まずお金を小さくします。"},
          {prompt:"「両替」はどれのことですか。", options:["品物を取り替える","お金を別の額に替える"], correctIndex:1, seconds:5},
          [
            "getting the note broken into smaller money",
            "taking it as it is leaves no change to give",
            "refusing the sale over change is not necessary",
            "weighing has nothing to do with the money"
          ]),

        q1("market-e01-q05", "listening-point", "w-kanjou", 8,
          {jp:"コン：「三番のお客様の勘定をお願いします。」何をしますか。", audio:true},
          {type:"quick-response", options:["市を閉めます。","買った物の代金を数えます。","品物を棚に並べます。","袋を配ります。"], correctIndex:1},
          {correct:"勘定ができました。「勘定」は、代金を数えて受け取ることです。",
           incorrect:"「勘定」は、買った物の代金を数えることです。"},
          {prompt:"「勘定」はどれのことですか。", options:["代金を数えること","品物を運ぶこと"], correctIndex:0, seconds:8},
          [
            "closing the market ends the evening",
            "totting up what they owe, which is what 勘定 is",
            "stocking the shelves is a different job",
            "handing out bags comes after the money"
          ]),

        q1("market-e01-q06", "reading", "w-goukei", 120,
          {jp:"【今夜の値札】\n果実　一つ　二百円\n弁当　一つ　六百円\n袋　一枚　十円\n※ 弁当を二つ以上お買いの方は、全部で百円お引きします。\n※ 袋は、お買い上げの品物の数にかかわらず一枚です。\nお客様は果実を三つと弁当を二つお買いになりました。袋も一枚お求めです。合計はいくらですか。"},
          {type:"evidence-choice", options:["千八百十円","千六百十円","千七百十円","千七百円"], correctIndex:2},
          {correct:"千七百十円です。果実六百円、弁当千二百円、袋十円から、百円お引きしました。",
           incorrect:"果実三つで六百円、弁当二つで千二百円、袋が十円です。そこから百円お引きします。"},
          {prompt:"「合計」はどれのことですか。", options:["一つ分の値段","全部を足した数"], correctIndex:1, seconds:5},
          [
            "this forgets the 100 off for buying two boxed lunches",
            "this takes 100 off twice",
            "600 for the fruit, 1200 for the boxes, 10 for the bag, minus the 100 discount",
            "this leaves the bag out"
          ])
      ]},

      {day:3, mode:"challenge", label:"客の波", questions:[

        q1("market-e01-q07", "reading", "w-junban", 120,
          {jp:"【お並びのお客様へ】\n一番　弁当を二つ　お待ちです\n二番　果実を五つ　お待ちです\n三番　両替だけ　お待ちです\n四番　弁当を一つ　お待ちです\n※ 両替だけのお客様は、品物をお待ちの方より先にご案内します。\n※ 品物をお待ちの方は、お並びの順にご案内します。\n次にご案内するのはどのお客様ですか。"},
          {type:"evidence-choice", options:["一番のお客様","二番のお客様","四番のお客様","三番のお客様"], correctIndex:3},
          {correct:"三番のお客様です。両替だけの方が先だと書いてあります。",
           incorrect:"両替だけのお客様を先にご案内する、と書いてあります。"},
          {prompt:"「順番」はどれのことですか。", options:["どちらが先かということ","いくらかということ"], correctIndex:0, seconds:5},
          [
            "first in line, but the notice overrides plain line order",
            "second in line, and not covered by the exception",
            "last in line for goods",
            "the money-changing customer, who the notice puts first"
          ]),


        q1("market-e01-q08", "quick-response", "w-urikire", 8,
          {jp:"弁当はもうありません。お客様：「弁当を一つください。」何と言いますか。", audio:true},
          {type:"quick-response", options:["申し訳ありません、売り切れです。","はい、すぐお持ちします。","値段は六百円です。","両替してまいります。"], correctIndex:0},
          {correct:"正直に伝えられました。「売り切れ」は、全部売れて残っていないことです。",
           incorrect:"弁当はもうありません。ないことを丁寧に伝えます。"},
          {prompt:"「売り切れ」はどんなときに使いますか。", options:["まだたくさんあるとき","全部売れてしまったとき"], correctIndex:1, seconds:5},
          [
            "sold out - saying so plainly and politely",
            "promising something the stall does not have",
            "the price of a thing that cannot be sold",
            "changing money answers a different request"
          ]),

        q1("market-e01-q09", "listening-task", "v-shiharau", 8,
          {jp:"コン：「倉庫から届いた分の代金を支払ってください。」何をしますか。", audio:true},
          {type:"quick-response", options:["お金を受け取ります。","お金を渡します。","品物を数えます。","袋に入れます。"], correctIndex:1},
          {correct:"代金を支払いました。「支払う」は、こちらからお金を渡すことです。",
           incorrect:"「支払う」は、こちらがお金を渡すほうです。受け取るのとは向きが逆です。"},
          {prompt:"「支払う」はどちらの向きですか。", options:["こちらが渡す","こちらが受け取る"], correctIndex:0, seconds:8},
          [
            "receiving money is the opposite direction",
            "handing the money over, which is what paying is",
            "counting the goods is not paying for them",
            "bagging them is a different job again"
          ]),

        q1("market-e01-q10", "integrated", "w-genkin", 12,
          {jp:"お客様：「後で払ってもいいですか。」この市は、その場でお金をいただく決まりです。何と言いますか。", audio:true},
          {type:"quick-response", options:["はい、後で結構です。","値段は分かりません。","売り切れです。","恐れ入りますが、現金でお願いしております。"], correctIndex:3},
          {correct:"決まりを丁寧に伝えられました。「現金」は、その場で渡すお金のことです。",
           incorrect:"その場でお金をいただく決まりです。それを丁寧に伝えます。"},
          {prompt:"「現金」はどれのことですか。", options:["その場で渡すお金","後で払う約束"], correctIndex:0, seconds:8},
          [
            "agreeing breaks the rule the stall runs on",
            "the price is not what was in doubt",
            "nothing here is sold out",
            "cash, on the spot, which is the rule here - said politely"
          ])
      ]}
    ]
  };

  var episode2 = {
    id:"market-e02",
    title:"品書き",
    sourceNote:NOTE2,
    intro:{jp:"コン：「お客様が引いたので、少し静かになりました。今のうちに品書きを直しましょう。今夜は書く仕事です。値札も、送り状も、字を間違えるとそのまま残ります。」", audio:true},
    briefing:{
      jp:"コン：「これから、品書きと送り状を正しくしてください。今は声がほとんど出ません。漢字の書き方、言葉の形、文の組み立て、そして文章の中の言葉を選びます。読む問題は長いので、時間も長く取ってあります。間違えた仕事は、最後にもう一度だけ確認します。」",
      audio:true,
      points:[
        "今は書く仕事です。声はほとんど出ません。",
        "かなで書いてある言葉を、正しい漢字で選びます。",
        "言葉の前や後ろにつく形を選びます。",
        "文を組み立てて、★の場所に入る言葉を選びます。",
        "間違えた仕事は、最後にもう一度出ます。"
      ]
    },
    days:[
      {day:1, mode:"learn", label:"値札を書く", questions:[

        q2("market-e02-q01", "orthography", "w-shouhin", 20,
          {jp:"棚に並べる（しょうひん）の札を書きます。（しょうひん）を漢字で書くと、どれになりますか。"},
          {type:"single-choice", options:["消品","賞品","商品","焼品"], correctIndex:2},
          {correct:"「商品」です。売るために置いてある品物のことです。",
           incorrect:"売るための品物なので、商いの「商」を使います。"},
          {prompt:"「商品」はどれのことですか。", options:["もらった賞","売るための品物"], correctIndex:1, seconds:5},
          [
            "消 is the 消 of 消える, to disappear",
            "賞品 is a prize, which is a different word",
            "商品 - goods put out to be sold",
            "焼 is the 焼 of grilling"
          ]),

        q2("market-e02-q02", "word-formation", "w-haitatsu", 20,
          {jp:"遠いお宅までお届けするときは、お金をいただきます。それを何と書きますか。「配達（　　）」の（　　）に入るのはどれですか。"},
          {type:"single-choice", options:["金","料","代","賃"], correctIndex:1},
          {correct:"「配達料」です。「料」は、そのために払うお金を表します。",
           incorrect:"そのためにいただくお金を表す形を選びます。"},
          {prompt:"「料」がついた言葉が表すのはどれですか。", options:["払うお金","運ぶ道具"], correctIndex:0, seconds:8},
          [
            "金 alone does not make a fee out of 配達",
            "料 - the fee charged for it, as in 送料 or 入場料",
            "代 attaches to goods, as in 品代, not to a service like this",
            "賃 is for hire and labour, as in 家賃 or 運賃"
          ]),

        q2("market-e02-q03", "sentence-building", "w-koukan", 30,
          {jp:"【傷んだ品物のお知らせ】\n傷んだ品物をお持ちのお客様に、新しい物とお取り替えできることを知らせます。次の文を正しく並べたとき、★に入るのはどれですか。\n傷んでいた品物は　＿　＿　★　＿　交換いたします。"},
          {type:"sentence-order", options:["お代を","新しい物と","お持ちくだされば","いただかずに"], correctIndex:0},
          {correct:"「お持ちくだされば新しい物とお代をいただかずに交換いたします」となります。★は「お代を」です。",
           incorrect:"「お持ちくだされば」「新しい物と」「お代を」「いただかずに」の順に並びます。★は三番目です。"},
          {prompt:"「交換する」はどれのことですか。", options:["代金を数える","別の物と取り替える"], correctIndex:1, seconds:5},
          [
            "お代を sits third, at the star, as the object of いただかずに",
            "新しい物と belongs second, naming what it is swapped for",
            "お持ちくだされば opens the sentence with the condition",
            "いただかずに comes last, just before 交換いたします"
          ])
      ]},

      {day:2, mode:"practice", label:"送り状", questions:[

        q2("market-e02-q04", "orthography", "w-souko", 20,
          {jp:"品物を置いてある（そうこ）から取ってきます。（そうこ）を漢字で書くと、どれになりますか。"},
          {type:"single-choice", options:["倉個","創庫","蔵庫","倉庫"], correctIndex:3},
          {correct:"「倉庫」です。品物をしまっておく建物のことです。",
           incorrect:"品物をしまっておく建物なので、「倉庫」と書きます。"},
          {prompt:"「倉庫」はどれのことですか。", options:["品物をしまう建物","お金を数える台"], correctIndex:0, seconds:5},
          [
            "個 is a counter, not part of this word",
            "創 is the 創 of 創る, to create",
            "蔵 is a storehouse too, but 蔵庫 is not the word",
            "倉庫 - the storehouse the stock comes from"
          ]),

        q2("market-e02-q05", "word-formation", "w-yuuryou", 20,
          {jp:"袋はただではありません。お金をいただきます。札には何と書きますか。「（　　）料」の（　　）に入るのはどれですか。"},
          {type:"single-choice", options:["未","無","有","別"], correctIndex:2},
          {correct:"「有料」です。「有」は、あることを表します。お金がかかる、ということです。",
           incorrect:"お金がかかるほうです。ないことを表す「無」とは逆の形を選びます。"},
          {prompt:"「有料」はどんなときに使いますか。", options:["ただのとき","お金がかかるとき"], correctIndex:1, seconds:5},
          [
            "未 marks something not yet done, which does not fit a price",
            "無 gives 無料, free of charge, which is the opposite",
            "有 - 有料, there is a charge for it",
            "別 would mean charged separately, which is not what the tag says"
          ]),

        q2("market-e02-q06", "text-grammar", "w-banchi", 90,
          {jp:"【送り状の書き方】\nお届け先は、町の名前だけでなく（　　）まで書いてください。\n※ 町の名前だけでは、同じ名前のお宅がいくつもあります。\n※ （　　）が分からないときは、お客様にその場で伺ってください。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["重さ","番地","種類","値段"], correctIndex:1},
          {correct:"「番地」です。町の名前の後につく、家の番号のことです。",
           incorrect:"同じ名前のお宅を見分けるものですから、家の番号を選びます。"},
          {prompt:"「番地」はどれのことですか。", options:["家の番号","品物の数"], correctIndex:0, seconds:5},
          [
            "the weight is on the parcel, not the address",
            "番地 - the house number that separates one address from another",
            "the kind of goods is not part of an address",
            "the price does not tell a delivery driver where to go"
          ])
      ]},

      {day:3, mode:"challenge", label:"帳面を閉じる", questions:[

        q2("market-e02-q07", "sentence-building", "w-yosan", 30,
          {jp:"【仕入れの相談】\n来月どれだけ仕入れられるかを、店主に伝えます。次の文を正しく並べたとき、★に入るのはどれですか。\n来月は　＿　＿　＿　★　仕入れられません。"},
          {type:"sentence-order", options:["これ以上","決まっていて","予算が","ないので"], correctIndex:0},
          {correct:"「予算が決まっていて、これ以上ないので仕入れられません」となります。★は「これ以上」です。",
           incorrect:"「予算が」「決まっていて」「ないので」…ではなく、「予算が」「決まっていて」「これ以上」「ないので」の順です。★は四番目のすぐ前、「これ以上」です。"},
          {prompt:"「予算」はどれのことですか。", options:["売れた数","使えるお金の見当"], correctIndex:1, seconds:8},
          [
            "これ以上 sits at the star, saying there is no more than this",
            "決まっていて follows 予算が, saying the budget is already set",
            "予算が opens the reason clause",
            "ないので comes last before 仕入れられません"
          ]),

        q2("market-e02-q08", "text-grammar", "w-waribiki", 90,
          {jp:"【今夜の札について】\n弁当を二つ以上お買いのお客様には、百円の（　　）をいたします。\n※ 一つだけお買いの場合は、（　　）はいたしません。\n※ 果実と合わせてお買いの場合も、弁当の数だけで数えます。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["配達","両替","交換","割引"], correctIndex:3},
          {correct:"「割引」です。決まった額を安くすることです。",
           incorrect:"百円安くする、という意味の言葉を選びます。"},
          {prompt:"「割引」はどれのことですか。", options:["値段を安くすること","品物を届けること"], correctIndex:0, seconds:5},
          [
            "配達 is delivering it, which costs money rather than saving it",
            "両替 is breaking a note into smaller money",
            "交換 is swapping one thing for another",
            "割引 - taking money off the price"
          ]),

        q2("market-e02-q09", "reading", "w-keisan", 120,
          {jp:"【今夜の帳面】\n果実　二百円　十二個　売れました\n弁当　六百円　四個　売れました\n袋　十円　九枚　売れました\n※ 弁当を二つ以上お買いのお客様が二組いらっしゃったので、百円ずつお引きしています。\n※ 袋の代金は、引く前の額に入れて数えます。\n今夜の売り上げを計算すると、いくらになりますか。"},
          {type:"evidence-choice", options:["五千八百三十円","五千七百三十円","五千六百三十円","五千五百三十円"], correctIndex:2},
          {correct:"五千六百三十円です。二千四百円と二千四百円と九十円を足して、二百円お引きしました。",
           incorrect:"果実で二千四百円、弁当で二千四百円、袋で九十円です。そこから百円ずつ二組分お引きします。"},
          {prompt:"「計算する」はどれのことですか。", options:["品物を運ぶこと","数を出すこと"], correctIndex:1, seconds:5},
          [
            "this takes off only one 100 discount",
            "this forgets one of the two discounts as well",
            "2400 + 2400 + 90, less 200 for the two discounted customers",
            "this takes off 300 instead of 200"
          ]),

        q2("market-e02-q10", "listening-task", "w-shurui", 8,
          {jp:"コン：「果実の種類ごとに分けて並べてください。」何をしますか。", audio:true},
          {type:"quick-response", options:["同じ果実どうしを集めます。","値段の高い順に並べます。","全部袋に入れます。","倉庫へ運びます。"], correctIndex:0},
          {correct:"種類ごとに分けられました。「種類」は、同じ性質のものの集まりのことです。",
           incorrect:"「種類ごとに」ですから、同じ果実どうしを集めます。"},
          {prompt:"「種類」はどれのことですか。", options:["値段の高さ","同じ性質のものの集まり"], correctIndex:1, seconds:5},
          [
            "grouping the same fruit together, which is what by kind means",
            "sorting by price is a different instruction",
            "bagging them all skips the sorting",
            "carrying them off does not sort anything"
          ])
      ]}
    ]
  };


  var episode3 = {
    id:"market-e03",
    title:"人の波",
    sourceNote:NOTE3,
    intro:{jp:"コン：「祭りの提灯がともりました。ここからが一番混みます。人の波の中では、聞き返している時間はありません。声をよく聞いて、すぐに動いてください。」", audio:true},
    briefing:{
      jp:"コン：「これから一時間、混んだ市を回します。お客様の声はいくつも重なりますから、私の言葉を最後まで聞いてから答えてください。品物をすすめる仕事もお願いします。間違えた仕事は、最後にもう一度だけ確認します。」",
      audio:true,
      points:[
        "人が多い時間です。時間内に答えてください。",
        "音声は最後まで聞いてから、時間が始まります。",
        "読む問題は二分あります。短い返事は五秒です。",
        "もう一度聞きたいときは、スピーカーを押してください。",
        "間違えた仕事は、一時間の最後にもう一度出ます。"
      ]
    },
    days:[
      {day:1, mode:"learn", label:"提灯がともる", questions:[

        q3("market-e03-q01", "quick-response", "w-konzatsu", 8,
          {jp:"店の前に人が集まって、通れなくなっています。店主：「今の様子はどうですか。」何と言いますか。", audio:true},
          {type:"quick-response", options:["誰もいません。","売り切れました。","静かになりました。","かなり混雑しています。"], correctIndex:3},
          {correct:"様子が伝わりました。「混雑」は、人や物が集まって込み合っていることです。",
           incorrect:"人が集まって通れないのですから、込み合っていると伝えます。"},
          {prompt:"「混雑」はどんな様子ですか。", options:["人が多くて込んでいる","人がいなくて静かだ"], correctIndex:0, seconds:5},
          [
            "\u300cthere is nobody\u300d contradicts what you can see",
            "sold out is about the goods, not the crowd",
            "quiet is the opposite of what was asked about",
            "crowded and hard to move through, which is what is in front of you"
          ]),

        q3("market-e03-q02", "listening-point", "w-gyouretsu", 8,
          {jp:"コン：「行列の最後尾に札を立ててください。」どこに立てますか。", audio:true},
          {type:"quick-response", options:["並んでいる人の一番後ろ","並んでいる人の一番前","店の中","倉庫の前"], correctIndex:0},
          {correct:"最後尾に立てられました。「行列」は、順番を待って並んでいる人の並びのことです。",
           incorrect:"「最後尾」は一番後ろです。行列の終わりに立てます。"},
          {prompt:"「行列」はどれのことですか。", options:["棚に置いた品物","並んで待っている人の並び"], correctIndex:1, seconds:5},
          [
            "the back of the queue, where a new arrival would join",
            "the front is where people are served, not where they join",
            "inside the stall is not part of the queue",
            "the storehouse is nowhere near the line"
          ]),

        q3("market-e03-q03", "quick-response", "v-susumeru", 8,
          {jp:"お客様：「どれがいいか分かりません。」今日は果実がとてもよく実っています。何と言いますか。", audio:true},
          {type:"quick-response", options:["ご自分でお選びください。","今日は果実がおすすめです。","どれも同じです。","分かりません。"], correctIndex:1},
          {correct:"お客様の助けになりました。「勧める」は、これがいいと相手に伝えることです。",
           incorrect:"迷っていらっしゃるのですから、いい品をこちらから伝えます。"},
          {prompt:"「勧める」はどれのことですか。", options:["これがいいと伝える","黙って待つ"], correctIndex:0, seconds:5},
          [
            "leaving them to it does not help someone who is stuck",
            "recommending the fruit, which is what a stall-keeper is for",
            "\u300cthey are all the same\u300d is not true and not helpful",
            "\u300cI do not know\u300d leaves the customer where they started"
          ])
      ]},

      {day:2, mode:"practice", label:"人が並ぶ", questions:[

        q3("market-e03-q04", "listening-task", "w-sentaku", 5,
          {jp:"コン：「お客様の選択を待ってください。」何をしますか。", audio:true},
          {type:"quick-response", options:["こちらで決めて渡します。","次のお客様を呼びます。","お客様が選ぶまで待ちます。","品物を片付けます。"], correctIndex:2},
          {correct:"待てました。「選択」は、いくつかの中から選ぶことです。",
           incorrect:"選ぶのはお客様です。決まるまで待ちます。"},
          {prompt:"「選択」はどれのことですか。", options:["代金を数えること","いくつかの中から選ぶこと"], correctIndex:1, seconds:5},
          [
            "deciding for them takes the choice away",
            "calling the next customer cuts this one off",
            "waiting while they choose, which is whose choice it is",
            "clearing the goods away removes what they are choosing from"
          ]),

        q3("market-e03-q05", "quick-response", "w-shinsen", 8,
          {jp:"今朝とれた果実です。お客様：「これは古くありませんか。」何と言いますか。", audio:true},
          {type:"quick-response", options:["分かりかねます。","売り切れです。","かなり前の物です。","今朝とれたばかりで、新鮮です。"], correctIndex:3},
          {correct:"安心していただけました。「新鮮」は、とれたてで古くないことです。",
           incorrect:"今朝とれた果実です。古くないことをそのまま伝えます。"},
          {prompt:"「新鮮」はどんな様子ですか。", options:["とれたてで古くない","何日もたっている"], correctIndex:0, seconds:5},
          [
            "\u300cI cannot say\u300d when you do know is not service",
            "sold out is about quantity, not freshness",
            "saying it is old is not true and loses the sale honestly earned",
            "picked this morning, so it is fresh - the true answer"
          ]),

        q3("market-e03-q06", "reading", "w-houfu", 120,
          {jp:"【今夜の品ぞろえ】\n果実　三十箱　ございます\n弁当　四つ　残っています\n袋　二百枚　ございます\n※ 十分な数がある品物には、札に「豊富」と書きます。\n※ 残りが五つより少ない品物には、札に「残りわずか」と書きます。\n※ 袋は品物ではありませんので、どちらの札もつけません。\n「豊富」の札をつけるのはどれですか。"},
          {type:"evidence-choice", options:["果実だけ","果実と袋","弁当だけ","果実と弁当"], correctIndex:0},
          {correct:"果実だけです。弁当は残りわずか、袋は品物ではないので札をつけません。",
           incorrect:"十分な数があるのは果実です。弁当は五つより少なく、袋は品物ではありません。"},
          {prompt:"「豊富」はどんな様子ですか。", options:["ほとんどない","たくさんある"], correctIndex:1, seconds:5},
          [
            "the fruit alone: thirty boxes is plenty",
            "bags are explicitly excluded from both labels",
            "four boxed lunches is fewer than five, so that is 残りわずか",
            "the boxed lunches do not qualify"
          ])
      ]},

      {day:3, mode:"challenge", label:"波が高い", questions:[

        q3("market-e03-q07", "reading", "w-fusoku", 120,
          {jp:"【明日の仕入れ】\n果実　今ある数　三十箱　　明日必要な数　二十箱\n弁当　今ある数　四つ　　　明日必要な数　二十四つ\n袋　　今ある数　二百枚　　明日必要な数　三百枚\n※ 今ある数が明日必要な数に足りないものを「不足」とします。\n※ 不足しているものだけ、今夜のうちに注文します。\n※ 果実は今夜のうちに傷むことがありますが、数には入れて数えます。\n今夜のうちに注文するのはどれですか。"},
          {type:"evidence-choice", options:["袋だけ","弁当と袋","三つとも","果実と弁当"], correctIndex:1},
          {correct:"弁当と袋です。果実は三十箱あって二十箱で足りますから、不足していません。",
           incorrect:"足りないものだけを選びます。果実は必要な数より多く残っています。"},
          {prompt:"「不足」はどんな様子ですか。", options:["足りない","余っている"], correctIndex:0, seconds:5},
          [
            "the bags are short, but so are the boxed lunches",
            "the boxed lunches and the bags, both short of tomorrow's need",
            "the fruit is the one item with enough",
            "the fruit is not short: thirty boxes against twenty needed"
          ]),

        q3("market-e03-q08", "listening-task", "v-kakaeru", 5,
          {jp:"コン：「その箱を抱えて運んでください。」どう持ちますか。", audio:true},
          {type:"quick-response", options:["指先でつまみます。","床を滑らせます。","両腕でかかえて持ちます。","肩に載せて持ちます。"], correctIndex:2},
          {correct:"抱えて運べました。「抱える」は、両腕で胸のあたりに抱くように持つことです。",
           incorrect:"「抱える」は、両腕で胸のあたりに持つことです。肩に載せるのとは違います。"},
          {prompt:"「抱える」はどう持つことですか。", options:["肩に載せて","両腕で胸のあたりに"], correctIndex:1, seconds:5},
          [
            "fingertips are for something small",
            "sliding it along the floor is not carrying it at all",
            "both arms around it, held against the chest",
            "on the shoulder is 担ぐ, a different way of carrying"
          ]),

        q3("market-e03-q09", "listening-task", "v-katsugu", 5,
          {jp:"コン：「その長い棒は担いでください。」どう持ちますか。", audio:true},
          {type:"quick-response", options:["両腕でかかえます。","袋に入れます。","はかりに載せます。","肩に載せて持ちます。"], correctIndex:3},
          {correct:"担げました。「担ぐ」は、肩に載せて運ぶことです。",
           incorrect:"「担ぐ」は肩に載せるほうです。両腕でかかえるのは「抱える」です。"},
          {prompt:"「担ぐ」はどう持つことですか。", options:["肩に載せて","両腕で胸に"], correctIndex:0, seconds:5},
          [
            "in both arms is 抱える, the word from a moment ago",
            "a pole does not go in a bag",
            "the scale weighs things, it does not carry them",
            "up on the shoulder, which is what a long pole needs"
          ]),

        q3("market-e03-q10", "integrated", "w-omotai", 12,
          {jp:"お客様は果実を十箱お買いになりました。お客様：「一人で持って帰れますか。」正直に答えます。何と言いますか。", audio:true},
          {type:"quick-response", options:["軽いので大丈夫です。","重たいので、お届けしましょうか。","お持ちになれません。","分かりません。"], correctIndex:1},
          {correct:"正直に伝えて、代わりの手も出せました。「重たい」は、持つのが大変なほど重いことです。",
           incorrect:"十箱は重たいはずです。正直に伝えて、届ける方法を出します。"},
          {prompt:"「重たい」はどんな様子ですか。", options:["持つのが大変だ","持つのが楽だ"], correctIndex:0, seconds:8},
          [
            "calling ten boxes light is not true",
            "honest about the weight, and offering delivery instead",
            "flatly telling a customer they cannot is not service",
            "\u300cI do not know\u300d when you can see the boxes is no answer"
          ])
      ]}
    ]
  };

  var episode4 = {
    id:"market-e04",
    title:"店じまい",
    sourceNote:NOTE4,
    intro:{jp:"コン：「提灯を落とす時間です。売れ残りを数えて、台を片付けて、帳面を閉じます。ここまでやって、やっと一日が終わります。」", audio:true},
    briefing:{
      jp:"コン：「これから、店じまいをします。残った品物を数えて、台をきれいにして、今夜の帳面を閉じてください。読む問題は長いので、時間も長く取ってあります。間違えた仕事は、最後にもう一度だけ確認します。」",
      audio:true,
      points:[
        "店を閉める仕事です。時間内に答えてください。",
        "音声は最後まで聞いてから、時間が始まります。",
        "読む問題は二分あります。短い返事は五秒です。",
        "もう一度聞きたいときは、スピーカーを押してください。",
        "間違えた仕事は、最後にもう一度出ます。"
      ]
    },
    days:[
      {day:1, mode:"learn", label:"売れ残りを数える", questions:[

        q4("market-e04-q01", "quick-response", "v-amaru", 8,
          {jp:"弁当を二十四つ作って、二十三つ売れました。店主：「弁当はどうなりましたか。」何と言いますか。", audio:true},
          {type:"quick-response", options:["一つ余りました。","一つ足りません。","二十四つ余りました。","全部売り切れました。"], correctIndex:0},
          {correct:"数が合いました。「余る」は、使い切らずに残ることです。",
           incorrect:"二十四つのうち二十三つ売れましたから、残りは一つです。"},
          {prompt:"「余る」はどんな様子ですか。", options:["足りなくなる","使い切らずに残る"], correctIndex:1, seconds:5},
          [
            "one left over, which is 24 minus 23",
            "short is the opposite: there were more than enough",
            "twenty-four left over would mean none sold at all",
            "sold out would mean none left"
          ]),

        q4("market-e04-q02", "listening-task", "v-tsumeru", 5,
          {jp:"コン：「残った果実を箱に詰めてください。」何をしますか。", audio:true},
          {type:"quick-response", options:["箱を捨てます。","果実を並べ直します。","値段を書きます。","箱にすき間なく入れます。"], correctIndex:3},
          {correct:"詰められました。「詰める」は、中にすき間なく入れることです。",
           incorrect:"「詰める」は、箱の中にすき間なく入れることです。"},
          {prompt:"「詰める」はどれのことですか。", options:["すき間なく入れる","外に出す"], correctIndex:0, seconds:5},
          [
            "throwing the box away leaves nothing to pack into",
            "rearranging them on the stall is not packing them",
            "writing prices is a job from the start of the evening",
            "packing them in tightly, which is what 詰める is"
          ]),

        q4("market-e04-q03", "listening-task", "v-tsumu", 5,
          {jp:"コン：「箱を三つまで積んでください。」何をしますか。", audio:true},
          {type:"quick-response", options:["箱を運び出します。","箱を横に並べます。","箱を上へ重ねます。","箱を開けます。"], correctIndex:2},
          {correct:"積めました。「積む」は、上へ重ねていくことです。",
           incorrect:"「積む」は、上へ重ねることです。横に並べるのとは違います。"},
          {prompt:"「積む」はどれのことですか。", options:["横に並べる","上へ重ねる"], correctIndex:1, seconds:5},
          [
            "carrying them out comes later",
            "side by side is 並べる, not 積む",
            "stacking them upward, three high",
            "opening them is a different action"
          ])
      ]},

      {day:2, mode:"practice", label:"台を片付ける", questions:[

        q4("market-e04-q04", "quick-response", "v-katazuku", 8,
          {jp:"台の上の品物を全部しまい終わりました。店主：「そちらはどうですか。」何と言いますか。", audio:true},
          {type:"quick-response", options:["品物が足りません。","こちらは片付きました。","混雑しています。","まだ始めていません。"], correctIndex:1},
          {correct:"報告できました。「片付く」は、散らかっていたものが整った状態になることです。",
           incorrect:"全部しまい終わったのですから、整ったと伝えます。"},
          {prompt:"「片付く」はどんな様子ですか。", options:["整った","散らかった"], correctIndex:0, seconds:5},
          [
            "running short is a different problem entirely",
            "cleared and in order, which is what has just happened",
            "the crowd has already gone home",
            "\u300cI have not started\u300d is not true"
          ]),

        q4("market-e04-q05", "listening-point", "w-hahen", 8,
          {jp:"コン：「割れた皿の破片に気をつけてください。」何に気をつけますか。", audio:true},
          {type:"quick-response", options:["割れて散らばったかけら","お客様の行列","まだ割れていない皿","売れ残った弁当"], correctIndex:0},
          {correct:"気をつけられました。「破片」は、割れて散らばった小さなかけらのことです。",
           incorrect:"「破片」は、割れた物の小さなかけらのことです。"},
          {prompt:"「破片」はどれのことですか。", options:["丸ごとの品物","割れたかけら"], correctIndex:1, seconds:5},
          [
            "the broken pieces scattered on the ground",
            "the queue has gone",
            "an unbroken plate is not a 破片",
            "leftover food is not what was warned about"
          ]),

        q4("market-e04-q06", "text-grammar", "w-shidai", 90,
          {jp:"【店じまいの手順】\n台の上を片付け（　　）、帳面をお持ちください。\n※ 片付けの途中で帳面を開くと、数が合わなくなります。\n※ 終わってから、その足でお持ちください。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["ながら","たびに","つつ","次第"], correctIndex:3},
          {correct:"「片付け次第」です。「次第」は、それが終わったらすぐに、ということを表します。",
           incorrect:"片付けの途中ではいけない、と書いてあります。終わったらすぐに、という形を選びます。"},
          {prompt:"「次第」はどれのことですか。", options:["終わったらすぐに","終わらないうちに"], correctIndex:0, seconds:8},
          [
            "ながら means while doing it, which the note forbids",
            "たびに means every time it happens, which does not fit once",
            "つつ is another while-doing form, forbidden for the same reason",
            "次第 - as soon as that is finished, which is what the note asks"
          ])
      ]},

      {day:3, mode:"challenge", label:"帳面を閉じる", questions:[

        q4("market-e04-q07", "text-grammar", "v-haraikomu", 90,
          {jp:"【売り上げの納め方】\n今夜の売り上げは、明日の朝までに店の口座へ（　　）ください。\n※ 手元に置いたままにしないでください。\n※ 明日の朝、口座の控えを店主にお見せください。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["受け取って","取り替えて","払い込んで","数え直して"], correctIndex:2},
          {correct:"「払い込んで」です。決まった先へお金を納めることです。",
           incorrect:"口座へお金を納めるのですから、それを表す言葉を選びます。"},
          {prompt:"「払い込む」はどれのことですか。", options:["お金を手元に置く","決まった先へお金を納める"], correctIndex:1, seconds:8},
          [
            "受け取る is receiving money, the wrong direction",
            "取り替える is swapping one thing for another",
            "払い込む - paying it into the account, as the note requires",
            "counting it again is not the same as banking it"
          ]),

        q4("market-e04-q08", "reading", "w-teido", 120,
          {jp:"【残った品物の扱い】\n果実　残り　二箱　　　傷みは少ない\n弁当　残り　一つ　　　今夜中に食べられる\n袋　　残り　百八十枚　傷みなし\n※ 傷みが少ない程度のものは、明日も並べます。\n※ 今夜中に食べられるものは、店の者で分けます。\n※ 袋は傷みませんので、そのまましまいます。\n明日また並べるのはどれですか。"},
          {type:"evidence-choice", options:["果実と弁当","果実だけ","弁当だけ","三つとも"], correctIndex:1},
          {correct:"果実だけです。弁当は今夜中に分け、袋はしまうだけです。",
           incorrect:"明日また並べるのは、傷みが少ない程度のものだけです。"},
          {prompt:"「程度」はどれのことですか。", options:["どのくらいかということ","どこにあるかということ"], correctIndex:0, seconds:5},
          [
            "the boxed lunch is eaten tonight, not shelved",
            "the fruit alone: its damage is slight, so it goes out again",
            "the fruit is the one that keeps",
            "the bags are only put away"
          ]),

        q4("market-e04-q09", "reading", "w-kaikei", 120,
          {jp:"【今夜の会計】\n売り上げ　五千六百三十円\n仕入れに払った額　二千円\n袋の仕入れに払った額　三百円\n※ 会計では、入ったお金から出たお金を引いた額を「今夜の残り」とします。\n※ 両替のために持ち出した千円は、そのまま戻していますので数えません。\n今夜の残りはいくらですか。"},
          {type:"evidence-choice", options:["三千三百三十円","四千三百三十円","三千六百三十円","二千三百三十円"], correctIndex:0},
          {correct:"三千三百三十円です。五千六百三十円から二千三百円を引きました。",
           incorrect:"入ったお金から出たお金を引きます。両替の千円は数えません。"},
          {prompt:"「会計」はどれのことですか。", options:["品物を運ぶこと","お金の出入りを整理すること"], correctIndex:1, seconds:5},
          [
            "5630 less 2300 in purchases; the 1000 for change came back",
            "this leaves out the 300 for bags",
            "this subtracts only the 2000",
            "this subtracts the 1000 that was returned"
          ]),

        q4("market-e04-q10", "integrated", "v-ureru", 12,
          {jp:"店主：「今夜はどうでしたか。」弁当は二十四つのうち二十三つ、果実は三十箱のうち二十八箱でした。何と言いますか。", audio:true},
          {type:"quick-response", options:["どちらも売れませんでした。","弁当だけ残りました。","どちらもよく売れました。","分かりません。"], correctIndex:2},
          {correct:"様子が伝わりました。「売れる」は、品物が客に買われていくことです。",
           incorrect:"ほとんど残っていないのですから、よく売れたと伝えます。"},
          {prompt:"「売れる」はどれのことですか。", options:["品物を仕入れる","品物が買われていく"], correctIndex:1, seconds:8},
          [
            "\u300cneither sold\u300d contradicts the numbers",
            "one boxed lunch left over is not \u300conly the lunches remained\u300d",
            "both sold well - 23 of 24 and 28 of 30",
            "\u300cI do not know\u300d when you have just counted them is no answer"
          ])
      ]}
    ]
  };

  root.N2MarketEpisodes = {
    key:"market",
    episodes:[episode1, episode2, episode3, episode4]
  };

  root.LanternEpisodeStages = root.LanternEpisodeStages || {};
  root.LanternEpisodeStages["market"] = root.N2MarketEpisodes;
})(typeof self !== "undefined" ? self : this);
