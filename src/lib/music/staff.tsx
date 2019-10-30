import Voice, { VoiceInterface } from "./voice"
import { flatten } from "ramda"
import Rest from "./rest"
import Rational from "./rational"
import Duration, { DurationInterface } from "./duration"
import Verticality from "./verticality"
import { Temporal } from "./temporal"
import Clef, { ClefInterface } from "./clef"
import TimeSignature, { TimeSignatureInterface } from "./time-signature"
import empty from "is-empty"

/**
 * Staff - a collection of the music objects that'd be on a single staff.
 * music objects can be many things (the idea is to keep things flexible and extensible),
 * but the main ones are:
 * - Voices
 * - clefs
 * - key signatures
 * - time signatures
 * - barlines
 * - newlines (when the staff breaks to a new line)
 *
 *
 * when it comes time to render, the staff finds the duration of each item and creates
 * a new representation of the data that's more appropriate for renderina.
 *
 * note that a grand staff, in our taxonomy, is actually a System object with two staves.
 */

class TimingError extends Error { }

export class LineBreak {
  position?: number
  at(n: number) {
    this.position = n
    return this
  }
}

// staff uses instanceof on these to make sure everything
// in a staff is valid
const permissibleObjects = [Voice, TimeSignature, LineBreak, Clef]
type MusicObject = VoiceInterface | ClefInterface | TimeSignatureInterface

