(function(root){
  "use strict";

  var intro = {
    context:"コン：「月見宿へようこそ。お祭りの間はお客様が続けて来るので、私一人では仕事が間に合いません。」",
    jp:"日本語の練習をしながら、お祭りの間、宿の仕事を手伝ってくれませんか？",
    romaji:"Nihongo no renshuu o shinagara, omatsuri no aida, yado no shigoto o tetsudatte kuremasen ka?",
    accept:"はい、喜んで手伝います。"
  };

  var DAY_META = {
    learn:{day:1,label:"一日目",mode:"基礎",difficulty:"やさしい",stars:"★☆☆"},
    practice:{day:2,label:"二日目",mode:"実践",difficulty:"ふつう",stars:"★★☆"},
    challenge:{day:3,label:"三日目",mode:"挑戦",difficulty:"むずかしい",stars:"★★★"},
    review:{day:3,label:"三日目",mode:"復習",difficulty:"もう一度",stars:"★★★"}
  };

  var DAY_ANNOUNCEMENTS = {
    learn:"コン：「一日目です。今日は基礎から始めましょう。」",
    practice:"コン：「二日目です。今日は実際の仕事の中で練習しましょう。」",
    challenge:"コン：「三日目です。今日は音声を聞いて仕事に挑戦しましょう。」",
    review:"コン：「三日目の最後に、間違えた仕事だけもう一度確認しましょう。」"
  };

  var encounters = [
    {
      level:"N2",
      focusWord:"揃える",
      reading:"そろえる",
      actionType:"visible movement",
      label:"Before the guest arrives",
      narration:"コン：「もうすぐ最初のお客様が来ます。前のお客様が座布団を乱したので、まず座る場所を整えましょう。」",
      jp:"二つのマットに、同じ色の座布団を二枚ずつ揃えてください。",
      romaji:"Futatsu no matto ni, onaji iro no zabuton o nimai zutsu soroete kudasai.",
      meaning:"Please place two cushions of the same colour on each mat.",
      successReply:"ありがとうございます。座布団が同じ色に揃いました。これでお客様を迎えられます。",
      retryReply:"まだ座布団が揃っていません。文の中で、何を同じにするのか確認してください。",
      hint:"揃える means to arrange things, make them uniform, or get them ready.",
      options:[
        {key:"arrange", emoji:"🛏️", label:"Arrange the bedding"},
        {key:"scatter", emoji:"🧺", label:"Scatter the bedding"},
        {key:"open", emoji:"🪟", label:"Open the window"}
      ],
      correct:"arrange"
    },
    {
      level:"N2",
      focusWord:"取り替える",
      reading:"とりかえる",
      actionType:"object interaction",
      label:"At the washstand",
      narration:"コン：「座る場所はきれいになりました。お客様は旅のあとで顔を洗いますが、前のお客様のタオルがまだ残っています。」",
      jp:"古いタオルを洗濯かごに入れて、新しいタオルに取り替えてください。",
      romaji:"Furui taoru o sentakukago ni irete, atarashii taoru ni torikaete kudasai.",
      meaning:"Put the old towel in the laundry basket, then replace it with a new one.",
      successReply:"ありがとうございます。新しいタオルになりました。これでお客様が使えます。",
      retryReply:"頼まれた物と、古い物を置く場所を確認してください。",
      hint:"取り替える means to swap one object for another of the same kind.",
      options:[
        {key:"replace", emoji:"🧻", label:"Replace the towel"},
        {key:"fold", emoji:"👘", label:"Fold the robe"},
        {key:"hide", emoji:"🧳", label:"Hide the luggage"}
      ],
      correct:"replace"
    },
    {
      level:"N2",
      focusWord:"温める",
      reading:"あたためる",
      actionType:"visible movement",
      label:"The tray has gone cold",
      narration:"コン：「お客様が到着しました。部屋を準備している間に、歓迎のお茶が冷めてしまいました。このままでは出せません。」",
      jp:"お茶をコンロでもう一度温めてください。",
      romaji:"Ocha o konro de mou ichido atatamete kudasai.",
      meaning:"Please warm the tea on the stove once more.",
      successReply:"ありがとうございます。お茶が温まりました。これでお客様に出せます。",
      retryReply:"頼まれた物と、温め方をもう一度確認してください。",
      hint:"温める means to warm or heat something.",
      options:[
        {key:"warm", emoji:"♨️", label:"Warm the tea"},
        {key:"pour", emoji:"🫖", label:"Pour it away"},
        {key:"cool", emoji:"🧊", label:"Cool the tea"}
      ],
      correct:"warm"
    },
    {
      level:"N2",
      focusWord:"調整",
      reading:"ちょうせい",
      actionType:"object interaction",
      label:"Planning tomorrow",
      narration:"コン：「お客様が部屋で休んでいる間に、明日の予定を決めておきましょう。お客様はできるだけ遅くまで滞在したいそうですが、駅への移動と掃除、次のお客様の準備時間も必要です。」",
      jp:"電車は14時で、駅まで1時間かかります。掃除には2時間必要で、次のお客様は15時に来ます。できるだけ遅いチェックアウト時間に調整してください。",
      romaji:"Densha wa juuyoji de, eki made ichijikan kakarimasu. Souji ni wa nijikan hitsuyou de, tsugi no okyakusama wa juugoji ni kimasu. Dekiru dake osoi chekku auto jikan ni chousei shite kudasai.",
      meaning:"The train is at 14:00 and the station is one hour away. Cleaning needs two hours before the next guest arrives at 15:00. Coordinate the latest possible checkout.",
      successReply:"ありがとうございます。チェックアウトを13時に調整できました。これなら電車にも掃除にも間に合います。",
      retryReply:"時間の条件をもう一度確認してください。",
      hint:"Use both the travel time and cleaning time. 調整 means reconciling several conditions.",
      options:[
        {key:"adjust", emoji:"📅", label:"Coordinate the time"},
        {key:"lock", emoji:"🌡️", label:"Control the temperature"},
        {key:"leave", emoji:"🚪", label:"Leave the room"}
      ],
      correct:"adjust"
    },
    {
      level:"N2",
      focusWord:"引き受ける",
      reading:"ひきうける",
      actionType:"social dialogue",
      label:"The evening meal",
      narration:"コン：「一日目の最後に、夕食を配る人がまだ決まっていません。私一人では間に合わないので、もう一つお願いします。」",
      jp:"今夜の夕食の配膳を引き受けていただけませんか。",
      romaji:"Kon'ya no yuushoku no haizen o hikiukete itadakemasen ka.",
      meaning:"Would you be willing to undertake serving tonight's dinner?",
      successReply:"ありがとうございます。一日目の仕事はこれで終わりです。今夜は宿で休んでください。",
      retryReply:"まだ夕食の配膳を引き受けた返事になっていません。もう少し手伝ってください。",
      hint:"引き受ける means to undertake, take over, or accept responsibility for something.",
      // Refusing a favour is a legitimate, correctly-understood Japanese reply.
      // Scoring it wrong taught that 引き受けられません is a comprehension error.
      declineReply:"そうですか……。残念ですが、仕方がありません。気が変わったら、いつでも戻ってきてください。",
      returnReply:"コン：「戻ってきてくれたんですね！とても嬉しいです。」",
      options:[
        {key:"accept", emoji:"", label:"はい、引き受けます。"},
        {key:"decline", emoji:"", label:"すみません、引き受けられません。"}
      ],
      correct:"accept",
      completionFeedback:"コン：「一日目の仕事が終わりました。宿で休んで、明日もよろしくお願いします。」",
      completionNextLabel:"二日目へ"
    }
  ];
  // One shared room. Every object-moving encounter shows all of it, so the scene
  // never reveals which action is wanted - only the verb in the sentence does.
  var ROOM = {
    cushions:[
      ["c1",{color:"red",size:"large",dir:"up"}],
      ["c2",{color:"red",size:"small",dir:"side"}],
      ["c3",{color:"blue",size:"small",dir:"up"}],
      ["c4",{color:"blue",size:"large",dir:"side"}]
    ],
    swaps:[
      {key:"towel", oldIcon:"towelUsed", newIcon:"towelClean", oldLabel:"古いタオル", newLabel:"新しいタオル", sourceIcon:"rack", sourceLabel:"タオル掛け", removalIcon:"basket", removalKey:"laundry", removalLabel:"洗濯かご", installLabel:"タオル掛け"},
      {key:"bulb", oldIcon:"bulbBroken", newIcon:"bulbNew", oldLabel:"切れた電球", newLabel:"新しい電球", sourceIcon:"socket", sourceLabel:"照明", removalIcon:"recycle", removalKey:"recycle", removalLabel:"回収箱", installLabel:"照明"},
      {key:"sheet", oldIcon:"sheetStained", newIcon:"sheetFresh", oldLabel:"汚れたシーツ", newLabel:"新しいシーツ", sourceIcon:"futon", sourceLabel:"ベッド", removalIcon:"basket", removalKey:"laundry", removalLabel:"洗濯かご", installLabel:"ベッド"}
    ],
    dishes:[
      {key:"tea", icon:"kettle", label:"お茶", appliance:"stove"},
      {key:"soup", icon:"pot", label:"スープ", appliance:"stove"},
      {key:"rice", icon:"rice", label:"ごはん", appliance:"microwave"}
    ],
    groups:[["g1","マット"],["g2","マット"]],
    heatingAppliances:[
      {key:"stove", icon:"stove", label:"コンロ"},
      {key:"microwave", icon:"microwave", label:"電子レンジ"}
    ],
    // The room art contains fixtures only. Every answer object is a separate
    // sprite, so moving one never leaves a duplicate baked into the background.
    visual:{
      background:"assets/inn/room-empty-v4.webp",
      spriteSheet:"assets/inn/room-objects-v2.webp",
      assets:{sheetStained:"assets/inn/sheet-stained-messy-v1.webp"},
      sprites:{
        c1:{col:0,row:0,rotate:90,zoom:1.08}, c2:{col:1,row:0,rotate:90,zoom:.82},
        c3:{col:2,row:0,rotate:0,zoom:.82}, c4:{col:3,row:0,rotate:0,zoom:1.08},
        towelUsed:{col:0,row:1}, towelClean:{col:1,row:1},
        bulbBroken:{col:2,row:1}, bulbNew:{col:3,row:1},
        sheetFresh:{col:1,row:2},
        kettle:{col:2,row:2}, pot:{col:3,row:2}, rice:{col:0,row:3}
      },
      // Percentages are measured against the 3:2 illustrated room.
      hotspots:{
        "install-towel":{x:2,y:19,w:19,h:25},
        "remove-laundry":{x:1,y:45,w:18,h:18},
        "remove-recycle":{x:19,y:45,w:8,h:18},
        "install-bulb":{x:45,y:23,w:11,h:15},
        stove:{x:56,y:34,w:15,h:8},
        microwave:{x:57,y:45,w:14,h:11},
        "install-sheet":{x:77,y:53,w:23,h:29},
        g1:{x:19,y:63,w:26,h:16},
        g2:{x:48,y:63,w:25,h:16}
      }
    }
  };
  var ROOM_HELP = "Tap an object, then tap where it goes. Dragging works too.";
  var ROOM_CLUE = "座布団は畳の上にあり、古いタオルはタオル掛け、汚れたシーツはベッド、切れた電球は照明にあります。新しい物と料理は棚に置かれています。";

  function roomScene(extra){
    var result = {scene:"room", room:ROOM, controlHelp:ROOM_HELP, clue:ROOM_CLUE};
    for(var key in extra) result[key] = extra[key];
    return result;
  }

  var guidedInteractions = [
    roomScene({verb:"arrange", attribute:"color"}),
    roomScene({verb:"replace", target:"towel"}),
    roomScene({verb:"warm", target:"tea"}),
    {
      scene:"checkout",
      controlHelp:"Move the time card, then confirm.",
      clue:"A checkout board with one adjustable time card, and the next booking already fixed.",
      min:9,max:15,startA:10,startB:15,gap:2,targetA:13,targetB:15,fixedB:true,labelA:"チェックアウト",labelB:"次のチェックイン"
    },
    {
      scene:"errand",
      controlHelp:"Choose your reply.",
      clue:"The innkeeper has asked you something and is waiting for an answer.",
      replies:[
        {key:"accept", label:"はい、引き受けます。"},
        {key:"decline", label:"すみません、引き受けられません。"}
      ]
    }
  ];

  var alternateInteractions = [
    roomScene({verb:"arrange", attribute:"size"}),
    roomScene({verb:"replace", target:"bulb"}),
    roomScene({verb:"warm", target:"soup"}),
    {
      scene:"arrivals",
      controlHelp:"Move the two time cards, then confirm.",
      clue:"An arrivals board with two movable time cards.",
      min:14,max:19,startA:15,startB:15,gap:2,targetA:15,targetB:17,fixedB:false,labelA:"Aグループ到着",labelB:"Bグループ到着"
    },
    {
      scene:"errand",
      controlHelp:"Choose your reply.",
      clue:"The innkeeper has asked you something and is waiting for an answer.",
      replies:[
        {key:"accept", label:"はい、引き受けます。"},
        {key:"decline", label:"すみません、引き受けられません。"}
      ]
    }
  ];

  var practiceInteractionsA = [
    roomScene({verb:"arrange", attribute:"dir"}),
    roomScene({verb:"replace", target:"sheet"}),
    roomScene({verb:"warm", target:"rice"}),
    {
      scene:"arrivals",
      controlHelp:"Move the two time cards, then confirm.",
      clue:"An arrivals board with two movable time cards.",
      min:10,max:16,startA:12,startB:12,gap:2,targetA:12,targetB:14,fixedB:false,labelA:"Cグループ到着",labelB:"Dグループ到着"
    },
    guidedInteractions[4]
  ];

  var mechanicNames = ["arrange", "replace", "warm", "coordinate", "undertake"];
  encounters.forEach(function(item, index){
    item.mechanic = mechanicNames[index];
    item.variant = "guided";
    item.interaction = guidedInteractions[index];
  });

  var practiceVariantsA = [
    {jp:"二つのマットに、同じ向きの座布団を二枚ずつ揃えてください。", romaji:"Futatsu no matto ni, onaji muki no zabuton o nimai zutsu soroete kudasai.", narration:"The cushions have been used again and now face different directions.", meaning:"Please place two cushions facing the same direction on each mat.", successReply:"座布団の向きが揃いました。これで朝食の準備を続けられます。"},
    {jp:"汚れたシーツを洗濯かごに入れて、新しいシーツに取り替えてください。", romaji:"Yogoreta shiitsu o sentakukago ni irete, atarashii shiitsu ni torikaete kudasai.", narration:"A marked sheet remains beside the fresh linen.", meaning:"Put the stained sheet in the laundry basket, then replace it with a new one.", successReply:"新しいシーツになりました。これで今夜のお客様を迎えられます。"},
    {jp:"ごはんを電子レンジで温めてください。", romaji:"Gohan o denshi renji de atatamete kudasai.", narration:"The evening meal has gone cold.", meaning:"Please warm the rice in the microwave.", successReply:"ごはんが温まりました。みんなで食事にしましょう。"},
    {jp:"Cグループは12時以降、Dグループは14時までに到着します。準備に2時間必要なので、到着時間を調整してください。", romaji:"C guruupu wa juuniji ikou, D guruupu wa juuyoji made ni touchaku shimasu. Junbi ni nijikan hitsuyou na node, touchaku jikan o chousei shite kudasai.", narration:"Two afternoon groups need separate arrival times, with two hours needed between them.", meaning:"Coordinate the two arrival times using the stated limits.", successReply:"Cグループは12時、Dグループは14時になりました。これで準備時間を取れます。"},
    {jp:"朝食の配膳を引き受けてください。", romaji:"Choushoku no haizen o hikiukete kudasai.", narration:"The breakfast shift still needs someone responsible for serving it.", meaning:"Please undertake serving breakfast.", successReply:"ありがとうございます。明日の朝食の配膳をお願いします。"}
  ];

  var practiceVariantsB = [
    {jp:"二つのマットに、同じ大きさの座布団を二枚ずつ揃えてください。", romaji:"Futatsu no matto ni, onaji ookisa no zabuton o nimai zutsu soroete kudasai.", narration:"The cushions are still mixed across the tatami.", meaning:"Please place two cushions of the same size on each mat.", successReply:"座布団の大きさが揃いました。これで部屋が整いました。"},
    {jp:"切れた電球を回収箱に入れて、新しい電球に取り替えてください。", romaji:"Kireta denkyuu o kaishuubako ni irete, atarashii denkyuu ni torikaete kudasai.", narration:"A lamp in the hallway has gone dark.", meaning:"Put the burned-out bulb in the recycling box, then replace it with a new one.", successReply:"新しい電球がつきました。これで廊下が明るくなります。"},
    {jp:"スープをコンロで温めてください。", romaji:"Suupu o konro de atatamete kudasai.", narration:"A guest returns late to a counter of cold dishes.", meaning:"Please warm the soup on the stove.", successReply:"スープが温まりました。お客様に出しましょう。"},
    {jp:"Aグループは15時以降、Bグループは17時までに到着します。ロビーの準備に2時間必要なので、到着時間を調整してください。", romaji:"A guruupu wa juugoji ikou, B guruupu wa juushichiji made ni touchaku shimasu. Robii no junbi ni nijikan hitsuyou na node, touchaku jikan o chousei shite kudasai.", narration:"Both groups are currently set for 15:00. Group A cannot arrive before 15:00, Group B must arrive by 17:00, and the lobby needs two hours between groups.", meaning:"Coordinate the arrival times using the groups' limits and the two-hour lobby preparation time.", successReply:"Aグループは15時、Bグループは17時になりました。これでロビーを準備できます。"},
    {jp:"荷物を運ぶ仕事を引き受けてください。", romaji:"Nimotsu o hakobu shigoto o hikiukete kudasai.", narration:"The innkeeper needs someone to take responsibility for moving the luggage.", meaning:"Please undertake the job of carrying the luggage.", successReply:"ありがとうございます。明日の朝、荷物をお願いします。"}
  ];

  var evidenceNarrationsA = [
    "コン：「おはようございます。昨夜はよく眠れましたか。最初の家族が遊んで座布団の向きを乱したので、朝食の前に部屋を整えます。」",
    "コン：「家族がチェックアウトしました。今夜もこの部屋を使いますが、滞在中にシーツが一枚汚れました。」",
    "コン：「掃除に予定より時間がかかり、従業員の食事のごはんが冷めてしまいました。」",
    "コン：「昼すぎにＣグループとＤグループが来ます。ロビーの準備には二時間必要なので、同じ時間には迎えられません。」",
    "コン：「二つのグループは無事に部屋へ入りました。でも、明日の朝食を配る人がまだ決まっていません。主人が返事を待っています。」"
  ];

  var evidenceNarrationsB = [
    "コン：「次の朝です。朝食のあと、子どもたちが大きさの違う座布団を二つのマットに残しました。」",
    "コン：「廊下が暗くなっています。散歩に出たお客様がもうすぐ戻りますが、この電球が切れてしまいました。」",
    "コン：「散歩のお客様が日暮れ後に戻りました。着替えている間に、夕食のスープが冷めてしまいました。」",
    "コン：「帳場を閉める前に、ＡグループとＢグループから同じ到着時間を希望されました。ロビーでは同時に迎えられません。」",
    "コン：「最後のお客様も部屋に入りました。残る仕事は一つです。明日の朝、荷物を駅まで運ぶ人が必要です。」"
  ];

  // Day 2 asks a different question, so it needs its own sentence. Reusing the
  // Day 1 request was incoherent: it commanded an action and then asked for a
  // word, and 「揃えてください」 already contained the answer. These are cloze
  // sentences with the verb removed, and the options take the form the blank
  // requires, so the sentence remains the only thing telling the learner what
  // is being asked.
  // Day 2 asks a different question, so it needs its own sentence. Reusing the
  // Day 1 request was incoherent: it commanded an action and then asked for a
  // word, and 「揃えてください」 already contained the answer. These are cloze
  // sentences with the verb removed, and the options take the form the blank
  // requires, so the sentence remains the only thing telling the learner what
  // is being asked.
  //
  // Day 2 shows the English translation rather than romaji: by the second day
  // the learner should be reading kana and kanji, but still needs to know what
  // the sentence means. Four choices, all Japanese.
  //
  // The translation is a full sentence rather than one carrying the blank.
  // English collapses the distinction each item tests - 揃える and 揃う both
  // read as "arrange" - so the verb in the translation does not give the
  // answer away.
  var practiceWordChoice = [
    {
      jp:"二つのマットに、同じ向きの座布団を二枚ずつ（　　）ください。",
      english:"Please arrange two cushions facing the same way on each of the two mats.",
      options:[
        {key:"arrange", label:"揃えて"},
        {key:"sorou", label:"揃って", nearMiss:true},
        {key:"scatter", label:"散らかして"},
        {key:"tidy", label:"片付けて"}
      ],
      successReply:"はい、座布団の向きを自分の手で同じにするので「揃える」です。"
    },
    {
      jp:"汚れたシーツを洗濯かごに入れて、新しいシーツに（　　）ください。",
      english:"Put the stained sheet in the laundry basket, then replace it with a new one.",
      options:[
        {key:"replace", label:"取り替えて"},
        {key:"kaeru", label:"代えて", nearMiss:true},
        {key:"leave", label:"そのままにして"},
        {key:"wash", label:"洗って"}
      ],
      successReply:"はい、汚れたシーツを別の物と交換するので「取り替える」です。"
    },
    {
      jp:"冷めたごはんを、電子レンジで（　　）ください。",
      english:"Please warm the cold rice in the microwave.",
      options:[
        {key:"warm", label:"温めて"},
        {key:"atatamaru", label:"温まって", nearMiss:true},
        {key:"cool", label:"冷やして"},
        {key:"grill", label:"焼いて"}
      ],
      successReply:"はい、冷めたごはんを自分で温かくするので「温める」です。"
    },
    {
      jp:"二つのグループの到着時間を（　　）ください。",
      english:"Please coordinate the arrival times of the two groups.",
      options:[
        {key:"adjust", label:"調整して"},
        {key:"chousetsu", label:"調節して", nearMiss:true},
        {key:"leave", label:"放置して"},
        {key:"cancel", label:"中止して"}
      ],
      successReply:"はい、Cグループは12時、Dグループは14時にしました。条件を合わせるのが「調整」です。"
    },
    {
      jp:"明日の朝食の配膳を（　　）くれませんか。",
      english:"Would you take on serving tomorrow's breakfast?",
      options:[
        {key:"accept", label:"引き受けて"},
        {key:"hikitomeru", label:"引き止めて", nearMiss:true},
        {key:"hikidasu", label:"引き出して"},
        {key:"hikikaesu", label:"引き返して"}
      ],
      successReply:"はい、明日の朝食の配膳をお願いします。責任を持って受けるのが「引き受ける」です。"
    }
  ];

  var japaneseOptions = [
    ["揃える", "揃う", "散らかす"],
    ["取り替える", "代える", "取り替わる"],
    ["温める", "温まる", "冷やす"],
    ["調整する", "調節する", "放置する"],
    // Two labels for two keys. A third label meant the decline key was rendered
    // as 「何時からですか。」 - a sensible clarifying question wired to the
    // refusal branch, so asking when it starts ended the stage.
    ["はい、引き受けます。", "すみません、引き受けられません。"]
  ];

  // These name the word the learner chose, never the one they should have
  // chosen. A wrong answer can be retried, so revealing the target would end
  // the question rather than teach it.
  var nearMissExplanations = [
    "揃う is intransitive: it describes the cushions coming to match by themselves. Here you are the one making them match.",
    "代える means substituting a person or role, as in 「コンに代えて私が案内します」. Here an object is being swapped for another of the same kind.",
    "温まる is intransitive: it describes something becoming warm on its own. Here you are the one warming it.",
    "調節 controls a degree or quantity, such as a temperature. Here several separate conditions have to be reconciled.",
    "引き止める means stopping someone from leaving. Here you are being asked whether you will take the work on yourself."
  ];

  // What each action means, and what the request is actually asking for. Both
  // in English, and neither names the target word.
  var actionGlosses = {
    arrange:"to make things match", scatter:"to scatter things about", open:"to open the window",
    replace:"to swap an item for another of the same kind", fold:"to fold the robe", hide:"to hide the luggage",
    warm:"to heat something up", pour:"to pour it away", cool:"to make it colder",
    adjust:"to reconcile several conditions", lock:"to control a temperature", leave:"to walk out of the room",
    accept:"to agree to do it", decline:"to turn it down"
  };

  var requiredActions = [
    "group the cushions so they match on the one attribute the sentence names",
    "put the used item in the bin the sentence names, then fit its fresh counterpart",
    "move the dish the sentence names to the appliance the sentence names",
    "choose a time that satisfies every condition given at once",
    "answer the request Kon actually made"
  ];

  encounters.forEach(function(item, index){
    item.options = item.options.map(function(option, optionIndex){
      option.nearMiss = index !== 4 && optionIndex === 1;
      option.explanation = option.nearMiss ? nearMissExplanations[index] : "";
      return option;
    });
  });

  function copyItem(base, changes){
    var result = {};
    var key;
    for(key in base) result[key] = base[key];
    for(key in changes) result[key] = changes[key];
    return result;
  }

  /* Where the right answer sits in the three days.
   *
   * Every one of these fifteen items listed its correct choice first, so a
   * learner could clear the whole first stage by always tapping the top
   * option without reading a word of Japanese. The episodes were balanced
   * months ago; this file was missed because its correctness is decided by
   * option key rather than by index, so nothing about it looked positional.
   *
   * The shuffle happens here rather than in the data because the learn and
   * challenge phases take their labels from a parallel array by position, and
   * mark the near miss as "whichever option is second". Reordering the data
   * would tear labels off their keys. By this point each option is one object
   * carrying its own key, label, near-miss flag and explanation, so moving it
   * moves everything with it.
   *
   * Keyed on the item and phase, so it is stable: the same question always
   * presents in the same order, and an answer never moves under a finger.
   */
  function shuffleSeed(text){
    var h = 0x811c9dc5;
    for(var i = 0; i < text.length; i++){
      h ^= text.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  function balanceOptions(options, seedText){
    var out = options.slice();
    var h = shuffleSeed(seedText);
    for(var i = out.length - 1; i > 0; i--){
      h = ((h ^ (h >>> 13)) * 0x01000193) >>> 0;
      var j = h % (i + 1);
      var swap = out[i]; out[i] = out[j]; out[j] = swap;
    }
    return out;
  }

  function phaseItem(index, variant, phase){
    var base = encounters[index];
    var text = variant ? practiceVariantsB[index] : practiceVariantsA[index];
    var options = phase === "practice"
      ? practiceWordChoice[index].options.map(function(option){
          return {
            key:option.key,
            emoji:"",
            label:option.label,
            nearMiss:!!option.nearMiss,
            explanation:option.nearMiss ? nearMissExplanations[index] || "" : ""
          };
        })
      : base.options.map(function(option, optionIndex){
          return {
            key:option.key,
            emoji:option.emoji,
            label:japaneseOptions[index][optionIndex],
            nearMiss:index !== 4 && optionIndex === 1,
            explanation:index !== 4 && optionIndex === 1 ? nearMissExplanations[index] : ""
          };
        });
    options = balanceOptions(options, phase + ":" + index + ":" + (variant ? "b" : "a"));
    return copyItem(base, {
      phase:phase,
      mechanic:mechanicNames[index],
      interaction:variant ? alternateInteractions[index] : practiceInteractionsA[index],
      variant:phase + "-" + (variant ? "b" : "a"),
      narration:(variant ? evidenceNarrationsB[index] : evidenceNarrationsA[index]),
      jp:phase === "practice" ? practiceWordChoice[index].jp : text.jp,
      // Support is withdrawn one layer per day, so the three days differ in
      // difficulty rather than only in situation:
      //   Day 1 基礎   Japanese + romaji + English meaning + hint
      //   Day 2 実践   Japanese + English translation, no romaji
      //   Day 3 挑戦   audio only
      meaning:phase === "learn" ? text.meaning : (phase === "practice" ? practiceWordChoice[index].english : ""),
      successReply:phase === "practice" ? practiceWordChoice[index].successReply : text.successReply,
      romaji:phase === "learn" ? (text.romaji || base.romaji) : "",
      hint:phase === "learn" ? "Use the subject, object, and scene result to decide whether the request describes a deliberate action or a change of state." : "",
      replyResponses:null,
      options:options
    });
  }

  var practice = [
    phaseItem(0, false, "practice"), phaseItem(1, false, "practice"),
    phaseItem(2, false, "practice"), phaseItem(3, false, "practice"),
    phaseItem(4, false, "practice")
  ];

  // Day 3 runs in story order. An earlier shuffle (2, 0, 4, 1, 3) made the day
  // jump from after dark, to the next morning, to before closing the front
  // desk. Each narration is tied to its own task, so the order cannot be
  // shuffled independently of the story. Challenge stays harder by hiding
  // romaji and hints and by using the variant-B situations, not by reordering.
  var challenge = [
    phaseItem(0, true, "challenge"), phaseItem(1, true, "challenge"),
    phaseItem(2, true, "challenge"), phaseItem(3, true, "challenge"),
    phaseItem(4, true, "challenge")
  ];

  function getEncounter(index){
    var safeIndex = Math.max(0, Math.min(encounters.length - 1, Number(index) || 0));
    return encounters[safeIndex];
  }

  function getDayMeta(phase){
    return DAY_META[phase] || DAY_META.learn;
  }

  function getDayAnnouncement(phase){
    return DAY_ANNOUNCEMENTS[phase] || DAY_ANNOUNCEMENTS.learn;
  }

  function getPhaseItems(phase){
    if(phase === "practice") return practice;
    if(phase === "challenge") return challenge;
    return encounters;
  }

  function isChallengeMastered(score, correctWords){
    var unique = {};
    (correctWords || []).forEach(function(word){ unique[word] = true; });
    return score >= challenge.length && encounters.every(function(item){ return !!unique[item.focusWord]; });
  }

  function isFocusedReviewComplete(reviewItems, correctWords){
    var unique = {};
    (correctWords || []).forEach(function(word){ unique[word] = true; });
    return (reviewItems || []).length > 0 && reviewItems.every(function(item){
      return !!unique[item.focusWord];
    });
  }

  function getWrittenPrompt(item, phase){
    if(phase === "challenge") return "音声を聞いてください。";
    return item.jp;
  }

  function getStorySetup(item, resumed, afterDecline){
    if(afterDecline) return (item.returnReply || "コン：「戻ってきてくれたんですね！」") + " " + item.narration;
    if(!resumed) return item.narration;
    return "コン：「お帰りなさい。続きから始めましょう。」 " + item.narration;
  }

  function getAutoAdvanceDelay(isCorrect){
    return isCorrect ? 2600 : null;
  }

  function getKonResponse(item, isCorrect, selectedKey){
    if(isCorrect) return item.successReply || "ありがとうございます。頼まれたことができました。";
    if(item.replyResponses && item.replyResponses[selectedKey]) return item.replyResponses[selectedKey];
    return item.retryReply || "もう一度、頼まれたことを確認してください。";
  }

  // Never names the target. The learner can try again, so the feedback says
  // what they chose and what the request wants - not which word to click.
  function getWrongAnswerFeedback(item, selectedKey){
    var selected = item.options.filter(function(option){ return option.key === selectedKey; })[0];
    if(selected && selected.nearMiss && selected.explanation) return selected.explanation;

    var index = encounters.map(function(entry){ return entry.focusWord; }).indexOf(item.focusWord);
    var wanted = requiredActions[index] || "do what the sentence asks";
    var chose = selected ? actionGlosses[selected.key] : null;
    return (chose ? "You chose " + chose + ". " : "")
      + "The request asks you to " + wanted + ".";
  }

  /* The five words this stage teaches are five of the Inn's forty catalog
   * targets. Naming the catalog id here is what lets a correct answer in the
   * three days count towards the Inn's understanding gauge.
   *
   * Without it the gauge read 0% through the whole first stage - three days of
   * work, a gold medal, and a wallet filling up beside a bar that never moved -
   * because mastery was only ever credited from the episode path.
   *
   * The pairing is authored knowledge, not something to derive: 温める here is
   * specifically the food-and-drink sense, v-atatameru-food, rather than the
   * room-warming verb it is usually taught against.
   */
  var TARGET_IDS = {
    "揃える":"v-soroeru",
    "取り替える":"v-torikaeru",
    "温める":"v-atatameru-food",
    "調整":"w-chousei",
    "引き受ける":"v-hikiukeru"
  };

  function getTargetId(focusWord){
    return TARGET_IDS[focusWord] || null;
  }

  root.N2HomeInnStage = {
    key:"home-inn",
    name:"Moonview Inn",
    icon:"🏡",
    pos:{x:64, y:74},
    label:"Moonview Inn - N2",
    intro:intro,
    encounters:encounters,
    practice:practice,
    challenge:challenge,
    getEncounter:getEncounter,
    getDayMeta:getDayMeta,
    getDayAnnouncement:getDayAnnouncement,
    getPhaseItems:getPhaseItems,
    isChallengeMastered:isChallengeMastered,
    isFocusedReviewComplete:isFocusedReviewComplete,
    getWrittenPrompt:getWrittenPrompt,
    getStorySetup:getStorySetup,
    getAutoAdvanceDelay:getAutoAdvanceDelay,
    getKonResponse:getKonResponse,
    getWrongAnswerFeedback:getWrongAnswerFeedback,
    getTargetId:getTargetId,
    balanceOptions:balanceOptions
  };
})(typeof window !== "undefined" ? window : globalThis);
