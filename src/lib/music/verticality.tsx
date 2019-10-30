import { uniq } from "ramda"
import { RationalInterface } from "./rational"
import Note, { NoteInterface, NoteJSON } from "./note"
import { Temporal } from "./temporal"
import { isTemporal } from "./util"
import { VoiceInterface } from "./voice"
import Rest from "./rest"

import Duration, { DurationInterface, DurationJSON } from "./duration"
import { TimeSignatureInterface } from "./time-signature"

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
export const chord = (...args: any[]) => new Verticality([...args])

interface VerticalityVexflowRepresentation {
  duration: string
  keys: string[]
}

export interface VerticalityJSON {
  type: "verticality"
  notes: NoteJSON[]
  duration: DurationJSON
}

// TODO: consider breaking the interface in two:
// one interface to represent a verticality (an array of notes)
// one interface to represent said verticality along with editor-pertinent information (eg insertAfter and the like)
export interface VerticalityInterface {
  notes: NoteInterface[]
  duration: DurationInterface
  canonical: VerticalityInterface
  vexflowRepresentation: VerticalityVexflowRepresentation
  makeCurrent?: boolean
  startsAt?: number
  endsAt?: number
  tie?: boolean
  endTie?: boolean
  owner: VoiceInterface | null
  DOMId: string | null
  next: Temporal | null
  prev: Temporal | null
  beats: number
  midiNoteNumbers: number[]
  intervals: number[]
  ABIntervals: number[]
  ABIntervalSet: string
  insertAfter: (temp: Temporal) => void // stateful
  insertBefore: (temp: Temporal) => void // stateful
  setDOMId: (id: string) => VerticalityInterface // stateful
  addNote: (n: NoteInterface) => VerticalityInterface
  isChord: () => boolean
  isCanonical: () => boolean
  turnIntoRest: () => void
  deleteFromOwningVoice: (addMakeCurrentFlag: boolean) => void
  durationAccordingToTimeSignature: (sig: TimeSignatureInterface) => number
  durationAccordingToTimeSignatureAsRational: (
    sig: TimeSignatureInterface
  ) => RationalInterface
  copy: () => VerticalityInterface
  invertUp: () => VerticalityInterface // stateful
  invertDown: () => VerticalityInterface // stateful
  invertedUp: () => VerticalityInterface // functional
  invertedDown: () => VerticalityInterface // funcitonal
  addLinks: (prev: Temporal, next: Temporal) => VerticalityInterface // stateful
  withoutNthNote: (i: number) => VerticalityInterface // functional
  withOctaveAdjustedBy: (n: number) => VerticalityInterface // functional
  mergedWith: (other: VerticalityInterface) => VerticalityInterface // functional
  transposeByHalfSteps: (steps: number) => VerticalityInterface // stateful
  toString: () => string
  toJSON: () => VerticalityJSON
}

class Verticality implements VerticalityInterface {
  canonical: Verticality
  duration: DurationInterface
  owner: VoiceInterface | null
  DOMId: string | null
  makeCurrent?: boolean
  tie?: boolean
  endTie?: boolean
  private _next: Temporal | null
  private _prev: Temporal | null
  private _notes: NoteInterface[]

