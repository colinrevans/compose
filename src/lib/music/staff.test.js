import Staff from "./staff"
import Duration from "./duration"
import Voice, { melody } from "./voice"
import Verticality, { chord } from "./verticality"
import TimeSignature from "./time-signature"
import { repeat } from "./util"

describe("staff", () => {
  it("constructs properly w/ type checking", () => {
    const fourFour = new TimeSignature(4, 4)
    fourFour.position = 0
    const cMaj = chord("c4", "e4", "g4")
    const voice = new Voice([cMaj, cMaj])
    voice.position = 0
    const voice2 = new Voice([cMaj, cMaj])
    voice2.position = 0.5
    expect(() => new Staff([fourFour, voice])).not.toThrow()
    // shouldn't allow a bare verticality.
    expect(() => new Staff([fourFour, cMaj])).toThrow()
  })

  it("gives the time signature for a measure", () => {
    let fourFour = new TimeSignature(4, 4)
    fourFour.position = 0
    let threeFour = new TimeSignature(3, 4)
    threeFour.position = 7
    let staff = new Staff([fourFour, threeFour])
    expect(staff.timeSignatureOfNthMeasure(1)).toEqual(fourFour)
    expect(staff.timeSignatureOfNthMeasure(100)).toEqual(threeFour)
    expect(staff.timeSignatureOfNthMeasure(8)).toEqual(threeFour)
    expect(() => staff.timeSignatureOfNthMeasure(0)).toThrow()
    threeFour.position = 1
    expect(staff.timeSignatureOfNthMeasure(1)).toEqual(fourFour)

    let emptyStaff = new Staff([])
    expect(() => emptyStaff.timeSignatureOfNthMeasure(3)).toThrow()
  })

  it("can be split to fit the measures in a staff", () => {
    let mel = melody("c4", "d4", "e4", "f4", "g4", "a4")
    mel.position = 0
    const fourFour = new TimeSignature(4, 4)
    fourFour.position = 0
    const staff = new Staff([fourFour, mel])
    expect(staff.splitVoice(mel)).toEqual([
      {
        timeSignature: fourFour,
        voice: melody("c4", "d4", "e4", "f4").at(0),
        owner: mel,
      },
      { timeSignature: fourFour, voice: melody("g4", "a4").at(1), owner: mel },
    ])

    const m = new Verticality("c4", new Duration(1, 2))
    const q = new Verticality("c4", new Duration(1))
    const vc = new Voice([m, m, m, m, q, q, q, q, q, q]).at(0)
    const staff2 = new Staff([fourFour, vc])
    expect(staff2.splitVoice(vc)).toEqual([
      {
        timeSignature: fourFour,
        voice: new Voice([m, m, m, m, q, q]).at(0),
        owner: vc,
      },
      {
        timeSignature: fourFour,
        voice: new Voice([q, q, q, q]).at(1),
        owner: vc,
      },
    ])

    const threeFour = new TimeSignature(3, 4)
    fourFour.position = 0
    threeFour.position = 1
    staff2.entities = [fourFour, vc, threeFour]
    expect(staff2.splitVoice(vc)).toEqual([
      {
        timeSignature: fourFour,
        voice: new Voice([m, m, m, m, q, q]).at(0),
        owner: vc,
      },
      {
        timeSignature: threeFour,
        voice: new Voice([q, q, q]).at(1),
        owner: vc,
      },
      { timeSignature: threeFour, voice: new Voice([q]).at(2), owner: vc },
    ])

    let mel2 = melody("e4", "d4", "c4", "b4", "c4", "d4")
    let mel3 = melody("c4", "d4", "e4", "f4", "g4", "a4")
    mel2.position = 0
    mel3.position = 0
    let staff3 = new Staff([fourFour, threeFour, mel3, mel2])
    expect(staff3.splitVoices()).toEqual([
      {
        timeSignature: fourFour,
        voices: [
          { voice: melody("c4", "d4", "e4", "f4").at(0), owner: mel3 },
          { voice: melody("e4", "d4", "c4", "b4").at(0), owner: mel2 },
        ],
      },
      {
        timeSignature: threeFour,
        voices: [
          { voice: melody("g4", "a4").at(1), owner: mel3 },
          { voice: melody("c4", "d4").at(1), owner: mel2 },
        ],
      },
    ])
  })

  it("splits voices when they overshoot barlines", () => {
    console.log("overshooting")
    const fourFour = new TimeSignature(4, 4)
    const threeFour = new TimeSignature(3, 4)
    const half = new Duration(2, 1)
    const q = new Duration(1, 1)
    const mel = melody("e6", "d4", "e4", "f4").withDurations([q, q, q, half])
    const irregStaff = new Staff([fourFour.at(0), threeFour.at(1), mel.at(0)])
    expect(irregStaff.splitVoice(mel)).toEqual([
      {
        owner: mel,
        timeSignature: fourFour,
        voice: melody("e6", "d4", "e4", "f4").at(0),
      },
      { timeSignature: threeFour, owner: mel, voice: melody("f4").at(1) },
    ])
  })

  it("finds the positions of its voices", () => {
    console.log("passed")
    const fourFour = new TimeSignature(4, 4).at(0)
    const threeFour = new TimeSignature(3, 4).at(1)
    const mel = melody("c4", "d4", "e4", "f4", "g4", "a4", "b4").at(0)
    const staff = new Staff([fourFour, mel, threeFour])
    expect(staff.positionsOfVoice(mel)).toEqual([
      0,
      0.25,
      0.5,
      0.75,
      1,
      1 + 1 / 3,
      1 + 2 / 3,
    ])
  })

  it("tests whether one voice is above another voice on a staff", () => {
    const fourFour = new TimeSignature(4, 4).at(0)
    const threeFour = new TimeSignature(3, 4).at(1)
    const higher = melody("e4", "f4", "g4", "a4", "b4", "c5", "d5").at(0)
    const eighth = new Duration(1, 2)
    expect(repeat(eighth, 8)).toEqual([
      eighth,
      eighth,
      eighth,
      eighth,
      eighth,
      eighth,
      eighth,
      eighth,
    ])
    const sixteenth = new Duration(1, 4)
    const quickdown = melody(
      "c5",
      "b4",
      "a4",
      "g4",
      "f4",
      "g4",
      "a4",
      "b4",
      "c5",
      "b4",
      "a4",
      "b4",
      "c5",
      "d5"
    )
      .withDurations(repeat(eighth, 14))
      .at(0)
    const drill = melody("c5")
      .withDurations(sixteenth)
      .repeated(15)
      .at(0)
    const rep = melody("c5", "d5", "e5")
      .withDurations(sixteenth)
      .repeated()
      .repeated()
      .at(0)
    const lower = melody("c4", "d4", "e4", "f4", "g4", "a4", "b4").at(0)
    const upDown = melody("e4", "f4", "f4", "e4", "d4", "c4", "b3").at(0)
    const staff = new Staff([
      fourFour,
      drill,
      drill.repeated(),
      higher,
      lower,
      threeFour,
    ])

    expect(staff.above(rep, lower)).toBeTruthy()
    expect(staff.above(drill, lower)).toBeTruthy()
    expect(staff.above(drill, higher)).toBeTruthy()
    expect(staff.above(drill.repeated(), higher)).not.toBeTruthy()
    expect(staff.above(higher, lower)).toBeTruthy()
    expect(staff.above(quickdown, lower)).toBeTruthy()
    quickdown.position = 1
    expect(staff.above(quickdown, lower)).not.toBeTruthy()
    quickdown.position = 0
    lower.position = 1

    // this fails:
    expect(staff.above(quickdown, lower)).toBeTruthy()

    expect(staff.above(upDown, lower)).not.toBeTruthy()
    expect(staff.above(higher, upDown)).toBeTruthy()
    expect(staff.above(lower, higher)).not.toBeTruthy()

    const empty = melody()
    expect(() => staff.above(empty, lower)).toThrow()
  })
})
