(function(root){
  "use strict";

  var intro = {
    context:"コン：「月見宿へようこそ。今日は従業員が一人休んでいて、とても忙しいんです。」",
    jp:"日本語の練習をしながら、私の仕事を手伝ってくれませんか？",
    romaji:"Nihongo no renshuu o shinagara, watashi no shigoto o tetsudatte kuremasen ka?",
    accept:"はい、手伝います。"
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
      focusWord:"代える",
      reading:"かえる",
      actionType:"object interaction",
      label:"At the washstand",
      narration:"コン：「座る場所はきれいになりました。お客様は旅のあとで顔を洗いますが、前のお客様のタオルがまだ残っています。」",
      jp:"古いタオルを新しいものに代えてください。",
      romaji:"Furui taoru o atarashii mono ni kaete kudasai.",
      meaning:"Please replace the old towel with a new one.",
      successReply:"ありがとうございます。新しいタオルになりました。これでお客様が使えます。",
      retryReply:"頼まれた物と、古い物を置く場所を確認してください。",
      hint:"代える means to substitute or replace one thing with another.",
      options:[
        {key:"replace", emoji:"🧻", label:"Replace the towel"},
        {key:"fold", emoji:"👘", label:"Fold the robe"},
        {key:"hide", emoji:"🧳", label:"Hide the luggage"}
      ],
      correct:"replace"
    },
    {
      level:"N2",
      focusWord:"暖める",
      reading:"あたためる",
      actionType:"visible movement",
      label:"The tray has gone cold",
      narration:"コン：「お客様が到着しました。部屋を準備している間に、歓迎のお茶が冷めてしまいました。このままでは出せません。」",
      jp:"お茶をもう一度暖めてください。",
      romaji:"Ocha o mou ichido atatamete kudasai.",
      meaning:"Please warm the tea once more.",
      successReply:"ありがとうございます。お茶が暖まりました。これでお客様に出せます。",
      retryReply:"頼まれた物と、暖め方をもう一度確認してください。",
      hint:"暖める means to warm or heat something.",
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
      label:"The next morning",
      narration:"コン：「朝になりました。お客様はできるだけ遅くまで滞在したいそうです。ただし、駅への移動と掃除、次のお客様の準備時間も必要です。」",
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
      label:"One more favour",
      narration:"コン：「お客様は満足して帰りました。明日も人手が必要です。手伝ってくれるなら、今夜はこの宿に無料で泊まれます。」",
      jp:"明日のお客様の案内を引き受けていただけませんか。",
      romaji:"Ashita no okyakusama no annai o hikiukete itadakemasen ka.",
      meaning:"Would you be willing to undertake guiding tomorrow's guests?",
      successReply:"ありがとうございます。今夜はここでゆっくり休んでください。",
      retryReply:"まだ仕事を引き受けた返事になっていません。",
      hint:"引き受ける means to undertake, take over, or accept responsibility for something.",
      options:[
        {key:"accept", emoji:"", label:"はい、引き受けます。"},
        {key:"ask", emoji:"", label:"何時からですか。"},
        {key:"refuse", emoji:"", label:"すみません、引き受けられません。"}
      ],
      correct:"accept",
      completionFeedback:"コン：「ありがとうございます。今夜はここでゆっくり休んでください。」",
      completionNextLabel:"次の朝へ"
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
    ]
  };
  var ROOM_HELP = "Drag objects between the places shown. Follow Kon's Japanese request to decide what to move.";
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
        {key:"ask", label:"何時からですか。"},
        {key:"refuse", label:"すみません、引き受けられません。"}
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
        {key:"ask", label:"何時からですか。"},
        {key:"refuse", label:"すみません、引き受けられません。"}
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
    {jp:"汚れたシーツを新しいものに代えてください。", romaji:"Yogoreta shiitsu o atarashii mono ni kaete kudasai.", narration:"A marked sheet remains beside the fresh linen.", meaning:"Please replace the stained sheet with a new one.", successReply:"新しいシーツになりました。これで今夜のお客様を迎えられます。"},
    {jp:"ごはんを暖めてください。", romaji:"Gohan o atatamete kudasai.", narration:"The evening meal has gone cold.", meaning:"Please warm the rice.", successReply:"ごはんが暖まりました。みんなで食事にしましょう。"},
    {jp:"Cグループは12時以降、Dグループは14時までに到着します。準備に2時間必要なので、到着時間を調整してください。", romaji:"C guruupu wa juuniji ikou, D guruupu wa juuyoji made ni touchaku shimasu. Junbi ni nijikan hitsuyou na node, touchaku jikan o chousei shite kudasai.", narration:"Two afternoon groups need separate arrival times, with two hours needed between them.", meaning:"Coordinate the two arrival times using the stated limits.", successReply:"Cグループは12時、Dグループは14時になりました。これで準備時間を取れます。"},
    {jp:"朝食の配膳を引き受けてください。", romaji:"Choushoku no haizen o hikiukete kudasai.", narration:"The breakfast shift still needs someone responsible for serving it.", meaning:"Please undertake serving breakfast.", successReply:"ありがとうございます。明日の朝食の配膳をお願いします。"}
  ];

  var practiceVariantsB = [
    {jp:"二つのマットに、同じ大きさの座布団を二枚ずつ揃えてください。", romaji:"Futatsu no matto ni, onaji ookisa no zabuton o nimai zutsu soroete kudasai.", narration:"The cushions are still mixed across the tatami.", meaning:"Please place two cushions of the same size on each mat.", successReply:"座布団の大きさが揃いました。これで部屋が整いました。"},
    {jp:"切れた電球を新しいものに代えてください。", romaji:"Kireta denkyuu o atarashii mono ni kaete kudasai.", narration:"A lamp in the hallway has gone dark.", meaning:"Please replace the burned-out bulb with a new one.", successReply:"新しい電球がつきました。これで廊下が明るくなります。"},
    {jp:"スープを暖めてください。", romaji:"Suupu o atatamete kudasai.", narration:"A guest returns late to a counter of cold dishes.", meaning:"Please warm the soup.", successReply:"スープが暖まりました。お客様に出しましょう。"},
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

  var japaneseOptions = [
    ["揃える", "整う", "散らかす"],
    ["代える", "代わる", "改める"],
    ["暖める", "暖まる", "冷やす"],
    ["調整する", "調節する", "放置する"],
    ["はい、引き受けます。", "何時からですか。", "すみません、引き受けられません。"]
  ];

  var nearMissExplanations = [
    "整う is intransitive: things become arranged. 揃える is transitive: you arrange the items.",
    "代わる is intransitive: something takes another's place. 代える is transitive: you replace it.",
    "暖まる is intransitive: something becomes warm. 暖める means you warm something.",
    "調節 controls degree or quantity, such as temperature. 調整 coordinates conditions such as schedules."
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

  function phaseItem(index, variant, phase){
    var base = encounters[index];
    var text = variant ? practiceVariantsB[index] : practiceVariantsA[index];
    var options = base.options.map(function(option, optionIndex){
      return {
        key:option.key,
        emoji:option.emoji,
        label:japaneseOptions[index][optionIndex],
        nearMiss:index !== 4 && optionIndex === 1,
        explanation:index !== 4 && optionIndex === 1 ? nearMissExplanations[index] : ""
      };
    });
    return copyItem(base, {
      phase:phase,
      mechanic:mechanicNames[index],
      interaction:variant ? alternateInteractions[index] : practiceInteractionsA[index],
      variant:phase + "-" + (variant ? "b" : "a"),
      narration:(variant ? evidenceNarrationsB[index] : evidenceNarrationsA[index]),
      jp:text.jp,
      meaning:text.meaning,
      successReply:text.successReply,
      romaji:phase === "challenge" ? "" : (text.romaji || base.romaji),
      hint:phase === "challenge" ? "" : "Use the subject, object, and scene result to decide whether the request describes a deliberate action or a change of state.",
      options:options
    });
  }

  var practice = [
    phaseItem(0, false, "practice"), phaseItem(1, false, "practice"),
    phaseItem(2, false, "practice"), phaseItem(3, false, "practice"),
    phaseItem(4, false, "practice"), phaseItem(0, true, "practice"),
    phaseItem(1, true, "practice"), phaseItem(2, true, "practice"),
    phaseItem(3, true, "practice"), phaseItem(4, true, "practice")
  ];

  var challenge = [
    phaseItem(2, true, "challenge"), phaseItem(0, false, "challenge"),
    phaseItem(4, true, "challenge"), phaseItem(1, false, "challenge"),
    phaseItem(3, true, "challenge"), phaseItem(4, false, "challenge"),
    phaseItem(2, false, "challenge"), phaseItem(1, true, "challenge"),
    phaseItem(3, false, "challenge"), phaseItem(0, true, "challenge")
  ];

  function getEncounter(index){
    var safeIndex = Math.max(0, Math.min(encounters.length - 1, Number(index) || 0));
    return encounters[safeIndex];
  }

  function getPhaseItems(phase){
    if(phase === "practice") return practice;
    if(phase === "challenge") return challenge;
    return encounters;
  }

  function isChallengeMastered(score, correctWords){
    var unique = {};
    (correctWords || []).forEach(function(word){ unique[word] = true; });
    return score >= 8 && encounters.every(function(item){ return !!unique[item.focusWord]; });
  }

  function getWrittenPrompt(item, phase){
    if(phase === "challenge") return "音声を聞いてください。";
    return item.jp;
  }

  function getStorySetup(item, resumed){
    if(!resumed) return item.narration;
    return "コン：「お帰りなさい。続きから始めましょう。」 " + item.narration;
  }

  function getAutoAdvanceDelay(isCorrect){
    return isCorrect ? 2600 : null;
  }

  function getKonResponse(item, isCorrect){
    if(isCorrect) return item.successReply || "ありがとうございます。頼まれたことができました。";
    return item.retryReply || "もう一度、頼まれたことを確認してください。";
  }

  function getWrongAnswerFeedback(item, selectedKey){
    var selected = item.options.filter(function(option){ return option.key === selectedKey; })[0];
    if(selected && selected.nearMiss) return selected.explanation;
    return "That action does not fit this situation. Compare it with 「" + item.focusWord + "」 and try again.";
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
    getPhaseItems:getPhaseItems,
    isChallengeMastered:isChallengeMastered,
    getWrittenPrompt:getWrittenPrompt,
    getStorySetup:getStorySetup,
    getAutoAdvanceDelay:getAutoAdvanceDelay,
    getKonResponse:getKonResponse,
    getWrongAnswerFeedback:getWrongAnswerFeedback
  };
})(typeof window !== "undefined" ? window : globalThis);
