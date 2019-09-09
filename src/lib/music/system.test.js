import System from "./system"
import Staff from "./staff"
import Voice, { melody } from "./voice"
import Duration from "./duration"
import TimeSignature from "./time-signature"

describe("system", () => {
  it("typechecks its constructor", () => {
    let mel = melody("c4")
      .repeated(3)
      .at(0)
    let mel2 = melody("d4")
      .repeated(3)
      .at(0)
    let fourFour = new TimeSignature(4, 4).at(0)
    let staff = new Staff([mel, mel2, fourFour])

    expect(() => new System(staff)).not.toThrow()
    expect(() => new System([staff])).not.toThrow()
    expect(() => new System("nonsense")).toThrow()
    expect(() => new System()).toThrow()
  })
})
