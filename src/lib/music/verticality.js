import { uniq } from "ramda"
import Note from "./note"
import { isTemporal } from "./util"
import Rest from "./rest"
import Duration from "./duration"

/**
 * Verticality --
 * A group of Notes that occurs simultaneously/appears vertically in a score, with a uniform duration.
 * This includes both single notes and chords
 *
 * a verticality is a 'temporal', our name for a rest or a verticality
 * ie something with a duration that gets put on a staff.
 */

// alternative constructor, eg
// chord('c4', 'e4', 'g4')
// use this if you don't need to care about duration information/a duration of 1/1 is ok
export const chord = (...args) => new Verticality([...args])

class Verticality {
  /**
   * notes is a list of Notes.
   * duration is a Duration.
   */
  constructor(notes = [], duration = new Duration(1)) {
    if (!Array.isArray(notes)) notes = [notes]
    this.notes = notes
    this.duration = duration
    // when verticalities end up crossing a barline,
    // we automatically make two new verticalities (using 'new Verticality') in its
    // place that are tied. canonical is a reference to the original
    // verticality. see splitVoice() method of Staff.
    this.canonical = this
    // the Voice that owns it
    this.owner = null
    this.DOMId = null
    this._next = null
    this._prev = null
  }

  get notes() {
    return this._notes
  }

  set notes(notes) {
    if (!Array.isArray(notes))
      throw new TypeError('"notes" for verticality should be an array.')
    else if (notes.every(note => note instanceof Note)) {
      this._notes = notes
    } else if (notes.every(note => typeof note === "string")) {
      this._notes = notes.map(note => new Note(note))
    } else if (Array.isArray(notes) && notes.length === 0) {
      this._notes = []
    } else {
      throw new TypeError("inconsistent or invalid note array for verticality.")
    }
  }

  get next() {
    return this._next
  }

  set next(temporal) {
    if (temporal === null || isTemporal(temporal)) this._next = temporal
    else throw new TypeError("Verticality cannot be linked to non-temporals.")
  }

  get prev() {
    return this._prev
  }

  set prev(temporal) {
    if (temporal === null || isTemporal(temporal)) this._prev = temporal
    else throw new TypeError("Verticality cannot be linked to non-temporals.")
  }

  get duration() {
    return this._duration
  }

  insertAfter(temporal) {
    if (!this.owner)
      throw new Error("Verticality has no owner. Insert impossible.")
    this.owner.addAfterIdx(temporal, this.owner.indexOf(this.canonical))
  }

  insertBefore(temporal) {
    if (!this.owner)
      throw new Error("Verticality has no owner. Insert impossible.")
    this.owner.addBeforeIdx(temporal, this.owner.indexOf(this.canonical))
  }

  setDOMId(id) {
    this.DOMId = id
    return this
  }

  addNote(note) {
    if (!(note instanceof Note))
      throw new TypeError("tried to add a non-note to a verticality.")
    this.makeCurrent = true
    if (this.notes.map(n => n.toString()).includes(note.toString())) return
    this.notes = [...this.notes, note].sort(
      (a, b) => a.midiNoteNumber - b.midiNoteNumber
    )
    return this
  }

  isChord() {
    return this.notes.length > 1
  }

  isCanonical() {
    return this === this.canonical
  }

  turnIntoRest() {
    let rest = new Rest(this.duration.copy())
    rest.makeCurrent = true
    this.canonical.insertBefore(rest)
    this.deleteFromOwningVoice()
  }

  deleteFromOwningVoice(addMakeCurrentFlag = false) {
    if (!this.owner)
      throw new Error("Verticality has no owner. Delete impossible.")
    if (this === this.canonical) {
      // this verticality isn't the result of an algorithm splitting notes
      // as, eg, when making a half note across a barline a quarter tied
      // to another quarter
      this.owner.deleteAtIdx(
        this.owner.indexOf(this.canonical),
        addMakeCurrentFlag
      )
    } else {
      // canonical verticality is longer, so just reduce the canonical duration
      // by this verticality's duration.
      this.canonical.duration = this.canonical.duration.minus(this.duration)
      if (addMakeCurrentFlag) this.canonical.makeCurrent = true
    }
  }

  set duration(duration) {
    if (typeof duration === "number") duration = new Duration(duration)
    if (!(duration instanceof Duration)) {
      throw new TypeError(
        '"duration" for verticality should be an instance of Duration.'
      )
    }
    this._duration = duration
  }