  /**
   * notes is a list of Notes.
   * duration is a Duration.
   */
  constructor(notes: NoteInterface, duration?: DurationInterface)
  constructor(notes: NoteInterface[], duration?: DurationInterface)
  constructor(
    notes = [] as NoteInterface | NoteInterface[],
    duration = new Duration(1)
  ) {
    if (!Array.isArray(notes)) notes = [notes]
    this._notes = []
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

  // NOTE: We have to bullshit typescript here.
  // Our setter allows for an array of Note instances
  // or Note strings (ie (NoteInterface | string)[]).
  // Typescript doesn't allow setters like this,
  // so we lie to it.
  // unfortunately this means the user of the API
  // has to @ts-ignore or type cast whenever
  // the note string version is used for assignment.
  // see note.tsx for the definition of 'note string'
  // in practice
  set notes(notes: NoteInterface[]) {
    if (!Array.isArray(notes))
      throw new TypeError('"notes" for verticality should be an array.')
    else if (notes.every((note: any) => note instanceof Note)) {
      this._notes = notes as NoteInterface[]
    } else if (notes.every((note: any) => typeof note === "string")) {
      this._notes = notes.map((note: any) => new Note(note)) as NoteInterface[]
    } else if (Array.isArray(notes) && notes.length === 0) {
      this._notes = [] as NoteInterface[]
    } else {
      this._notes = [] as NoteInterface[]
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

  insertAfter(temporal: Temporal) {
    if (!this.owner)
      throw new Error("Verticality has no owner. Insert impossible.")
    this.owner.addAfterIdx(temporal, this.owner.indexOf(this.canonical))
  }

  insertBefore(temporal: Temporal) {
    if (!this.owner)
      throw new Error("Verticality has no owner. Insert impossible.")
    this.owner.addBeforeIdx(temporal, this.owner.indexOf(this.canonical))
  }

  setDOMId(id: string) {
    this.DOMId = id
    return this
  }

  addNote(note: NoteInterface) {
    if (!(note instanceof Note))
      throw new TypeError("tried to add a non-note to a verticality.")
    this.makeCurrent = true
    if (this.notes.map(n => n.toString()).includes(note.toString())) return this
    this.notes = ([...this.notes, note] as NoteInterface[]).sort(
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
    //@ts-ignore
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
      // @ts-ignore - (involved string union type vs. string. dumb. fix isn't pretty)
      this.canonical.duration = this.canonical.duration.minus(this.duration)
      if (addMakeCurrentFlag) this.canonical.makeCurrent = true
    }
  }

  get vexflowRepresentation() {
    return {
      duration: this.duration.vexflowRepresentation,
      keys: (this.notes as NoteInterface[]).map(n => n.vexflowRepresentation),
    }
  }

  asCurrent() {
    this.makeCurrent = true
    return this
  }

  durationAccordingToTimeSignature(sig: TimeSignatureInterface) {
    return this.duration.durationAccordingToTimeSignature(sig)
  }

  associateWithDOMId(id: string) {
    this.DOMId = id
  }

  copy() {
    return new Verticality(
      (this.notes as NoteInterface[]).map(n => n.copy()),
      this.duration.copy()
    )
  }

  durationAccordingToTimeSignatureAsRational(sig: TimeSignatureInterface) {
    return this.duration.durationAccordingToTimeSignatureAsRational(sig)
  }

  invertUp() {
    let [toInvert, ...unchanged] = this.notes as NoteInterface[]
    toInvert = toInvert.withOctaveAdjustedBy(1)
    this.notes = [...unchanged, toInvert]
    return this
  }

  invertDown() {
    let unchanged = this.notes.slice(0, this.notes.length - 1)
    let toInvert = this.notes[this.notes.length - 1] as NoteInterface
    toInvert = toInvert.withOctaveAdjustedBy(-1)
    this.notes = [toInvert, ...unchanged]
    return this
  }

  invertedUp() {
    let [toInvert, ...unchanged] = this.notes as NoteInterface[]
    toInvert = toInvert.withOctaveAdjustedBy(1)
    return new Verticality([...unchanged, toInvert], this.duration).addLinks(
      this.prev,
      this.next
    )
  }

  addLinks(prev: Temporal, next: Temporal) {
    this.prev = prev
    this.next = next
    return this
  }

  get beats() {
    return this.duration.valueOf()
  }

  get midiNoteNumbers() {
    return (this.notes as NoteInterface[]).map(n => n.midiNoteNumber)
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

  withoutNthNote(n: number) {
    if (n >= this.notes.length)
      throw new RangeError("verticality access out of bounds")
    // negative goes from the end
    if (n < 0) n = this.notes.length - (Math.abs(n) % this.notes.length)
    return new Verticality(
      [
        ...(this.notes as NoteInterface[]).slice(0, n),
        ...(this.notes as NoteInterface[]).slice(n + 1, this.notes.length),
      ],
      this.duration
    )
  }

  invertedDown() {
    let toInvert = this.notes[this.notes.length - 1] as NoteInterface
    toInvert = toInvert.withOctaveAdjustedBy(-1)
    let unchanged = this.notes.slice(0, this.notes.length - 1)
    return new Verticality([toInvert, ...unchanged], this.duration).addLinks(
      this.prev,
      this.next
    )
  }

  withOctaveAdjustedBy(n: number) {
    return new Verticality(
      (this.notes as NoteInterface[]).map(note => note.withOctaveAdjustedBy(n)),
      this.duration
    ).addLinks(this.prev, this.next)
  }

  mergedWith(other: VerticalityInterface) {
    if (!(other instanceof Verticality))
      throw new TypeError("mergedWith requires another Verticality")
    return new Verticality(
      uniq([...this.notes, ...other.notes] as NoteInterface[]).sort(
        (a, b) => a.midiNoteNumber - b.midiNoteNumber
      ),
      this.duration
    ).addLinks(this.prev, this.next)
  }

  transposeByHalfSteps(steps: number) {
    this.notes = (this.notes as NoteInterface[]).map(n =>
      n.transposeByHalfSteps(steps)
    )
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
      type: "verticality" as "verticality",
      notes: (this.notes as NoteInterface[]).map((n: NoteInterface) =>
        n.toJSON()
      ),
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
} as { [interval: string]: string }

export default Verticality
