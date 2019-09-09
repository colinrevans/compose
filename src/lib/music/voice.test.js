import Voice, { melody } from "./voice"
import TimeSignature from "./time-signature"
import Verticality, { chord } from "./verticality"
import Rational from "./rational"
import Staff from "./staff"
import Duration from "./duration"

describe("voice", () => {
  const cMajorChord = new Verticality(["c4", "e4", "g4"])
  it("has setters that typecheck", () => {
    expect(() => {
      new Voice(cMajorChord)
    }).toThrow()
    expect(() => {
      new Voice([cMajorChord])
    }).not.toThrow()
    expect(() => new Voice()).not.toThrow()
    expect(() => new Voice("nonsense")).toThrow()
  })

  it("adjusts by octave easily", () => {
    expect(new Voice([cMajorChord]).withOctaveAdjustedBy(1)).toEqual(
      new Voice([new Verticality(["c5", "e5", "g5"])])
    )
  })

  it("calculates a duration according to a time sig", () => {
    const c = new Verticality("c4")
    const voice = new Voice([c, c, c])
    expect(voice.durationAccordingToTimeSignature(new Rational(4, 4))).toBe(
      0.75
    )
  })

  it("has a getter for the number of beats in a voice", () => {
    const c = new Verticality("c4")
    const voice = new Voice([c, c, c])
    const cEigth = new Verticality("c4", new Duration(1, 2))
    const eighths = new Voice([cEigth, cEigth, cEigth])
    expect(eighths.beats).toBe(1.5)
    expect(voice.beats).toBe(3)
  })

  it("merges with another voice", () => {
    const cMaj = new Verticality(["c4", "e4", "g4"])
    const dMin = new Verticality(["d4", "f4", "a4"])
    const merged = cMaj.mergedWith(dMin)
    const voice1 = new Voice([cMaj])
    const voice2 = new Voice([cMaj, dMin])
    const voice3 = new Voice([dMin, cMaj, dMin])
    expect(voice1.mergedWith(voice2).stripForTests()).toEqual(
      voice2.stripForTests()
    )
    expect(voice2.mergedWith(voice3).stripForTests()).toEqual(
      new Voice([merged, merged, dMin]).stripForTests()
    )

    const cde = new Voice(["c4", "d4", "e4"].map(n => new Verticality(n)))
    const efg = new Voice(["e4", "f4", "g4"].map(n => new Verticality(n)))
    const gac = new Voice(["g4", "a4", "c4"].map(n => new Verticality(n)))
    expect(
      cde
        .mergedWith(efg)
        .mergedWith(gac)
        .stripForTests()
    ).toEqual(new Voice([cMaj, dMin, cMaj]).stripForTests())
  })

  it("calculates positions of notes in beats from the beginning.", () => {
    const mel = melody("c4", "d4", "e4", "f4")
    let eighth = new Duration(1 / 2)
    const mel2 = new Voice([
      new Verticality("c4", eighth),
      new Verticality("c3", eighth),
      new Verticality("c4", eighth),
      new Verticality("c5", eighth),
    ])
    expect(mel.positions).toEqual([0, 1, 2, 3])
    expect(mel2.positions).toEqual([0, 0.5, 1, 1.5])
  })

  it("has a repeat function to easily create voices", () => {
    const mel = melody("c4")
      .withDurations(new Duration(1, 2))
      .repeated()
      .repeated()
    expect(mel.length).toBe(4)
    const mel2 = melody("c4").repeated(3)
    expect(mel2.length).toBe(4)
  })
})
