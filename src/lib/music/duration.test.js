import Duration, { isFullMeasure } from "./duration"
import Rational from "./rational"
import TimeSignature from "./time-signature"

describe("Duration", () => {
  it("validates constructor input", () => {
    expect(() => Duration(1, 2, 1, 2)).toThrow()
    expect(() => Duration(1, 4 / 4)).toThrow()
  })

  const quarterNote = new Duration(1)

  it("has valueOf that gives duration respective to measure in time signature. (1 is the value of a full measure)", () => {
    expect(
      quarterNote.durationAccordingToTimeSignature(new Rational(4, 4)) * 4
    ).toBe(1)
    expect(
      quarterNote.durationAccordingToTimeSignature(new TimeSignature(3, 4)) * 3
    ).toBe(1)

    expect(
      quarterNote.durationAccordingToTimeSignatureAsRational(new Rational(4, 4))
    ).toEqual(new Rational(1, 4))
    expect(
      quarterNote.durationAccordingToTimeSignatureAsRational(
        new TimeSignature(3, 4)
      )
    ).toEqual(new Rational(1, 3))
  })

  it("has a convenience function for testing whether durations complete a measure", () => {
    const wholeNote = new Duration(4)
    expect(isFullMeasure([1, 1, 1, 1].map(x => quarterNote))).toBeTruthy()
    expect(isFullMeasure([wholeNote])).toBeTruthy()
    const eighthNote = new Duration(1, 2)
    expect(
      isFullMeasure([1, 1, 1, 1, 1, 1, 1, 1].map(x => eighthNote))
    ).toBeTruthy()
  })

  it("has an equality check", () => {
    expect(new Duration(1).equals(new Duration(1, 1))).toBeTruthy()
    expect(new Duration(2, 1).equals(new Duration(4, 2))).toBeTruthy()
  })

  it("can switch to triplets from an even value and vice versa", () => {
    expect(new Duration(1).makeTriplet()).toEqual(new Duration(2, 3))
    expect(new Duration(2, 3).makeEven()).toEqual(new Duration(1))
    expect(quarterNote.makeTriplet().makeEven()).toEqual(new Duration(1))
  })

  it("dots and undots a duration", () => {
    let dottedQuarter = new Duration(1).dot()
    let quarter = new Duration(1)
    let dottedHalf = new Duration(2).dot()
    expect(isFullMeasure([dottedHalf, quarter])).toBeTruthy()
    expect(isFullMeasure([dottedQuarter, dottedQuarter, quarter])).toBeTruthy()
    expect(dottedHalf.diminute(2)).toEqual(dottedQuarter)
  })

  it("double dots", () => {
    let doubleDottedQuarter = new Duration(1).doubleDot()
    let sixteenth = new Duration(1, 4)
    expect(
      isFullMeasure([
        doubleDottedQuarter,
        sixteenth,
        doubleDottedQuarter,
        sixteenth,
      ])
    ).toBeTruthy()
  })
})
