import { flatten, equals, uniq } from "ramda";

const MIDDLE_C = 60;
const FRET_STRETCH = 4;

export const TUNINGS = {
  standard: ["E2", "A2", "D3", "G3", "B3", "E4"],
  myc: ["C2", "A2", "D3", "G3", "B3", "F#4"],
  dropd: ["D2", "A2", "D3", "G3", "B3", "E4"],
  doubledropd: ["D2", "A2", "D3", "G3", "B3", "D4"],
  dropc: ["C2", "G2", "C3", "F3", "A3", "D4"],
  allfourths: ["E2", "A2", "D3", "G3", "C4", "F4"],
  newstandard: ["C2", "G2", "D3", "A3", "E3", "G4"],
  opend: ["D2", "A2", "D3", "F#3", "A3", "D4"],
  openc: ["C2", "G2", "C3", "G3", "C4", "E4"],
  dadgad: ["D2", "A2", "D3", "G3", "A3", "D4"],
  mandolin: ["G3", "D4", "A4", "E5"],
  bass: ["E2", "A2", "D3", "G3"],
  custom: [] // this has to be there for the ui for some reason--a material UI thing? i don't know.
};
Object.freeze(TUNINGS);

export const CHORD_TYPES = {
  minor_second: { rootPosition: "1", invertible: false },
  major_second: { rootPosition: "2", invertible: false },
  minor_third: { rootPosition: "3", invertible: false },
  major_third: { rootPosition: "4", invertible: false },
  perfect_fourth: { rootPosition: "5", invertible: false },
  tritone: { rootPosition: "6", invertible: false },
  perfect_fifth: { rootPosition: "7", invertible: false },
  minor_sixth: { rootPosition: "8", invertible: false },
  major_sixth: { rootPosition: "9", invertible: false },
  minor_seventh: { rootPosition: "t", invertible: false },
  major_seventh: { rootPosition: "e", invertible: false },
  octave: { rootPosition: "0", invertible: false },
  major: { rootPosition: "47", invertible: true },
  minor: { rootPosition: "37", invertible: true },
  major_7: { rootPosition: "47e", invertible: true },
  minor_flat_6: { rootPosition: "378", invertible: false },
  major_9: { rootPosition: "47e2", invertible: false },
  major_9_add_4: { rootPosition: "457e2", invertible: false },
  major_13: { rootPosition: "47e29", invertible: false },
  major_7_sharp_11: { rootPosition: "467e", invertible: false },
  major_7_sharp_11_add_flat_9: { rootPosition: "47e2691", invertible: false },
  major_9_sharp_11: { rootPosition: "467e2", invertible: false },
  major_13_sharp_11: { rootPosition: "47e269", invertible: false },
  major_69: { rootPosition: "4792", invertible: false },
  major_6: { rootPosition: "479", invertible: false },
  minor_7: { rootPosition: "37t", invertible: true },
  minor_9: { rootPosition: "37t2", invertible: false },
  minor_11: { rootPosition: "37t25", invertible: false },
  minor_13: { rootPosition: "37t259", invertible: false },
  minor_7_sharp_11: { rootPosition: "367t", invertible: false },
  minor_7_flat_13: { rootPosition: "378t", invertible: false },
  minor_7_flat_9: { rootPosition: "37t1", invertible: false },
  minor_9_sharp_11: { rootPosition: "37t26", invertible: false },
  minor_9_flat_13: { rootPosition: "37t28", invertible: false },
  minor_11_flat_13: { rootPosition: "37t258", invertible: false },
  minor_13_sharp_11: { rootPosition: "37t269", invertible: false },
  dominant_7: { rootPosition: "47t", invertible: true },
  dominant_9: { rootPosition: "47t2", invertible: false },
  dominant_11: { rootPosition: "47t25", invertible: false },
  dominant_13: { rootPosition: "47t259", invertible: false },
  dominant_7_sharp_11: { rootPosition: "467t", invertible: false },
  dominant_9_sharp_11: { rootPosition: "47t26", invertible: false },
  dominant_13_sharp_11: { rootPosition: "47t269", invertible: false },
  dominant_7_upper_structure_II: { rootPosition: "4t269", invertible: false },
  dominant_7_upper_structure_bIII: { rootPosition: "4t37t", invertible: false },
  dominant_7_upper_structure_bV: { rootPosition: "4t6t1", invertible: false },
  dominant_7_upper_structure_bVI: { rootPosition: "4t803", invertible: false },
  dominant_7_upper_structure_VI: { rootPosition: "4t914", invertible: false },
  dominant_7_upper_structure_bii: { rootPosition: "4t158", invertible: false },
  dominant_7_upper_structure_biii: { rootPosition: "4t37", invertible: false },
  dominant_7_upper_structure_sharp_iv: {
    rootPosition: "4t691",
    invertible: false
  },
  dominant_7_upper_structure_v: { rootPosition: "4t72", invertible: false },
  dominant_7_upper_structure_vi: { rootPosition: "4t9", invertible: false },
  dominant_aggregate: { rootPosition: "12346789t", invertible: false },
  minor_6: { rootPosition: "379", invertible: false },
  diminished: { rootPosition: "36", invertible: true },
  diminished_7: { rootPosition: "369", invertible: true },
  half_diminished_7: { rootPosition: "36t", invertible: true },
  minor_major_7: { rootPosition: "37e", invertible: true },
  augmented: { rootPosition: "48", invertible: false },
  augmented_major_7: { rootPosition: "48e", invertible: true },
  seven_sus_4: { rootPosition: "5t", invertible: false },
  quartal: { rootPosition: "5t381", invertible: false },
  so_what: { rootPosition: "5t37", invertible: false },
  sus_4: { rootPosition: "57", invertible: false },
  major_add_9: { rootPosition: "247", invertible: false },
  chromatic_scale: { rootPosition: "123456789te", invertible: false },
  ionian_mode: { rootPosition: "24579e", invertible: false },
  major_scale: { rootPosition: "24579e", invertible: false },
  major_bebop_scale: { rootPosition: "245789e", invertible: false },
  natural_minor_scale: { rootPosition: "23578t", invertible: false },
  melodic_minor_scale: { rootPosition: "23579e", invertible: true },
  harmonic_minor_scale: { rootPosition: "23578e", invertible: false },
  minor_sharp_7_bebop: { rootPosition: "235789e", invertible: false },
  minor_flat_7_bebop: { rootPosition: "235789t", invertible: false },
  dorian_bebop: { rootPosition: "23579te", invertible: false },
  dorian_mode: { rootPosition: "23579t", invertible: false },
  phrygian_mode: { rootPosition: "13578t", invertible: false },
  lydian_mode: { rootPosition: "24679e", invertible: false },
  mixolydian_mode: { rootPosition: "24579t", invertible: false },
  dominant_bebop_scale: { rootPosition: "24579te", invertible: false },
  aeolian_mode: { rootPosition: "23578t", invertible: false },
  locrian_mode: { rootPosition: "13568t", invertible: false },
  whole_tone_scale: { rootPosition: "2468t", invertible: false },
  half_whole_octatonic: { rootPosition: "134679t", invertible: false },
  whole_half_octatonic: { rootPosition: "235689e", invertible: false },
  major_pentatonic: { rootPosition: "2479", invertible: true },
  minor_pentatonic: { rootPosition: "357t", invertible: true },
  dominant_pentatonic: { rootPosition: "247t", invertible: false },
  suspended_pentatonic: { rootPosition: "257t", invertible: false },
  dorian_pentatonic: { rootPosition: "2379", invertible: false },
  phrygian_pentatonic: { rootPosition: "157t", invertible: false },
  lydian_pentatonic: { rootPosition: "469e", invertible: false },
  mixolydian_pentatonic: { rootPosition: "2578", invertible: false },
  aeolian_pentatonic: { rootPosition: "2578", invertible: false },
  locrian_pentatonic: { rootPosition: "356t", invertible: false },
  blues_scale: { rootPosition: "3567t", invertible: false },
  augmented_scale: { rootPosition: "3478e", invertible: true },
  prometheus_scale: { rootPosition: "2469t", invertible: false },
  messaien_third_mode: { rootPosition: "234678te", invertible: true },
  messaien_fourth_mode: { rootPosition: "125678e", invertible: true },
  messaien_fifth_mode: { rootPosition: "1567e", invertible: true },
  messaien_sixth_mode: { rootPosition: "24568te", invertible: true },
  messaien_seventh_mode: { rootPosition: "12356789e", invertible: true },
  german_augmented_sixth: { rootPosition: "47t", invertible: false },
  french_augmented_sixth: { rootPosition: "46t", invertible: false },
  italian_augmented_sixth: { rootPosition: "4t", invertible: false }
};
Object.freeze(CHORD_TYPES);
const notes = {
  a: { sharp: "is", flat: "at" },
  b: { sharp: "c", flat: "bet" },
  c: { sharp: "cis", flat: "b" },
  d: { sharp: "dis", flat: "det" },
  e: { sharp: "f", flat: "et" },
  f: { sharp: "fis", flat: "e" },
  g: { sharp: "gis", flat: "get" }
};
Object.freeze(notes);
const whiteNotes = Object.keys(notes);

