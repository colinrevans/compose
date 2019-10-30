import Verticality from "./verticality.js"
import Duration from "./duration.js"
import Rational from "./rational.js"
import Rest from "./rest"
import { repeat } from "./util"
import { isTemporal } from "./util"
import { TimingError } from "./errors"
// a voice is more or less a list of temporals (verticalities or rests)
//

class NotInVoiceError extends Error {
  constructor(...args) {
    super(...args)
    this.name = "NotInVoiceError"
  }
}

// helper function to add next + prev links to a list of verticalities
const linkTemporals = temporalArray => {
  if (temporalArray.length === 0) return temporalArray
  temporalArray[0].prev = null
  for (let i = 1; i < temporalArray.length; i++) {
    let prev = temporalArray[i - 1]
    let cur = temporalArray[i]
    prev.next = cur
    cur.prev = prev
  }
  temporalArray[temporalArray.length - 1].next = null
  return temporalArray
}

export const melody = (...args) =>
  new Voice(args.map(arg => new Verticality(arg)))

class Voice {
  constructor(temporals = []) {
    this.temporals = temporals
    this.position = 0
  }

  set temporals(temps) {
    if (!Array.isArray(temps) || !temps.every(t => isTemporal(t)))
      throw new TypeError("Voice's temporals should be an array of Temporals.")
    if (temps.every(temp => temp.prev === null && temp.next === null))
      linkTemporals(temps)
    this._temporals = temps
  }

  get temporals() {
    return this._temporals
  }

  mergedWith(other) {
    if (!(other instanceof Voice))
      throw new TypeError("mergedWith requires another Voice")
    let lenA = this.temporals.length
    let lenB = other.temporals.length
    let merged = []
    for (let i = 0; i < Math.max(lenA, lenB); i++) {
      let a = this.temporals[i]
      let b = other.temporals[i]

      if (a && b) {
        if (!a.duration.equals(b.duration))
          throw new TimingError(
            `invalid merge. notes are of different lengths: ${a.duration}, ${b.duration}, .`
          )
        merged.push(a.mergedWith(b))
      } else if (a) merged.push(a)
      else if (b) merged.push(b)
    }
    return new Voice(merged)
  }

  duplicate() {
    let tempsAtStart = [...this.temporals]
    for (let temp of tempsAtStart) {
      this.add(temp.copy())
    }
    return this
  }

  get beats() {
    return this.temporals.map(temp => temp.duration).reduce((a, b) => a + b)
  }

  get ABIntervalSets() {
    return this.temporals.map(temp => temp.ABIntervalSet)
  }

  stripForTests() {
    this.temporals.forEach(temp => {
      temp.prev = null
      temp.next = null
      temp.owner = null
    })
    return this
  }

  durationAccordingToTimeSignature(sig) {
    if (!(sig instanceof Rational))
      throw new TypeError("time signature should be a Rational.")
    return this.temporals
      .map(temp => temp.durationAccordingToTimeSignature(sig))
      .reduce((a, b) => a + b)
  }

  withoutNthTemporal(n) {
    if (n >= this.temporals.length) throw new RangeError("access out of bounds")
    // negative goes from the end
    if (n < 0) n = this.temporals.length - (Math.abs(n) % this.temporals.length)
    return new Voice([
      ...this.temporals.slice(0, n),
      ...this.temporals.slice(n + 1, this.temporals.length),
    ])
  }

  withOctaveAdjustedBy(n) {
    return new Voice(this.temporals.map(temp => temp.withOctaveAdjustedBy(n)))
  }

  // positions of every note in beats from the beginning
  get positions() {
    let ret = []
    let curPos = 0
    for (let temp of this.temporals) {
      ret.push(curPos)
      curPos += temp.duration
    }
    return ret
  }

  at(n) {
    this.position = n
    return this
  }

  withDurations(durs) {
    if (!Array.isArray(durs)) durs = [durs]
    if (!durs.every(d => d instanceof Duration)) {
      throw new TypeError("durations incorrect! ")
    }
    if (arguments.length > 1)
      throw new Error(
        "withDurations recieved more than one argument. malformed input!"
      )
    return new Voice(
      this.temporals.map((temp, idx) => {
        let dur = durs[idx]
          ? new Duration(
              durs[idx].duration.numerator,
              durs[idx].duration.denominator
            )
          : new Duration(
              durs[durs.length - 1].duration.numerator,
              durs[durs.length - 1].duration.denominator
            )
        if (temp instanceof Verticality) return new Verticality(temp.notes, dur)
        if (temp instanceof Rest) return new Rest(dur)
      })
    )
  }