  get vexflowRepresentation() {
    return {
      duration: this.duration.vexflowRepresentation,
      keys: this.notes.map(n => n.vexflowRepresentation),
    }
  }

  asCurrent() {
    this.makeCurrent = true
    return this
  }

  durationAccordingToTimeSignature(sig) {
    return this.duration.durationAccordingToTimeSignature(sig)
  }

  associateWithDOMId(id) {
    this.DOMId = id
  }

  copy() {
    return new Verticality(this.notes.map(n => n.copy()), this.duration.copy())
  }

  durationAccordingToTimeSignatureAsRational(sig) {
    return this.duration.durationAccordingToTimeSignatureAsRational(sig)
  }

  invertUp() {
    let [toInvert, ...unchanged] = this.notes
    toInvert = toInvert.withOctaveAdjustedBy(1)
    this.notes = [...unchanged, toInvert]
    return this
  }

  invertDown() {
    let unchanged = this.notes.slice(0, this.notes.length - 1)
    let toInvert = this.notes[this.notes.length - 1]
    toInvert = toInvert.withOctaveAdjustedBy(-1)
    this.notes = [toInvert, ...unchanged]
    return this
  }

  invertedUp() {
    let [toInvert, ...unchanged] = this.notes
    toInvert = toInvert.withOctaveAdjustedBy(1)
    return new Verticality([...unchanged, toInvert], this.duration).addLinks(
      this.prev,
      this.next
    )
  }

  addLinks(prev, next) {
    this.prev = prev
    this.next = next
    return this
  }

  get beats() {
    return this.duration.valueOf()
  }

  get midiNoteNumbers() {
    return this.notes.map(n => n.midiNoteNumber)
  }

  get intervals() {
    let a = this.midiNoteNumbers
    let ret = []
    for (let i = 1; i < a.length; i++) {
      ret.push(a[i] - a[i - 1])
    }
    return ret
  }

  get ABIntervals() {
    let midinums = this.midiNoteNumbers
    return midinums
      .map(n => n - midinums[0])
      .slice(1)
      .filter(x => x > 0)
  }

  get ABIntervalSet() {
    let abintrvls = [0, ...this.ABIntervals]
    let ret = []
    for (let i = 1; i < abintrvls.length; i++) {
      let halfstepsFromPrevious = abintrvls[i] - abintrvls[i - 1]
      while (halfstepsFromPrevious > 12) {
        ret.push(".")
        halfstepsFromPrevious -= 12
      }
      ret.push(ABIntervalsToLetters[(abintrvls[i] % 12).toString()])
    }
    return "v" + ret.join("")
  }

  withoutNthNote(n) {
    if (n >= this.notes.length)
      throw new RangeError("verticality access out of bounds")
    // negative goes from the end
    if (n < 0) n = this.notes.length - (Math.abs(n) % this.notes.length)
    return new Verticality(
      [
        ...this.notes.slice(0, n),
        ...this.notes.slice(n + 1, this.notes.length),
      ],
      this.duration
    )
  }

  invertedDown() {
    let toInvert = this.notes[this.notes.length - 1]
    toInvert = toInvert.withOctaveAdjustedBy(-1)
    let unchanged = this.notes.slice(0, this.notes.length - 1)
    return new Verticality([toInvert, ...unchanged], this.duration).addLinks(
      this.prev,
      this.next
    )
  }

  withOctaveAdjustedBy(n) {
    return new Verticality(
      this.notes.map(note => note.withOctaveAdjustedBy(n)),
      this.duration
    ).addLinks(this.prev, this.next)
  }

  mergedWith(other) {
    if (!(other instanceof Verticality))
      throw new TypeError("mergedWith requires another Verticality")
    return new Verticality(
      uniq([...this.notes, ...other.notes]).sort(
        (a, b) => a.midiNoteNumber - b.midiNoteNumber
      ),
      this.duration
    ).addLinks(this.prev, this.next)
  }

  transposeByHalfSteps(steps) {
    this.notes = this.notes.map(n => n.transposeByHalfSteps(steps))
    return this
  }

  toString() {
    // c4 e4 g4 --> "[C4 E4 G4] : 1/1"
    return `[${this.notes
      .map(note => note.toString())
      .toString()
      .replace(/,/g, " ")}] ${this.duration}`
  }

  toJSON() {
    return {
      type: "verticality",
      notes: this.notes.map(n => n.toJSON()),
      duration: this.duration.toJSON(),
    }
  }
}

const ABIntervalsToLetters = {
  "0": "0",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "t",
  "11": "e",
}

export default Verticality
