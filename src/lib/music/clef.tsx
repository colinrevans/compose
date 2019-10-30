type clefType = "treble" | "bass" | "tenor" | "alto"

type ClefJSON = {
  type: "clef"
  clefType: clefType
  position?: number
}

export interface ClefInterface {
  type: clefType
  position?: number
  at: (n: number) => ClefInterface
  toJSON: () => ClefJSON
  toString: () => string
}

class Clef implements ClefInterface {
  type: clefType
  position?: number

  constructor(t: clefType) {
    this.type = t
  }

  at(n: number) {
    this.position = n
    return this
  }

  toJSON() {
    return {
      type: "clef" as "clef",
      clefType: this.type,
      position: this.position,
    }
  }

  toString() {
    return this.type
  }
}

export default Clef
