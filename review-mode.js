/* Review mode: read the game's Japanese in the place it actually appears.
 *
 * The owner is a native speaker and reviews after authoring. A spreadsheet of
 * 620 lines would be faster to mark up and would lose the thing that matters
 * most - whether the Japanese fits the situation, the speaker and the moment.
 * A guest's line has to sound like that guest, at that hour, to that listener.
 *
 * So: the real screens, reached directly, with the clock off and somewhere to
 * write. Reachable only with ?review=1, so a learner never falls into it.
 *
 * Notes live in their own localStorage key, separate from progress, so
 * reviewing never disturbs a save and clearing a save never loses notes.
 */
(function(root){
  "use strict";

  var NOTES_KEY = "lanternAlley.review";

  function isEnabled(search){
    return /(^|[?&])review=1(&|$)/.test(String(search || ""));
  }

  function loadNotes(storage){
    try{
      return JSON.parse(storage.getItem(NOTES_KEY) || "{}") || {};
    }catch(err){
      return {};
    }
  }

  function saveNote(storage, notes, id, note){
    var next = {};
    Object.keys(notes || {}).forEach(function(key){ next[key] = notes[key]; });
    if(note && note.trim()) next[id] = note.trim();
    else delete next[id];
    try{ storage.setItem(NOTES_KEY, JSON.stringify(next)); }catch(err){}
    return next;
  }

  /* Every authored question, flattened, in the order a learner meets them.
   * The three-day Inn stage is included: it is the first Japanese anyone
   * reads, and it was authored the same way as the rest. */
  function buildIndex(stages, legacyStage){
    var rows = [];

    if(legacyStage && legacyStage.getPhaseItems){
      ["learn", "practice", "challenge"].forEach(function(phase){
        legacyStage.getPhaseItems(phase).forEach(function(item, at){
          rows.push({
            id: "three-days:" + phase + ":" + at,
            place: legacyStage.key || "home-inn",
            group: "三日間・" + phase,
            title: item.focusWord || "",
            jp: item.jp || "",
            kind: "stage"
          });
        });
      });
    }

    Object.keys(stages || {}).forEach(function(key){
      var stage = stages[key];
      stage.episodes.forEach(function(episode){
        episode.days.forEach(function(day){
          day.questions.forEach(function(question){
            rows.push({
              id: question.id,
              place: key,
              group: episode.title || episode.id,
              title: question.target,
              jp: (question.prompt && question.prompt.jp) || "",
              kind: "episode",
              episodeId: episode.id
            });
          });
        });
      });
    });

    return rows;
  }

  // A plain-text report of everything flagged, for pasting back.
  function exportNotes(rows, notes){
    var flagged = rows.filter(function(row){ return notes[row.id]; });
    if(!flagged.length) return "No notes yet.";
    var out = ["# Japanese review notes", "", flagged.length + " item(s) flagged.", ""];
    var place = null;
    flagged.forEach(function(row){
      if(row.place !== place){
        place = row.place;
        out.push("## " + place, "");
      }
      out.push("### " + row.id + "  (" + row.group + " / " + row.title + ")");
      out.push("JP: " + row.jp.replace(/\n/g, " / "));
      out.push("NOTE: " + notes[row.id]);
      out.push("");
    });
    return out.join("\n");
  }

  root.LanternReviewMode = Object.freeze({
    NOTES_KEY: NOTES_KEY,
    isEnabled: isEnabled,
    loadNotes: loadNotes,
    saveNote: saveNote,
    buildIndex: buildIndex,
    exportNotes: exportNotes
  });
})(typeof self !== "undefined" ? self : this);
