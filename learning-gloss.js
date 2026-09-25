/* Tap a word, see how it is read and what it means.
 *
 * N2 sentences are full of kanji a learner half-knows. Being stuck on one word
 * in the middle of a request means the whole request is lost, and the game's
 * answer - "you got it wrong" - teaches nothing about why.
 *
 * So every catalog word in a line becomes tappable, and tapping shows its
 * reading and its first meaning.
 *
 * Except the ones that would hand over the answer. The question's own target
 * is never glossed, and neither is anything that appears in the answer
 * options: a learner who can tap 満員 to read "no vacancy" can answer a
 * question about 満員 without knowing it, which is exactly the false progress
 * the Golden Rule exists to prevent. The aid is for reading the situation, not
 * for reading the answer.
 *
 * Pure and DOM-free so the matching can be tested on its own.
 */
(function(root){
  "use strict";

  var KANJI = /[一-龯]/;

  // The catalog reading is correct for the word as its own entry, but wrong
  // for the same lone character when it is actually a verb stem in context.
  // 来 alone in the catalog is the "来週/来年" prefix, read らい - but a lone
  // 来 flanked by kana in running text (来ます, 来た, 来て, 来い...) is the
  // stem of 来る, whose reading depends on conjugation and is never らい.
  // This module has no conjugation engine to pick the right one, and a
  // wrong reading teaches the wrong thing, so a lone 来 is left unglossed.
  var AMBIGUOUS_ALONE = {"来": true};

  /* Kanji whose lone catalogue entry is a different word from the one
   * running text uses. Found when every day's words became tappable:
   * 空いています was glossed "sky", 分かりました "dividing", 冬の間 "space",
   * お盆 "Lantern Festival" beside a tray, 角 "horn" for a corner, 方 (a
   * person) "side". Where contextualReading knows the reading here (空い あ,
   * 分か わ, 終わ お...) the furigana is still shown, but the word opens no
   * meaning; anywhere else it is left alone. Compounds are not affected. */
  var MEANING_UNSAFE_ALONE = {"空": true, "分": true, "方": true, "間": true, "角": true,
    "盆": true, "上": true, "正": true, "回": true, "終": true, "後": true};

  /* Words whose catalog reading is real but is not the one running text takes.
   *
   * Unlike 来, these are not wrong entries - both readings exist, and the
   * catalog holds the one that heads its dictionary sense. What is missing is
   * a parser to tell which applies here:
   *
   *   今日  こんにち in 今日では "nowadays", but きょう in ordinary text. Kon's
   *         「今日は基礎から始めましょう」 was glossed こんにち.
   *   中    ちゅう as a suffix (仕事中, 工事中), but なか as a standalone noun
   *         after の. 「仕事の中で」 was glossed ちゅう.
   *
   * Same conclusion as 来 and 時: a wrong reading teaches the wrong thing, so
   * these are left unglossed. Checked at any length, not only single
   * characters, because 今日 is two.
   */
  var AMBIGUOUS_READING = {"今日": true, "中": true};

  // Kana that can follow a noun without making it part of another word.
  var PARTICLES = "をがはのにでともへやかねよ";

  // 時 alone in the catalog is the noun "moment" (あの時), read とき. A digit
  // right before it makes it the o'clock counter instead (14時, 15時), read
  // じ - a different reading for a different word, not a variant of the
  // same one. Left unglossed there rather than glossed with とき.
  var DIGIT = /[0-9０-９]/;

  /* A catalog headword can be the right string and still need another reading
   * inside a conjugation or fixed phrase. Keep these overrides deliberately
   * narrow: each one names the neighbouring kana that makes the reading
   * unambiguous, so 品 remains しな on its own but is ひん in お預かり品. */
  function contextualReading(word, source, at, fallback){
    var before = at > 0 ? source.charAt(at - 1) : "";
    var after = source.slice(at + word.length);
    if(word === "空" && after.indexOf("いて") === 0) return "あ";
    if(word === "何" && after.indexOf("と") === 0) return "なん";
    if(word === "正" && after.indexOf("しく") === 0) return "ただ";
    if(word === "分" && after.indexOf("か") === 0) return "わ";
    if(word === "明後日" && after.indexOf("まで") === 0) return "あさって";
    if(word === "終" && /^[わえ]/.test(after)) return "お";
    if(word === "生" && after.indexOf("き") === 0) return "い";
    if(word === "下" && after.indexOf("の") === 0) return "した";
    if(word === "品" && before === "り") return "ひん";
    if(word === "上" && before === "し" && after.indexOf("げ") === 0) return "あ";
    if(word === "後" && before === "の") return "あと";
    if(word === "回" && after.indexOf("っ") === 0) return "まわ";
    return fallback;
  }

  function hasKanji(text){
    return KANJI.test(text || "");
  }

  function escapeHtml(text){
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* An index of every catalog word worth glossing, plus the longest one, so a
   * scan can try the longest match first and not gloss 会 inside 会計. */
  function buildIndex(catalog){
    var byWord = {};
    var longest = 1;
    (catalog && catalog.items ? catalog.items : []).forEach(function(item){
      var word = item.canonical;
      // Kana-only headwords are their own reading, so a gloss would say
      // nothing; and a single kana would match inside half the sentence.
      if(!word || !hasKanji(word)) return;
      if(byWord[word]) return;
      byWord[word] = {
        reading: item.reading || "",
        meaning: (item.meanings && item.meanings[0]) || ""
      };
      if(word.length > longest) longest = word.length;
    });
    return {byWord:byWord, longest:longest};
  }

  /* Words that must stay unglossed for this question: the word being taught,
   * and anything a learner could read straight off an answer option. */
  function exclusionsFor(question, catalog){
    var out = {};
    if(!question) return out;
    var item = catalog && catalog.getItem ? catalog.getItem(question.target) : null;
    if(item && item.canonical) out[item.canonical] = true;
    if(item && item.aliases) item.aliases.forEach(function(alias){ out[alias] = true; });
    var options = ((question.answer && question.answer.options) || []).map(String);
    if(question.repair && question.repair.options){
      options = options.concat(question.repair.options.map(String));
    }
    options.forEach(function(option){ out[option] = true; });
    /* A hint must never be the answer. Every catalogue word that appears
     * anywhere inside a choice is left unglossed in the question too:
     * glossing 確認 in a line whose right reply is 「確認します。」 would hand
     * the learner the choice by its meaning. */
    var items = (catalog && catalog.items) || [];
    /* Nor may a word inside the tested one: glossing 替える "to exchange"
     * in 「取り替える」に近い意味はどれですか answered it. */
    if(item && item.canonical){
      items.forEach(function(entry){
        var word = entry && entry.canonical;
        if(word && word.length > 1 && item.canonical.indexOf(word) >= 0) out[word] = true;
      });
    }
    if(options.length){
      var joined = options.join("\n");
      items.forEach(function(entry){
        var word = entry && entry.canonical;
        if(word && joined.indexOf(word) >= 0) out[word] = true;
      });
    }
    return out;
  }

  /* Marks up one line. Returns HTML: matched words become buttons carrying
   * their reading and meaning, everything else is escaped text. */
  function annotate(text, index, exclusions, mode){
    var source = String(text || "");
    if(!index || !index.byWord) return escapeHtml(source);
    exclusions = exclusions || {};

    var out = "";
    var plain = "";
    var i = 0;
    while(i < source.length){
      var matched = null;
      var readingOnly = false;
      var maxLen = Math.min(index.longest, source.length - i);
      for(var len = maxLen; len >= 1; len--){
        var candidate = source.substr(i, len);
        if(index.byWord[candidate] && !exclusions[candidate]){
          var before = i > 0 ? source.charAt(i - 1) : "";
          if(len === 1){
            if(AMBIGUOUS_ALONE[candidate]) continue;
            if(candidate === "時" && DIGIT.test(before)) continue;
          }
          if(AMBIGUOUS_READING[candidate]) continue;
          // A catalog word is only that word when nothing kanji is attached
          // to either side of it. 様 is in the catalog, but glossing it out
          // of お客様 breaks a word the learner reads as one thing; the same
          // is true of 日本 carved out of 日本語, at any matched length, not
          // only single characters. A lone 灰 or a stand-alone 会議 still
          // glosses, because nothing is attached to it.
          var after = i + len < source.length ? source.charAt(i + len) : "";
          if(hasKanji(before) || hasKanji(after)) continue;
          /* Part of a verb or adjective, not the noun the catalogue holds:
           * 直して is not 直 "earnestly", 決まりました is not 決まり
           * "settlement", 切れた電球 is not 切れ "cloth". A lone kanji, or a
           * headword ending in kana, that runs straight on into kana other
           * than a particle is a conjugated word, and is left alone. */
          // Glued to a katakana word: 電子 in 電子レンジ is not "electron".
          if(hasKanji(candidate.slice(-1)) && /[\u30A1-\u30FA\u30FC]/.test(after)) continue;
          if(len === 1 && MEANING_UNSAFE_ALONE[candidate]){
            if(contextualReading(candidate, source, i, null) === null) continue;
            readingOnly = true;
          }
          var endsKana = /[\u3041-\u3096]$/.test(candidate);
          if(((len === 1 && hasKanji(candidate)) || endsKana)
              && /[\u3041-\u3096]/.test(after) && PARTICLES.indexOf(after) < 0) readingOnly = true;
          matched = candidate;
          break;
        }
      }
      if(matched){
        if(plain){ out += escapeHtml(plain); plain = ""; }
        var entry = index.byWord[matched];
        var reading = contextualReading(matched, source, i, entry.reading);
        // Every glossed word opens its meaning when tapped or hovered. Ruby
        // mode used to print furigana alone, so on the first day - the one
        // with the most help - a word could be read but not understood.
        if(readingOnly){
          // The reading is right here; the catalogue's meaning is not.
          out += mode === "ruby" ? '<ruby class="gloss-ruby">' + escapeHtml(matched)
            + '<rt>' + escapeHtml(reading) + '</rt></ruby>' : escapeHtml(matched);
          i += matched.length;
          continue;
        }
        var face = mode === "ruby"
          ? '<ruby class="gloss-ruby">' + escapeHtml(matched)
            + '<rt>' + escapeHtml(reading) + '</rt></ruby>'
          : escapeHtml(matched);
        out += '<button type="button" class="gloss' + (mode === "ruby" ? ' gloss-has-ruby' : '')
          + '" data-reading="' + escapeHtml(reading) + '" data-meaning="' + escapeHtml(entry.meaning)
          + '" aria-label="' + escapeHtml(matched + " の読みと意味") + '">'
          + face + '</button>';
        i += matched.length;
      }else{
        plain += source.charAt(i);
        i += 1;
      }
    }
    if(plain) out += escapeHtml(plain);
    return out;
  }

  root.LanternGloss = Object.freeze({
    buildIndex: buildIndex,
    exclusionsFor: exclusionsFor,
    annotate: annotate,
    hasKanji: hasKanji
  });
})(typeof self !== "undefined" ? self : this);
