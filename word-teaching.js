/* What a learner is shown about a word before being asked to use it.
 *
 * The boards already name the five words of a stage; nothing taught them. This
 * turns a focus word into the card that does, and it is pure so the content
 * rules can be tested without a browser.
 *
 * The sentence is authored per stage rather than taken from the catalogue.
 * Of the 200 focus words, 197 come from OpenJLPT with a median example of nine
 * characters - too short to show the grammar N2 is tested on - and some teach
 * the wrong thing outright: the catalogue's example for 揃える is 口を揃える,
 * an idiom meaning to speak in unison, while the game teaches it as tidying a
 * room.
 */
(function(root){
  "use strict";

  // Below this a sentence is a fragment rather than a use. The catalogue's
  // median example is nine characters, which is exactly what this excludes.
  var MIN_SENTENCE = 12;

  /* Where the word actually appears in its sentence.
   *
   * A verb is usually inflected - 揃える becomes 揃えて - so looking for the
   * dictionary form finds nothing. Falling back to the longest leading run of
   * the word that does appear catches the stem, which is the part worth
   * highlighting. An entry may name `focus` outright where even that is wrong.
   *
   * The stem fallback has a 2-character floor because a one-character prefix
   * often matches by coincidence (e.g. あ in あちこち when searching for ある,
   * or 生 in 生きがい when searching for 生きる). Validation that accepts a
   * coincidence is worse than no validation: the author must then provide an
   * explicit `focus` for such words.
   */
  function locate(sentence, word, authored){
    if(authored && sentence.indexOf(authored) >= 0) return authored;
    if(sentence.indexOf(word) >= 0) return word;
    for(var end = word.length - 1; end > 1; end -= 1){
      var stem = word.slice(0, end);
      if(sentence.indexOf(stem) >= 0) return stem;
    }
    return "";
  }

  function buildCard(entry, item, sense){
    if(!entry || !item) return null;
    var sentence = entry.sentence || "";
    var focus = locate(sentence, item.canonical, entry.focus);
    var at = focus ? sentence.indexOf(focus) : -1;
    return {
      id: item.id || null,
      word: item.canonical,
      reading: item.reading || "",
      // The catalogue's first sense is the general one and is sometimes wrong
      // for a particular story, which is why getCardSense already exists.
      sense: sense || (item.meanings && item.meanings[0]) || "",
      sentence: sentence,
      before: at >= 0 ? sentence.slice(0, at) : sentence,
      focus: at >= 0 ? focus : "",
      after: at >= 0 ? sentence.slice(at + focus.length) : "",
      pattern: entry.pattern || "",
      // Art has somewhere to go and nothing in it. 84 of the 200 focus words
      // are verbs or abstract nouns a picture cannot disambiguate, so the step
      // does not wait on illustration.
      image: entry.image || null
    };
  }

  /* Content bugs are cheap to introduce and expensive to notice by playing, so
   * they fail a test instead - the same argument learning-content.js makes. */
  function validateEntries(words, entries){
    var errors = [];
    (words || []).forEach(function(row){
      var word = row.word;
      var entry = (entries || {})[word];
      if(!entry){ errors.push(word + " has no teaching entry"); return; }
      var sentence = entry.sentence || "";
      if(sentence.length < MIN_SENTENCE){
        errors.push(word + " has a sentence of " + sentence.length
          + " characters; at least " + MIN_SENTENCE + " are needed to show a use");
        return;
      }
      if(entry.focus && sentence.indexOf(entry.focus) < 0){
        errors.push(word + " has an authored focus \"" + entry.focus + "\" that does not appear in its sentence");
        return;
      }
      if(!locate(sentence, word, entry.focus)){
        errors.push(word + " has a sentence that does not contain the word");
        return;
      }
      if(!entry.pattern){
        errors.push(word + " has no pattern, which is the part that makes it usable");
      }
    });
    return errors;
  }

  root.LanternWordTeaching = {
    MIN_SENTENCE: MIN_SENTENCE,
    buildCard: buildCard,
    validateEntries: validateEntries
  };
})(typeof self !== "undefined" ? self : this);