// Collide
//
// takes a list of two voices,
// both of which last a measure,
// and whose temporals
// are marked w/ startsAt and endsAt (as by
// Staff's splitVoice and splitVoices methods).
// used by Staff's splitVoices method
// to check whether two voices, split
// into their respective measures,
// 'cross'.
//
// two voices,
// the one
//   do re mi
// the other
//   mi re do
// cross at the first and third notes, respectively.
const reconcile = voices => {
  if (voices.length > 2)
    throw new Error("collide hasn't been implemented for more than two voices.")

  // find a 'bounding box', ie a self contained
  // group of notes, from both voices, such that
  // the last note in voice A ends before or when the next
  // note in group B starts, and vice versa.

  // voice A : whole note
  // voice B : four quarters
  // --> one bounding box, a measure long

  // voice A : four quarters
  // voice B : four quarters
  // --> four bounding boxes, each a quarter note long.

  // voice A : eight eighths
  // voice B : four quarters
  // --> four bounding boxes, each a quarter note long.

  // voice A : two half notes
  // voice B : three half note triplets
  // --> one bounding box, a measure long

  // if, for each bounding box, the pitches
  // of one voice are higher than the other's,
  // there are no collisions.
  console.log(voices)

  let voiceA = [...voices[0].voice.temporals].filter((temp, idx) => {
    if (temp instanceof Verticality) {
      temp.voiceIdx = idx
      return true
    }
    return false
  })
  let voiceB = [...voices[1].voice.temporals].filter((temp, idx) => {
    if (temp instanceof Verticality) {
      temp.voiceIdx = idx
      return true
    }
    return false
  })
  console.log("voiceA: ", voiceA)
  console.log("voiceB: ", voiceB)
  let Aidx = 0
  let Bidx = 0
  let c = 0

  const above = (vertA, vertB) =>
    vertA.notes[0].midiNoteNumber >=
    vertB.notes[vertB.notes.length - 1].midiNoteNumber
  const meet = (vertA, vertB) =>
    vertA.notes[0].midiNoteNumber ===
    vertB.notes[vertB.notes.length - 1].midiNoteNumber
  let overallDir = above(voiceA[Aidx], voiceB[Bidx])

  while (voiceA[Aidx] && voiceB[Bidx]) {
    if (c > 500) throw new Error("probable infinite loop.")
    // ie, for each bounding box
    let nextAStart = voiceA[Aidx].startsAt
    let nextAEnd = voiceA[Aidx].endsAt
    let nextBStart = voiceB[Bidx].startsAt
    let nextBEnd = voiceB[Bidx].endsAt

    console.log("starting new bounding box")

    let boundingBeginsWithA = nextAStart <= nextBStart
    let boundingBeginsWithB = !boundingBeginsWithA

    let boundingDir = above(voiceA[Aidx], voiceB[Bidx])

    // a has a bounding box on its own
    if (nextAEnd < nextBStart && boundingBeginsWithA) {
      Aidx++
      continue
    }
    // b has a bounding box on its own
    if (nextBEnd < nextAStart && boundingBeginsWithB) {
      Bidx++
      continue
    }

    let idxOfLastAInBox = Aidx
    let idxOfLastBInBox = Bidx
    let collision = false
    let inLineWithVoice = true

    let i = idxOfLastAInBox
    let j = idxOfLastBInBox
    let a = voiceA
    let b = voiceB
    while (a[i] && b[j] && a[i].startsAt < b[j].endsAt) {
      console.log("current a: ", a[i].toString())
      console.log("current b: ", b[j].toString())
      if (above(a[i], b[j]) !== boundingDir) {
        console.log("inconsistent bounding box !")
        let collision = true
      }
      if (above(a[i], b[j]) !== overallDir) {
        inLineWithVoice = false
        console.log("inconsistent dir w/ voice")
      }
      while (b[j + 1] && b[j + 1].startsAt < a[i].endsAt) {
        j++
        console.log("current b: ", b[j].toString())
        if (above(a[i], b[j]) !== boundingDir) {
          console.log("inconsistent bounding box !")
          collision = true
        }
        if (above(a[i], b[j]) !== overallDir) {
          inLineWithVoice = false
          console.log("inconsistent dir w/ voice")
        }
      }
      i++
    }
    Aidx = i
    Bidx = j + 1
    console.log("Aidx now ", Aidx, " and Bidx now ", Bidx)

    /*
while (
voiceA[idxOfLastAInBox] &&
voiceB[idxOfLastBInBox] &&
voiceA[idxOfLastAInBox].startsAt < voiceB[idxOfLastBInBox].endsAt
) {
console.log("current A: ", voiceA[idxOfLastAInBox].toString())
while (
voiceB[idxOfLastBInBox] &&
voiceB[idxOfLastBInBox].startsAt < voiceA[idxOfLastAInBox].endsAt
) {
console.log("current B: ", voiceB[idxOfLastBInBox].toString())
if (
!meet(voiceA[idxOfLastAInBox], voiceB[idxOfLastBInBox]) &&
above(voiceA[idxOfLastAInBox], voiceB[idxOfLastBInBox]) !== dir
) {
console.log("collision. ", Aidx, Bidx)
if (
voiceA[idxOfLastAInBox].startsAt ===
voiceB[idxOfLastBInBox].startsAt &&
voiceA[idxOfLastAInBox].endsAt === voiceB[idxOfLastBInBox].endsAt
) {
voices[0].voice.temporals[voiceA[idxOfLastAInBox].voiceIdx] =
voiceB[idxOfLastBInBox]
voices[1].voice.temporals[voiceB[idxOfLastBInBox].voiceIdx] =
voiceA[idxOfLastAInBox]
}
}
idxOfLastBInBox++
}
idxOfLastAInBox++
if (
voiceA[idxOfLastAInBox] &&
voiceB[idxOfLastBInBox] &&
voiceA[idxOfLastAInBox - 1].endsAt <=
voiceB[idxOfLastBInBox].startsAt &&
voiceB[idxOfLastBInBox - 1].startsAt <= voiceA[idxOfLastAInBox].endsAt
)
break
}

Aidx = idxOfLastAInBox
Bidx = idxOfLastBInBox
*/
    c++
  }

  return voices
}

interface OneVoiceMeasure {
  timeSignature: TimeSignatureInterface
  owner: VoiceInterface
  voice: VoiceInterface // voice fills measure exactly
}
// note:
// OneVoiceMeasure[] can represent both complete measures comprising one voice each,
// or many voices of one complete measure (within Measure interface below)

interface Measure {
  timeSignature: TimeSignatureInterface
  voices: VoiceWithinMeasure[] // each voice fills measure exactly
}

interface VoiceWithinMeasure {
  owner: VoiceInterface
  voice: VoiceInterface
}

interface StaffInterface {
  entities: MusicObject[]
  empty: boolean
  clefs: ClefInterface[]
  timeSignatures: TimeSignatureInterface[]
  voices: VoiceInterface[]
  splitVoice: (v: VoiceInterface, idx: number) => OneVoiceMeasure[]
  splitVoices: Measure[]
  measures: Measure[] // getter version of splitVoices
  remove: (obj: MusicObject) => StaffInterface
  locate: (obj: MusicObject) => void
  includes: (obj: MusicObject) => boolean
  positionsOfVoice: (v: VoiceInterface) => number[]
  above: (v1: VoiceInterface, v2: VoiceInterface) => boolean
  add: (ent: MusicObject) => StaffInterface
  timeSignatureOfNthMeasure: (n: number) => TimeSignatureInterface
}