export const SAMPLER_FILES = {
  C3: "/piano/C3.[mp3|ogg]",
  G3: "/piano/G3.[mp3|ogg]",
  C4: "/piano/C4.[mp3|ogg]",
  G4: "/piano/G4.[mp3|ogg]",
  C5: "/piano/C5.[mp3|ogg]"
};

// pairs : function -> [] -> []
// e.g. pairs(+, [1, 2, 3, 1]) = [3, 5, 4]
const pairs = (func, [x, ...xs]) => {
  if (!xs || !xs.length) return [];
  if (xs.length === 1) return [func(x, xs[0])];
  else return [func(x, xs[0]), ...pairs(func, xs)];
};

//calcInterval : pc -> pc -> number
//a is assumed to be lower than b
const pitchClassInterval = (a, b) => {
  if (a < b) return b - a;
  else return b + 12 - a;
};
const pitchClassIntervals = l => pairs(pitchClassInterval, l);

//toPitchClass : note -> pc
const noteToPitchClass = note => {
  if (note === "") return NaN;
  if (note === "c" || note.match(/^C\d+$/)) return 0;
  if (note === "cis" || note === "det" || note.match(/^(C#|Db)\d+$/)) return 1;
  if (note === "d" || note.match(/^D\d+$/)) return 2;
  if (note === "dis" || note === "et" || note.match(/^(D#|Eb)\d+$/)) return 3;
  if (note === "e" || note.match(/^E\d+$/)) return 4;
  if (note === "f" || note.match(/^F\d+$/)) return 5;
  if (note === "fis" || note === "get" || note.match(/^(F#|Gb)\d+$/)) return 6;
  if (note === "g" || note.match(/^G\d+$/)) return 7;
  if (note === "gis" || note === "at" || note.match(/^(G#|Ab)\d+$/)) return 8;
  if (note === "a" || note.match(/^A\d+$/)) return 9;
  if (note === "is" || note === "bet" || note.match(/^(A#|Bb)\d+$/)) return 10;
  if (note === "b" || note.match(/^B\d+$/)) return 11;
};

// howToFretVoicing
//
// finds the intervals above bass for a given voicing
// finds the intervals above bass starting from each string, according to the tuning
// for each string, finds an array representing how to voice each ABinterval of the voicing
//
// e.g frettingPossibiltiesForAllIntervalsFromAllStrings of "170" ---> (standard tuning)
// [
//  [ // lowest string
//     [ -4 x x x x]
//     [ 2 -3 x x x]
//     [ x  2 -3 x x]
//  ]
//  [ // second to lowest string
//     [ -4 x x x]
//     [ 2 -3 x x]
//     [ x  2 -2 x]
//  ]
//  [ // third to lowest string
//     [ -4 x x]
//     [ 2 -2 x]
//     [ x 3 -2]
//  ]
// ]
//
// then, for every start string, follows a recursive algorithm that
// 1. chooses, from the first row, (keeping the matrix analogy as depicted above)
// all possible ways to fret the first note
// 2. recurses the matrix to the right and bottom of the possibility.
// edge cases:  * there is no matrix to the right and bottom (succcessful traversal)
//              * the row is just x's (this way of fretting the voicing doesn't work)
// at this point we move to a string representation (cause we want dots to represent when you skip a string)
// algorithm ends up with a list of trees, represented as an array of arrays
//
// e.g: 7t
//
//  [
//   [ 5 0 -5 x x ]
//   [ x 2 -3 x x ]
//  ]
//
// above is input just for from the lowest string
//
//k -->
//
// [
//   [ "5" ["2", ".-3"]] // reject 5.-3 because of fret stretch
//   [ ".0" ["-3"]]
// ]
//
// then we concat the strings down the tree, so that every leaf gets a string
//
// --> [ "5,2", ".0,-3"]
//
// function returns a list like above for each possible start string
//
// another prettify function later??
export const howToFretVoicing = (
  voicing,
  tuning = TUNINGS.standard,
  fretStretch = FRET_STRETCH
) => {
  if (
    tuning !== TUNINGS.standard &&
    !equals(tuning, tuning.sort((a, b) => exactInterval(b, a)))
  )
    throw Error;

  let numNotes = voicing.replace(/\./g, "").length + 1;
  if (numNotes === 1) return [];

  let voicingABIntervals = voicingToIntervalsFromBass(voicing);

  let AbIntervalsFromEachStartString = [];
  for (let i = 0; i < tuning.length - numNotes + 1; i++) {
    AbIntervalsFromEachStartString.push(
      exactNotesToAboveBassIntervals(tuning.slice(i, tuning.length))
    );
  }
  // filter out the start strings if they don't give you enough other strings to work with
  AbIntervalsFromEachStartString = AbIntervalsFromEachStartString.filter(
    x => x.length >= voicingABIntervals.length
  );

  let frettingPossibilitiesForAllIntervalsFromAllStrings = AbIntervalsFromEachStartString.map(
    ls => {
      let returnValue = [];
      for (let i of voicingABIntervals) {
        let b = [];
        for (let a of ls) {
          let c = i - a;
          //fingers can't stretch more than six frets
          if (Math.abs(c) > fretStretch) b.push("x");
          else b.push(i - a);
        }
        returnValue.push(b);
      }
      return returnValue;
    }
  );

  let process = ([firstInterval, ...otherIntervals]) => {
    let dots = l => {
      if (l <= 0) return "";
      else return "." + dots(l - 1);
    };

    let nextStrings = (ls, num) => {
      return ls.map(x => x.slice(num));
    };

    if (firstInterval.every(x => x === "x")) {
      return ["fail"];
    }
    if (otherIntervals.length === 0) {
      for (let i = 0; i < firstInterval.length; i++) {
        firstInterval[i] = dots(i) + firstInterval[i];
      }
      return firstInterval.filter(x => !x.match(/x$/));
    }

    let a = [];
    for (let i = 0; i < firstInterval.length; i++) {
      if (firstInterval[i] !== "x") {
        let next = nextStrings(otherIntervals, i + 1);
        a.push([dots(i) + firstInterval[i], process(next)]);
      }
    }

    return a;
  };

  frettingPossibilitiesForAllIntervalsFromAllStrings = frettingPossibilitiesForAllIntervalsFromAllStrings.map(
    process
  );

  const allPathsToLeaves = ls => {
    if (ls.length === 0) return [];
    let collect = [];

    const collector = (tree, prev = "") => {
      if (prev === undefined) prev = ""; //default argument
      if (tree === "fail") return;
      if (!Array.isArray(tree)) {
        if (prev) {
          //checks for validity here

          let str = prev + ", " + tree;
          let nums = str
            .replace(/\./g, "")
            .split(", ")
            .map(parseInt);
          if (nums.length > 0) {
            let min = 0;
            let max = 0;
            for (let i of nums) {
              if (i < min) min = i;
              if (i > max) max = i;
            }
            if (max - min > fretStretch) {
              return;
            }
          }

          collect.push(str);
        } else collect.push(tree);
      } else if (tree.length === 1) {
        collect.push(tree[0]);
      } else
        tree[1].map(x =>
          prev ? collector(x, prev + ", " + tree[0]) : collector(x, tree[0])
        );
    };

    ls.map(x => collector(x));

    return collect;
  };

  frettingPossibilitiesForAllIntervalsFromAllStrings = frettingPossibilitiesForAllIntervalsFromAllStrings.map(
    allPathsToLeaves
  );

  return frettingPossibilitiesForAllIntervalsFromAllStrings.map((x, idx) => {
    return x.join(" | ");
  });
};

const dropNoteListByOctaves = (noteList, numOctaves = 1) => {
  if (noteList.length === 0) return [];
  return noteList.map(x => {
    let oct = parseInt(x.match(/\d+$/)) - numOctaves;
    if (oct < 0) return "";
    return x.replace(/\d+$/, oct);
  });
};

export const processTuningInput = str => {
  let notes = dropNoteListByOctaves(inputToExactNotes(str), 2);
  if (
    !Array.isArray(notes) ||
    notes === undefined ||
    (Array.isArray(notes) && notes.length <= 1)
  ) {
    if (localStorage.getItem("tuning")) {
      return localStorage.getItem("tuning");
    } else return "standard";
  }
  return notes;
};

export const allPathsToLeaves = (ls, prev = "") => {
  if (ls.length === 0) return "";
  if (ls.length === 1) return ls[0];
};

export const transposeNote = (note, steps) => {
  return vexflowNote(exactNoteToMidiNote(note) + steps);
};

export const tablatureToEasyScore = (tab, tuning = TUNINGS.standard) => {
  return exactNotesToEasyScore(
    tablatureToExactNotes(tab, tuning).sort((a, b) => exactInterval(b, a))
  );
};

export const tablatureToExactNotes = (tab, tuning = TUNINGS.standard) => {
  //clean input and turn into list
  tab = tab
    .replace(/[^ox0123456789\s]/g, "")
    .replace(/\s{,2}/g, " ")
    .trim();

  //allow input with no spaces
  if (tab.match(/^.+\s./)) tab = tab.replace(/\s{2,}/g, " ").split(" ");
  else tab = tab.substr(0, 6).split("");

  if (tab.length === 0 || tab === [""]) return [];
  tab = tab.slice(0, tuning.length);

  let notes = [];
  for (let i = 0; i < tab.length; i++) {
    notes.push([tuning[i], tab[i]]);
  }
  notes = notes.map(([n, fret]) => {
    if (fret === "o" || fret === "0") return transposeNote(n, 12);
    if (fret === "x") return "";
    if (fret.match(/^\d+$/)) {
      if (parseInt(fret) > 19) return "";
      else return transposeNote(n, parseInt(fret) + 12);
    } else return "";
  });
  notes = notes.filter(x => x !== "");
  return notes;
};

export const tablatureToVoicing = (tab, tuning = TUNINGS.standard) => {
  let prettified = uniq(
    exactNotesToAboveBassIntervals(
      tablatureToExactNotes(tab, tuning).sort((a, b) => exactInterval(b, a))
    )
  );

  let notesAndDots = [];
  prettified = [0, ...prettified];
  for (let i = 1; i < prettified.length; i++) {
    let halfStepsFromPreviousNote = prettified[i] - prettified[i - 1];
    if (halfStepsFromPreviousNote > 12) {
      //add a dot for every extra octave
      for (let i = halfStepsFromPreviousNote; i > 12; i -= 12) {
        notesAndDots.push(".");
      }
    }
    notesAndDots.push(prettified[i]);
  }

  return notesAndDots
    .map(x => {
      if (x === ".") return ".";
      else return prettifyABInterval(x);
    })
    .join("");
};

export const exactInterval = (n1, n2) => {
  return exactNoteToMidiNote(n2) - exactNoteToMidiNote(n1);
};

export const exactNoteToMidiNote = n => {
  let pc = noteToPitchClass(n);
  let oct = n.match(/\d+$/);
  let midiNote = 12 + oct * 12 + pc;
  return midiNote;
};
export const exactNotesToAboveBassIntervals = noteList => {
  if (noteList.length === 0) return [];
  if (noteList.length === 1) return [];
  noteList = noteList.map(exactNoteToMidiNote);
  let [first, ...rest] = noteList;
  return rest.map(x => x - first);
};

const PCToNote = pc => {
  if (pc == null) return "";
  if (pc === 0) return "C";
  if (pc === 1) return "C#";
  if (pc === 2) return "D";
  if (pc === 3) return "Eb";
  if (pc === 4) return "E";
  if (pc === 5) return "F";
  if (pc === 6) return "F#";
  if (pc === 7) return "G";
  if (pc === 8) return "Ab";
  if (pc === 9) return "A";
  if (pc === 10) return "Bb";
  if (pc === 11) return "B";
};

const parseFirstNote = str => {
  if (str === "") return "";
  if (str === " ") return "";
  if (whiteNotes.includes(str)) return str;

  if (str.match(/^cis/)) return "cis";
  if (str.match(/^det/)) return "det";
  if (str.match(/^dis/)) return "dis";
  if (str.match(/^et/)) return "et";
  if (str.match(/^fis/)) return "fis";
  if (str.match(/^get/)) return "get";
  if (str.match(/^gis/)) return "gis";
  if (str.match(/^at/)) return "at";
  if (str.match(/^is/)) return "is";
  if (str.match(/^bet/)) return "bet";

  if (whiteNotes.includes(str[0])) {
    if (str.match(/^.#/)) return notes[str[0]].sharp;
    if (str.match(/^.sharp/)) return notes[str[0]].sharp;
    if (str.match(/^.flat/)) return notes[str[0]].flat;
    if (str.match(/^.b/)) return notes[str[0]].flat;
    return str[0];
  }

  return parseFirstNote(str.substr(1));
};
//alias for boolean
const hasFirstNote = parseFirstNote;

const shortHandToSharpFlat = n => {
  if (n === "") return "";
  if (n.length === 1) return n.toUpperCase();
  if (n === "cis") return "C#";
  if (n === "det") return "Db";
  if (n === "dis") return "D#";
  if (n === "et") return "Eb";
  if (n === "fis") return "F#";
  if (n === "get") return "Gb";
  if (n === "gis") return "G#";
  if (n === "at") return "Ab";
  if (n === "is") return "A#";
  if (n === "bet") return "Bb";
};

// notesToNoteList : str -> [notes]
export const noteStrToNoteList = str => {
  if (str === "") return [];

  if (str === " ") return noteStrToNoteList(str.substr(1));
  if (str.length === 1 && whiteNotes.includes(str[0])) return [str];
  let three = str.substr(3);
  let two = str.substr(2);

  //match accidentals
  if (str.match(/^cis/)) return ["cis", ...noteStrToNoteList(three)];
  if (str.match(/^det/)) return ["det", ...noteStrToNoteList(three)];
  if (str.match(/^dis/)) return ["dis", ...noteStrToNoteList(three)];
  if (str.match(/^et/)) return ["et", ...noteStrToNoteList(two)];
  if (str.match(/^fis/)) return ["fis", ...noteStrToNoteList(three)];
  if (str.match(/^get/)) return ["get", ...noteStrToNoteList(three)];
  if (str.match(/^gis/)) return ["gis", ...noteStrToNoteList(three)];
  if (str.match(/^at/)) return ["at", ...noteStrToNoteList(two)];
  if (str.match(/^is/)) return ["is", ...noteStrToNoteList(two)];
  if (str.match(/^bet/)) return ["bet", ...noteStrToNoteList(three)];

  if (whiteNotes.includes(str[0])) {
    if (str.match(/^.#/))
      return [notes[str[0]].sharp, ...noteStrToNoteList(two)];
    if (str.match(/^.sharp/))
      return [notes[str[0]].sharp, ...noteStrToNoteList(str.substr(6))];
    if (str.match(/^.flat/))
      return [notes[str[0]].flat, ...noteStrToNoteList(str.substr(5))];
    if (str.match(/^.b/))
      return [notes[str[0]].flat, ...noteStrToNoteList(two)];
    if (str.match(/^.s/))
      return [notes[str[0]].sharp, ...noteStrToNoteList(two)];
    else return [str[0], ...noteStrToNoteList(str.substr(1))];
  }

  if (str.match(/^sharp/)) return noteStrToNoteList(str.substr(5));
  if (str.match(/^flat/)) return noteStrToNoteList(str.substr(4));
  //just skip if not a note
  return noteStrToNoteList(str.substr(1));
};

const splitRawNotesInput = x => {
  if (x === "") return [];
  if (x[0] === ".") return [".", ...splitRawNotesInput(x.substr(1))];
  let a = x.match(/\./);
  if (!a) return [x];
  let idx = a.index;
  return [x.substr(0, idx), ...splitRawNotesInput(x.substr(idx))];
};

export const inputToExactNotes = str => {
  if (str === "") return [];
  if (!hasFirstNote(str)) return [];
  str = str
    .trim()
    .replace(/^\.+/, "")
    .replace(/\.+$/, "");
  let notesAndDots = splitRawNotesInput(str);

  let a = x =>
    x === "."
      ? "."
      : noteStrToNoteList(x).map(n => shortHandToSharpFlat(n) + "4");

  let c = notesAndDots.map(a);
  //we want notes and periods to be on the same depth in the list:
  let d = flatten(c);
  let result = [];
  let octaveOffset = 0;
  let prev = "";
  for (let i = 0; i < d.length; i++) {
    //if there's a dot, we're skipping an octave
    if (d[i] === ".") {
      octaveOffset += 1;
      continue;
    }

    let note = d[i];
    // if we make our a's h's and our b's i's, we can use < and > to compare
    // a note's placement in an octave (new octave at C).
    // temp <= prev? we've passed an octave boundary.
    let temp = "";
    if (note[0] === "A") temp = "H";
    else if (note[0] === "B") temp = "I";
    else temp = note[0];
    if (prev === "A") prev = "H";
    else if (prev === "B") prev = "I";
    if (temp <= prev) {
      octaveOffset += 1;
    }

    let oct = parseInt(note.match(/\d+$/)) + octaveOffset;
    result.push(note.match(/^[^0-9]+/) + oct);
    prev = note[0];
  }

  return result;
};

const notesToVoicing = x => {
  let pcs = noteStrToNoteList(x).map(noteToPitchClass);
  let intrvls = pitchClassIntervals(pcs);
  let intrvlsFromBass = intervalsFromBass(intrvls);
  let prettified = intrvlsFromBass.map(prettifyABInterval);
  return prettified.join("");
};

const cleanInput = str => {
  if (str === "") return [];
  str = str
    .trim()
    .replace(/^\.+/, "")
    .replace(/\.+$/, "");
  return splitRawNotesInput(str);
};

export const noteStrToVoicing = str => {
  if (str === "") return "";

  let firstNote = parseFirstNote(str);
  if (!firstNote) return "";

  let notesAndDots = cleanInput(str);

  let a = x => (x === "." ? "." : notesToVoicing(firstNote + " " + x));

  let voicing = notesAndDots.map(a).join("");
  //ignore first "0"
  return voicing.substr(1);
};

export const inputToEasyScoreChord = str => {
  let notes = inputToExactNotes(str);
  if (notes.length === 0) return "D5/w/r";
  if (notes.length === 1) return notes[0] + "/w";
  return "(" + notes.join(" ") + ")/w";
};

// j : [intervals] -> [intervals from first note]
const intervalsFromBass = ([x, ...xs], current = 0) => {
  if (x === undefined) return [];
  let fromLowestNote = x + current;
  if (!xs || !xs.length) return [fromLowestNote];
  return [fromLowestNote, ...intervalsFromBass(xs, fromLowestNote)];
};

// prettifyABInterval : interval -> character
// 0123456789te
const prettifyABInterval = x => {
  if (x === undefined || x === null || x === "") return undefined;
  if (x < 0) return undefined;
  if (x < 10) return x.toString();
  if (x === 10) return "t";
  if (x === 11) return "e";
  if (x === 12) return "0";
  if (x > 12) return prettifyABInterval(x % 12);
};

const getABCharToPC = () => {
  let offset = 0;
  return x => {
    if (isNaN(Number(x))) {
      if (x === ".") {
        offset += 12;
        return "offset";
      }
      if (x === "e") {
        let a = 11 + offset;
        return [a, 11];
      }
      if (x === "t") {
        let a = 10 + offset;
        return [a, 10];
      }
    } else {
      let a = Number(x) + offset;
      return [a, x];
    }
  };
};

export const voicingToIntervals = x => {
  let ABCharToPC = getABCharToPC();
  let pcs = [
    [0, 0],
    ...x
      .split("")
      .map(ABCharToPC)
      .filter(a => a !== "offset")
  ];
  return pairs((a, b) => {
    if (b[1] <= a[1]) return 12 + (b[0] - a[0]);
    else return b[0] - a[0];
  }, pcs);
};

const toIntervalName = x => {
  if (x === 0) return "unison";
  if (x === 1) return "half-step";
  if (x === 2) return "major second";
  if (x === 3) return "minor third";
  if (x === 4) return "major third";
  if (x === 5) return "fourth";
  if (x === 6) return "tritone";
  if (x === 7) return "fifth";
  if (x === 8) return "minor sixth";
  if (x === 9) return "major sixth";
  if (x === 10) return "minor seventh";
  if (x === 11) return "major seventh";
  if (x === 12) return "octave";
  if (x === 13) return "minor ninth";
  if (x === 14) return "major ninth";
  if (x === 15) return "minor tenth";
};

const toIntervalAbbreviation = x => {
  if (x === undefined) return "";
  if (x === 0) return "u";
  if (x === 1) return "m2";
  if (x === 2) return "M2";
  if (x === 3) return "m3";
  if (x === 4) return "M4";
  if (x === 5) return "P4";
  if (x === 6) return "tritone";
  if (x === 7) return "P5";
  if (x === 8) return "m6";
  if (x === 9) return "M6";
  if (x === 10) return "m7";
  if (x === 11) return "M7";
  if (x === 12) return "octave";
  if (x === 13) return "m9";
  if (x === 14) return "M9";
  if (x === 15) return "m10";
  if (x === 16) return "M10";
  if (x === 17) return "P11";
  if (x === 18) return "tritone";
  if (x === 19) return "P12";
  if (x === 20) return "m13";
  if (x === 21) return "M13";
  if (x === 22) return "m7";
  if (x === 23) return "M7";
  if (x === 24) return "octave";
  return toIntervalAbbreviation((x % 12) + 12);
};

export const numOctaves = v => {
  if (v === "") return 0;
  if (v.length === 1) return 1;
  let numDots = v.replace(/[^.]/g, "").length;
  v = v.replace(/\./g, "");
  let c = 1;
  for (let i = 1; i < v.length; i++) {
    if (v[i - 1] >= v[i]) c += 1;
  }
  return c + numDots;
};

export const span = v => {
  if (v === "") return 0;
  if (v === "0") return 12;
  let octaves = numOctaves(v);
  let last = v.substr(-1);
  if (last === "0") return octaves * 12;
  if (last === "e") last = 11;
  else if (last === "t") last = 10;
  else last = parseInt(last);
  return (octaves - 1) * 12 + last;
};

export const voicingToEasyScore = voicing => {
  if (voicing === "") return "D5/w/r";
  return exactNotesToEasyScore(voicingToExactNotes(voicing));
};

export const exactNotesToEasyScore = notes => {
  if (notes.length === 0) return "D5/w/r";
  if (notes.length === 1) return notes[0] + "/w";
  return "(" + notes.join(" ") + ")/w";
};

export const easyScoreToExactNotes = scr => {
  if (scr === "") return [];
  if (scr === "D5/w/r") return [];
  //if a chord, get notes between parentheses
  if (scr.match(/^\(/)) return scr.match(/[A-G](?!\().+.(?=\))/)[0].split(" ");
  else return [scr.match(/.+.(?=\/)/)[0]];
};

const vexflowNote = note => {
  let a = note % 12;
  if (a === 0) a = "C";
  if (a === 1) a = "C#";
  if (a === 2) a = "D";
  if (a === 3) a = "Eb";
  if (a === 4) a = "E";
  if (a === 5) a = "F";
  if (a === 6) a = "F#";
  if (a === 7) a = "G";
  if (a === 8) a = "G#";
  if (a === 9) a = "A";
  if (a === 10) a = "Bb";
  if (a === 11) a = "B";
  return a + octave(note);
};

export const inputToIntervalDisplay = str => {
  if (str === "") return [];
  return voicingToIntervalsFromBass(noteStrToVoicing(str)).map(
    toIntervalAbbreviation
  );
};

export const exactNotesToIntervals = notes => {
  if (notes.length === 0) return [];
  if (notes.length === 1) return [];
  return pairs(exactInterval, notes);
};

const octave = note => {
  if (note < 24) return 0;
  if (note < 36) return 1;
  if (note < 48) return 2;
  if (note < 60) return 3;
  if (note < 72) return 4;
  if (note < 84) return 5;
  if (note < 96) return 6;
  if (note < 108) return 7;
  if (note < 120) return 8;
};

export const voicingToExactNotes = (voicing, n = MIDDLE_C) => {
  if (voicing === "") return [vexflowNote(n)];
  return exactNotesFromABIntervals(
    intervalsFromBass(voicingToIntervals(voicing)),
    n
  );
};

const exactNotesFromABIntervals = (abintervals, n = MIDDLE_C) => {
  if (!abintervals.length) return [n];
  return [vexflowNote(n), ...abintervals.map(x => vexflowNote(x + n))];
};

export const invert = voicing => {
  if (voicing === "") return "";
  let fromBass = voicingToIntervalsFromBass(voicing);
  let subValue = fromBass[0];
  let octavesToJumpRoot = Math.ceil(fromBass[fromBass.length - 1] / 12);
  fromBass = fromBass.splice(1).concat(12 * octavesToJumpRoot);
  return fromBass
    .map(x => x - subValue)
    .map(prettifyABInterval)
    .join("");
};

export const andInversions = voicing => {
  if (voicing === "") return "";
  let inversions = [voicing];
  let v = invert(voicing);
  while (v !== voicing) {
    inversions.push(v);
    v = invert(v);
  }
  return inversions;
};

const chordTypesAndInversions = (chords = CHORD_TYPES) => {
  let r = [];
  for (let i of Object.keys(chords)) {
    if (!chords[i].invertible) {
      r.push([i, chords[i].rootPosition]);
    } else {
      let allInversions = andInversions(chords[i].rootPosition);
      let x = allInversions.map((x, idx) => {
        if (idx) {
          return [i + ", " + ordNum(idx) + " inversion", x];
        } else return [i, x];
      });
      r = r.concat(x);
    }
  }
  return r;
};

export const matchChord = (voicingA, chords = CHORD_TYPES) => {
  voicingA = voicingA.replace(/[.0]/g, "");
  voicingA = uniq(voicingA.split("")).join("");
  let r = chordTypesAndInversions().map(([name, voicingB]) => {
    return [name, voicingB, getConfidenceScore(voicingA, voicingB)];
  });
  return r.sort((a, b) => b[2] - a[2]);
};

// gets a "confidence score" for voicingA
// matched to voicingB.
//
// similar to the percentage of notes in voicingB that voicingA has.
// if voicingA has a note that voicingB doesn't have, there is no match.
//
// weights the perfect fifth less than other notes.
// since the 5th gels with the root,
// 5ths don't matter as much when determining the identity of a chord.
//
// 47t, 47 --> <= 0 (reject)
// 47, 47 --> 1 (perfect match)
// 4t, 47t --> .89
//
export const getConfidenceScore = (voicingA, voicingB) => {
  if (voicingA === "" || voicingB === "") return 0;
  // unison/octave is always matched.
  // we don't care abt which octave things are in either.
  voicingB = voicingB.replace(/[0.]/g, "");
  let step = 1 / voicingB.length;
  let count = 0;
  // weight the perfect fifth less than other notes
  if (voicingB.match(/7/g)) {
    count += step * voicingB.match(/7/g).length * (2 / 3);
  }
  for (let i = 0; i < voicingA.length; i++) {
    if (voicingB.includes(voicingA[i])) {
      if (voicingA[i] === "7") {
        count += step * (1 / 3);
      } else count += step;
    } else count -= 1;
  }
  return count;
};

const matches = (voicingA, voicingB) => {
  if (getConfidenceScore(voicingA, voicingB) === 1) return true;
  else return false;
};

const voicingToIntervalsFromBass = x =>
  intervalsFromBass(voicingToIntervals(x));

const ordNum = i => {
  if (i === 1) return "1st";
  if (i === 2) return "2nd";
  if (i === 3) return "3rd";
  if (i === 4) return "4th";
  if (i === 5) return "5th";
  if (i === 6) return "6th";
  if (i === 7) return "7th";
};
