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

  function card(kind, item, prompt, answer, distractors, random){
    if(distractors.length < CHOICES - 1) return null;
    var built = assemble(answer, distractors.slice(0, CHOICES - 1), random);
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

  function buildPracticeCards(item, catalog, random){
    random = random || Math.random;
    if(!item) return [];
    var cards = [];

    // Reading: only where there is a reading to ask for. A kana headword is its
    // own reading, so the question would answer itself.
    if(item.hasKanji && item.reading){
      var readings = neighbours(item, catalog, CHOICES - 1, random, function(other){ return other.reading; });
      var readingCard = card("reading", item, "「" + item.canonical + "」の読み方はどれですか。",
        item.reading, readings, random);
      if(readingCard) cards.push(readingCard);
    }

    var meaning = firstMeaning(item);
    if(meaning){
      var meanings = neighbours(item, catalog, CHOICES - 1, random, firstMeaning);
      var meaningCard = card("meaning", item, "「" + item.canonical + "」の意味はどれですか。",
        meaning, meanings, random);
      if(meaningCard) cards.push(meaningCard);
    }

    // Cloze from the record's own example. Every example contains its headword,
    // but a kana headword can also match inside an inflection: blanking 「あっ」
    // out of 「何かあった？」 leaves 「何か（　　）た？」, which asks nothing.
    // Requiring a kanji makes the match a word rather than a fragment.
    var sentence = exampleSentence(item);
    if(sentence && item.hasKanji && item.canonical.length >= 2 && sentence.indexOf(item.canonical) >= 0){
      var words = neighbours(item, catalog, CHOICES - 1, random, function(other){ return other.canonical; });
      var clozeCard = card("cloze", item, sentence.split(item.canonical).join("（　　）"),
        item.canonical, words, random);
      if(clozeCard) cards.push(clozeCard);
    }

    return cards;
  }

  // Unseen words come first: practice exists to reach what the story cannot,
  // so repeating a tested item before an untouched one wastes the session.
  function getPracticeSession(partitionKey, progress, catalog, size, random){
    random = random || Math.random;
    size = size || 8;
    var items = catalog.getPartition(partitionKey);
    var states = (progress && progress.items) || {};

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
    buildPracticeCards: buildPracticeCards,
    getPracticeSession: getPracticeSession
  };
})(typeof self !== "undefined" ? self : this);
