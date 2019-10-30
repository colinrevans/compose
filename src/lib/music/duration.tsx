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

import Rational, { RationalInterface } from "./rational"
import { TimeSignature, TimeSignatureInterface } from "./time-signature"

export function isFullMeasure(
 durationList: DurationInterface[],
 timeSignature = new TimeSignature(4, 4)
) {
 return (
  durationList
   .map(x => x.durationAccordingToTimeSignature(timeSignature))
   .reduce((a, b) => a + b) == 1
 )
}

export interface DurationInterface {
 dur: RationalInterface
 vexflowRepresentation: string
 dot: () => DurationInterface // stateful
 undot: () => DurationInterface // stateful
 doubleDot: () => DurationInterface // stateful
 unDoubleDot: () => DurationInterface // stateful
 makeTriplet: () => DurationInterface // stateful
 makeEven: () => DurationInterface // stateful
 plus: (other: Duration) => DurationInterface // functional
 minus: (other: Duration) => DurationInterface // functional
 times: (other: Duration) => DurationInterface // functional
 equals: (other: Duration) => boolean // functional
 augment: (amt: number) => DurationInterface // stateful
 diminute: (amt: number) => DurationInterface // stateful
 copy: () => DurationInterface
 durationAccordingToTimeSignature: (sig: TimeSignatureInterface) => number
 durationAccordingToTimeSignatureAsRational: (
  sig: TimeSignatureInterface
 ) => RationalInterface
 valueOf: () => number
 toString: () => string
 toJSON: () => DurationJSON
}

export interface DurationJSON {
 type: "duration"
 numerator: number
 denominator: number
}

class Duration implements DurationInterface {
 dur: RationalInterface

 constructor(numerator: number, divisor = 1) {
  this.dur = new Rational(numerator, divisor)
 }

 dot() {
  this.dur = this.dur.times(new Rational(3, 2))
  return this
 }

 undot() {
  this.dur = this.dur.times(new Rational(2, 3))
  return this
 }

 doubleDot() {
  this.dur = this.dur.times(new Rational(7, 4))
  return this
 }

 unDoubleDot() {
  this.dur = this.dur.times(new Rational(4, 7))
  return this
 }

 makeTriplet() {
  this.dur = this.dur.times(new Rational(2, 3))
  return this
 }

 plus(other: DurationInterface) {
  let res = this.dur.plus(other.dur)
  return new Duration(res.numerator, res.denominator)
 }

 minus(other: DurationInterface) {
  let res = this.dur.minus(other.dur)
  return new Duration(res.numerator, res.denominator)
 }

 times(other: DurationInterface) {
  let res = this.dur.times(other.dur)
  return new Duration(res.numerator, res.denominator)
 }

 copy() {
  return new Duration(this.dur.numerator, this.dur.denominator)
 }

 equals(other: DurationInterface) {
  if (!(other instanceof Duration))
   throw new TypeError("Duration equality requires another.dur.")
  return this.dur.equals(other.dur)
 }

 makeEven() {
  this.dur = this.dur.times(new Rational(3, 2))
  return this
 }

 augment(n: number) {
  this.dur = this.dur.times(n)
  return this
 }

 diminute(n: number) {
  this.dur = this.dur.over(n)
  return this
 }

 valueOf() {
  return this.dur.valueOf()
 }

 toString() {
  return this.dur.toString()
 }

 toJSON() {
  return {
   type: "duration" as "duration",
   numerator: this.dur.numerator,
   denominator: this.dur.denominator,
  }
 }

 // TODO
 get vexflowRepresentation() {
  let dur = this.dur.valueOf()
  if (dur == 4) return "w" as string
  if (dur == 3) return "hd" as string
  if (dur == 2) return "h" as string
  if (dur == 3 / 2) return "qd" as string
  if (dur == 1) return "q" as string
  if (dur == 3 / 4) return "8d" as string
  if (dur == 1 / 2) return "8" as string
  if (dur == 3 / 8) return "16d" as string
  if (dur == 1 / 4) return "16" as string
  if (dur == 3 / 16) return "32d" as string
  if (dur == 1 / 8) return "32" as string
  if (dur == 3 / 32) return "64d" as string
  if (dur == 1 / 16) return "64" as string
  else return "q" as string
 }

 durationAccordingToTimeSignature(timeSignature: TimeSignatureInterface) {
  if (!(timeSignature instanceof Rational))
   throw new TypeError(
    "durationAccordingToTimeSignature requires a timeSignature of type Rational"
   )
  let beatValue = timeSignature.denominator
  let durationInBeats = (1 / beatValue) * this.dur.valueOf()
  return durationInBeats / timeSignature.valueOf()
 }

 durationAccordingToTimeSignatureAsRational(
  timeSignature: TimeSignatureInterface
 ) {
  if (!(timeSignature instanceof Rational))
   throw new TypeError("need rational")
  let beatValue = timeSignature.denominator
  let durationInBeats = new Rational(1, beatValue).times(this.dur)
  /*
console.log(`time signature: ${timeSignature}`)
console.log(`this.dur: ${this.dur}`)
console.log(`1 / beatValue: ${new Rational(1, beatValue)}`)
console.log(`duration in beats: ${durationInBeats}`)
*/
  return durationInBeats.over(timeSignature)
 }
}

export default Duration
