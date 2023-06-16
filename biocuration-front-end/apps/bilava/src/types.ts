import {Float32BufferAttribute} from 'three'

export interface TreeData {
  taxonomy: string[]
  data: string[]
}

export interface Dimensions {
  width: number
  height: number
  marginRight: number
  marginLeft: number
  marginTop: number
  marginBottom: number
  boundedWidth: number
  boundedHeight: number
}

export interface ScatterDot {
  dbId: number // TODO database, shit i need the schema and classifier too...
  x: number // projected x coordinate
  y: number // projected y coordinate
  lbl: string // label
  ulbl: string | null // updated label
  prd: string // prediction
  uri: string // relative url to image
  hit: number // neighborhood hit
  ss: string // split set
  distance?: number
  selected?: boolean
  w: number // image width
  h: number // image height
  ms: number // margin sampling
  en: number // entropy
  sr: string // source
  mp: number // probability for prediction
}

export interface Dataset {
  data: ScatterDot[]
  labels: string[]
  sources: string[]
  minPrediction: number
}

export interface ProjectionBuffer {
  position: Float32BufferAttribute
  fillColor: Float32BufferAttribute
  strokeColor: Float32BufferAttribute
  raw: ScatterDot[]
}

export interface SelectionListOption {
  label: string
  value: string
}

export interface SpiralThumbnail extends ScatterDot {
  id?: string // id generated to build d3 hierarchy
  name: string
  index: number
  k?: number
  ring?: number // ring number
  placedholder?: boolean
  children?: SpiralThumbnail[] // children rings
}

export interface Filter {
  hits: number
  label: string[]
  prediction: string[]
  probability: [number, number]
  source: string[]
}

export interface BarChartDatum {
  field: string
  count: number
  selected: boolean
}

export interface ImageExtras {
  caption: string
  probs: number[]
  name: string
  fullLabel: string
}

export interface UpdateResult {
  total_updates: number
}

export interface ResponseError {
  description: string
  error: boolean
}