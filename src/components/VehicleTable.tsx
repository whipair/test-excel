import type { VehicleRecord } from '../types'
import { CSV_COLUMNS, formatVehicleRow } from '../utils'

type VehicleTableProps = {
  records: VehicleRecord[]
  onDelete: (id: string) => void
  onExport?: () => void
  exporting?: boolean
}

const VehicleTable = ({ records, onDelete, onExport, exporting = false }: VehicleTableProps) => {
  const rows = records.map(formatVehicleRow)

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Nessun veicolo inserito. Usa il modulo per aggiungere la prima riga.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-600">Anteprima foglio di calcolo</p>
          <p className="text-xs text-slate-400">{rows.length} veicol{rows.length > 1 ? 'i' : 'o'}</p>
        </div>
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {exporting ? 'Esportazione…' : 'Esporta Excel'}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full text-left text-sm text-slate-700">
          <thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-wide">
            <tr>
              <th className="border border-slate-200 px-3 py-2 font-semibold w-16">Azioni</th>
              {CSV_COLUMNS.map((column) => (
                <th key={column} className="border border-slate-200 px-3 py-2 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record, rowIndex) => {
              const row = formatVehicleRow(record)
              return (
                <tr key={record.id} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border border-slate-200 px-3 py-2 align-top text-center">
                    <button
                      onClick={() => onDelete(record.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Elimina riga"
                    >
                      🗑️
                    </button>
                  </td>
                  {CSV_COLUMNS.map((column) => (
                    <td key={`${record.id}-${column}`} className="border border-slate-200 px-3 py-2 align-top">
                      {row[column]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default VehicleTable
