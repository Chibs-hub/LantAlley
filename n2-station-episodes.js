/* 路地駅, four episodes, in the shared episode contract.
 *
 * The station is the one place in the alley where being wrong costs someone
 * their night: a passenger sent to the wrong platform misses the last train
 * home. So these episodes are about precision under a clock - up line against
 * down line, which announcement applies to whom, and what a notice actually
 * says rather than what it seems to say.
 *
 * One night in order: guiding people to the last trains (終電まで), putting the
 * ticket window's paperwork right (窓口の書き付け), working through the
 * announcements when the trains go wrong (放送が鳴る), and the lost property
 * left behind when the last train has gone (忘れ物).
 */
(function(root){
  "use strict";

  var NOTE1 = "路地駅・第一話「終電まで」";
  var NOTE2 = "路地駅・第二話「窓口の書き付け」";
  var NOTE3 = "路地駅・第三話「放送が鳴る」";
  var NOTE4 = "路地駅・第四話「忘れ物」";

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
    "お客様は電車を待っています。時間内に答えてください。",
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
    id:"station-e01",
    title:"終電まで",
    sourceNote:NOTE1,
    intro:{jp:"コン：「路地駅です。祭りの帰りで、今夜は終電までずっと混みます。駅員さんは一人しかいません。行き先を間違えて教えると、その方は今夜帰れません。気をつけて。」", audio:true},
    briefing:{jp:"コン：「これから一時間、案内を手伝ってください。乗客は急いでいますから、時間内に答えてください。分からないまま答えるより、確かめるほうが早いこともあります。間違えた仕事は、最後にもう一度だけ確認します。」", audio:true, points:RULES},
    days:[
      {day:1, mode:"learn", label:"改札に立つ", questions:[

        q1("station-e01-q01", "quick-response", "w-joukyaku", 8,
          {jp:"駅員さん：「今夜の乗客は多いですか。」改札の前に人が並んでいます。何と言いますか。", audio:true},
          {type:"quick-response", options:["電車が来ません。","切符が売り切れました。","乗客は一人もいません。","乗客がとても多いです。"], correctIndex:3},
          {correct:"様子が伝わりました。「乗客」は、乗り物に乗る客のことです。",
           incorrect:"改札の前に人が並んでいます。乗る人が多いと伝えます。"},
          {prompt:"「乗客」はどれのことですか。", options:["乗り物に乗る客","駅で働く人"], correctIndex:0, seconds:5},
          [
            "the trains are not the question",
            "tickets are a different matter",
            "there is a line of people at the gate",
            "a lot of passengers, which is what the queue shows"
          ]),

        q1("station-e01-q02", "listening-task", "w-kaisatsu", 5,
          {jp:"コン：「改札に立ってください。」どこに立ちますか。", audio:true},
          {type:"quick-response", options:["切符を見せて通る所","切符を買う所","荷物を置く所","電車に乗る所"], correctIndex:0},
          {correct:"立てました。「改札」は、切符を確かめて通す所のことです。",
           incorrect:"「改札」は、切符を見せて通る所のことです。"},
          {prompt:"「改札」はどこですか。", options:["電車が止まる所","切符を確かめる所"], correctIndex:1, seconds:5},
          [
            "the gate where tickets are checked",
            "the window is where tickets are bought",
            "luggage has its own place",
            "the platform is where you board"
          ]),

        q1("station-e01-q03", "listening-point", "w-hougaku", 8,
          {jp:"コン：「あのお客様に、駅の方向をお伝えしてください。」何を伝えますか。", audio:true},
          {type:"quick-response", options:["何時に着くか","どちらへ向かうか","誰が乗るか","いくらかかるか"], correctIndex:1},
          {correct:"伝えられました。「方向」は、どちらへ向かうかということです。",
           incorrect:"「方向」は、どちらへ向かうかということです。"},
          {prompt:"「方向」はどれのことですか。", options:["どちらへ向かうか","いくらかかるか"], correctIndex:0, seconds:5},
          [
            "the time is a when, not a which way",
            "which way to head, which is what a direction is",
            "who is travelling is a different question",
            "the fare is a price, not a direction"
          ])
      ]},

      {day:2, mode:"practice", label:"上りと下り", questions:[

        q1("station-e01-q04", "listening-task", "w-nobori", 5,
          {jp:"コン：「上りの電車は二番線です。」上りとはどちらのことですか。", audio:true},
          {type:"quick-response", options:["来ない電車","都心から離れる電車","都心へ向かう電車","止まっている電車"], correctIndex:2},
          {correct:"分かりました。「上り」は、中心の町へ向かう電車のことです。",
           incorrect:"「上り」は、中心の町へ向かうほうです。離れるほうは「下り」です。"},
          {prompt:"「上り」はどちらですか。", options:["中心から離れる","中心へ向かう"], correctIndex:1, seconds:5},
          [
            "a train that does not come has no direction",
            "away from the centre is 下り",
            "towards the central city, which is what 上り means",
            "standing still is not a direction"
          ]),

        q1("station-e01-q05", "listening-task", "w-kudari", 5,
          {jp:"コン：「このお客様は下りです。」どちらへ向かうお客様ですか。", audio:true},
          {type:"quick-response", options:["中心へ向かうほう","駅の外","改札の中","中心から離れるほう"], correctIndex:3},
          {correct:"分かりました。「下り」は、中心の町から離れていく電車のことです。",
           incorrect:"「下り」は中心から離れるほうです。向かうほうは「上り」です。"},
          {prompt:"「下り」はどちらですか。", options:["中心から離れる","中心へ向かう"], correctIndex:0, seconds:5},
          [
            "towards the centre is 上り, the word just before this",
            "leaving the station is not a train direction",
            "inside the gate is a place, not a direction",
            "away from the centre, which is 下り"
          ]),

        q1("station-e01-q06", "quick-response", "w-hasha-2", 8,
          {jp:"お客様：「次の電車はいつ出ますか。」時刻表には十時四十分と書いてあります。何と言いますか。", audio:true},
          {type:"quick-response", options:["発車は十時四十分です。","もう出ました。","分かりません。","二番線です。"], correctIndex:0},
          {correct:"伝えられました。「発車」は、乗り物が出ていくことです。",
           incorrect:"時刻表に書いてあります。出る時刻をそのまま伝えます。"},
          {prompt:"「発車」はどれのことですか。", options:["乗り物が着くこと","乗り物が出ること"], correctIndex:1, seconds:5},
          [
            "the departure time, read off the timetable",
            "「it has already gone」 is not what the timetable says",
            "「I do not know」 when it is written in front of you",
            "the platform number answers a different question"
          ])
      ]},

      {day:3, mode:"challenge", label:"終電が近い", questions:[

        q1("station-e01-q07", "reading", "w-jikoku", 120,
          {jp:"【今夜の時刻表】\n上り　十時四十分　　十一時十分　　十一時四十分\n下り　十時五十分　　十一時二十分　　十一時五十分\n※ 十一時四十分の上りは、祭りの日だけの臨時です。\n※ 臨時の電車は、乗車券のほかに何もいりません。\n※ 下りの最後は十一時五十分です。\n十一時二十分に、上りにお乗りになりたいお客様がいらっしゃいました。何時の電車をご案内しますか。"},
          {type:"evidence-choice", options:["十一時十分","十一時四十分","十一時五十分","十時四十分"], correctIndex:1},
          {correct:"十一時四十分です。臨時ですが、乗車券だけで乗れます。",
           incorrect:"十一時二十分より後で、上りの電車を探します。"},
          {prompt:"「時刻」はどれのことですか。", options:["何時何分ということ","どこ行きかということ"], correctIndex:0, seconds:5},
          [
            "11:10 has already gone by 11:20",
            "11:40, the next up-train after 11:20",
            "11:50 is a down-train, not an up-train",
            "10:40 was over an hour earlier"
          ]),

        q1("station-e01-q08", "reading", "w-saishuu", 120,
          {jp:"【最終電車のお知らせ】\n上りの最終　十一時四十分\n下りの最終　十一時五十分\n※ 最終電車は、いつもより二両少なくなります。\n※ 最終電車を逃した方のために、駅の待合室を朝まで開けています。\n※ 待合室は、お一人でも空いています。\n十一時四十五分に、上りにお乗りになりたい方がいらっしゃいました。何をご案内しますか。"},
          {type:"evidence-choice", options:["十一時五十分の電車をご案内します","次の上りをお待ちいただきます","待合室をご案内します","改札の外へお出しします"], correctIndex:2},
          {correct:"待合室です。上りの最終はもう出てしまいました。",
           incorrect:"上りの最終は十一時四十分です。もう出ています。"},
          {prompt:"「最終」はどれのことですか。", options:["いちばん初めの","いちばん終わりの"], correctIndex:1, seconds:5},
          [
            "11:50 is the down-train, going the wrong way for them",
            "there is no next up-train tonight",
            "the waiting room, which the notice opens for exactly this",
            "putting them out of the station strands them"
          ]),

        q1("station-e01-q09", "listening-task", "w-jousha", 5,
          {jp:"コン：「ご乗車はお早めに。」お客様に何をお願いしていますか。", audio:true},
          {type:"quick-response", options:["早く切符を買うこと","早く駅を出ること","早く並ぶこと","早く電車に乗ること"], correctIndex:3},
          {correct:"分かりました。「乗車」は、乗り物に乗ることです。",
           incorrect:"「乗車」は、乗り物に乗ることです。"},
          {prompt:"「乗車」はどれのことですか。", options:["乗り物に乗る","乗り物から降りる"], correctIndex:0, seconds:5},
          [
            "buying a ticket comes before boarding",
            "leaving the station is the opposite of boarding",
            "queueing is not the same as getting on",
            "boarding the train promptly"
          ]),

        q1("station-e01-q10", "integrated", "w-gesha", 12,
          {jp:"お客様：「一つ手前で降りたいのですが、切符はこのままでいいですか。」手前で降りると運賃は安くなります。何と言いますか。", audio:true},
          {type:"quick-response", options:["下車はできません。","下車は手前でも構いませんが、差額はお返しできません。","切符を買い直してください。","そのままで結構です、お返しします。"], correctIndex:1},
          {correct:"正直に伝えられました。「下車」は、乗り物から降りることです。",
           incorrect:"手前で降りること自体はできます。ただ、差額は戻りません。それを正直に伝えます。"},
          {prompt:"「下車」はどれのことですか。", options:["乗り物から降りる","乗り物に乗る"], correctIndex:0, seconds:8},
          [
            "getting off early is not forbidden",
            "getting off early is allowed, but the difference is not refunded",
            "making them buy again is worse, not better",
            "promising a refund that the rules do not give"
          ])
      ]}
    ]
  };

  var episode2 = {
    id:"station-e02",
    title:"窓口の書き付け",
    sourceNote:NOTE2,
    intro:{jp:"コン：「終電が出ました。今度は窓口の書き付けです。駅の紙は、書き間違えるとそのまま人が動いてしまいます。丁寧にお願いします。」", audio:true},
    briefing:{jp:"コン：「これから、窓口の書き付けを正しくしてください。漢字の書き方、言葉の形、文の組み立て、そして文章の中の言葉を選びます。間違えた仕事は、最後にもう一度だけ確認します。」", audio:true, points:WRITTEN_RULES},
    days:[
      {day:1, mode:"learn", label:"札を書く", questions:[

        q2("station-e02-q01", "orthography", "w-senro", 20,
          {jp:"（せんろ）に立ち入らないよう、札を書きます。（せんろ）を漢字で書くと、どれになりますか。"},
          {type:"single-choice", options:["線路","先路","線露","戦路"], correctIndex:0},
          {correct:"「線路」です。電車が走る道のことです。",
           incorrect:"電車が走る道なので、「線路」と書きます。"},
          {prompt:"「線路」はどれのことですか。", options:["切符を買う所","電車が走る道"], correctIndex:1, seconds:5},
          [
            "線路 - the track a train runs on",
            "先 is the 先 of ahead or previous",
            "露 is the 露 of dew",
            "戦 is the 戦 of a battle"
          ]),

        q2("station-e02-q02", "word-formation", "w-katamichi", 20,
          {jp:"帰りの分は要らないお客様の切符です。札には何と書きますか。「（　　）道」の（　　）に入るのはどれですか。"},
          {type:"single-choice", options:["一","半","単","片"], correctIndex:3},
          {correct:"「片道」です。行きだけ、帰りは含まないという意味です。",
           incorrect:"行きだけで帰りを含まない切符のことです。「往復」と対になる形を選びます。"},
          {prompt:"「片道」はどれのことですか。", options:["行きだけ","行きと帰り"], correctIndex:0, seconds:5},
          [
            "一 would be counting one road, not travelling one way",
            "半 would be half of the distance, not one direction of it",
            "単 appears in 単数 and 単語, not in this word",
            "片 - 片道, one way, the pair to 往復"
          ]),

        q2("station-e02-q03", "sentence-building", "w-tetsuzuki", 30,
          {jp:"【定期券のご案内】\n定期券を買うお客様に、何が要るかをお知らせします。次の文を正しく並べたとき、★に入るのはどれですか。\n定期券は　＿　＿　★　＿　お済ませください。"},
          {type:"sentence-order", options:["手続きを","お使いになる","前日までに","窓口で"], correctIndex:2},
          {correct:"「お使いになる前日までに窓口で手続きをお済ませください」となります。★は「前日までに」です。",
           incorrect:"「お使いになる」「前日までに」「窓口で」「手続きを」の順に並びます。★は二番目です。"},
          {prompt:"「手続き」はどれのことですか。", options:["乗り物の名前","決められた順の作業"], correctIndex:1, seconds:5},
          [
            "手続きを is the object, just before お済ませください",
            "お使いになる opens the sentence, attaching to 前日",
            "前日までに sits second, at the star, saying by when",
            "窓口で says where, and comes third"
          ])
      ]},

      {day:2, mode:"practice", label:"窓口を直す", questions:[

        q2("station-e02-q04", "orthography", "w-madoguchi", 20,
          {jp:"切符を売る（まどぐち）の場所を書き入れます。（まどぐち）を漢字で書くと、どれになりますか。"},
          {type:"single-choice", options:["間戸口","窓口","窓門","窓後"], correctIndex:1},
          {correct:"「窓口」です。客と係の人がやりとりする小さな窓のことです。",
           incorrect:"客と係がやりとりする窓なので、「窓口」と書きます。"},
          {prompt:"「窓口」はどれのことですか。", options:["やりとりをする窓","電車が走る道"], correctIndex:0, seconds:5},
          [
            "間戸口 is not a word",
            "窓口 - the ticket window",
            "門 is a gate, which is a different thing again",
            "後 is the 後 of afterwards"
          ]),

        q2("station-e02-q05", "word-formation", "w-tsuukin", 20,
          {jp:"毎朝、仕事のために電車で通う方の定期券です。札には何と書きますか。「（　　）勤」の（　　）に入るのはどれですか。"},
          {type:"single-choice", options:["通","出","往","上"], correctIndex:0},
          {correct:"「通勤」です。仕事のために毎日通うことです。",
           incorrect:"毎日通うことを表す形を選びます。学校なら「通学」です。"},
          {prompt:"「通勤」はどれのことですか。", options:["旅に出ること","仕事のために通うこと"], correctIndex:1, seconds:5},
          [
            "通 - 通勤, travelling to work regularly, paired with 通学",
            "出勤 is arriving at work on a given day, not the commute itself",
            "往 appears in 往復, a round trip",
            "上 gives 上り, the up-train"
          ]),

        q2("station-e02-q06", "text-grammar", "w-kinyuu", 90,
          {jp:"【定期券のお申し込み】\nお名前とご住所を、この用紙に（　　）してください。\n※ 鉛筆ではなく、消えない筆記具をお使いください。\n※ 書き損じた場合は、新しい用紙に初めから（　　）してください。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["提出","相談","乗車","記入"], correctIndex:3},
          {correct:"「記入」です。決められた欄に書き入れることです。",
           incorrect:"用紙に書き入れることを表す言葉を選びます。"},
          {prompt:"「記入」はどれのことですか。", options:["用紙に書き入れる","用紙を出す"], correctIndex:0, seconds:5},
          [
            "提出 is handing the form in, which comes after filling it",
            "相談 is discussing something with someone",
            "乗車 is boarding a train",
            "記入 - writing your details into the form"
          ])
      ]},

      {day:3, mode:"challenge", label:"書き付けを閉じる", questions:[

        q2("station-e02-q07", "sentence-building", "w-teishutsu", 30,
          {jp:"【用紙のお預かり】\n書き終えた用紙をどうするかをお知らせします。次の文を正しく並べたとき、★に入るのはどれですか。\nご記入の済んだ用紙は　＿　＿　★　＿　提出してください。"},
          {type:"sentence-order", options:["係の者に","そのまま","お持ちになり","窓口の"], correctIndex:1},
          {correct:"「窓口の係の者にそのままお持ちになり提出してください」となります。★は「そのまま」です。",
           incorrect:"「窓口の」「係の者に」「そのまま」「お持ちになり」の順に並びます。★は三番目です。"},
          {prompt:"「提出」はどれのことですか。", options:["書いたものを直す","書いたものを出す"], correctIndex:1, seconds:5},
          [
            "係の者に is who it goes to, and comes second",
            "そのまま sits at the star, saying to bring it as it is",
            "お持ちになり joins the clause to 提出してください",
            "窓口の comes first, attaching to 係の者"
          ]),

        q2("station-e02-q08", "text-grammar", "v-moushikomu", 90,
          {jp:"【臨時電車について】\n祭りの日の臨時電車は、前もって（　　）必要はありません。\n※ 当日、そのままご乗車いただけます。\n※ 座席をお決めになりたい方だけ、窓口で（　　）ください。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["下車する","申し込む","記入する","出発する"], correctIndex:1},
          {correct:"「申し込む」です。前もって願い出ることです。",
           incorrect:"前もって願い出ることを表す言葉を選びます。"},
          {prompt:"「申し込む」はどれのことですか。", options:["前もって願い出る","乗り物から降りる"], correctIndex:0, seconds:5},
          [
            "下車する is getting off a train",
            "申し込む - applying in advance, which the notice says is not needed",
            "記入する is filling in a form",
            "出発する is departing"
          ]),

        q2("station-e02-q09", "reading", "w-nitei", 120,
          {jp:"【来週の日程】\n月曜　線路の点検　　始発から七時まで\n火曜　いつもどおり\n水曜　線路の点検　　始発から七時まで\n木曜　祭りの片付け　終日、臨時が出ます\n金曜　いつもどおり\n※ 点検の日は、始発から七時までの電車が動きません。\n※ 臨時が出る日は、いつもの電車もそのまま動きます。\n※ 点検と臨時が重なる日はありません。\n朝六時に電車をお使いになりたい方が、お乗りになれない日はどれですか。"},
          {type:"evidence-choice", options:["月曜と水曜","木曜だけ","月曜と水曜と木曜","月曜だけ"], correctIndex:0},
          {correct:"月曜と水曜です。点検の日は七時まで動きません。",
           incorrect:"点検の日を探します。臨時が出る日は、いつもの電車も動きます。"},
          {prompt:"「日程」はどれのことですか。", options:["かかるお金","日ごとの予定"], correctIndex:1, seconds:5},
          [
            "Monday and Wednesday, the two inspection mornings",
            "Thursday runs its normal trains as well as the extras",
            "Thursday is not affected",
            "Wednesday is an inspection day too"
          ]),

        q2("station-e02-q10", "listening-task", "w-soudan", 8,
          {jp:"コン：「決めかねているお客様には、まず相談に乗ってください。」何をしますか。", audio:true},
          {type:"quick-response", options:["こちらで決めて渡します。","次のお客様を呼びます。","困りごとを聞いて一緒に考えます。","窓口を閉めます。"], correctIndex:2},
          {correct:"相談に乗れました。「相談」は、困りごとを話し合うことです。",
           incorrect:"「相談に乗る」は、話を聞いて一緒に考えることです。"},
          {prompt:"「相談」はどれのことですか。", options:["一人で決めること","話し合って考えること"], correctIndex:1, seconds:8},
          [
            "deciding for them is not consulting",
            "calling the next person cuts them off",
            "hearing them out and thinking it through together",
            "closing the window ends the conversation"
          ])
      ]}
    ]
  };


  var episode3 = {
    id:"station-e03",
    title:"放送が鳴る",
    sourceNote:NOTE3,
    intro:{jp:"コン：「風で電車が遅れています。こういう夜は、放送が何度も鳴ります。全部が全部のお客様に当てはまるわけではありません。誰にどれが当てはまるのか、よく聞いてください。」", audio:true},
    briefing:{jp:"コン：「これから一時間、遅れた駅を回します。放送は最後まで聞いてから答えてください。上りと下りで違うことも申します。間違えた仕事は、最後にもう一度だけ確認します。」", audio:true, points:RULES},
    days:[
      {day:1, mode:"learn", label:"風が強い", questions:[

        q3("station-e03-q01", "listening-point", "w-housou-2", 8,
          {jp:"コン：「今の放送を聞きましたか。」何のことですか。", audio:true},
          {type:"quick-response", options:["駅の掲示板の紙","駅で流れる知らせの声","電車の走る音","改札の機械の音"], correctIndex:1},
          {correct:"分かりました。「放送」は、多くの人に向けて流す知らせのことです。",
           incorrect:"「放送」は、みんなに向けて流される声の知らせのことです。"},
          {prompt:"「放送」はどれのことですか。", options:["みんなに流す知らせ","一人に渡す紙"], correctIndex:0, seconds:5},
          [
            "a printed notice is read, not broadcast",
            "the announcement played over the station speakers",
            "the sound of the train is not a message",
            "the gate machine beeping is not an announcement"
          ]),

        q3("station-e03-q02", "quick-response", "w-shirase", 8,
          {jp:"上りが二十分遅れると分かりました。お客様はまだご存じありません。何をしますか。", audio:true},
          {type:"quick-response", options:["黙って待ちます。","改札を閉めます。","お客様に知らせをお伝えします。","下りにご案内します。"], correctIndex:2},
          {correct:"伝えられました。「知らせ」は、相手に分かるように伝える中身のことです。",
           incorrect:"お客様はまだご存じありません。分かったことをお伝えします。"},
          {prompt:"「知らせ」はどれのことですか。", options:["乗る場所","伝える中身"], correctIndex:1, seconds:5},
          [
            "saying nothing leaves them waiting blind",
            "closing the gate does not help anyone",
            "telling the waiting passengers what you now know",
            "sending them to the down-line sends them the wrong way"
          ]),

        q3("station-e03-q03", "listening-task", "w-gyaku", 5,
          {jp:"コン：「そのお客様は逆の電車に乗ろうとしています。」どういうことですか。", audio:true},
          {type:"quick-response", options:["止まっている電車","一本後の電車","高い切符の電車","行きたい方向と反対の電車"], correctIndex:3},
          {correct:"気づけました。「逆」は、向きが反対であることです。",
           incorrect:"「逆」は、向きが反対だということです。"},
          {prompt:"「逆」はどれのことですか。", options:["向きが反対","時間が遅い"], correctIndex:0, seconds:5},
          [
            "a stopped train has no direction at all",
            "a later train is a matter of time, not direction",
            "the fare is not what 逆 describes",
            "the train going the opposite way from where they want"
          ])
      ]},

      {day:2, mode:"practice", label:"間隔があく", questions:[

        q3("station-e03-q04", "listening-point", "w-kankaku-2", 8,
          {jp:"コン：「電車の間隔があいています。」どういうことですか。", audio:true},
          {type:"quick-response", options:["次の電車まで時間が長い","駅が広い","電車がとても混んでいる","電車が速く走る"], correctIndex:0},
          {correct:"分かりました。「間隔」は、ものとものの間のへだたりのことです。ここでは時間のへだたりです。",
           incorrect:"「間隔があく」は、次までの間が長くなることです。"},
          {prompt:"「間隔」はどれのことですか。", options:["乗る人の数","間のへだたり"], correctIndex:1, seconds:5},
          [
            "a longer gap until the next train",
            "the size of the station is unrelated",
            "crowding is about people, not spacing",
            "speed is not the gap between services"
          ]),

        q3("station-e03-q05", "quick-response", "w-chikoku", 8,
          {jp:"お客様：「これでは勤め先に遅刻します。」電車は二十分遅れています。何と言いますか。", audio:true},
          {type:"quick-response", options:["私には分かりません。","遅延の証明をお出しできます。","仕方がありません。","走れば間に合います。"], correctIndex:1},
          {correct:"役に立つことを出せました。「遅刻」は、決まった時刻に間に合わないことです。",
           incorrect:"遅れているのは電車のほうです。駅にできることを出します。"},
          {prompt:"「遅刻」はどれのことですか。", options:["決まった時刻に遅れる","早く着きすぎる"], correctIndex:0, seconds:5},
          [
            "「I do not know」 when there is a standard remedy",
            "offering the delay certificate, which is what a station can do",
            "「it cannot be helped」 offers nothing",
            "telling them to run is not a solution to a late train"
          ]),

        q3("station-e03-q06", "listening-task", "w-mukai", 5,
          {jp:"コン：「下りの乗り場は向かいのホームです。」どこですか。", audio:true},
          {type:"quick-response", options:["同じホームの端","改札の外","線路をはさんだ反対側","階段の下"], correctIndex:2},
          {correct:"分かりました。「向かい」は、間をはさんだ反対側のことです。",
           incorrect:"「向かい」は、間をはさんで反対側にあることです。"},
          {prompt:"「向かい」はどれのことですか。", options:["となり合わせ","はさんだ反対側"], correctIndex:1, seconds:5},
          [
            "the far end of the same platform is still the same side",
            "outside the gate is not a platform",
            "the platform across the tracks",
            "under the stairs is not a platform either"
          ])
      ]},

      {day:3, mode:"challenge", label:"終電が動くか", questions:[

        q3("station-e03-q07", "reading", "w-shinya", 120,
          {jp:"【深夜の運転について】\n上り　十一時四十分　二十分ほど遅れて発車の見込み\n下り　十一時五十分　定刻どおり発車の見込み\n※ 深夜零時を過ぎた電車は、途中の三つの駅に止まりません。\n※ 止まらない駅でお降りになる方は、下りの最終をお使いください。\n※ 下りの最終は、すべての駅に止まります。\n途中の駅でお降りになる上りのお客様には、何をご案内しますか。"},
          {type:"evidence-choice", options:["上りをそのままお待ちいただきます","待合室をご案内します","改札の外へお出しします","下りの最終をご案内します"], correctIndex:3},
          {correct:"下りの最終です。零時を過ぎた上りは、その駅に止まりません。",
           incorrect:"零時を過ぎた上りは途中の三駅に止まりません。すべての駅に止まるほうをご案内します。"},
          {prompt:"「深夜」はいつのことですか。", options:["夜のとても遅い時間","朝の早い時間"], correctIndex:0, seconds:5},
          [
            "the delayed up-train will skip their stop",
            "the waiting room is for people with no train at all",
            "there is still a train that serves them",
            "the last down-train, which does stop everywhere"
          ]),

        q3("station-e03-q08", "reading", "w-tsuugaku", 120,
          {jp:"【定期券をお持ちの方へ】\n通勤の定期券　　朝六時から夜十一時まで\n通学の定期券　　朝六時から夜八時まで\n※ 定期券の時間を過ぎたご乗車には、別に運賃をいただきます。\n※ 祭りの日は、通学の定期券も夜十一時までお使いになれます。\n※ 今夜は祭りの日です。\n夜九時に、通学の定期券でお乗りになる方はどうなりますか。"},
          {type:"evidence-choice", options:["そのままお乗りになれます","別に運賃がかかります","お乗りになれません","通勤の定期券が要ります"], correctIndex:0},
          {correct:"そのままお乗りになれます。今夜は祭りの日なので、十一時まで使えます。",
           incorrect:"今夜は祭りの日だと書いてあります。通学の定期券も十一時までです。"},
          {prompt:"「通学」はどれのことですか。", options:["仕事へ通うこと","学校へ通うこと"], correctIndex:1, seconds:5},
          [
            "the festival exception extends the student pass to eleven",
            "the extra fare applies only outside the pass hours",
            "nothing here refuses them travel",
            "they do not need a different pass tonight"
          ]),

        q3("station-e03-q09", "quick-response", "w-kakujitsu", 8,
          {jp:"お客様：「この電車は確実に動きますか。」風はやみましたが、まだ点検中です。何と言いますか。", audio:true},
          {type:"quick-response", options:["分かりません。","まだ確実とは申し上げられません。点検が終わり次第お知らせします。","確実に動きます。","動きません。"], correctIndex:1},
          {correct:"正直に伝えられました。「確実」は、間違いなくそうだと言えることです。",
           incorrect:"まだ点検中です。確実だと言い切らず、分かり次第伝えると言います。"},
          {prompt:"「確実」はどんな様子ですか。", options:["間違いないと言える","たぶんそうだと思う"], correctIndex:0, seconds:5},
          [
            "「I do not know」 alone gives them nothing to wait for",
            "honest: not certain yet, and you will tell them when it is",
            "promising certainty you do not have",
            "saying it will not run is equally unfounded"
          ]),

        q3("station-e03-q10", "integrated", "w-angai", 12,
          {jp:"駅員さん：「今夜は思ったより早く片付きましたね。」二十分の遅れが十分で戻りました。何と言いますか。", audio:true},
          {type:"quick-response", options:["やはり遅れましたね。","まったく戻りませんでした。","予定どおりでした。","案外早く戻りましたね。"], correctIndex:3},
          {correct:"様子が伝わりました。「案外」は、思っていたのと違って、という意味です。",
           incorrect:"思っていたより早かったのですから、それを表す言葉を使います。"},
          {prompt:"「案外」はどんなときに使いますか。", options:["思っていたのと違うとき","思ったとおりのとき"], correctIndex:0, seconds:8},
          [
            "「as expected, it was late」 says the opposite",
            "the delay did recover",
            "it was not on schedule; it was late and then recovered",
            "sooner than expected, which is what 案外 marks"
          ])
      ]}
    ]
  };

  var episode4 = {
    id:"station-e04",
    title:"忘れ物",
    sourceNote:NOTE4,
    intro:{jp:"コン：「終電が出ました。ホームには、置いていかれた物が残っています。持ち主はもう帰ってしまいました。ここからは、預かる仕事です。」", audio:true},
    briefing:{jp:"コン：「これから、忘れ物を預かって、駅を閉めます。どこにあったか、いつのものか、正しく残してください。読む問題は長いので、時間も長く取ってあります。間違えた仕事は、最後にもう一度だけ確認します。」", audio:true, points:RULES},
    days:[
      {day:1, mode:"learn", label:"ホームを回る", questions:[

        q4("station-e04-q01", "quick-response", "v-azukeru", 8,
          {jp:"お客様：「明日の朝まで荷物を置いておけますか。」駅には預かり所があります。何と言いますか。", audio:true},
          {type:"quick-response", options:["置いていってください。","できません。","お預かりできます。","持ってお帰りください。"], correctIndex:2},
          {correct:"お引き受けできました。「預ける」は、人に頼んでしばらく持っていてもらうことです。",
           incorrect:"預かり所があります。お預かりできると伝えます。"},
          {prompt:"「預ける」はどれのことですか。", options:["あげてしまう","しばらく持っていてもらう"], correctIndex:1, seconds:5},
          [
            "「just leave it」 is not the same as taking responsibility for it",
            "refusing when the station has a left-luggage office",
            "yes, the station can hold it for them",
            "telling them to carry it ignores what they asked"
          ]),

        q4("station-e04-q02", "listening-task", "w-zaseki", 5,
          {jp:"コン：「座席の下も見てください。」どこを見ますか。", audio:true},
          {type:"quick-response", options:["窓口の下","客が座る所の下","改札の下","階段の下"], correctIndex:1},
          {correct:"見られました。「座席」は、人が座る所のことです。",
           incorrect:"「座席」は、人が座る所のことです。"},
          {prompt:"「座席」はどれのことですか。", options:["人が座る所","切符を買う所"], correctIndex:0, seconds:5},
          [
            "the window is where tickets are sold",
            "under the seats, where dropped things collect",
            "the ticket gate is not a seat",
            "the stairs are not a seat either"
          ]),

        q4("station-e04-q03", "listening-task", "v-todoku", 5,
          {jp:"コン：「落とし物が届いています。」どういうことですか。", audio:true},
          {type:"quick-response", options:["誰かが持ってきてくれた","誰かが持って帰った","まだ見つからない","駅の外にある"], correctIndex:0},
          {correct:"分かりました。「届く」は、物がこちらに着くことです。",
           incorrect:"「届いている」は、こちらに着いているということです。"},
          {prompt:"「届く」はどれのことですか。", options:["持ち去られる","こちらに着く"], correctIndex:1, seconds:5},
          [
            "someone has brought it in to the station",
            "taken away is the opposite of arrived",
            "it has been found; that is why it is here",
            "it is here at the station, not outside it"
          ])
      ]},

      {day:2, mode:"practice", label:"預かる", questions:[

        q4("station-e04-q04", "listening-point", "w-kakari", 8,
          {jp:"コン：「忘れ物の係を呼んでください。」誰を呼びますか。", audio:true},
          {type:"quick-response", options:["近くのお客様","電車の運転士","お店の人","その仕事を受け持つ人"], correctIndex:3},
          {correct:"呼べました。「係」は、その仕事を受け持っている人のことです。",
           incorrect:"「係」は、その仕事を受け持っている人のことです。"},
          {prompt:"「係」はどれのことですか。", options:["その仕事の担当者","たまたまいた人"], correctIndex:0, seconds:5},
          [
            "a passenger standing nearby has no such duty",
            "the driver has left with the train",
            "a shopkeeper is not station staff",
            "the person whose job that is"
          ]),

        q4("station-e04-q05", "listening-task", "w-fukin", 5,
          {jp:"コン：「三番線の付近を見てきてください。」どこを見ますか。", audio:true},
          {type:"quick-response", options:["二番線だけ","三番線の切符売り場","三番線の近く一帯","駅の外の道"], correctIndex:2},
          {correct:"見られました。「付近」は、その辺り一帯のことです。",
           incorrect:"「付近」は、そのあたり一帯のことです。"},
          {prompt:"「付近」はどれのことですか。", options:["建物の中だけ","そのあたり一帯"], correctIndex:1, seconds:5},
          [
            "platform two is a different platform",
            "the ticket counter is a specific spot, not the vicinity",
            "the area around platform three",
            "the road outside is not near platform three"
          ]),

        q4("station-e04-q06", "text-grammar", "w-kinshi", 90,
          {jp:"【ホームでのお願い】\n線路への立ち入りは（　　）されています。\n※ 落とし物を拾うために降りることも、同じく認められません。\n※ 落ちた物は、係の者が電車の止まっている間にお取りします。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["案内","禁止","相談","放送"], correctIndex:1},
          {correct:"「禁止」です。してはいけないと決められていることです。",
           incorrect:"してはいけないと決められていることを表す言葉を選びます。"},
          {prompt:"「禁止」はどれのことですか。", options:["してはいけないこと","してもよいこと"], correctIndex:0, seconds:5},
          [
            "案内 is guiding someone, not forbidding them",
            "禁止 - forbidden, which is what the notice says",
            "相談 is discussing something",
            "放送 is an announcement"
          ])
      ]},

      {day:3, mode:"challenge", label:"駅を閉める", questions:[

        q4("station-e04-q07", "text-grammar", "w-toujitsu", 90,
          {jp:"【お忘れ物のお引き取りについて】\nお忘れ物は、お預かりした（　　）のうちは駅でお返しできます。\n※ 翌日からは、町の預かり所へ移します。\n※ 移した後は、駅ではお返しできません。\n（　　）に入る言葉はどれですか。"},
          {type:"single-choice", options:["当日","前日","翌日","毎日"], correctIndex:0},
          {correct:"「当日」です。その日のうち、ということです。",
           incorrect:"翌日からは移すと書いてあります。移す前はその日のうちです。"},
          {prompt:"「当日」はいつのことですか。", options:["次の日","その日"], correctIndex:1, seconds:5},
          [
            "当日 - the same day, before it is moved on",
            "前日 is the day before, which is before it was even lost",
            "翌日 is when it leaves the station",
            "毎日 would mean every day, which contradicts the transfer"
          ]),

        q4("station-e04-q08", "reading", "w-keikaku", 120,
          {jp:"【駅を閉めるまでの計画】\n一　ホームを二番線から順に見ます\n二　忘れ物を預かり所へ運びます\n三　改札を閉めます\n四　待合室の火を落とします\n※ 待合室に人がいらっしゃる間は、四を行いません。\n※ 三は、ホームに誰もいなくなってから行います。\n※ 今夜は、待合室に一人いらっしゃいます。\n今夜、行わないのはどれですか。"},
          {type:"evidence-choice", options:["三","二","一","四"], correctIndex:3},
          {correct:"四です。待合室にお客様がいらっしゃる間は、火を落としません。",
           incorrect:"待合室に人がいらっしゃる間は行わない、と書いてあるものを選びます。"},
          {prompt:"「計画」はどれのことですか。", options:["前もって決めた段取り","その場の思いつき"], correctIndex:0, seconds:5},
          [
            "step three only waits for the platforms to clear",
            "step two is unaffected",
            "step one is where the night starts",
            "step four: someone is still in the waiting room"
          ]),

        q4("station-e04-q09", "reading", "w-touchaku", 120,
          {jp:"【今夜の到着記録】\n上り最終　十一時四十分着　　忘れ物　傘一本\n下り最終　十一時五十分着　　忘れ物　なし\n臨時　　　十一時二十分着　　忘れ物　包み一つ\n※ 忘れ物は、着いた電車ごとに分けて預かります。\n※ 同じ電車に二つ以上あったときだけ、まとめて一つの札にします。\n※ 忘れ物のなかった電車の札は作りません。\n今夜、作る札はいくつですか。"},
          {type:"evidence-choice", options:["作りません","一つ","二つ","三つ"], correctIndex:2},
          {correct:"二つです。上りの傘と臨時の包みで、電車ごとに一つずつです。",
           incorrect:"忘れ物があったのは二本の電車です。電車ごとに分けて預かります。"},
          {prompt:"「到着」はどれのことですか。", options:["出ること","着くこと"], correctIndex:1, seconds:5},
          [
            "two trains did have lost property",
            "one would mean combining two different trains",
            "two: one for the up-train's umbrella, one for the extra train's parcel",
            "the down-train had nothing, so it gets no tag"
          ]),

        q4("station-e04-q10", "integrated", "w-shupatsu", 12,
          {jp:"駅員さん：「明日の始発は何時でしたか。」書き付けには、点検のため七時からと書いてあります。何と言いますか。", audio:true},
          {type:"quick-response", options:["明日の出発は七時からです。点検があるためです。","いつもどおり五時です。","分かりません。","明日は動きません。"], correctIndex:0},
          {correct:"理由まで伝えられました。「出発」は、乗り物が出ていくことです。",
           incorrect:"書き付けに点検のため七時からとあります。時刻と理由を伝えます。"},
          {prompt:"「出発」はどれのことですか。", options:["着くこと","出ていくこと"], correctIndex:1, seconds:8},
          [
            "seven, and why - the inspection is the reason",
            "five is the usual time, but tomorrow is not usual",
            "「I do not know」 when it is written down",
            "the trains do run, just later"
          ])
      ]}
    ]
  };

  root.N2StationEpisodes = {
    key:"station",
    episodes:[episode1, episode2, episode3, episode4]
  };

  root.LanternEpisodeStages = root.LanternEpisodeStages || {};
  root.LanternEpisodeStages["station"] = root.N2StationEpisodes;
})(typeof self !== "undefined" ? self : this);
