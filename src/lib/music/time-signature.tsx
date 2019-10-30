import Rational, { RationalInterface } from "./rational"

interface TimeSignatureJSON {
 type: "time-signature"
 position?: number
 numerator: number
 denominator: number
}

export interface TimeSignatureInterface extends RationalInterface {
 position?: number
 beatValue: number
 beatsInBar: number
 toJSON: () => TimeSignatureJSON
}

export class TimeSignature extends Rational implements TimeSignatureInterface {
 position?: number

 constructor(beatValue: number, beatsInBar: number) {
  super(beatValue, beatsInBar)
 }

 at(n: number) {
  this.position = n
  return this
 }

 get vexflowRepresentation() {
  return `${this.numerator}/${this.denominator}`
 }

 get beatValue() {
  return this.denominator
 }

 get beatsInBar() {
  return this.numerator
 }

 toJSON() {
  return {
   type: "time-signature" as "time-signature",
   position: this.position,
   numerator: this.numerator,
   denominator: this.denominator,
  }
 }
}

export default TimeSignature
