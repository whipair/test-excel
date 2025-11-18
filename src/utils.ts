import type {
  AccessoryItem,
  PricingTable,
  PricingTerm,
  PricingTermKey,
  TireOption,
  VehicleInfo,
  VehicleRecord,
  VehicleRow,
} from './types'

export const PRICING_TERM_METADATA: Record<PricingTermKey, { label: string; rateCount: number }> = {
  '3y': { label: '36 months', rateCount: 3 },
  '4y': { label: '48 months', rateCount: 4 },
  '5y': { label: '60 months', rateCount: 5 },
}

const createEmptyPricingTerm = (rateCount: number): PricingTerm => ({
  monthlyAvg: '',
  finalMin: '',
  finalMax: '',
  downMin: '',
  downMax: '',
  rates: Array.from({ length: rateCount }, (_, index) => ({
    label: `rate_${index + 1}`,
    min: '',
    max: '',
  })),
})

export const createEmptyPricingTable = (): PricingTable => ({
  '3y': createEmptyPricingTerm(PRICING_TERM_METADATA['3y'].rateCount),
  '4y': createEmptyPricingTerm(PRICING_TERM_METADATA['4y'].rateCount),
  '5y': createEmptyPricingTerm(PRICING_TERM_METADATA['5y'].rateCount),
})

export const createEmptyVehicleInfo = (): VehicleInfo => ({
  brand: '',
  model: '',
  trim: '',
  condition: '',
  category: '',
  registration_date: '',
  kilometers: '',
  url: '',
  configuration_url: '',
  engine_size: '',
  fuel_type: '',
  transmission: '',
  power_kw: '',
  power_cv: '',
  seats: '',
  doors: '',
  status: '',
  visibility: '',
  images: '',
  exterior_color: '',
  interior_color: '',
  wheels: '',
  pair_to_save_daily: '',
  standard_equipment: '',
})

export const CSV_COLUMNS = [
  'brand',
  'model',
  'trim',
  'condition',
  'category',
  'registration_date',
  'kilometers',
  'url',
  'configuration_url',
  'engine_size',
  'fuel_type',
  'transmission',
  'power_kw',
  'power_cv',
  'seats',
  'doors',
  'status',
  'visibility',
  'images',
  'exterior_color',
  'interior_color',
  'wheels',
  'pair_to_save_daily',
  'standard_equipment',
  'pricing_3y_monthly_avg',
  'pricing_3y_final_min',
  'pricing_3y_final_max',
  'pricing_3y_down_min',
  'pricing_3y_down_max',
  'pricing_3y_rate_1_min',
  'pricing_3y_rate_1_max',
  'pricing_3y_rate_2_min',
  'pricing_3y_rate_2_max',
  'pricing_3y_rate_3_min',
  'pricing_3y_rate_3_max',
  'pricing_4y_monthly_avg',
  'pricing_4y_final_min',
  'pricing_4y_final_max',
  'pricing_4y_down_min',
  'pricing_4y_down_max',
  'pricing_4y_rate_1_min',
  'pricing_4y_rate_1_max',
  'pricing_4y_rate_2_min',
  'pricing_4y_rate_2_max',
  'pricing_4y_rate_3_min',
  'pricing_4y_rate_3_max',
  'pricing_4y_rate_4_min',
  'pricing_4y_rate_4_max',
  'pricing_5y_monthly_avg',
  'pricing_5y_final_min',
  'pricing_5y_final_max',
  'pricing_5y_down_min',
  'pricing_5y_down_max',
  'pricing_5y_rate_1_min',
  'pricing_5y_rate_1_max',
  'pricing_5y_rate_2_min',
  'pricing_5y_rate_2_max',
  'pricing_5y_rate_3_min',
  'pricing_5y_rate_3_max',
  'pricing_5y_rate_4_min',
  'pricing_5y_rate_4_max',
  'pricing_5y_rate_5_min',
  'pricing_5y_rate_5_max',
  'accessories',
  'tire_options',
] as const

