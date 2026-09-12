/* Tier 2: practice generated from the curated catalog.
 *
 * The story episodes teach roughly ten words deeply, with artwork, audio and
 * authored feedback. That method cannot reach 3,579 items and should not try:
 * at three clips and bespoke authoring per question it would cost more than the
 * whole rest of the game. This layer covers the remainder from data the catalog
 * already holds, so the work is curating one dataset rather than writing
 * thousands of questions.
 *
 * Consequently: no artwork, no pre-rendered audio, nothing authored per item.
 * If a card here ever needs a recording, the coverage goal stops being
 * affordable - see the delivery budget in the design document.
 *
 * Pure and deterministic: `random` is injected so a session can be reproduced.
 */
(function(root){
  "use strict";

  /* Four options by default, and callers may ask for more.
   *
   * The correction round asks for six: it is the one place where a right
   * answer takes a word off a list, so a one-in-four guess is too cheap a way
   * to clear something you do not know. Everywhere else four is the shape the
   * questions were written around.
   */
  var CHOICES = 4;

  function pick(list, count, random){
    var pool = list.slice();
    var out = [];
    while(pool.length && out.length < count){
      var index = Math.floor(random() * pool.length) % pool.length;
      out.push(pool.splice(index, 1)[0]);
    }
    return out;
  }

  /* ---- Typing the reading ----
   *
   * The one card in this file that asks the learner to produce Japanese
   * rather than recognise it. Everything else here, and 190 of the 200
   * authored questions, is four options and a tap: you can pick 「あたためる」
   * out of a line-up long after you have lost the ability to say it. A card
   * you have to answer from nothing is the difference between knowing a word
   * and knowing it when you meet it.
   *
   * It replaces the multiple-choice reading question rather than joining it.
   * Keeping both would halve how often the harder one comes up, which is the
   * only thing this change is for.
   *
   * Romaji is accepted because the alternative is a wall: a learner on an
   * English phone keyboard cannot type ひらがな without installing a Japanese
   * IME first, and an app that demands that before the third card has lost
   * them. Typing "atatameru" is still production - the sounds have to come
   * from memory either way - so nothing is given away by taking it.
   */

  // A reading field that is not clean kana is not a reading. Nineteen of the
  // catalogue's rows carry something else there, inherited from the source: a
  // part-of-speech marker that leaked out of the column ("（感）", "（副）"),
  // a gloss ("（カーペット）"), bracketed okurigana ("あたたか(い)"), and one
  // row whose reading is mojibake outright (賛成 = "Uӣ[い"). Two of the
  // nineteen have kanji, so before this guard they were built into reading
  // questions whose correct answer was wrong. They now produce no reading
  // question of either kind.
  var KANA_READING = /^[\u3041-\u3096\u30a1-\u30fa\u30fc]+$/;

  // Longest first: sya must be found before sy, and shi before sh.
  var ROMAJI = {
    kya:"きゃ",kyu:"きゅ",kyo:"きょ",gya:"ぎゃ",gyu:"ぎゅ",gyo:"ぎょ",
    sha:"しゃ",shu:"しゅ",sho:"しょ",sya:"しゃ",syu:"しゅ",syo:"しょ",
    ja:"じゃ",ju:"じゅ",jo:"じょ",jya:"じゃ",jyu:"じゅ",jyo:"じょ",
    zya:"じゃ",zyu:"じゅ",zyo:"じょ",
    cha:"ちゃ",chu:"ちゅ",cho:"ちょ",tya:"ちゃ",tyu:"ちゅ",tyo:"ちょ",
    nya:"にゃ",nyu:"にゅ",nyo:"にょ",hya:"ひゃ",hyu:"ひゅ",hyo:"ひょ",
    bya:"びゃ",byu:"びゅ",byo:"びょ",pya:"ぴゃ",pyu:"ぴゅ",pyo:"ぴょ",
    mya:"みゃ",myu:"みゅ",myo:"みょ",rya:"りゃ",ryu:"りゅ",ryo:"りょ",
    shi:"し",chi:"ち",tsu:"つ",
    ka:"か",ki:"き",ku:"く",ke:"け",ko:"こ",
    ga:"が",gi:"ぎ",gu:"ぐ",ge:"げ",go:"ご",
    sa:"さ",si:"し",su:"す",se:"せ",so:"そ",
    za:"ざ",zi:"じ",zu:"ず",ze:"ぜ",zo:"ぞ",ji:"じ",
    ta:"た",ti:"ち",tu:"つ",te:"て",to:"と",
    da:"だ",di:"ぢ",du:"づ",de:"で",dou:"どう",
    na:"な",ni:"に",nu:"ぬ",ne:"ね",no:"の",
    ha:"は",hi:"ひ",hu:"ふ",fu:"ふ",he:"へ",ho:"ほ",
    ba:"ば",bi:"び",bu:"ぶ",be:"べ",bo:"ぼ",
    pa:"ぱ",pi:"ぴ",pu:"ぷ",pe:"ぺ",po:"ぽ",
    ma:"ま",mi:"み",mu:"む",me:"め",mo:"も",
    ya:"や",yu:"ゆ",yo:"よ",
    ra:"ら",ri:"り",ru:"る",re:"れ",ro:"ろ",
    wa:"わ",wo:"を",
    a:"あ",i:"い",u:"う",e:"え",o:"お",
    "do":"ど"
  };
  var VOWELS = "aiueo";
  // Used to tell a word from a fragment of a longer one: 違いない inside
  // 間違いない is a fragment, and the kanji in front of it is the proof.
  var KANJI = /[\u4e00-\u9faf\u3400-\u4dbf]/;

  function toHiragana(text){
    var out = "";
    for(var i = 0; i < text.length; i++){
      var code = text.charCodeAt(i);
      // Katakana block onto hiragana; everything else is copied through.
      out += (code >= 0x30a1 && code <= 0x30f6)
        ? String.fromCharCode(code - 0x60) : text.charAt(i);
    }
    return out;
  }

  function romajiToKana(text, forceN){
    var out = "";
    var i = 0;
    while(i < text.length){
      var c = text.charAt(i);
      // A doubled consonant is a small tsu: "kitte" -> きって.
      if(c !== "n" && VOWELS.indexOf(c) < 0 && c === text.charAt(i + 1)){
        out += "っ"; i += 1; continue;
      }
      /* "n" is ん unless a vowel or y follows, where it starts a syllable.
       *
       * "nn" needs one more character to decide, the same way an IME does:
       * in "annai" the second n begins ない, so only the first is ん and
       * あんない comes out; in "kanngaeru" nothing follows it that could
       * start a syllable, so the pair is one ん. Deciding on the pair alone
       * turns 案内 into あんあい. */
      if(c === "n"){
        var after = text.charAt(i + 1);
        if(after === "'"){ out += "ん"; i += 2; continue; }
        if(after === "n"){
          var third = text.charAt(i + 2);
          out += "ん";
          i += (third && (VOWELS.indexOf(third) >= 0 || third === "y")) ? 1 : 2;
          continue;
        }
        if(forceN || !after || (VOWELS.indexOf(after) < 0 && after !== "y")){ out += "ん"; i += 1; continue; }
      }
      var matched = false;
      for(var take = 3; take >= 1; take--){
        var chunk = text.substr(i, take);
        if(chunk.length === take && ROMAJI[chunk]){
          out += ROMAJI[chunk]; i += take; matched = true; break;
        }
      }
      // An unknown letter is kept so the learner can see what was read.
      if(!matched){ out += c; i += 1; }
    }
    return out;
  }

  /* What the learner typed, as kana.
   *
   * Whitespace goes because a phone keyboard adds a trailing space more often
   * than a learner means one, and both halves are normalised the same way so
   * the comparison cannot be thrown by the form the answer is stored in.
   */
  function normalizeReading(text, forceN){
    var value = String(text == null ? "" : text)
      .replace(/[\s\u3000\u30fb\u00b7]/g, "")
      .toLowerCase();
    // Romaji only where the learner actually typed letters. Mixed input - a
    // half-converted IME buffer - is converted the same way.
    if(/[a-z]/.test(value)) value = romajiToKana(value, forceN);
    return toHiragana(value);
  }

  /* Both readings of an ambiguous "n" are accepted.
   *
   * An IME resolves "kinyoubi" to きにょうび and wants "kin'youbi" for
   * きんようび, which is correct and is also a rule about a keyboard rather
   * than about Japanese. A learner who knows 金曜日 is きんようび and types
   * what they hear should not be marked wrong for not knowing where the
   * apostrophe goes, so the strict parse is tried first and then the one that
   * reads every loose n as ん. Each card has one expected answer, so the
   * second pass can only forgive the ambiguity, not accept a different word.
   */
  function checkReading(input, expected){
    var target = normalizeReading(expected);
    if(!target) return false;
    var strict = normalizeReading(input);
    if(strict && strict === target) return true;
    var loose = normalizeReading(input, true);
    return !!loose && loose === target;
  }

  function firstMeaning(item){
    return (item.meanings && item.meanings[0]) || "";
  }

  function exampleSentence(item){
    var example = (item.examples || [])[0];
    return example && example.ja ? example.ja : "";
  }

  // Distractors come from the item's own partition, so they are words the
  // learner meets in the same place - plausible neighbours rather than noise.
  function neighbours(item, catalog, want, random, projection){
    var same = catalog.getPartition(item.partition).filter(function(other){
      return other.id !== item.id && projection(other);
    });
    var chosen = pick(same, want * 3, random);
    var seen = {};
    var out = [];
    chosen.forEach(function(other){
      var value = projection(other);
      if(!value || seen[value] || value === projection(item)) return;
      seen[value] = true;
      if(out.length < want) out.push(value);
    });
    return out;
  }

  function assemble(answer, distractors, random){
    var options = [answer].concat(distractors);
    // Place the answer deterministically rather than always first.
    var at = Math.floor(random() * options.length) % options.length;
    options.splice(at, 0, options.splice(0, 1)[0]);
    return {options: options, correctIndex: options.indexOf(answer)};
  }

  function card(kind, item, prompt, answer, distractors, random, choices){
    var want = choices || CHOICES;
    /* Not fewer than four, even where the partition cannot fill six: a place
     * with thin vocabulary would otherwise produce a two-option question,
     * which is a coin toss dressed as a check. */
    if(distractors.length < Math.min(want, CHOICES) - 1) return null;
    var built = assemble(answer, distractors.slice(0, want - 1), random);
    return {
      id: item.id + "-" + kind,
      kind: kind,
      target: item.id,
      prompt: prompt,
      options: built.options,
      correctIndex: built.correctIndex,
      sourceNote: item.source === "project" ? "プロジェクト補足" : "OpenJLPT " + item.level
    };
  }

  function buildPracticeCards(item, catalog, random, choices){
    random = random || Math.random;
    if(!item) return [];
    var want = choices || CHOICES;
    var cards = [];

    // Reading: only where there is a reading to ask for. A kana headword is its
    // own reading, so the question would answer itself, and a reading field
    // that is not kana is not one - see KANA_READING.
    if(item.hasKanji && item.reading && KANA_READING.test(item.reading)){
      cards.push({
        id: item.id + "-reading-input",
        kind: "reading-input",
        target: item.id,
        prompt: "「" + item.canonical + "」の読み方を書いてください。",
        answer: item.reading,
        sourceNote: item.source === "project" ? "プロジェクト補足" : "OpenJLPT " + item.level
      });
    }

    var meaning = firstMeaning(item);
    if(meaning){
      var meanings = neighbours(item, catalog, want - 1, random, firstMeaning);
      var meaningCard = card("meaning", item, "「" + item.canonical + "」の意味はどれですか。",
        meaning, meanings, random, want);
      if(meaningCard) cards.push(meaningCard);
    }

    // Cloze from the record's own example. Every example contains its headword,
    // but a kana headword can also match inside an inflection: blanking 「あっ」
    // out of 「何かあった？」 leaves 「何か（　　）た？」, which asks nothing.
    // Requiring a kanji makes the match a word rather than a fragment.
    /* A cloze has to leave a sentence around the blank.
     *
     * Three ways it did not. The catalogue's examples are often the word and
     * a full stop, so 素晴らしい's 「素晴らしい。」 became 「（　　）。」, which
     * asks nothing at all - ten cards were that. `split().join()` blanked
     * every occurrence, so 「過去は過去。」 became 「（　　）は（　　）。」, a
     * tautology with the answer removed twice. And the kanji requirement was
     * meant to stop a match inside a longer word, but 違いない sits inside
     * 間違いない, so 「間違いない！」 became 「間（　　）！」 - the fragment
     * case the comment above promised to prevent, still happening.
     *
     * So: blank the first occurrence only, refuse a match that a kanji runs
     * straight into, and require two characters of sentence to survive
     * besides the blank and its punctuation.
     */
    var sentence = exampleSentence(item);
    var at = sentence ? sentence.indexOf(item.canonical) : -1;
    if(sentence && item.hasKanji && item.canonical.length >= 2 && at >= 0
      && !KANJI.test(sentence.charAt(at - 1))){
      var blanked = sentence.slice(0, at) + "（　　）" + sentence.slice(at + item.canonical.length);
      var remaining = blanked.replace(/（　　）/g, "").replace(/[。、！？「」\s]/g, "");
      if(remaining.length >= 2){
        var words = neighbours(item, catalog, want - 1, random, function(other){ return other.canonical; });
        var clozeCard = card("cloze", item, blanked, item.canonical, words, random, want);
        if(clozeCard) cards.push(clozeCard);
      }
    }

    return cards;
  }

  // Unseen words come first: practice exists to reach what the story cannot,
  // so repeating a tested item before an untouched one wastes the session.
  // One key or several: once more than one place is open, practice should
  // cover everywhere the learner has been rather than only the last door.
  function getPracticeSession(partitionKey, progress, catalog, size, random){
    random = random || Math.random;
    size = size || 8;
    var keys = Object.prototype.toString.call(partitionKey) === "[object Array]"
      ? partitionKey : [partitionKey];
    var items = [];
    keys.forEach(function(key){
      catalog.getPartition(key).forEach(function(item){ items.push(item); });
    });
    var states = (progress && progress.items) || {};
    var excluded = new Set((progress && progress.excluded) || []);
    items = items.filter(function(item){ return !excluded.has(item.id); });

    var unseen = items.filter(function(item){ return !states[item.id]; });
    var rest = items.filter(function(item){ return !!states[item.id]; });
    var ordered = unseen.concat(rest);

    var session = [];
    for(var i = 0; i < ordered.length && session.length < size; i++){
      var cards = buildPracticeCards(ordered[i], catalog, random);
      if(cards.length) session.push(cards[Math.floor(random() * cards.length) % cards.length]);
    }
    return session;
  }

  root.LanternCatalogPractice = {
    CHOICES: CHOICES,
    KANA_READING: KANA_READING,
    romajiToKana: romajiToKana,
    normalizeReading: normalizeReading,
    checkReading: checkReading,
    buildPracticeCards: buildPracticeCards,
    getPracticeSession: getPracticeSession
  };
})(typeof self !== "undefined" ? self : this);