  append(other) {
    return new Voice([...this.temporals, ...other.temporals]).at(this.position)
  }

  add(temporal) {
    if (!isTemporal(temporal))
      throw new TypeError("cannot add a non-temporal to a voice")
    let lastTemp = this.temporals[this.temporals.length - 1]
    lastTemp.next = temporal
    temporal.prev = lastTemp
    this.temporals = [...this.temporals, temporal]
    return this
  }

  addAfterIdx(temporal, idx) {
    if (!isTemporal(temporal))
      throw new TypeError("cannot add a non-temporal to a voice")
    if (idx < 0 || idx >= this.temporals.length)
      throw new RangeError("invalid index into voice")
    if (idx === this.temporals.length - 1) {
      let last = this.temporals[this.temporals.length - 1]
      last.next = temporal
      temporal.prev = last
      temporal.makeCurrent = true
      this.temporals = [...this.temporals, temporal]
    } else {
      let pre = this.temporals.slice(0, idx + 1)
      let post = this.temporals.slice(idx + 1, this.temporals.length)
      let lastOfPre = pre[pre.length - 1]
      let firstOfPost = post[0]
      lastOfPre.next = temporal
      temporal.prev = lastOfPre
      temporal.next = firstOfPost
      firstOfPost.prev = temporal
      // tell the editor to make the new temporal the current one
      temporal.makeCurrent = true
      this.temporals = [...pre, temporal, ...post]
    }
  }

  addBeforeIdx(temporal, idx) {
    if (!isTemporal(temporal))
      throw new TypeError("cannot add a non-temporal to a voice")
    if (idx < 0 || idx >= this.temporals.length)
      throw new RangeError("invalid index into voice")
    if (idx === 0) {
      let first = this.temporals[0]
      first.prev = temporal
      temporal.next = first
      temporal.makeCurrent = true
      this.temporals = [temporal, ...this.temporals]
    } else {
      this.addAfterIdx(temporal, idx - 1)
    }
  }

  deleteAtIdx(idx, addMakeCurrentFlag = false) {
    if (idx < 0 || idx >= this.temporals.length)
      throw new RangeError("invalid index into voice")
    if (idx === 0) {
      this.temporals = this.temporals.slice(1)
      if (this.temporals.length > 1) {
        this.temporals[0].prev = null
      }
    } else if (idx === this.temporals.length - 1) {
      this.temporals = this.temporals.slice(0, this.temporals.length - 1)
      this.temporals[this.temporals.length - 1].next = null
      if (addMakeCurrentFlag)
        this.temporals[this.temporals.length - 1].makeCurrent = true
    } else {
      this.temporals[idx - 1].next = this.temporals[idx + 1]
      this.temporals[idx + 1].prev = this.temporals[idx - 1]
      this.temporals = [
        ...this.temporals.slice(0, idx),
        ...this.temporals.slice(idx + 1),
      ]
      if (addMakeCurrentFlag) this.temporals[idx - 1].makeCurrent = true
    }
    // guarantee that links don't leap to dummy rests
    // that're added during rendering to fill incomplete
    // measures
    this.temporals[this.temporals.length - 1].next = null
    return this
  }

  // NB: matches by reference
  indexOf(temporal) {
    for (let i = 0; i < this.temporals.length; i++) {
      if (this.temporals[i] === temporal) return i
    }
    throw new NotInVoiceError(
      "temporal not found in indexOf. probably an error!"
    )
  }

  deleteNFromEnd(n) {
    if (n <= 0 || n > this.tempialities.length) return this
    this.temporals = this.temporals.slice(0, this.temporals.length - n)
    return this
  }

  get length() {
    return this.temporals.length
  }

  repeated(n = 1) {
    return new Voice(repeat(this.temporals, n + 1)).at(this.position)
  }

  toString() {
    return `[ ${this.temporals.map(temp => temp.toString()).join(" | ")} ]`
  }

  toJSON() {
    return {
      type: 'voice',
      temporals: this.temporals.map(temp => temp.toJSON()),
      position: this.position,
    }
  }
}

export default Voice
