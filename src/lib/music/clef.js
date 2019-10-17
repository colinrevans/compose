const clefTypes = ["treble", "bass", "tenor", "alto"]

class Clef {
  constructor(type) {
    this.type = type
  }

  set type(type) {
    if (!clefTypes.includes(type)) {
      throw new TypeError("invalid clef type given to Clef constructor")
    }
    this._type = type
  }

  get type() {
    return this._type
  }

  at(n) {
    this.position = n
    return this
  }

  toJSON() {
    return {
      type: 'clef',
      clefType: this.type,
      position: this.position
    }
  }
}

export default Clef
