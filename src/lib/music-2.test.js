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

const CMINTRIAD = {
  keys: [
    {
      key: "c",
      octave: 4,
      accidental: "",
    },
    {
      key: "e",
      octave: 4,
      accidental: "b",
    },
    {
      key: "g",
      octave: 4,
      accidental: "",
    },
  ],
  duration: "q",
}

const CMAJTRIADDOUBLED = {
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

const FIFTHONC = {
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
  ],
  duration: "q",
}

const DMINTRIAD = {
  keys: [
    {
      key: "d",
      octave: 4,
      accidental: "",
    },
    {
      key: "f",
      octave: 4,
      accidental: "",
    },
    {
      key: "a",
      octave: 4,
      accidental: "",
    },
  ],
  duration: "q",
}

const BDIMTRIAD = {
  keys: [
    {
      key: "b",
      octave: 3,
      accidental: "",
    },
    {
      key: "d",
      octave: 4,
      accidental: "",
    },
    {
      key: "f",
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

const DFLAT5 = {
  keys: [
    {
      key: "d",
      octave: 5,
      accidental: "b",
    },
  ],
  duration: "q",
}

const verticalitied = n => {
  return { keys: [n], duration: "q" }
}

describe("music-2", () => {
  it("calculates midi notes for a verticality.", () => {
    const fn = music.verticalityToMidiNotes
    expect(fn(CMAJTRIAD)).toEqual([60, 64, 67])
    expect(fn(MIDDLEC)).toEqual([60])
    expect(fn(CSHARP3)).toEqual([49])
    expect(fn(DFLAT5)).toEqual([73])
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
    expect(fn(MIDDLEC)).toBe(0)
    expect(fn(EMPTY)).toBe(0)
    expect(fn(CMAJTRIADOPEN)).toBe(2)
  })

  it("diatonically planes a verticality up", () => {
    const fn = music.planeUp
    expect(fn(CMAJTRIAD)).toEqual(DMINTRIAD)
    expect(fn(EMPTY)).toEqual(EMPTY)
  })

  it("diatonically planes a verticality down", () => {
    const fn = music.planeDown
    expect(fn(CMAJTRIAD)).toEqual(BDIMTRIAD)
    expect(fn(EMPTY)).toEqual(EMPTY)
  })

  it("creates a key object from a midi note", () => {
    const fn = music.keyFromMidiNote
    expect(verticalitied(fn(60))).toEqual(MIDDLEC)
  })

  it("removes duplicate notes", () => {
    const fn = music.removeDuplicateNotes
    expect(fn(CMAJTRIADDOUBLED)).toEqual(CMAJTRIAD)
    expect(fn(EMPTY)).toEqual(EMPTY)
    expect(fn(CMAJTRIAD)).toEqual(CMAJTRIAD)
  })

  it("removes keys in a verticality by index", () => {
    const fn = music.deleteNoteInVerticalityByIdx
    expect(fn(MIDDLEC, 0)).toEqual(EMPTY)
    expect(fn(CMAJTRIAD, 1)).toEqual(FIFTHONC)
    expect(fn(EMPTY, 0)).toEqual(EMPTY)
    expect(fn(CMAJTRIAD, 5)).toEqual(CMAJTRIAD)
  })

  it("removes accidentals from a verticality", () => {
    const fn = music.removeAccidentals
    expect(fn(CMINTRIAD)).toEqual(CMAJTRIAD)
  })

  it("can compare the pitch of notes", () => {
    const fn = music.higher
    let middlec = MIDDLEC.keys[0]
    let dflat5 = DFLAT5.keys[0]
    let csharp3 = CSHARP3.keys[0]
    expect(fn(middlec, dflat5)).toBe(false)
    expect(fn(dflat5, middlec)).toBe(true)
    expect(fn(csharp3, middlec)).toBe(false)
    expect(fn(csharp3, { ...csharp3, key: "d" })).toBe(false)
    expect(fn(csharp3, { ...csharp3, accidental: "" })).toBe(true)
    expect(fn({ ...dflat5, accidental: "" }, dflat5)).toBe(true)
  })
})