class Staff implements StaffInterface {
  private _entities: MusicObject[]

  constructor(entities: MusicObject[]) {
    this._entities = [] as MusicObject[]
    this.entities = entities
  }

  set entities(entities) {
    if (!Array.isArray(entities))
      throw new TypeError("Staff requires an Array of music objects")
    for (let i = 0; i < entities.length; i++) {
      let entity = entities[i]
      if (
        !permissibleObjects.some(obj => {
          return entity instanceof obj
        })
      ) {
        throw new TypeError(
          `Staff was given an invalid musical object. Must be one of ${permissibleObjects.map(
            x => x.name
          )}`
        )
      }
      if (!entity.position) entity.position = 0
    }
    this._entities = entities.sort(
      (a, b) => (a.position || 0) - (b.position || 0)
    )
  }

  get entities() {
    return this._entities
  }

  remove(obj: MusicObject) {
    if (this.includes(obj)) {
      let ret = []
      for (let ent of this.entities) {
        if (ent !== obj) ret.push(ent)
      }
      this.entities = ret
    }
    return this
  }

  locate(obj: MusicObject) {
    if (!this.entities.includes(obj)) throw new Error("object not in staff.")
  }

  includes(obj: MusicObject) {
    return this.entities.includes(obj)
  }

  get clefs() {
    return this.entities.filter(obj => obj instanceof Clef) as ClefInterface[]
  }

  get timeSignatures() {
    return this.entities.filter(
      obj => obj instanceof TimeSignature
    ) as TimeSignatureInterface[]
  }

  get lineBreaks() {
    return this.entities.filter(obj => obj instanceof LineBreak)
  }

  get voices() {
    return this.entities.filter(obj => obj instanceof Voice) as VoiceInterface[]
  }

  get measures() {
    return this.splitVoices()
  }

  get empty() {
    if (this.voices.length === 0) return true
    if (this.voices.length === 1 && this.voices[0].temporals.length === 0)
      return true
    return false
  }

  splitVoices(): Measure[] {
    let splittedVoices = this.voices.map(v => this.splitVoice(v, v.position))
    let ret = []
    for (let voice of splittedVoices) {
      for (let i = 0; i < voice.length; i++) {
        let measure = voice[i]
        if (ret[i] === undefined)
          ret[i] = { timeSignature: measure.timeSignature, voices: [] }
        ret[i].voices.push({ owner: measure.owner, voice: measure.voice })
      }
    }

    for (let i = 0; i < ret.length; i++) {
      let measure = ret[i]
      if (measure.voices.length <= 1) continue

      //if (!collide(measure.voices)) {
      //  console.log(`voices in ${measure} don't collide`)
      //} else console.log(`voices in ${measure} do collide `)
      //let reconciled = reconcile(measure.voices)

      measure.voices = reconcile(measure.voices)
    }
    return ret
  }

  // positions of voice's temporals relative to staff's measures.
  positionsOfVoice(voice: VoiceInterface) {
    if (voice.position === undefined) throw new Error("voice has no position")
    let measures = this.splitVoice(voice, voice.position)
    return flatten(
      measures.map((measure, idx) =>
        measure.voice.positions.map(
          pos => pos / measure.timeSignature.numerator + idx + voice.position
        )
      )
    )
  }

