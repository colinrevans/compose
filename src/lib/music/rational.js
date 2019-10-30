/*
  TYPES:
  numerator: int
  denominator: int
*/

function getGcd(a, b) {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y) {
    let t = y
    y = x % y
    x = t
  }
  return x
}

class Rational {
  constructor(numerator, denominator) {
    this.numerator = numerator
    this.denominator = denominator
  }

  get numerator() {
    return this._numerator
  }

  get denominator() {
    return this._denominator
  }

  reset(numerator, denominator) {
    this.numerator = numerator
    this.denominator = denominator
  }

  set numerator(numerator) {
    if (typeof numerator !== "number") {
      throw new TypeError(`incorrect numerator type: got ${typeof numerator}`)
    }
    this._numerator = numerator
    return numerator
  }

  withNumeratorAs(n) {
    return new Rational(n, this.denominator)
  }

  withDenominatorAs(n) {
    return new Rational(this.numerator, n)
  }

  set denominator(denominator) {
    if (typeof denominator !== "number") {
      throw new TypeError("incorrect denominator type")
    }
    this._denominator = denominator
    return denominator
  }

  // test for numeric equality. eg 4/2.equals(2/1) is true.
  equals(otherRational) {
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

  plus(other) {
    if (other instanceof Rational) {
      const numerator =
        this.numerator * other.denominator + other.numerator * this.denominator
      const denominator = this.denominator * other.denominator
      return new Rational(numerator, denominator).simplify()
    } else {
      return new Rational(
        this.numerator + other * this.denominator,
        this.denominator
      ).simplify()
    }
  }

  minus(other) {
    if (other instanceof Rational) {
      const numerator =
        this.numerator * other.denominator - other.numerator * this.denominator
      const denominator = this.denominator * other.denominator
      return new Rational(numerator, denominator).simplify()
    } else {
      return new Rational(
        this.numerator - other * this.denominator,
        this.denominator
      ).simplify()
    }
  }

  // NB: does NOT automatically simplify
  times(otherRational) {
    if (otherRational instanceof Rational) {
      const numerator = this.numerator * otherRational.numerator
      const denominator = this.denominator * otherRational.denominator
      return new Rational(numerator, denominator).simplify()
    } else {
      return new Rational(
        this.numerator * otherRational,
        this.denominator
      ).simplify()
    }
  }

  over(otherRational) {
    if (typeof otherRational === "number") {
      let num = otherRational
      return this.times(new Rational(1, num))
    }
    return this.times(otherRational.reciprocal)
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
