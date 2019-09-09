import Verticality, { chord } from "./verticality"
import Note from "./note"
import Duration from "./duration"

const vert = (...args) => new Verticality([...args])

describe("verticality", () => {
  const beat = new Duration(1)
  const c4 = new Note("C4")
  const e4 = new Note("E4")
  const g4 = new Note("G4")

  it("constructs properly", () => {
    expect(() => new Verticality("nonsense")).toThrow()
    expect(() => new Verticality()).not.toThrow()
    expect(() => new Verticality(c4)).not.toThrow()
    expect(() => new Verticality("c4")).not.toThrow()
    expect(() => new Verticality([c4, e4, g4], beat)).not.toThrow()
    expect(() => new Verticality(["c4", "e4", "g4"], beat)).not.toThrow()
  })

  it("has an alternative chord constructor", () => {
    expect(chord("c4", "e4", "g4")).toEqual(new Verticality(["c4", "e4", "g4"]))
  })

  const c5 = new Note("C5")
  const e5 = new Note("E5")
  const g5 = new Note("G5")
  let cMajorChord4 = new Verticality([c4, e4, g4], beat)
  const cMajorChord5 = new Verticality([c5, e5, g5], beat)

  it("maps over notes work as expected", () => {
    expect(
      (() => {
        cMajorChord4.notes = cMajorChord4.notes.map(note => note.withOctave(5))
        return cMajorChord4
      })()
    ).toEqual(cMajorChord5)

    cMajorChord4 = new Verticality([c4, e4, g4], beat)

    expect(
      (() => {
        cMajorChord4.notes = cMajorChord4.notes.map(note =>
          note.withOctaveAdjustedBy(1)
        )
        return cMajorChord4
      })()
    ).toEqual(cMajorChord5)

    cMajorChord4 = new Verticality([c4, e4, g4], beat)
  })

  it("has easy octave adjustment", () => {
    expect(cMajorChord4.withOctaveAdjustedBy(1)).toEqual(cMajorChord5)
  })

  it("has a getter for midi note numbers", () => {
    const cMajorChord = new Verticality([c4, e4, g4])
    expect(cMajorChord.midiNoteNumbers).toEqual([60, 64, 67])
  })

  it("calculates the halfsteps between its notes", () => {
    const cMajorChord = new Verticality([c4, e4, g4])
    expect(cMajorChord.intervals).toEqual([4, 3])
  })

  it("calculates an ab interval set", () => {
    const dMin = vert("d4", "f4", "a4")
    const cOctave = new Verticality([c4, c5])
    const c15 = new Verticality(["c4", "c6"])
    const threeOctaves = new Verticality(["c4", "c7"])
    const openCMajor = new Verticality([c4, g4, e5])
    const c10 = new Verticality(["c4", "e5"])
    const nuther = new Verticality(["c4", "e5", "f6"])

    const cMajorChord = vert("c4", "e4", "g4")

    cMajorChord.hello = "hello"
    const dMinorChord = vert("d4", "f4", "a4")

    expect(cMajorChord.mergedWith(dMin).ABIntervalSet).toEqual("v24579")
    expect(cMajorChord.ABIntervalSet).toEqual("v47")
    expect(openCMajor.ABIntervalSet).toEqual("v74")
    expect(cOctave.ABIntervalSet).toEqual("v0")
    expect(c15.ABIntervalSet).toEqual("v.0")
    expect(c10.ABIntervalSet).toEqual("v.4")
    expect(nuther.ABIntervalSet).toEqual("v.4.5")
    expect(threeOctaves.ABIntervalSet).toEqual("v..0")
    expect(vert("c4", "c4").ABIntervalSet).toEqual("v")
  })

  it("calculates the above bass intervals", () => {
    const cMajorChord = new Verticality([c4, e4, g4])
    expect(cMajorChord.ABIntervals).toEqual([4, 7])
    expect(vert("c4", "c4").ABIntervals).toEqual([])
  })

  it("has a getter for beats", () => {
    expect(new Verticality("c4").beats).toBe(1)
    expect(vert("c4").beats).toBe(1)
    expect(new Verticality("c4", new Duration(2, 1)).beats).toBe(2)
  })

  const cMajorChord4FirstInversion = new Verticality([e4, g4, c5])
  const cMajorChord4SecondInversion = new Verticality([g4, c5, e5])

  it("inverts up and down", () => {
    expect(cMajorChord4.invertedUp()).toEqual(cMajorChord4FirstInversion)
    expect(cMajorChord4FirstInversion.invertedDown()).toEqual(cMajorChord4)
    expect(cMajorChord4SecondInversion.invertedUp()).toEqual(cMajorChord5)
    expect(cMajorChord4SecondInversion.invertedDown()).toEqual(
      cMajorChord4FirstInversion
    )
  })

  it("has a withoutNthNote function for quickly removing notes", () => {
    const cMaj = new Verticality(["c4", "e4", "g4"])
    expect(cMaj.withoutNthNote(1)).toEqual(new Verticality(["c4", "g4"]))
    expect(cMaj.withoutNthNote(-1)).toEqual(new Verticality(["c4", "e4"]))
    expect(cMaj.withoutNthNote(-2)).toEqual(cMaj.withoutNthNote(1))
    expect(cMaj.withoutNthNote(-5)).toEqual(cMaj.withoutNthNote(1))
  })

  it("has a pretty toString", () => {
    expect(cMajorChord4.toString()).toBe("[C4 E4 G4] 1/1")
  })

  it("can marge with another verticality.", () => {
    const cMaj = new Verticality(["c4", "e4", "g4"])
    const dMin = new Verticality(["d4", "f4", "a4"])
    const merged = new Verticality(["c4", "d4", "e4", "f4", "g4", "a4"])
    expect(cMaj.mergedWith(dMin)).toEqual(merged)
    expect(cMaj.mergedWith(cMaj)).toEqual(cMaj)
  })
})