  splitVoice(voice: VoiceInterface, startingPos: number): OneVoiceMeasure[] {
    if (voice.temporals.length === 0) {
      return [
        {
          timeSignature: new TimeSignature(4, 4),
          owner: voice,
          voice: new Voice([]).at(startingPos),
        },
      ]
    }
    let log
    if (voice.temporals[0] instanceof Verticality)
      if (voice.temporals[0].notes[0].toString() === "E6") {
        log = true

        console.log("LOGGING")
      }
    if (!(voice instanceof Voice))
      throw new TypeError("splitVoice method requires a Voice")
    if (!startingPos) startingPos = voice.position ? voice.position : 0
    // ensure links don't link off to nothin
    voice.temporals[0].prev = null
    voice.temporals[voice.temporals.length - 1].next = null

    let curPos = new Rational(0, 1)
    let splitVoices = [] as OneVoiceMeasure[]
    let currentMeasure = [] as Temporal[]
    let sig = this.timeSignatureOfNthMeasure(splitVoices.length + 1)
    for (let temporal of voice.temporals) {
      if (log) console.log("START FOR: ", temporal.toString())
      let durInSig = temporal.durationAccordingToTimeSignatureAsRational(sig)
      if (log) console.log(curPos.plus(durInSig).toString())
      if (curPos.plus(durInSig).valueOf() <= 1) {
        // this temporal fits inside the current measure.
        temporal.startsAt = curPos.valueOf()
        curPos = curPos.plus(durInSig)
        if (currentMeasure.length > 0) {
          currentMeasure[currentMeasure.length - 1].next = temporal
          temporal.prev = currentMeasure[currentMeasure.length - 1]
        }
        temporal.endsAt = curPos.valueOf()

        currentMeasure = [...currentMeasure, temporal]

        if (curPos.numerator % curPos.denominator === 0) {
          // voice durations match the measure cleanly.
          // start a new measure with the next temporal
          let newVoice = new Voice([...currentMeasure])
          newVoice.position = splitVoices.length + startingPos
          splitVoices = [
            ...splitVoices,
            { timeSignature: sig, owner: voice, voice: newVoice },
          ]
          currentMeasure = []
          sig = this.timeSignatureOfNthMeasure(splitVoices.length + 1)
          curPos = new Rational(0, 1)
        }
      } else if (curPos.plus(durInSig).valueOf() > 1) {
        let start = curPos.valueOf()
        curPos = curPos.plus(durInSig)
        // we've overshot the barline.
        // split the temporal into two:
        // one temporal before the barline
        // and one after. (from here on out, their 'canonical'
        // will refer to the original temporal)
        // split the note into two. add a tie.
        // add what's left over to next measure.
        let overShotDur = durInSig
        let nextMeasureSig = this.timeSignatureOfNthMeasure(
          splitVoices.length + 2
        )
        let curMeasureSig = sig
        let durInCurMeasure = overShotDur.minus(curPos.minus(1))
        let end = durInCurMeasure.valueOf()
        // we have to convert back to beat-wise duration from measure-wise duration
        if (log) console.log("durincurmeasure: ", durInCurMeasure)
        let preDuration = durInCurMeasure.times(
          new Rational(curMeasureSig.numerator, 1)
        )
        if (log) console.log("pre duration: ", preDuration.toString())
        if (log) console.log("temporal duration: ", temporal.duration)
        let postDuration = temporal.duration.dur.minus(preDuration)
        if (log) console.log("post duration: ", postDuration)
        // account for timesignature changes like 4/4 -> 2/2
        postDuration = postDuration.times(
          new Rational(
            1,
            curMeasureSig.denominator / nextMeasureSig.denominator
          )
        )
        if (log) {
          console.log("predur: ", preDuration)
          console.log("postdur: ", postDuration)
        }
        let preAsDuration = new Duration(
          preDuration.numerator,
          preDuration.denominator
        )
        let postAsDuration = new Duration(
          postDuration.numerator,
          postDuration.denominator
        )
        if (log) console.log("didd")
        let firstTemporal
        if (temporal instanceof Verticality) {
          firstTemporal = new Verticality(temporal.notes, preAsDuration)
          firstTemporal.tie = true
        } else if (temporal instanceof Rest)
          firstTemporal = new Rest(preAsDuration)

        firstTemporal.canonical = temporal
        let secondTemporal
        if (temporal instanceof Verticality) {
          secondTemporal = new Verticality(temporal.notes, postAsDuration)
          secondTemporal.endTie = true
        } else if (temporal instanceof Rest)
          secondTemporal = new Rest(postAsDuration)
        secondTemporal.canonical = temporal
        secondTemporal.next = firstTemporal.next
        secondTemporal.prev = firstTemporal
        firstTemporal.next = secondTemporal
        let prevTemporal = currentMeasure[currentMeasure.length - 1]
        prevTemporal.next = firstTemporal
        firstTemporal.prev = prevTemporal

        firstTemporal.startsAt = start
        firstTemporal.endsAt = 1

        secondTemporal.startsAt = 0
        secondTemporal.endsAt = end

        if (!temporal.makeFormerCurrent && !temporal.makeLatterCurrent)
          secondTemporal.makeCurrent = temporal.makeCurrent
        else if (temporal.makeFormerCurrent) firstTemporal.makeCurrent = true
        else if (temporal.makeLatterCurrent) secondTemporal.makeCurrent = true

        currentMeasure = [...currentMeasure, firstTemporal]
        let newVoice = new Voice([...currentMeasure])
        currentMeasure = [secondTemporal]
        if (log) console.log("sec: ", secondTemporal)
        newVoice.position = splitVoices.length + startingPos
        splitVoices = [
          ...splitVoices,
          { timeSignature: curMeasureSig, owner: voice, voice: newVoice },
        ]
        sig = nextMeasureSig
        curPos = curPos.minus(1, 1)
      }
    }
    if (log) console.log(currentMeasure)
    if (!empty(currentMeasure)) {
      // we've got some stragglers. add em w/ a rest at the end
      // to complete the measure.
      let coveredDuration = currentMeasure
        .map(temp => temp.duration)
        .reduce((a, b) => a.plus(b))
      let restLength = new Duration(sig.numerator).minus(coveredDuration)
      let newRest = new Rest(restLength)
      newRest.prev = currentMeasure[currentMeasure.length - 1]
      newRest.startsAt = currentMeasure[currentMeasure.length - 1].endsAt
      newRest.endsAt = 1
      newRest.filler = true
      currentMeasure[currentMeasure.length - 1].next = newRest
      if (log) console.log("leftovers")
      splitVoices = [
        ...splitVoices,
        {
          timeSignature: sig,
          owner: voice,
          voice: new Voice([...currentMeasure, newRest]).at(splitVoices.length),
        },
      ]
    }
    // preserve links
    for (let i = 1; i < splitVoices.length; i++) {
      let last = x => x[x.length - 1]
      let first = x => x[0]
      last(splitVoices[i - 1].voice.temporals).next = first(
        splitVoices[i].voice.temporals
      )
      first(splitVoices[i].voice.temporals).prev = last(
        splitVoices[i - 1].voice.temporals
      )
    }

    // add positions
    for (let i = 0; i < splitVoices.length; i++) {
      /*      console.log(
"BATCH: ",
splitVoices[i].voice.temporals.map(t => t.toString())
)
*/
      let temporals = splitVoices[i].voice.temporals
      for (let t of temporals) t.position = startingPos + i
      /*     console.log(
"Batch positions: ",
splitVoices[i].voice.temporals.map(t => t.position)
)
*/
    }
    if (log) splitVoices.forEach(v => console.log(v.voice.toString()))
    return splitVoices
  }

