import Staff, { LineBreak } from "./staff"

class System {
  constructor(staves) {
    this.staves = staves
  }

  set staves(staves) {
    if (!Array.isArray(staves)) staves = [staves]
    if (!staves.every(stave => stave instanceof Staff)) {
      console.log(staves)
      throw new TypeError(
        `System requires an array of Staff instances. got ${staves}`
      )
    }
    this._staves = staves
  }

  get staves() {
    return this._staves
  }

  get lines() {
    let lineBreaks = []
    for (let staff of this.staves) {
      lineBreaks = [...lineBreaks, staff.lineBreaks]
    }
    return lineBreaks
  }
}

export default System
