import Duration, { DurationInterface, DurationJSON } from "./duration"
import { RationalInterface } from "./rational"
import { Temporal } from "./temporal"
import { VoiceInterface } from "./voice"
import { TimeSignatureInterface } from "./time-signature"
import { isTemporal } from "./util"

interface RestVexflowRepresentation {
  duration: string
  keys: Array<string>
}

export interface RestJSON {
  type: "rest"
  duration: DurationJSON
}

export interface RestInterface {
  duration: DurationInterface
  beats: number
  DOMId: string | null
  makeCurrent?: boolean
  startsAt?: number
  endsAt?: number
  canonical: RestInterface
  vexflowRepresentation: RestVexflowRepresentation
  owner: VoiceInterface | null
  next: Temporal | null
  prev: Temporal | null
  copy: () => RestInterface
  insertAfter: (temp: Temporal) => void
  setDOMId: (id: string) => RestInterface
  deleteFromOwningVoice: (addMakeCurrentFlag?: boolean) => void
  durationAccordingToTimeSignature: (sig: TimeSignatureInterface) => number
  durationAccordingToTimeSignatureAsRational: (
    sig: TimeSignatureInterface
  ) => RationalInterface
  associateWithDOMId: (id: string) => RestInterface
  addLinks: (prev: Temporal, next: Temporal) => RestInterface
  toString: () => string
  toJSON: () => RestJSON
}

class Rest implements RestInterface {
  duration: Duration
  canonical: Rest
  owner: VoiceInterface | null
  next: Temporal | null
  prev: Temporal | null
  DOMId: string | null
  makeCurrent?: boolean

  constructor(duration = new Duration(1)) {
    this.duration = duration
    this.canonical = this
    this.owner = null
    this.next = null
    this.prev = null
    this.DOMId = null
  }

  copy() {
    return new Rest(this.duration.copy())
  }

  insertAfter(temporal: Temporal) {
    if (!this.owner) throw new Error("Rest has no owner. Insert impossible.")
    this.owner.addAfterIdx(temporal, this.owner.indexOf(this.canonical))
  }

  setDOMId(id: string) {
    this.DOMId = id
    return this
  }

  deleteFromOwningVoice(addMakeCurrentFlag = false) {
    if (!this.owner) throw new Error("Rest has no owner. Delete impossible.")
    if (this.owner.temporals.length === 1) {
      if (addMakeCurrentFlag) this.canonical.makeCurrent = true
      return
    }
    if (this === this.canonical) {
      this.owner.deleteAtIdx(
        this.owner.indexOf(this.canonical),
        addMakeCurrentFlag
      )
    } else {
      this.canonical.duration = this.canonical.duration.minus(this.duration)
      if (addMakeCurrentFlag) this.canonical.makeCurrent = true
    }
  }

  get vexflowRepresentation() {
    return {
      duration: this.duration.vexflowRepresentation + "r",
      keys: ["b/4"],
    }
  }

  durationAccordingToTimeSignature(sig: TimeSignatureInterface) {
    return this.duration.durationAccordingToTimeSignature(sig)
  }

  durationAccordingToTimeSignatureAsRational(sig: TimeSignatureInterface) {
    return this.duration.durationAccordingToTimeSignatureAsRational(sig)
  }

  associateWithDOMId(id: string) {
    this.DOMId = id
    return this
  }

  addLinks(prev: Temporal, next: Temporal) {
    this.prev = prev
    this.next = next
    return this
  }

  get beats() {
    return this.duration.valueOf()
  }

  toString() {
    return `rest : ${this.duration}`
  }

  toJSON() {
    return {
      type: "rest" as "rest",
      duration: this.duration.toJSON(),
    }
  }
}

export default Rest
