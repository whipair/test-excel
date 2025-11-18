import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  AccessoryItem,
  PricingTable,
  PricingTerm,
  PricingTermKey,
  TireOption,
  TireOptionLabel,
  VehicleInfo,
  VehicleRecord,
} from '../types'
import {
  CONDITION_OPTIONS,
  FUEL_TYPE_OPTIONS,
  TIRE_OPTION_LABELS,
  TRANSMISSION_OPTIONS,
  VISIBILITY_OPTIONS,
} from '../types'
import {
  PRICING_TERM_METADATA,
  createEmptyPricingTable,
  createEmptyVehicleInfo,
  generateId,
} from '../utils'

const VEHICLE_FIELDS: Array<{
  name: keyof VehicleInfo
  label: string
  type?: string
  placeholder?: string
  required?: boolean
  options?: readonly string[]
}> = [
  { name: 'brand', label: 'Brand', required: true },
  { name: 'model', label: 'Model', required: true },
  { name: 'trim', label: 'Trim', required: true },
  { name: 'condition', label: 'Condition', options: CONDITION_OPTIONS },
  { name: 'category', label: 'Category' },
  { name: 'registration_date', label: 'Registration Date', type: 'date' },
  { name: 'kilometers', label: 'Kilometers', type: 'number' },
  { name: 'url', label: 'Vehicle URL', type: 'url' },
  { name: 'configuration_url', label: 'Configuration URL', type: 'url' },
  { name: 'engine_size', label: 'Engine Size (cc)', type: 'number' },
  { name: 'fuel_type', label: 'Fuel Type', options: FUEL_TYPE_OPTIONS },
  { name: 'transmission', label: 'Transmission', options: TRANSMISSION_OPTIONS },
  { name: 'power_kw', label: 'Power (kW)', type: 'number' },
  { name: 'power_cv', label: 'Power (CV)', type: 'number' },
  { name: 'seats', label: 'Seats', type: 'number' },
  { name: 'doors', label: 'Doors', type: 'number' },
  { name: 'status', label: 'Status' },
  { name: 'visibility', label: 'Visibility', options: VISIBILITY_OPTIONS },
  { name: 'images', label: 'Image URLs' },
  { name: 'exterior_color', label: 'Exterior Color' },
  { name: 'interior_color', label: 'Interior Color' },
  { name: 'wheels', label: 'Wheels' },
  { name: 'pair_to_save_daily', label: 'Pair To Save (Daily)', type: 'number' },
]

const PRICING_BASE_FIELDS: Array<{
  key: keyof Pick<PricingTerm, 'monthlyAvg' | 'finalMin' | 'finalMax' | 'downMin' | 'downMax'>
  label: string
}> = [
  { key: 'monthlyAvg', label: 'Monthly average' },
  { key: 'finalMin', label: 'Final min' },
  { key: 'finalMax', label: 'Final max' },
  { key: 'downMin', label: 'Down payment min' },
  { key: 'downMax', label: 'Down payment max' },
]

const formatOptionLabel = (value: string) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

type VehicleFormState = {
  vehicle: VehicleInfo
  pricing: PricingTable
  accessories: AccessoryItem[]
  tires: TireOption[]
}

type DraftAccessory = {
  name: string
  price: string
}

type DraftTire = {
  label: TireOptionLabel | ''
  price: string
}

type VehicleFormProps = {
  onCreate: (record: VehicleRecord) => void
}

const FORM_STORAGE_KEY = 'vehicle-importer-form'

const createInitialState = (): VehicleFormState => ({
  vehicle: createEmptyVehicleInfo(),
  pricing: createEmptyPricingTable(),
  accessories: [],
  tires: [],
})

const loadFormState = (): VehicleFormState => {
  const stored = localStorage.getItem(FORM_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as VehicleFormState
    } catch (error) {
      console.error('Failed to parse stored form state:', error)
    }
  }
  return createInitialState()
}

