import Note from "./note"

describe("Notes", () => {
  it("constructs with a note string", () => {
    expect(() => {
      new Note("C#4")
    }).not.toThrow()
    expect(() => {
      new Note("C4")
    }).not.toThrow()
    expect(() => {
      new Note("nonsense")
    }).toThrow()
  })

  it("constructs with multiple args", () => {
    expect(() => {
      new Note("C", "#", 4)
    }).not.toThrow()
    expect(() => {
      new Note("c", "b", "4")
    }).toThrow()
    expect(() => {
      new Note("C#4", "", 4)
    }).toThrow()
  })

  it("has a midinote getter", () => {
    expect(new Note("C4").midiNoteNumber).toBe(60)
    expect(new Note("C#4").midiNoteNumber).toBe(61)
    expect(new Note("C5").midiNoteNumber).toBe(72)
    expect(new Note("G3").midiNoteNumber).toBe(55)
  })

  it("has string output", () => {
    expect(`${new Note("C#4")}`).toBe("C#4")
  })

  it("has an octave elem that's a number", () => {
    expect(typeof new Note("C#4").octave).toBe("number")
  })

  it("returns the enharmonic of a note", () => {
    expect(new Note("C#4").enharmonic.toString()).toBe("Db4")
    expect(new Note("Db4").enharmonic).toEqual(new Note("C#4"))
  })
})