const normalizeListField = (value: string): string =>
  value
    .split(/\r?\n|\|/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join('|')

const buildAccessoryString = (items: AccessoryItem[]): string =>
  items
    .filter((item) => item.name.trim())
    .map((item) => `${item.name.trim()}:${item.price.trim()}`)
    .join('|')

const buildTireString = (items: TireOption[]): string =>
  items
    .filter((item) => item.label.trim())
    .map((item) => `${item.label.trim()}:${item.price.trim()}`)
    .join('|')

export const formatVehicleRow = (record: VehicleRecord): VehicleRow => {
  const row: VehicleRow = {} as VehicleRow

  CSV_COLUMNS.forEach((column) => {
    row[column] = ''
  })

  const vehicle = record.vehicle
  row.brand = vehicle.brand
  row.model = vehicle.model
  row.trim = vehicle.trim
  row.condition = vehicle.condition
  row.category = vehicle.category
  row.registration_date = vehicle.registration_date
  row.kilometers = vehicle.kilometers
  row.url = vehicle.url
  row.configuration_url = vehicle.configuration_url
  row.engine_size = vehicle.engine_size
  row.fuel_type = vehicle.fuel_type
  row.transmission = vehicle.transmission
  row.power_kw = vehicle.power_kw
  row.power_cv = vehicle.power_cv
  row.seats = vehicle.seats
  row.doors = vehicle.doors
  row.status = vehicle.status
  row.visibility = vehicle.visibility
  row.images = vehicle.images
  row.exterior_color = vehicle.exterior_color
  row.interior_color = vehicle.interior_color
  row.wheels = vehicle.wheels
  row.pair_to_save_daily = vehicle.pair_to_save_daily
  row.standard_equipment = normalizeListField(vehicle.standard_equipment)

  ;(Object.entries(record.pricing) as [PricingTermKey, PricingTerm][]).forEach(([termKey, term]) => {
    const prefix = `pricing_${termKey}`
    row[`${prefix}_monthly_avg`] = term.monthlyAvg
    row[`${prefix}_final_min`] = term.finalMin
    row[`${prefix}_final_max`] = term.finalMax
    row[`${prefix}_down_min`] = term.downMin
    row[`${prefix}_down_max`] = term.downMax

    term.rates.forEach((rate, index) => {
      const rateIndex = index + 1
      row[`${prefix}_rate_${rateIndex}_min`] = rate.min
      row[`${prefix}_rate_${rateIndex}_max`] = rate.max
    })
  })

  row.accessories = buildAccessoryString(record.accessories)
  row.tire_options = buildTireString(record.tires)

  return row
}

export const buildVehicleSheetRows = (records: VehicleRecord[]) =>
  records.map((record) => ({
    vehicle_id: record.id,
    ...record.vehicle,
    standard_equipment: normalizeListField(record.vehicle.standard_equipment),
  }))

export const buildPricingSheetRows = (records: VehicleRecord[]) => {
  const rows: Record<string, string>[] = []

  records.forEach((record) => {
    ;(Object.entries(record.pricing) as [PricingTermKey, PricingTerm][]).forEach(([termKey, term]) => {
      const row: Record<string, string> = {
        vehicle_id: record.id,
        term: termKey,
        monthly_avg: term.monthlyAvg,
        final_min: term.finalMin,
        final_max: term.finalMax,
        down_min: term.downMin,
        down_max: term.downMax,
      }

      term.rates.forEach((rate, index) => {
        const rateIndex = index + 1
        row[`rate_${rateIndex}_min`] = rate.min
        row[`rate_${rateIndex}_max`] = rate.max
      })

      rows.push(row)
    })
  })

  return rows
}

export const buildAccessorySheetRows = (records: VehicleRecord[]) =>
  records.flatMap((record) =>
    record.accessories.map((item) => ({
      vehicle_id: record.id,
      name: item.name,
      price: item.price,
    })),
  )

export const buildTireSheetRows = (records: VehicleRecord[]) =>
  records.flatMap((record) =>
    record.tires.map((item) => ({
      vehicle_id: record.id,
      label: item.label,
      price: item.price,
    })),
  )

export const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