const SAMPLE_VEHICLES: VehicleInfo[] = [
  {
    brand: 'Peugeot',
    model: '208',
    trim: 'Style',
    condition: 'km0',
    category: 'city_car',
    registration_date: '2024-12-01',
    kilometers: '1',
    url: 'https://www.brescianiautomobilisrl.it/auto/km0/bergamo/peugeot/208/benzina/208-puretech-75-stop-start-5-porte-style/9392176/',
    configuration_url: 'https://vendite.whipair.it/peugeot-208-style-km0-1-configurazione-riepilogo-ordine/',
    engine_size: '1199',
    fuel_type: 'benzina',
    transmission: 'automatic',
    power_kw: '110',
    power_cv: '110',
    seats: '5',
    doors: '5',
    status: 'available',
    visibility: 'visible_orderable',
    images: '',
    exterior_color: 'Grigio artense',
    interior_color: 'Tessuto Renzo / Rimini',
    wheels: 'Cerchi in lamiera da 16" monti con copricerchio',
    pair_to_save_daily: '12.00',
    standard_equipment: `6 Airbags (frontali, laterali, a tendina)
Climatizzatore manuale monozona
Sensori di parcheggio posteriori`,
  },
  {
    brand: 'Fiat',
    model: '500',
    trim: 'Pop',
    condition: 'used',
    category: 'city_car',
    registration_date: '2022-05-15',
    kilometers: '25000',
    url: 'https://example.com/fiat-500-used',
    configuration_url: 'https://example.com/fiat-500-config',
    engine_size: '1242',
    fuel_type: 'benzina',
    transmission: 'manual',
    power_kw: '51',
    power_cv: '69',
    seats: '4',
    doors: '3',
    status: 'available',
    visibility: 'visible_orderable',
    images: '',
    exterior_color: 'Bianco',
    interior_color: 'Tela nera',
    wheels: 'Cerchi in acciaio',
    pair_to_save_daily: '8.50',
    standard_equipment: `ABS
Airbag conducente
Climatizzatore manuale`,
  },
  {
    brand: 'Tesla',
    model: 'Model 3',
    trim: 'Standard Range Plus',
    condition: 'new',
    category: 'electric',
    registration_date: '2025-01-01',
    kilometers: '0',
    url: 'https://example.com/tesla-model3-new',
    configuration_url: 'https://example.com/tesla-model3-config',
    engine_size: '',
    fuel_type: 'elettrico',
    transmission: 'single_speed',
    power_kw: '140',
    power_cv: '190',
    seats: '5',
    doors: '4',
    status: 'available',
    visibility: 'visible_orderable',
    images: '',
    exterior_color: 'Nero',
    interior_color: 'Vegan leather',
    wheels: 'Cerchi Aero',
    pair_to_save_daily: '0.00',
    standard_equipment: `Autopilot
Supercharger access
Glass roof`,
  },
  {
    brand: 'BMW',
    model: 'X3',
    trim: 'xDrive20d',
    condition: 'km0',
    category: 'suv',
    registration_date: '2024-11-01',
    kilometers: '500',
    url: 'https://example.com/bmw-x3-km0',
    configuration_url: 'https://example.com/bmw-x3-config',
    engine_size: '1995',
    fuel_type: 'diesel',
    transmission: 'automatic',
    power_kw: '140',
    power_cv: '190',
    seats: '5',
    doors: '5',
    status: 'available',
    visibility: 'visible_requestable',
    images: '',
    exterior_color: 'Blu metallizzato',
    interior_color: 'Pelle nera',
    wheels: 'Cerchi in lega 18"',
    pair_to_save_daily: '25.00',
    standard_equipment: `Navigazione
Sedili riscaldati
Sensori parcheggio`,
  },
  {
    brand: 'Renault',
    model: 'Clio',
    trim: 'Intens',
    condition: 'used',
    category: 'city_car',
    registration_date: '2021-03-20',
    kilometers: '45000',
    url: 'https://example.com/renault-clio-used',
    configuration_url: 'https://example.com/renault-clio-config',
    engine_size: '999',
    fuel_type: 'benzina',
    transmission: 'manual',
    power_kw: '75',
    power_cv: '102',
    seats: '5',
    doors: '5',
    status: 'available',
    visibility: 'visible_orderable',
    images: '',
    exterior_color: 'Rosso',
    interior_color: 'Tela grigia',
    wheels: 'Cerchi in acciaio',
    pair_to_save_daily: '10.00',
    standard_equipment: `Radio DAB
Climatizzatore automatico
Sensori pioggia`,
  },
]

