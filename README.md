# Whipair Vehicle Import Workbook

React + Vite + Tailwind CSS app for capturing vehicle inventory that matches the
`importable_vehicle.csv` schema. Each record is stored across four logical tables
(vehicles, pricing, accessories, tyres), visualised in a spreadsheet-like grid, and can be exported
to an Excel workbook that mirrors the CSV plus the relational tables.

## Features

- Guided form split per table (vehicle specs, pricing, accessories, tyre options)
- Spreadsheet preview that preserves the exact CSV column order
- Export to Excel with five sheets:
  - `importable_vehicle`: flat table identical to `importable_vehicle.csv`
  - `vehicles`, `pricing`, `accessories`, `tires`: relational views keyed by `vehicle_id`
- Pure TypeScript data model so every field is typed and validated before export

## Requirements

- Node.js 18+
- npm 9+

## Getting started

Install dependencies and launch the dev server:

```cmd
cd vehicle-importer
npm install
npm run dev
```

Build the static bundle (also runs the TypeScript checker):

```cmd
cd vehicle-importer
npm run build
```

## Using the app

1. Fill the **Vehicle profile** section (brand/model/trim are required). Standard equipment can be
   typed one per line; it is exported as a `|` separated list automatically.
2. Enter the 3y/4y/5y pricing bands. Leave unused cells blank—the export keeps empty strings.
3. Add accessories or tyre packs with their prices; they are serialised as `label:price` pairs.
4. Review rows inside the spreadsheet preview. Every row matches the CSV ordering so you can spot
   gaps instantly.
5. Click **Export Excel workbook** once satisfied. The generated file is named
   `whipair-import-YYYY-MM-DD.xlsx` and contains all four tables plus the flat CSV sheet.

## Schema reference

The Excel export follows the same header order as `importable_vehicle.csv` located at the root of
this repository. Update `src/utils.ts` if new columns are added—`CSV_COLUMNS` is the single source
of truth for the spreadsheet and export routines.

## Notes

- Tailwind utility classes are configured in `tailwind.config.js` and compiled by Vite.
- The project keeps data client-side only; refresh clears the queue. Hook it up to an API if server
  persistence is needed.
