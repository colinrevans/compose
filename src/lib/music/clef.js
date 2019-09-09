const clefTypes = ["treble", "bass", "tenor", "alto"]

class Clef {
  constructor(type) {
    this.type = type
  }

  set type(type) {
    if (!clefTypes.includes(type)) {
      throw new TypeError("invalid clef type given to Clef constructor")
    }
  }

  get type() {
    return this._type
  }

  at(n) {
    this.position = n
    return this
  }
}

export default Clef
