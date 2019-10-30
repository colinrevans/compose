/*
  TYPES:
  numerator: int
  denominator: int
*/

function getGcd(a: number, b: number) {
 let x = Math.abs(a)
 let y = Math.abs(b)
 while (y) {
  let t = y
  y = x % y
  x = t
 }
 return x
}

export interface RationalInterface {
 numerator: number
 denominator: number
 reciprocal: RationalInterface // functional
 simplified: RationalInterface // functional
 reset: (num: number, denom: number) => RationalInterface // stateful
 withNumeratorAs: (numerator: number) => RationalInterface // functional
 withDenominatorAs: (denominator: number) => RationalInterface // functional
 equals: (other: RationalInterface) => boolean
 flip: () => RationalInterface // stateful
 plus: (other: RationalInterface | number) => RationalInterface //functional
 minus: (other: RationalInterface | number) => RationalInterface // functional
 times: (other: RationalInterface | number) => RationalInterface // functional
 over: (other: RationalInterface | number) => RationalInterface // functional
 toString: () => string
 valueOf: () => number
 simplify: () => RationalInterface // stateful
}

const checkInt = (n: number) => {
 if (!Number.isInteger(n))
  throw new TypeError("rational requires integers by Number.isInteger()")
}

class Rational {
 private _numerator: number
 private _denominator: number

 constructor(numerator: number, denominator: number) {
  this._numerator = numerator
  this._denominator = denominator
  this.numerator = numerator
  this.denominator = denominator
 }

 set numerator(n: number) {
  checkInt(n)
  this._numerator = n
 }

 get numerator() {
  return this._numerator
 }

 set denominator(n: number) {
  checkInt(n)
  this._denominator = n
 }

 get denominator() {
  return this._denominator
 }

 reset(numerator: number, denominator: number) {
  checkInt(numerator)
  checkInt(denominator)
  this.numerator = numerator
  this.denominator = denominator
  return this
 }

 withNumeratorAs(n: number) {
  checkInt(n)
  return new Rational(n, this.denominator)
 }

 withDenominatorAs(n: number) {
  checkInt(n)
  return new Rational(this.numerator, n)
 }

 // test for numeric equality. eg 4/2.equals(2/1) is true.
 equals(otherRational: RationalInterface) {
  return (
   this.numerator / otherRational.numerator ==
   this.denominator / otherRational.denominator
  )
 }

 flip() {
  const tempForSwap = this.numerator
  this.numerator = this.denominator
  this.denominator = tempForSwap
  return this
 }

 get reciprocal() {
  return new Rational(this.denominator, this.numerator)
 }

 plus(other: RationalInterface | number) {
  if (typeof other === "number") {
   return new Rational(
    this.numerator + other * this.denominator,
    this.denominator
   ).simplify()
  } else {
   const numerator =
    this.numerator * other.denominator + other.numerator * this.denominator
   const denominator = this.denominator * other.denominator
   return new Rational(numerator, denominator).simplify()
  }
 }

 minus(other: RationalInterface | number) {
  if (typeof other === "number") {
   return new Rational(
    this.numerator - other * this.denominator,
    this.denominator
   ).simplify()
  } else {
   const numerator =
    this.numerator * other.denominator - other.numerator * this.denominator
   const denominator = this.denominator * other.denominator
   return new Rational(numerator, denominator).simplify()
  }
 }

 // NB: does NOT automatically simplify
 times(other: RationalInterface | number) {
  if (typeof other === "number") {
   return new Rational(this.numerator * other, this.denominator).simplify()
  } else {
   const numerator = this.numerator * other.numerator
   const denominator = this.denominator * other.denominator
   return new Rational(numerator, denominator).simplify()
  }
 }

 over(other: RationalInterface | number): RationalInterface {
  if (typeof other === "number") {
   let num = other
   return this.times(new Rational(1, num))
  } else {
   return this.times(other.reciprocal)
  }
 }

 toString() {
  return `${this.numerator}/${this.denominator}`
 }

 valueOf() {
  return this.numerator / this.denominator
 }

 simplify() {
  let gcd = getGcd(this.numerator, this.denominator)
  this.numerator = Math.round(this.numerator / gcd)
  this.denominator = Math.round(this.denominator / gcd)
  return this
 }

 get simplified() {
  let gcd = getGcd(this.numerator, this.denominator)
  return new Rational(
   Math.round(this.numerator / gcd),
   Math.round(this.denominator / gcd)
  )
 }
}

export default Rational