const SAMPLE_PRICING: PricingTable = {
  '3y': {
    monthlyAvg: '520.00',
    finalMin: '15000.00',
    finalMax: '20000.00',
    downMin: '3000.00',
    downMax: '6000.00',
    rates: [
      { label: 'rate_1', min: '550.00', max: '200.00' },
      { label: 'rate_2', min: '520.00', max: '190.00' },
      { label: 'rate_3', min: '490.00', max: '180.00' },
    ],
  },
  '4y': {
    monthlyAvg: '410.00',
    finalMin: '14000.00',
    finalMax: '19000.00',
    downMin: '2500.00',
    downMax: '5500.00',
    rates: [
      { label: 'rate_1', min: '440.00', max: '195.00' },
      { label: 'rate_2', min: '420.00', max: '185.00' },
      { label: 'rate_3', min: '380.00', max: '175.00' },
      { label: 'rate_4', min: '340.00', max: '165.00' },
    ],
  },
  '5y': {
    monthlyAvg: '360.00',
    finalMin: '13000.00',
    finalMax: '18500.00',
    downMin: '2000.00',
    downMax: '5000.00',
    rates: [
      { label: 'rate_1', min: '400.00', max: '160.00' },
      { label: 'rate_2', min: '360.00', max: '150.00' },
      { label: 'rate_3', min: '320.00', max: '145.00' },
      { label: 'rate_4', min: '300.00', max: '140.00' },
      { label: 'rate_5', min: '280.00', max: '135.00' },
    ],
  },
}

const SAMPLE_ACCESSORIES: Array<Omit<AccessoryItem, 'id'>> = [
  { name: 'Infotainment (media display)', price: '300.00' },
  { name: 'Gancio traino', price: '440.00' },
  { name: 'Telecamera di retromarcia', price: '165.00' },
]

const SAMPLE_TIRES: Array<Omit<TireOption, 'id'>> = [
  { label: TIRE_OPTION_LABELS[0], price: '22.23' },
  { label: TIRE_OPTION_LABELS[1], price: '31.95' },
]

const clonePricingTable = (source: PricingTable): PricingTable => ({
  '3y': {
    ...source['3y'],
    rates: source['3y'].rates.map((rate) => ({ ...rate })),
  },
  '4y': {
    ...source['4y'],
    rates: source['4y'].rates.map((rate) => ({ ...rate })),
  },
  '5y': {
    ...source['5y'],
    rates: source['5y'].rates.map((rate) => ({ ...rate })),
  },
})

const createSampleState = (): VehicleFormState => {
  const randomVehicle = SAMPLE_VEHICLES[Math.floor(Math.random() * SAMPLE_VEHICLES.length)]
  return {
    vehicle: { ...randomVehicle },
    pricing: clonePricingTable(SAMPLE_PRICING),
    accessories: SAMPLE_ACCESSORIES.map((item) => ({ ...item, id: generateId() })),
    tires: SAMPLE_TIRES.map((item) => ({ ...item, id: generateId() })),
  }
}

