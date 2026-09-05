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

  // 時 alone in the catalog is the noun "moment" (あの時), read とき. A digit
  // right before it makes it the o'clock counter instead (14時, 15時), read
  // じ - a different reading for a different word, not a variant of the
  // same one. Left unglossed there rather than glossed with とき.
  var DIGIT = /[0-9０-９]/;

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
    var options = (question.answer && question.answer.options) || [];
    options.forEach(function(option){ out[String(option)] = true; });
    if(question.repair && question.repair.options){
      question.repair.options.forEach(function(option){ out[String(option)] = true; });
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
      var maxLen = Math.min(index.longest, source.length - i);
      for(var len = maxLen; len >= 1; len--){
        var candidate = source.substr(i, len);
        if(index.byWord[candidate] && !exclusions[candidate]){
          var before = i > 0 ? source.charAt(i - 1) : "";
          if(len === 1){
            if(AMBIGUOUS_ALONE[candidate]) continue;
            if(candidate === "時" && DIGIT.test(before)) continue;
          }
          // A catalog word is only that word when nothing kanji is attached
          // to either side of it. 様 is in the catalog, but glossing it out
          // of お客様 breaks a word the learner reads as one thing; the same
          // is true of 日本 carved out of 日本語, at any matched length, not
          // only single characters. A lone 灰 or a stand-alone 会議 still
          // glosses, because nothing is attached to it.
          var after = i + len < source.length ? source.charAt(i + len) : "";
          if(hasKanji(before) || hasKanji(after)) continue;
          matched = candidate;
          break;
        }
      }
      if(matched){
        if(plain){ out += escapeHtml(plain); plain = ""; }
        var entry = index.byWord[matched];
        if(mode === "ruby"){
          out += '<ruby class="gloss-ruby">' + escapeHtml(matched)
            + '<rt>' + escapeHtml(entry.reading) + '</rt></ruby>';
        }else{
          out += '<button type="button" class="gloss" data-reading="'
            + escapeHtml(entry.reading) + '" data-meaning="' + escapeHtml(entry.meaning)
            + '" aria-label="' + escapeHtml(matched + " の読みと意味") + '">'
            + escapeHtml(matched) + '</button>';
        }
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
