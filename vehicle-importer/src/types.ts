export const CONDITION_OPTIONS = ['km0', 'used', 'new'] as const
export type ConditionOption = (typeof CONDITION_OPTIONS)[number]

export const FUEL_TYPE_OPTIONS = [
  'benzina',
  'diesel',
  'gpl',
  'metano',
  'ibrido_full',
  'ibrido_plug_in',
  'mild_hybrid',
  'elettrico',
] as const
export type FuelTypeOption = (typeof FUEL_TYPE_OPTIONS)[number]

export const VISIBILITY_OPTIONS = [
  'visible_orderable',
  'visible_requestable',
  'hidden',
  'url_only',
] as const
export type VisibilityOption = (typeof VISIBILITY_OPTIONS)[number]

export const TRANSMISSION_OPTIONS = [
  'manual',
  'automatic',
  'cvt',
  'dual_clutch',
  'single_speed',
] as const
export type TransmissionOption = (typeof TRANSMISSION_OPTIONS)[number]

export const TIRE_OPTION_LABELS = ['all_season', 'summer_winter', 'winter', 'summer'] as const
export type TireOptionLabel = (typeof TIRE_OPTION_LABELS)[number]

export type VehicleInfo = {
  brand: string
  model: string
  trim: string
  condition: ConditionOption | ''
  category: string
  registration_date: string
  kilometers: string
  url: string
  configuration_url: string
  engine_size: string
  fuel_type: FuelTypeOption | ''
  transmission: TransmissionOption | ''
  power_kw: string
  power_cv: string
  seats: string
  doors: string
  status: string
  visibility: VisibilityOption | ''
  images: string
  exterior_color: string
  interior_color: string
  wheels: string
  pair_to_save_daily: string
  standard_equipment: string
}

export type PricingTermKey = '3y' | '4y' | '5y'

export type PricingRateRange = {
  label: string
  min: string
  max: string
}

export type PricingTerm = {
  monthlyAvg: string
  finalMin: string
  finalMax: string
  downMin: string
  downMax: string
  rates: PricingRateRange[]
}

export type PricingTable = Record<PricingTermKey, PricingTerm>

export type AccessoryItem = {
  id: string
  name: string
  price: string
}

export type TireOption = {
  id: string
  label: TireOptionLabel
  price: string
}

export type VehicleRecord = {
  id: string
  vehicle: VehicleInfo
  pricing: PricingTable
  accessories: AccessoryItem[]
  tires: TireOption[]
}

export type VehicleRow = Record<string, string>
