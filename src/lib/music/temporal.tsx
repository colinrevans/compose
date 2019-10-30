import { RestInterface, RestJSON } from "./rest"
import { VerticalityInterface, VerticalityJSON } from "./verticality"

export type Temporal = RestInterface | VerticalityInterface
export type TemporalJSON = RestJSON | VerticalityJSON
