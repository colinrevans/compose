import music from "./music-2"

const CMAJTRIAD = {
  keys: [
    {
      key: "c",
      octave: 4,
      accidental: "",
    },
    {
      key: "e",
      octave: 4,
      accidental: "",
    },
    {
      key: "g",
      octave: 4,
      accidental: "",
    },
  ],
  duration: "q",
}

const CMAJTRIADOPEN = {
  keys: [
    {
      key: "c",
      octave: 4,
      accidental: "",
    },
    {
      key: "g",
      octave: 4,
      accidental: "",
    },
    {
      key: "e",
      octave: 5,
      accidental: "",
    },
  ],
  duration: "q",
}

const CMAJTRIADUNSORTED = {
  keys: [
    {
      key: "g",
      octave: 4,
      accidental: "",
    },
    {
      key: "e",
      octave: 4,
      accidental: "",
    },
    {
      key: "c",
      octave: 4,
      accidental: "",
    },
  ],
  duration: "q",
}

const EMPTY = {
  keys: [],
  duration: "q",
}

const MIDDLEC = {
  keys: [
    {
      key: "c",
      octave: 4,
      accidental: "",
    },
  ],
  duration: "q",
}

const CSHARP3 = {
  keys: [
    {
      key: "c",
      octave: 3,
      accidental: "#",
    },
  ],
  duration: "q",
}

describe("music-2", () => {
  it("calculates midi notes for a verticality.", () => {
    const fn = music.verticalityToMidiNotes
    expect(fn(CMAJTRIAD)).toEqual([60, 64, 67])
    expect(fn(MIDDLEC)).toEqual([60])
    expect(fn(CSHARP3)).toEqual([49])
    expect(fn(EMPTY)).toEqual([])
  })

  it("sorts a verticality from lowest to highest pitch", () => {
    const fn = music.sortVerticality
    expect(fn(CMAJTRIADUNSORTED)).toEqual(CMAJTRIAD)
    expect(fn(EMPTY)).toEqual(EMPTY)
  })

  it("calculates the octave span of a verticality", () => {
    const fn = music.octaveSpan
    expect(fn(CMAJTRIAD)).toBe(1)
    expect(fn(MIDDLEC)).toBe(1)
    expect(fn(EMPTY)).toBe(0)
    expect(fn(CMAJTRIADOPEN)).toBe(2)
  })
})
