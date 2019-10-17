export const pianoRollRegex = /^[awsedftgyhujkl;bvc\[\]\\]$/
export const pianoRollKeysToNotes = {
  a: { letter: "c" },
  w: { letter: "c", accidental: "#" },
  s: { letter: "d" },
  e: { letter: "e", accidental: "b" },
  d: { letter: "e" },
  f: { letter: "f" },
  t: { letter: "f", accidental: "#" },
  g: { letter: "g" },
  y: { letter: "a", accidental: "b" },
  h: { letter: "a" },
  u: { letter: "b", accidental: "b" },
  j: { letter: "b" },
  k: { letter: "c", octaveAdjust: 1 },
  l: { letter: "d", octaveAdjust: 1 },
  [";"]: { letter: "e", octaveAdjust: 1 },
  ["["]: { letter: "f", octaveAdjust: 1 },
  ["]"]: { letter: "g", octaveAdjust: 1 },
  ["\\"]: { letter: "a", octaveAdjust: 1 },
  b: { letter: "b", octaveAdjust: -1 },
  v: { letter: "a", octaveAdjust: -1 },
  c: { letter: "g", octaveAdjust: -1 },
}

export const durationRegex = /^[123456]$/
export const durationKeysToDurations = {
  1: [4, 1],
  2: [2, 1],
  3: [1, 1],
  4: [1, 2],
  5: [1, 4],
  6: [1, 8],
  7: [1, 16],
}
