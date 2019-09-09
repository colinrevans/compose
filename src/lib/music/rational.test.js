import Rational from "./rational"

describe("Rational", () => {
  const oneHalf = new Rational(1, 2)
  it("gets its numerator and denominator", () => {
    expect(oneHalf.numerator).toBe(1)
    expect(oneHalf.denominator).toBe(2)
  })

  it("validates numerator and denominator input", () => {
    expect(() => {
      oneHalf.numerator = "a"
    }).toThrow()
    expect(() => {
      oneHalf.denominator = "b"
    }).toThrow()
  })

  it("sets new numerators", () => {
    oneHalf.numerator = 2
    expect(oneHalf.numerator).toBe(2)
    oneHalf.denominator = 4
    expect(oneHalf.denominator).toBe(4)

    oneHalf.reset(1, 2)
  })

  const twoFourths = new Rational(2, 4)
  const oneThird = new Rational(1, 3)
  const twoSixths = new Rational(2, 6)
  const threeNinths = new Rational(3, 9)

  it("subtracts", () => {
    expect(twoFourths.minus(twoFourths)).toEqual(new Rational(0, 1))
    expect(new Rational(4, 3).minus(new Rational(1, 3))).toEqual(
      new Rational(1, 1)
    )
  })

  it("tests for numeric equality between rationals", () => {
    expect(oneHalf.equals(twoFourths)).toBe(true)
    expect(oneHalf.equals(oneHalf)).toBe(true)
    expect(oneHalf.equals(oneThird)).toBe(false)
    expect(oneThird.equals(twoSixths)).toBe(true)
    expect(twoSixths.equals(threeNinths)).toBe(true)
  })

  it("simplifies", () => {
    expect(twoFourths.simplify()).toEqual(oneHalf)
    twoFourths.reset(2, 4)
    expect(twoSixths.simplify()).toEqual(oneThird)
    twoSixths.reset(2, 6)
    expect(threeNinths.simplify()).toEqual(oneThird)
    threeNinths.reset(3, 9)
    expect(oneHalf.simplify()).toEqual(oneHalf)
  })

  it("gets the reciprocal", () => {
    expect(oneHalf.reciprocal).toEqual(new Rational(2, 1))
    expect(oneHalf).toEqual(new Rational(1, 2))
  })

  it("multiplies", () => {
    expect(twoFourths.times(oneHalf)).toEqual(new Rational(1, 4))
    expect(twoFourths.times(2).valueOf()).toEqual(1)
  })

  it("adds", () => {
    expect(twoFourths.plus(twoFourths)).toEqual(new Rational(1, 1))
    expect(new Rational(1, 4).plus(new Rational(2, 4))).toEqual(
      new Rational(3, 4)
    )
    expect(new Rational(3, 4).plus(new Rational(2, 4))).toEqual(
      new Rational(5, 4)
    )
  })

  it("divides", () => {
    expect(oneHalf.over(oneHalf)).toEqual(new Rational(1, 1))
    expect(oneHalf.over(2)).toEqual(new Rational(1, 4))
    expect(new Rational(1, 4).over(new Rational(4, 4))).toEqual(
      new Rational(1, 4)
    )
  })

  it("has nice string output", () => {
    expect(`duration: ${oneHalf}`).toBe(`duration: 1/2`)
  })

  it("has a getter for the simplified version", () => {
    expect(twoFourths.simplified).toEqual(oneHalf)
    expect(twoFourths).toEqual(new Rational(2, 4))
  })

  const oneQuarter = new Rational(1, 4)
  it("can easily be used in mathematical expressions", () => {
    // addition
    expect(oneHalf + oneHalf).toBe(1)
    expect(oneQuarter + oneQuarter + oneQuarter).toBe(0.75)
    // multiplication
    expect(oneHalf * oneHalf).toBe(0.25)
    expect(oneThird * oneThird).toBe(1 / 9)
    // division
    expect(oneHalf / oneHalf).toBe(1)
  })

  it("flips to become reciprocal", () => {
    expect(oneHalf.flip().valueOf()).toBe(2)
    expect(threeNinths.flip().valueOf()).toBe(3)
  })
})
