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
    review:{day:3,label:"三日目",mode:"復習",difficulty:"もう一度",stars:"★★★"},
    // Day 0, and deliberately starless: the cold open is not scored, so a
    // star rating on it would promise a judgement that never comes.
    coldopen:{day:0,label:"はじめの仕事",mode:"ためし",difficulty:"",stars:""}
  };

  /* The first guest arrives before any teaching, and the learner almost
   * certainly cannot help her yet. That is the point: the three days become an
   * answer to a problem they have just felt rather than homework set in
   * advance. Kon absorbs the outcome - nothing here is scored, paid or
   * recorded - and the correct branch exists so a learner who already knows
   * 揃える is not sent away to practise it. */
  var coldOpen = {
    wrongReply:"コン：「間違いです。でもこれから一緒に覚えていきましょう。」",
    correctReply:"コン：「よくご存じですね。では、残りの言葉も見ていきましょう。」"
  };

  /* What each part of the stage is for, said before it starts.
   *
   * The days differ in how much help is on screen, and nothing said so. A
   * learner met Day 3 with no warning that the request would not be written
   * down this time, which reads as the game breaking rather than as the
   * difficulty rising on purpose.
   */
  var DAY_GOALS = {
    coldopen:"まだ習っていない言葉ばかりです。できなくて大丈夫、今日から一緒に覚えましょう。",
    learn:"五つの言葉を、意味とローマ字を見ながら覚えます。困ったらヒントを見てください。",
    practice:"同じ五つを、別の場面で使います。今日はローマ字がありません。文を読んで、正しい形を選びます。",
    challenge:"同じ五つを、音声だけで聞き取ります。文は画面に出ません。もう一度聞きたいときはスピーカーを押してください。",
    review:"間違えた言葉だけ、別のやり方でもう一度出します。全部できたら終わりです。"
  };

  function getDayGoal(phase){
    return DAY_GOALS[phase] || DAY_GOALS.learn;
  }

  /* What kind of thing this part is, in three words.
   *
   * The days already carried story names - 基礎, 実践, 挑戦 - which say where
   * the learner is in the shift but not what they are being asked to do.
   * Reported from play: it was not clear whether a part was teaching new
   * words, drilling ones already met, or testing them. The goal sentence says
   * it in full; this is the label that says it at a glance, and it is the same
   * vocabulary everywhere so the three read as a set.
   */
  var DAY_KINDS = {
    coldopen:"ためし",
    learn:"新しい言葉を覚える",
    practice:"覚えた言葉を練習する",
    challenge:"覚えた言葉をテストする",
    review:"間違えた言葉を復習する"
  };

  function getDayKind(phase){
    return DAY_KINDS[phase] || DAY_KINDS.learn;
  }

  /* The sentence each word is taught with, and the pattern it lives in.
   *
   * Authored here rather than taken from the catalogue because the catalogue
   * cannot carry this. Its examples for these five run to a median of nine
   * characters, which is too short to show the grammar N2 tests, and two are
   * actively wrong for this stage: the catalogue exampled a whole idiom that
   * means to speak in unison, and it tuned a clarinet. The three that are
   * kept below are the catalogue's project-written entries, which were
   * authored for this inn in the first place.
   *
   * The pattern is the part that makes an N2 word usable and the part no
   * picture can convey, so it is a required field rather than a nicety.
   */
  var TEACHING = {
    "揃える": {
      sentence:"お客様の分のスリッパを四つ揃えてください。",
      pattern:"〜を揃える"
    },
    "取り替える": {
      sentence:"古いタオルを新しいタオルに取り替えてください。",
      pattern:"〜を〜に取り替える"
    },
    "温める": {
      sentence:"お茶をコンロでもう一度温めてください。",
      pattern:"〜を温める"
    },
    "調整": {
      sentence:"夕食の開始時刻を調整していただけますか。",
      pattern:"〜を調整する"
    },
    "引き受ける": {
      sentence:"今夜の夕食の配膳を引き受けていただけませんか。",
      pattern:"〜を引き受ける"
    }
  };

  function getTeaching(focusWord){
    return TEACHING[focusWord] || null;
  }

  var DAY_ANNOUNCEMENTS = {
    learn:"コン：「一日目です。今日は基礎から始めましょう。」",
    practice:"コン：「二日目です。今日は実際の仕事の中で練習しましょう。」",
    challenge:"コン：「三日目です。今日は音声を聞いて仕事に挑戦しましょう。」",
    review:"コン：「三日目の最後に、間違えた仕事だけもう一度確認しましょう。」",
    // Without its own line the cold open announced 「一日目です」, which is the
    // one thing it is not: the three days start after it, because of it.
    coldopen:"コン：「あっ、もうお客様がいらっしゃいました。さっそくですが、お願いします。」"
  };

  var encounters = [
    {
      level:"N2",
      focusWord:"揃える",
      reading:"そろえる",
      actionType:"visible movement",
      label:"お客様が来る前に",
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
      label:"洗面所で",
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
      label:"お茶が冷めてしまった",
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
      label:"明日の予定を立てる",
      // Real inns do not let staff move a guest's checkout time around like
      // this - checkout is a fixed house time, and any exception is a simple
      // request, not a calculation. Reported live three times running: the
      // checkout-adjusting premise, then the train/travel-time math once
      // that was fixed, then cleaning starting the same instant as checkout
      // once that was fixed too - nothing hands a room straight over the
      // second a guest leaves. The guest's checkout (12:00) is a stated
      // fact; cleaning is stated as starting an hour after that, at the
      // earliest, which is what actually separates the two times. The other
      // side is unchanged: two hours of cleaning before the fixed 15:00
      // arrival. Both facts remain load-bearing - removing either changes
      // which bound produces 13:00.
      narration:"コン：「お客様が部屋で休んでいる間に、明日の予定を決めておきましょう。お客様のチェックアウト時刻と、次のお客様の到着時刻を確認して、掃除を始める時間を調整してください。」",
      jp:"お客様は12時にチェックアウトするそうです。チェックアウトの1時間後から掃除ができます。掃除には2時間必要です。次のお客様は15時に到着します。掃除を始める時間を調整してください。",
      romaji:"Okyakusama wa juuniji ni chekku auto suru sou desu. Chekku auto no ichijikan go kara souji ga dekimasu. Souji ni wa nijikan hitsuyou desu. Tsugi no okyakusama wa juugoji ni touchaku shimasu. Souji o hajimeru jikan o chousei shite kudasai.",
      meaning:"The guest says they'll check out at 12:00. Cleaning can start one hour after checkout at the earliest. Cleaning needs two hours. The next guest arrives at 15:00. Coordinate what time to start cleaning.",
      successReply:"ありがとうございます。掃除を13時に始めるよう調整できました。これで次のお客様の到着にも間に合います。",
      retryReply:"時間の条件をもう一度確認してください。",
      hint:"Use both the checkout time (plus its one-hour wait) and the cleaning time. 調整 means reconciling several conditions.",
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
      label:"夕食の配膳",
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
      scene:"cleaning",
      // "Move the time card" named neither the control (a slider) nor which
      // of the two labeled sliders responds to it, and "a checkout board
      // with one adjustable time card" described the widget rather than the
      // constraint driving the puzzle - reported live as leaving a learner
      // unsure what to actually do.
      controlHelp:"Use Earlier or Later to set a time, then press 決定 to confirm.",
      clue:"Only the cleaning start time can move. The next guest's arrival at 15:00 is fixed.",
      min:9,max:15,startA:10,startB:15,gap:2,targetA:13,targetB:15,fixedB:true,labelA:"掃除開始",labelB:"次のお客様到着"
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
      scene:"dinner-seatings",
      controlHelp:"Use Earlier or Later to set each dinner time, then press 決定 to confirm.",
      clue:"Both dinner start times can move. Leave enough time to serve one group before the next.",
      min:17,max:21,startA:18,startB:18,gap:2,targetA:18,targetB:20,fixedB:false,labelA:"Aグループ夕食",labelB:"Bグループ夕食"
    },
    {
      scene:"errand",
      controlHelp:"Choose your reply.",
      clue:"The entrance needs sweeping before it opens, and the innkeeper is already making breakfast.",
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
      scene:"dinner-seatings",
      controlHelp:"Use Earlier or Later to set each dinner time, then press 決定 to confirm.",
      clue:"Both dinner start times can move. Leave enough time to serve one group before the next.",
      min:17,max:21,startA:18,startB:18,gap:2,targetA:18,targetB:20,fixedB:false,labelA:"Cグループ夕食",labelB:"Dグループ夕食"
    },
    {
      scene:"errand",
      controlHelp:"Choose your reply.",
      clue:"The guests are out at the fireworks, and six rooms still need their futons laid out.",
      replies:[
        {key:"accept", label:"はい、引き受けます。"},
        {key:"decline", label:"すみません、引き受けられません。"}
      ]
    }
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
    {jp:"Cグループは18時以降、Dグループは20時までに夕食を始められます。一組の食事には2時間かかります。夕食の開始時刻を調整してください。", romaji:"C guruupu wa juuhachiji ikou, D guruupu wa nijuji made ni yuushoku o hajimeraremasu. Hitokumi no shokuji ni wa nijikan kakarimasu. Yuushoku no kaishi jikoku o chousei shite kudasai.", narration:"Two groups need dinner seatings, with enough time to serve one group before the next.", meaning:"Coordinate the two dinner start times using the stated booking windows.", successReply:"Cグループは18時、Dグループは20時になりました。これで順番に夕食をお出しできます。"},
    {jp:"三番から六番のお部屋のお布団を引き受けていただけませんか。", romaji:"Sanban kara rokuban no oheya no ofuton o hikiukete itadakemasen ka.", narration:"Six rooms still need their futons laid out before the guests return.", meaning:"Would you take on the futons for rooms three to six?", successReply:"ありがとうございます。お客様が戻るまでに間に合いました。"}
  ];

  var practiceVariantsB = [
    {jp:"二つのマットに、同じ大きさの座布団を二枚ずつ揃えてください。", romaji:"Futatsu no matto ni, onaji ookisa no zabuton o nimai zutsu soroete kudasai.", narration:"The cushions are still mixed across the tatami.", meaning:"Please place two cushions of the same size on each mat.", successReply:"座布団の大きさが揃いました。これで部屋が整いました。"},
    {jp:"切れた電球を回収箱に入れて、新しい電球に取り替えてください。", romaji:"Kireta denkyuu o kaishuubako ni irete, atarashii denkyuu ni torikaete kudasai.", narration:"A lamp in the hallway has gone dark.", meaning:"Put the burned-out bulb in the recycling box, then replace it with a new one.", successReply:"新しい電球がつきました。これで廊下が明るくなります。"},
    {jp:"スープをコンロで温めてください。", romaji:"Suupu o konro de atatamete kudasai.", narration:"A guest returns late to a counter of cold dishes.", meaning:"Please warm the soup on the stove.", successReply:"スープが温まりました。お客様に出しましょう。"},
    {label:"夕食の時間を決める", jp:"Aグループは18時以降、Bグループは20時までに夕食を始められます。一組の食事には2時間かかります。夕食の開始時刻を調整してください。", romaji:"A guruupu wa juuhachiji ikou, B guruupu wa nijuji made ni yuushoku o hajimeraremasu. Hitokumi no shokuji ni wa nijikan kakarimasu. Yuushoku no kaishi jikoku o chousei shite kudasai.", narration:"Both groups requested the same dinner time. Group A can begin at 18:00 or later, Group B by 20:00, and each meal needs two hours.", meaning:"Coordinate the two dinner start times using the booking windows and meal length.", successReply:"Aグループは18時、Bグループは20時になりました。これで順番に夕食をお出しできます。"},
    {jp:"明日の朝、玄関の掃除を引き受けていただけませんか。", romaji:"Ashita no asa, genkan no souji o hikiukete itadakemasen ka.", narration:"The entrance has to be swept before it opens tomorrow.", meaning:"Would you take on sweeping the entrance tomorrow morning?", successReply:"ありがとうございます。これで朝のお客様を気持ちよくお迎えできます。"}
  ];

  /* Day 2's own shift, and deliberately not the same shape as the others.
   *
   * Day 1 and Day 3 both open on the cushions and end on a favour, so playing
   * the second day felt like playing the first again with the words moved
   * around. This one starts in the office with tonight's plan and works
   * outward - desk, kitchen, dining room, guest room - which is a different
   * hour of the same job rather than a re-run of it.
   *
   * Indexed by encounter, not by position: the day is played in DAY2_ORDER
   * below, so 揃える's line is still at index 0 here even though it is asked
   * third. Keeping the arrays index-aligned is what lets the order change
   * without every other table having to be reshuffled with it.
   */
  var evidenceNarrationsA = [
    "コン：「食事処を開けます。前の組が使った座布団が、向きばらばらのままです。」",
    "コン：「お食事の間に客室を回ります。三番のシーツに染みがついていました。」",
    "コン：「時刻が決まりました。厨房を見てきてください。早く着いたお客様の分のごはんが冷めています。」",
    "コン：「二日目は帳場から始めます。今夜はＣグループとＤグループが同じ時刻をご希望です。食事処は一組ずつしかご案内できません。」",
    "コン：「今日はよく回りました。最後にもう一つ、明日の朝食の配膳をお願いしたいのですが。」"
  ];

  // Desk, kitchen, dining room, guest room, then tomorrow's favour.
  var DAY2_ORDER = [3, 2, 0, 1, 4];

  var evidenceNarrationsB = [
    "コン：「次の朝です。朝食のあと、子どもたちが大きさの違う座布団を二つのマットに残しました。」",
    "コン：「廊下が暗くなっています。散歩に出たお客様がもうすぐ戻りますが、この電球が切れてしまいました。」",
    "コン：「散歩のお客様が日暮れ後に戻りました。着替えている間に、夕食のスープが冷めてしまいました。」",
    "コン：「夕食の時間に、ＡグループとＢグループから同じ時刻の希望をいただきました。食事処は一組ずつご案内します。」",
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
        {key:"air", label:"干して"},
        {key:"stack", label:"重ねて"}
      ],
      successReply:"はい、座布団の向きを自分の手で同じにするので「揃える」です。"
    },
    {
      jp:"汚れたシーツを洗濯かごに入れて、新しいシーツに（　　）ください。",
      english:"Put the stained sheet in the laundry basket, then replace it with a new one.",
      options:[
        {key:"replace", label:"取り替えて"},
        {key:"kaeru", label:"代えて", nearMiss:true},
        {key:"wash", label:"洗って"},
        {key:"flip", label:"裏返して"}
      ],
      successReply:"はい、汚れたシーツを別の物と交換するので「取り替える」です。"
    },
    {
      jp:"冷めたごはんを、電子レンジで（　　）ください。",
      english:"Please warm the cold rice in the microwave.",
      options:[
        {key:"warm", label:"温めて"},
        {key:"atatamaru", label:"温まって", nearMiss:true},
        {key:"grill", label:"焼いて"},
        {key:"remove", label:"取り出して"}
      ],
      successReply:"はい、冷めたごはんを自分で温かくするので「温める」です。"
    },
    {
      jp:"二つのグループの夕食開始時刻を（　　）ください。",
      english:"Please coordinate the dinner start times of the two groups.",
      options:[
        {key:"adjust", label:"調整して"},
        {key:"chousetsu", label:"調節して", nearMiss:true},
        {key:"record", label:"記録して"},
        {key:"tell", label:"知らせて"}
      ],
      successReply:"はい、Cグループは18時、Dグループは20時にしました。条件を合わせるのが「調整」です。"
    },
    {
      jp:"明日の朝食の配膳を（　　）くれませんか。",
      english:"Would you take on serving tomorrow's breakfast?",
      options:[
        {key:"accept", label:"引き受けて"},
        {key:"hikitomeru", label:"引き止めて", nearMiss:true},
        // 手伝って was here and had to go: it is not a different action from
        // 引き受ける, it is one that follows it. 引き受けてから手伝う is an
        // ordinary sequence, so the option was not wrong, only vaguer than the
        // answer - which teaches nothing except that the vaguer word loses.
        // Checking the arrangements is a genuinely different job.
        {key:"confirm", label:"確認して"},
        {key:"substitute", label:"代わって"}
      ],
      successReply:"はい、明日の朝食の配膳をお願いします。責任を持って受けるのが「引き受ける」です。"
    }
  ];

  // Day 3 is audio-only, so its two word-choice items need complete spoken
  // requests rather than Day 2's visible cloze. These lines and replies are
  // also used by Episode 1, so their actor recordings remain available here.
  var challengeListening = {
    2:{
      jp:"お客様：「このお茶、冷めてしまいました。同じものを温かくしていただけますか。」",
      successReply:"温かいお茶をお出しできました。飲み物には「温める」を使います。",
      options:[
        {key:"warm", label:"温めます。"},
        {key:"atatamaru", label:"温まります。", nearMiss:true},
        // The room-and-air spelling of this verb would be the sharpest
        // distractor here, but the whole file is guarded against that
        // character - including in comments - so a collocation error cannot
        // creep into a request or a reply. Episode 1 draws that contrast
        // instead, where the wrong option carries an explanation. Boiling the
        // tea is the next best thing: a real action, and wrong for a reason
        // the learner has to know.
        {key:"boil", label:"沸かします。"},
        {key:"cool", label:"冷やします。"}
      ]
    },
    4:{
      jp:"コン：「明日の朝、駅までお客様を送る仕事があります。お願いできますか。」",
      successReply:"任せました。責任を持ってやると決めるのが「引き受ける」です。",
      options:[
        {key:"accept", label:"はい、引き受けます。"},
        {key:"hikitomeru", label:"はい、引き止めます。", nearMiss:true},
        {key:"uketoru", label:"はい、受け取ります。"},
        {key:"hikikaesu", label:"はい、引き返します。"}
      ]
    }
  };

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
    accept:"to agree to do it", decline:"to turn it down",
    // The Day 2 word choices. Each is a real thing to do in that room, which
    // is the point - the learner has to know the word rather than spot the
    // one absurd option.
    air:"to air them out", stack:"to stack them up",
    wash:"to wash it", flip:"to turn it over",
    grill:"to grill it", remove:"to take it out",
    record:"to write them down", tell:"to pass them on", confirm:"to check it",
    substitute:"to take someone's place",
    // Day 3's spoken questions.
    boil:"to boil it", uketoru:"to receive an object",
    hikikaesu:"to turn back the way you came"
  };

  var requiredActions = [
    "group the cushions so they match on the one attribute the sentence names",
    "put the used item in the bin the sentence names, then fit its fresh counterpart",
    "move the dish the sentence names to the appliance the sentence names",
    "choose dinner seating times that satisfy every booking condition at once",
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

  /* Build one day's version of an encounter.
   *
   * `format` separates how a question is answered from which day it belongs
   * to. Day 2 is all word choice and Day 1 is all task, so those two defaulted
   * cleanly off the phase - but Day 3 is now mixed, and keying the renderer off
   * the phase made that impossible to express.
   *
   * Day 3 keeps the task only where performing the action is what proves the
   * word was understood: 揃える against 揃う is precisely the difference
   * between doing it and it happening, 取り替える is a physical swap, and the
   * schedule stepper is what 調整 means. 温める turns on food versus a room,
   * and 引き受ける is a decision - neither is demonstrated by dragging
   * anything, and 引き受ける's task is a two-button accept/decline, which is a
   * coin flip sitting inside the final test.
   */
  function phaseItem(index, variant, phase, format){
    var base = encounters[index];
    // "guided" is Day 1's own situation and room, reused by the review ladder.
    // Variant A's request lines are the one set with no recorded audio - they
    // are never spoken anywhere else - so a review pass built on them would be
    // read out by the device voice.
    var guided = variant === "guided";
    var text = guided ? base : (variant ? practiceVariantsB[index] : practiceVariantsA[index]);
    format = format || (phase === "practice" ? "choice" : "task");
    var choiceContent = phase === "challenge" && challengeListening[index]
      ? challengeListening[index] : practiceWordChoice[index];
    var options = format === "choice"
      ? (choiceContent.options || practiceWordChoice[index].options).map(function(option){
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
    var tag = guided ? "guided" : (variant ? "b" : "a");
    options = balanceOptions(options, phase + ":" + index + ":" + tag);
    return copyItem(base, {
      phase:phase,
      format:format,
      mechanic:mechanicNames[index],
      interaction:guided ? guidedInteractions[index]
        : (variant ? alternateInteractions[index] : practiceInteractionsA[index]),
      variant:phase + "-" + tag,
      label:text.label || base.label,
      narration:guided ? base.narration
        : (variant ? evidenceNarrationsB[index] : evidenceNarrationsA[index]),
      jp:format === "choice" ? choiceContent.jp : text.jp,
      // Support is withdrawn one layer per day, so the three days differ in
      // difficulty rather than only in situation:
      //   Day 1 基礎   Japanese + romaji + English meaning + hint
      //   Day 2 実践   Japanese + tappable support-word glosses, no romaji
      //   Day 3 挑戦   audio only
      meaning:phase === "learn" ? text.meaning : "",
      successReply:format === "choice" ? choiceContent.successReply : text.successReply,
      romaji:phase === "learn" ? (text.romaji || base.romaji) : "",
      hint:phase === "learn" ? "Use the subject, object, and scene result to decide whether the request describes a deliberate action or a change of state." : "",
      replyResponses:null,
      options:options
    });
  }

  /* Every day asks about every word.
   *
   * Coverage used to shrink as difficulty rose - five words on Day 1, three on
   * Day 2, two on Day 3 - so the easiest day tested everything and the final
   * exam tested forty percent of it. 取り替える was asked once, on Day 1, with
   * romaji and a hint on screen, and never again, and the stage could still
   * report itself mastered. A gate has to cover what it claims to gate.
   *
   * Both days run in encounter order, which is also story order: the A
   * narrations walk one day from the morning cushions to tomorrow's breakfast
   * rota, and the B narrations walk the next from the morning after to the
   * luggage that has to reach the station. An earlier shuffle (2, 0, 4, 1, 3)
   * made a day jump from after dark to the next morning to before closing the
   * front desk, because each narration is tied to its own task. Day 3 is
   * harder for hiding romaji, hints and the written request - not for being
   * out of order.
   */
  var practice = DAY2_ORDER.map(function(index){
    return phaseItem(index, false, "practice");
  });

  var challenge = [0, 1, 2, 3, 4].map(function(index){
    return phaseItem(index, true, "challenge", index === 2 || index === 4 ? "choice" : "task");
  });

  /* The review ladder: the same word, a different way of asking, every time.
   *
   * Review used to hand back the identical Day 3 question that was just
   * missed. Getting it right the second time proves the learner remembers the
   * screen, which is not the same as knowing the word - and if they miss it
   * again there is nothing else to try.
   *
   * Three rungs, and each one changes both the format and the situation, so
   * what is left behind is that 取り替える means swapping one thing for another
   * of the same kind rather than one memorised sentence:
   *
   *   0  name it     the cloze, four options, the near-miss pair among them
   *   1  do it       Day 1's own room and situation, but without romaji or hint
   *   2  hear it     Day 3's situation again, audio only
   *
   * All three speak lines that have recorded clips. Variant A's requests are
   * the one set with none - nothing else ever speaks them - so the ladder uses
   * Day 1's `guided` situation for the middle rung rather than variant A.
   */
  var REVIEW_LADDER = [
    {variant:false, format:"choice"},
    {variant:"guided", format:"task"},
    {variant:true, format:"task"}
  ];

  function indexOfWord(word){
    for(var i = 0; i < encounters.length; i++){
      if(encounters[i].focusWord === word) return i;
    }
    return -1;
  }

  function getReviewItem(word, pass){
    var index = indexOfWord(word);
    if(index < 0) return null;
    var rung = REVIEW_LADDER[Math.max(0, Number(pass) || 0) % REVIEW_LADDER.length];
    return copyItem(phaseItem(index, rung.variant, "review", rung.format), {
      reviewPass:Math.max(0, Number(pass) || 0)
    });
  }

  function getReviewLadderLength(){
    return REVIEW_LADDER.length;
  }

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

  function hasTrainingEvidence(correctWords){
    var unique = {};
    (correctWords || []).forEach(function(word){ unique[word] = true; });
    return encounters.every(function(item){ return !!unique[item.focusWord]; });
  }

  function isChallengeMastered(score, correctWords){
    return score >= challenge.length && hasTrainingEvidence(correctWords);
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

  /* One speaker, one pair of quotes.
   *
   * Both of these glue a greeting in front of the narration, and both are Kon
   * talking - so joining them with a space produced 「コン：「お帰りなさい。」
   * コン：「もうすぐ最初のお客様が来ます。」」 in a single bubble, which reads
   * as two foxes. app.js already merges the day announcement onto a narration
   * for exactly this reason; the same rule has to hold here, because this is
   * where these two get glued together.
   */
  function joinKonLines(first, second){
    if(!first) return second || "";
    if(!second) return first;
    var open = "コン：「";
    if(first.slice(-1) === "」" && second.indexOf(open) === 0){
      return first.slice(0, -1) + second.slice(open.length);
    }
    return first + " " + second;
  }

  function getStorySetup(item, resumed, afterDecline){
    if(afterDecline) return joinKonLines(item.returnReply || "コン：「戻ってきてくれたんですね！」", item.narration);
    if(!resumed) return item.narration;
    return joinKonLines("コン：「お帰りなさい。続きから始めましょう。」", item.narration);
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

  /* The catalog's first sense is not always the Inn's sense.
   *
   * w-chousei's meanings are ["regulation","adjustment","tuning"], in that
   * order, because "regulation" is the catalog's general-purpose first sense
   * across every place that uses this word. In the Inn it never means that -
   * the checkout-and-cleaning and dinner-seating tasks are both about reconciling
   * several conditions into one time, which is "adjustment" or "coordination".
   * A learner reading "regulation" on the new-word card would associate the
   * kanji with the wrong concept before ever answering the question.
   *
   * This overrides the card only, not the catalog entry: nothing else that
   * reads meanings[0] - reviews, other places, the general gloss - should have
   * its sense reordered for a fix that is specific to one story. */
  var CARD_SENSES = {
    "調整":"adjustment, coordination"
  };

  function getCardSense(focusWord){
    return CARD_SENSES[focusWord] || null;
  }

  root.N2HomeInnStage = {
    key:"home-inn",
    name:"Moonview Inn",
    icon:"🏡",
    pos:{x:64, y:74},
    label:"月見宿・N2",
    intro:intro,
    coldOpen:coldOpen,
    encounters:encounters,
    practice:practice,
    challenge:challenge,
    getEncounter:getEncounter,
    getDayMeta:getDayMeta,
    getDayAnnouncement:getDayAnnouncement,
    getDayGoal:getDayGoal,
    getDayKind:getDayKind,
    getPhaseItems:getPhaseItems,
    getReviewItem:getReviewItem,
    getReviewLadderLength:getReviewLadderLength,
    hasTrainingEvidence:hasTrainingEvidence,
    isChallengeMastered:isChallengeMastered,
    isFocusedReviewComplete:isFocusedReviewComplete,
    getWrittenPrompt:getWrittenPrompt,
    getStorySetup:getStorySetup,
    getAutoAdvanceDelay:getAutoAdvanceDelay,
    getKonResponse:getKonResponse,
    getWrongAnswerFeedback:getWrongAnswerFeedback,
    getTargetId:getTargetId,
    getCardSense:getCardSense,
    getTeaching:getTeaching,
    balanceOptions:balanceOptions
  };
})(typeof window !== "undefined" ? window : globalThis);