const VehicleForm = ({ onCreate }: VehicleFormProps) => {
  const [formState, setFormState] = useState<VehicleFormState>(loadFormState())
  const [accessoryDraft, setAccessoryDraft] = useState<DraftAccessory>({ name: '', price: '' })
  const [tireDraft, setTireDraft] = useState<DraftTire>({ label: '', price: '' })
  const [error, setError] = useState<string>('')

  // Save form state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formState))
  }, [formState])

  const vehicle = formState.vehicle
  const pricing = formState.pricing

  const requiredMissing = useMemo(
    () =>
      VEHICLE_FIELDS.filter((field) => field.required && !vehicle[field.name]?.trim()).map(
        (field) => field.label,
      ),
    [vehicle],
  )

  const updateVehicleField = (field: keyof VehicleInfo, value: string) => {
    setFormState((prev) => ({
      ...prev,
      vehicle: {
        ...prev.vehicle,
        [field]: value,
      },
    }))
  }

  const updatePricingField = (termKey: PricingTermKey, field: keyof PricingTerm, value: string) => {
    setFormState((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [termKey]: {
          ...prev.pricing[termKey],
          [field]: value,
        },
      },
    }))
  }

  const updateRateField = (termKey: PricingTermKey, rateIndex: number, bound: 'min' | 'max', value: string) => {
    setFormState((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [termKey]: {
          ...prev.pricing[termKey],
          rates: prev.pricing[termKey].rates.map((rate, index) =>
            index === rateIndex
              ? {
                  ...rate,
                  [bound]: value,
                }
              : rate,
          ),
        },
      },
    }))
  }

  const addAccessory = () => {
    if (!accessoryDraft.name.trim()) {
      return
    }

    setFormState((prev) => ({
      ...prev,
      accessories: [
        ...prev.accessories,
        {
          id: generateId(),
          name: accessoryDraft.name,
          price: accessoryDraft.price,
        },
      ],
    }))

    setAccessoryDraft({ name: '', price: '' })
  }

  const removeAccessory = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      accessories: prev.accessories.filter((item) => item.id !== id),
    }))
  }

  const addTire = () => {
    const label = tireDraft.label
    if (!label) {
      return
    }

    setFormState((prev) => ({
      ...prev,
      tires: [
        ...prev.tires,
        {
          id: generateId(),
          label,
          price: tireDraft.price,
        },
      ],
    }))

    setTireDraft({ label: '', price: '' })
  }

  const removeTire = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      tires: prev.tires.filter((item) => item.id !== id),
    }))
  }

  const resetForm = () => {
    setFormState(createInitialState())
    setAccessoryDraft({ name: '', price: '' })
    setTireDraft({ label: '', price: '' })
    setError('')
  }

  const autofillForm = () => {
    setFormState(createSampleState())
    setAccessoryDraft({ name: '', price: '' })
    setTireDraft({ label: '', price: '' })
    setError('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (requiredMissing.length > 0) {
      setError(`Compila i campi obbligatori: ${requiredMissing.join(', ')}`)
      return
    }

    const record: VehicleRecord = {
      id: generateId(),
      vehicle,
      pricing,
      accessories: formState.accessories,
      tires: formState.tires,
    }

    onCreate(record)
    // Clear localStorage on form submission
    localStorage.removeItem(FORM_STORAGE_KEY)
    resetForm()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <header className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Profilo veicolo</h2>
          <p className="text-sm text-slate-500">
            Dati base esportati nella tabella <code>vehicles</code>.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {VEHICLE_FIELDS.map((field) => {
            const value = (vehicle[field.name] as string) ?? ''
            return (
              <label key={field.name} className="text-sm font-medium text-slate-700">
                <span className="mb-1 inline-flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-rose-500">*</span>}
                </span>
                {field.options ? (
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
                    value={value}
                    onChange={(event) => updateVehicleField(field.name, event.target.value)}
                  >
                    <option value="">Seleziona {field.label.toLowerCase()}</option>
                    {field.options.map((option) => (
                      <option key={`${field.name}-${option}`} value={option}>
                        {formatOptionLabel(option)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type ?? 'text'}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
                    value={value}
                    placeholder={field.placeholder}
                    onChange={(event) => updateVehicleField(field.name, event.target.value)}
                  />
                )}
              </label>
            )
          })}
        </div>
        <label className="mt-6 block text-sm font-medium text-slate-700">
          <span className="mb-1 inline-flex items-center gap-1">Equipaggiamento standard</span>
          <textarea
            className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
            placeholder={'Una caratteristica per riga\n(verranno esportate come una stringa separata da |)'}
            value={vehicle.standard_equipment}
            onChange={(event) => updateVehicleField('standard_equipment', event.target.value)}
          />
        </label>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <header className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Tabelle prezzi</h2>
          <p className="text-sm text-slate-500">
            Compila ogni durata di finanziamento. Lascia vuote le celle non utilizzate.
          </p>
        </header>
        <div className="grid gap-6 lg:grid-cols-3">
          {(Object.keys(PRICING_TERM_METADATA) as PricingTermKey[]).map((termKey) => {
            const meta = PRICING_TERM_METADATA[termKey]
            const term = pricing[termKey]
            return (
              <article key={termKey} className="rounded-2xl border border-slate-100 p-4">
                <h3 className="text-base font-semibold text-slate-800">
                  {meta.label} ({termKey.toUpperCase()})
                </h3>
                <div className="mt-4 grid gap-3">
                  {PRICING_BASE_FIELDS.map((field) => (
                    <label key={field.key} className="text-sm font-medium text-slate-700">
                      <span className="mb-1 block text-slate-500">{field.label}</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
                        value={term[field.key]}
                        onChange={(event) =>
                          updatePricingField(
                            termKey,
                            field.key,
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-600">Fasce tariffarie</p>
                  {term.rates.map((rate, index) => (
                    <div key={`${termKey}-${rate.label}`} className="flex items-center gap-3">
                      <span className="w-16 text-sm font-medium text-slate-500 uppercase whitespace-nowrap">
                        {rate.label.replace('_', ' ')}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Min"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        value={rate.min}
                        onChange={(event) => updateRateField(termKey, index, 'min', event.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Max"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        value={rate.max}
                        onChange={(event) => updateRateField(termKey, index, 'max', event.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Accessori</h2>
            <p className="text-sm text-slate-500">
              Verranno esportati come coppie <code>etichetta:prezzo</code> separate da <code>|</code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Nome accessorio"
              className="w-52 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={accessoryDraft.name}
              onChange={(event) => setAccessoryDraft((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Prezzo"
              className="w-36 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={accessoryDraft.price}
              onChange={(event) => setAccessoryDraft((prev) => ({ ...prev, price: event.target.value }))}
            />
            <button
              type="button"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={addAccessory}
            >
              Aggiungi accessorio
            </button>
          </div>
        </header>
        {formState.accessories.length === 0 ? (
          <p className="text-sm text-slate-500">Nessun accessorio ancora.</p>
        ) : (
          <ul className="space-y-2">
            {formState.accessories.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-800">{item.name}</p>
                  {item.price && <p className="text-slate-500">{item.price}</p>}
                </div>
                <button type="button" className="text-rose-500" onClick={() => removeAccessory(item.id)}>
                  Rimuovi
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Opzioni pneumatici</h2>
            <p className="text-sm text-slate-500">Aggiungi opzioni come pneumatici all-season o pacchetti estate/inverno.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              className="w-52 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={tireDraft.label}
              onChange={(event) =>
                setTireDraft((prev) => ({
                  ...prev,
                  label: (event.target.value as TireOptionLabel | ''),
                }))
              }
            >
              <option value="">Seleziona opzione pneumatici</option>
              {TIRE_OPTION_LABELS.map((option) => (
                <option key={`tire-${option}`} value={option}>
                  {formatOptionLabel(option)}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Prezzo"
              className="w-36 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={tireDraft.price}
              onChange={(event) => setTireDraft((prev) => ({ ...prev, price: event.target.value }))}
            />
            <button
              type="button"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={addTire}
            >
              Aggiungi opzione
            </button>
          </div>
        </header>
        {formState.tires.length === 0 ? (
          <p className="text-sm text-slate-500">Ancora nessuna opzione pneumatici.</p>
        ) : (
          <ul className="space-y-2">
            {formState.tires.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-800">{item.label}</p>
                  {item.price && <p className="text-slate-500">{item.price}</p>}
                </div>
                <button type="button" className="text-rose-500" onClick={() => removeTire(item.id)}>
                  Rimuovi
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-2xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm"
        >
          Aggiungi riga veicolo
        </button>
        <button
          type="button"
          className="rounded-2xl border border-slate-200 px-6 py-3 text-base font-semibold text-slate-700"
          onClick={autofillForm}
        >
          Riempimento automatico dati test
        </button>
        <button
          type="button"
          className="rounded-2xl border border-slate-200 px-6 py-3 text-base font-semibold text-slate-700"
          onClick={resetForm}
        >
          Reimposta modulo
        </button>
      </div>
    </form>
  )
}

export default VehicleForm