  above(voice1: VoiceInterface, voice2: VoiceInterface) {
    //console.log("voice1: ", voice1.temporals.map(vert => vert.toString()))
    //console.log("voice2: ", voice2.temporals.map(vert => vert.toString()))
    let voice1positions = this.positionsOfVoice(voice1)
    let voice2positions = this.positionsOfVoice(voice2)
    if (empty(voice1positions) || empty(voice2positions))
      throw new Error("one of the voices given to above is empty")
    let voice2idx = 1
    for (let idx = 0; idx < voice1positions.length; idx++) {
      let voice1position = voice1positions[idx]
      while (voice2positions[voice2idx] < voice1position) {
        voice2idx += 1
      }
      if (
        !(voice1.temporals[idx] instanceof Verticality) ||
        !(voice2.temporals[voice2idx - 1] instanceof Verticality)
      )
        continue
      else {
        let voice1lowest = (voice1.temporals[idx] as Verticality).notes[0]
        let voice2highest = (voice2.temporals[voice2idx - 1] as Verticality)
          .notes[
          (voice2.temporals[voice2idx - 1] as Verticality).notes.length - 1
        ]
        if (voice1lowest.midiNoteNumber < voice2highest.midiNoteNumber)
          return false
      }
    }

    return true
  }

  add(ent: MusicObject) {
    this.entities = [...this.entities, ent]
    return this
  }

  timeSignatureOfNthMeasure(n: number) {
    if (n <= 0)
      throw new RangeError(
        "invalid measure access. no zeroth or negative measure."
      )
    let signatures = this.timeSignatures
    if (empty(signatures)) throw new Error("no time signatures on staff")
    let positions = signatures.map(sig => {
      if (sig.position === undefined || !Number.isInteger(sig.position))
        throw new TimingError("time signature not at measure boundary")
      return sig.position
    })

    if (positions[0] !== 0)
      throw new TimingError("no time signature at the beginning of the staff.")
    if (n === 1) return signatures[0]

    for (let i = 1; i < positions.length; i++) {
      if (n > positions[i - 1] && n < positions[i]) {
        return signatures[i - 1]
      }
    }
    return signatures[signatures.length - 1]
  }
}

export default Staff
