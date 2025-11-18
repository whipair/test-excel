import { useEffect, useState } from 'react'
import { utils, writeFileXLSX } from 'xlsx'
import VehicleForm from './components/VehicleForm'
import VehicleTable from './components/VehicleTable'
import type { VehicleRecord } from './types'
import {
  CSV_COLUMNS,
  PRICING_TERM_METADATA,
  buildAccessorySheetRows,
  buildPricingSheetRows,
  buildTireSheetRows,
  buildVehicleSheetRows,
  createEmptyVehicleInfo,
  formatVehicleRow,
} from './utils'

const STORAGE_KEY = 'vehicle-importer-records'

const App = () => {
  const [records, setRecords] = useState<VehicleRecord[]>(() => {
    // Initialize state from localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored) as VehicleRecord[]
      } catch (error) {
        console.error('Failed to parse stored records:', error)
      }
    }
    return []
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  // Save to localStorage whenever records change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }, [records])

  const handleCreate = (record: VehicleRecord) => {
    setRecords((prev) => [...prev, record])
  }

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((record) => record.id !== id))
  }

  const clearRows = () => {
    setRecords([])
    setExportError('')
  }

  const createSheet = (data: Record<string, string>[], header: string[]) => {
    if (data.length === 0) {
      return utils.aoa_to_sheet([header])
    }

    return utils.json_to_sheet(data, {
      header,
    })
  }

  const handleExport = () => {
    if (records.length === 0) {
      setExportError('Aggiungi almeno un veicolo prima di esportare.')
      return
    }

    setExportError('')
    setIsExporting(true)

    try {
      const workbook = utils.book_new()
      const flatSheet = utils.json_to_sheet(records.map(formatVehicleRow), {
        header: [...CSV_COLUMNS],
      })
      utils.book_append_sheet(workbook, flatSheet, 'importable_vehicle')

      const vehicleHeader = ['vehicle_id', ...Object.keys(createEmptyVehicleInfo())]
      utils.book_append_sheet(
        workbook,
        createSheet(buildVehicleSheetRows(records), vehicleHeader),
        'vehicles',
      )

      const maxRates = Math.max(
        ...Object.values(PRICING_TERM_METADATA).map((meta) => meta.rateCount),
      )
      const pricingHeader = [
        'vehicle_id',
        'term',
        'monthly_avg',
        'final_min',
        'final_max',
        'down_min',
        'down_max',
        ...Array.from({ length: maxRates }, (_, index) => `rate_${index + 1}_min`),
        ...Array.from({ length: maxRates }, (_, index) => `rate_${index + 1}_max`),
      ]

      utils.book_append_sheet(
        workbook,
        createSheet(buildPricingSheetRows(records), pricingHeader),
        'pricing',
      )

      utils.book_append_sheet(
        workbook,
        createSheet(buildAccessorySheetRows(records), ['vehicle_id', 'name', 'price']),
        'accessories',
      )

      utils.book_append_sheet(
        workbook,
        createSheet(buildTireSheetRows(records), ['vehicle_id', 'label', 'price']),
        'tires',
      )

      const dateTag = new Date().toISOString().split('T')[0]
      writeFileXLSX(workbook, `whipair-import-${dateTag}.xlsx`)

      // Clear localStorage after successful export
      localStorage.removeItem(STORAGE_KEY)
      setRecords([])
    } catch (error) {
      console.error('Esportazione Excel fallita', error)
      setExportError('Esportazione Excel fallita. Controlla la console per i dettagli.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <header className="bg-slate-900 py-10 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Strumenti Whipair</p>
            <h1 className="text-3xl font-semibold">Generatore Excel di importazione veicoli</h1>
            <p className="mt-2 text-sm text-slate-300">
              Inserisci veicoli, prezzi, accessori e pneumatici, poi esporta un foglio di calcolo.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-200">
            <span className="rounded-full bg-slate-800/60 px-4 py-2">
              {records.length} veicol{records.length === 1 ? 'o' : 'i'} in coda
            </span>
            {records.length > 0 && (
              <button
                type="button"
                onClick={clearRows}
                className="rounded-full border border-white/30 px-4 py-2 font-semibold text-white hover:border-white"
              >
                Cancella lista
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 pt-10">
        <VehicleForm onCreate={handleCreate} />
        {exportError && (
          <p className="text-sm font-semibold text-rose-600">{exportError}</p>
        )}
        <VehicleTable records={records} onDelete={handleDelete} onExport={handleExport} exporting={isExporting} />
      </main>
    </div>
  )
}

export default App
