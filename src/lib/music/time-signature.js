import Rational from "./rational"

class TimeSignature extends Rational {
  at(n) {
    this.position = n
    return this
  }

  get vexflowRepresentation() {
    return `${this.numerator}/${this.denominator}`
  }

  toJSON() {
    return {
      type: "time-signature",
      position: this.position,
      numerator: this.numerator,
      denominator: this.denominator,
    }
  }
}

export default TimeSignature
