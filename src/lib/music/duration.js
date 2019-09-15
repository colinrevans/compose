/*
  a class that implements a rhythmic duration in beats.

  1 is a beat, relative to the current time signature.
  in 4/4 (beat is 1/4 of measure) :
  - 1 is a quarter note
  - 2 is a half note
  - 4 is a whole note
  - 1/2 is an eight note
  - 1/3 is an eight triplet
  and so on and so forth.
*/

import Rational from "./rational"

export function isFullMeasure(
  durationList,
  timeSignature = new Rational(4, 4)
) {
  return (
    durationList
      .map(x => x.durationAccordingToTimeSignature(timeSignature))
      .reduce((a, b) => a + b) == 1
  )
}

class Duration {
  constructor(numerator, divisor = 1) {
    this.duration = new Rational(numerator, divisor)
  }

  get duration() {
    return this._duration
  }

  set duration(duration) {
    if (duration instanceof Rational) {
      this._duration = duration
    } else if (typeof duration === "number" && duration > 0) {
      this._duration = new Rational(duration, 1)
    } else {
      throw new TypeError(
        "Duration constructor requires a rational or an integer greater than 0."
      )
    }
  }

  dot() {
    this.duration = this.duration.times(new Rational(3, 2))
    return this
  }

  undot() {
    this.duration = this.duration.times(new Rational(2, 3))
  }

  doubleDot() {
    this.duration = this.duration.times(new Rational(7, 4))
    return this
  }

  unDoubleDot() {
    this.duration = this.duration.times(new Rational(4, 7))
  }

  makeTriplet() {
    this.duration = this.duration.times(new Rational(2, 3))
    return this
  }

  plus(other) {
    let res = this.duration.plus(other.duration)
    return new Duration(res.numerator, res.denominator)
  }

  minus(other) {
    let res = this.duration.minus(other.duration)
    return new Duration(res.numerator, res.denominator)
  }

  times(other) {
    let res = this.duration.times(other.duration)
    return new Duration(res.numerator, res.denominator)
  }

  copy() {
    return new Duration(this.duration.numerator, this.duration.denominator)
  }

  equals(other) {
    if (!(other instanceof Duration))
      throw new TypeError("Duration equality requires another Duration.")
    return this.duration.equals(other.duration)
  }

  makeEven() {
    this.duration = this.duration.times(new Rational(3, 2))
    return this
  }

  augment(n) {
    this.duration = this.duration.times(n)
    return this
  }

  diminute(n) {
    this.duration = this.duration.over(n)
    return this
  }

  valueOf() {
    return this.duration.valueOf()
  }

  toString() {
    return this.duration.toString()
  }

  toJSON() {
    return {
      type: "duration",
      numerator: this.duration.numerator,
      denominator: this.duration.denominator,
    }
  }

  // TODO
  get vexflowRepresentation() {
    if (this.duration == 4) return "w"
    if (this.duration == 3) return "hd"
    if (this.duration == 2) return "h"
    if (this.duration == 3 / 2) return "qd"
    if (this.duration == 1) return "q"
    if (this.duration == 3 / 4) return "8d"
    if (this.duration == 1 / 2) return "8"
    if (this.duration == 3 / 8) return "16d"
    if (this.duration == 1 / 4) return "16"
    if (this.duration == 3 / 16) return "32d"
    if (this.duration == 1 / 8) return "32"
    if (this.duration == 3 / 32) return "64d"
    if (this.duration == 1 / 16) return "64"
    else return "q"
  }

  durationAccordingToTimeSignature(timeSignature) {
    if (!(timeSignature instanceof Rational))
      throw new TypeError(
        "durationAccordingToTimeSignature requires a timeSignature of type Rational"
      )
    let beatValue = timeSignature.denominator
    let durationInBeats = (1 / beatValue) * this.duration
    return durationInBeats / timeSignature
  }

  durationAccordingToTimeSignatureAsRational(timeSignature) {
    if (!(timeSignature instanceof Rational))
      throw new TypeError("need rational")
    let beatValue = timeSignature.denominator
    let durationInBeats = new Rational(1, beatValue).times(this.duration)
    /*
    console.log(`time signature: ${timeSignature}`)
    console.log(`this.duration: ${this.duration}`)
    console.log(`1 / beatValue: ${new Rational(1, beatValue)}`)
    console.log(`duration in beats: ${durationInBeats}`)
    */
    return durationInBeats.over(timeSignature)
  }
}

export default Duration
