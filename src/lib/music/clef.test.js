import Clef from "./clef"

describe("clef", () => {
  it("typechecks its constructor", () => {
    expect(() => new Clef("treble")).not.toThrow()
    expect(() => new Clef("trebble")).toThrow()
  })
})
