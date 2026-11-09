# TigerTurf Data Model

A working database built from your `TigerTurf_Data_Model.xlsx` workbook. No downloads required — everything runs on your computer with Node.js (already installed).

The browser server uses Node's built-in `node:sqlite` module and requires Node
22.5 or later (tested with Node 24).

## What's in this folder

| File | Purpose |
|------|---------|
| `TigerTurf_Data_Model.xlsx` | Your workbook — the **design master**. Edit tables, fields, relationships here. |
| `build_db.js` | Reads the workbook and rebuilds the database. Run after changing Excel. |
| `schema.sql` | Generated SQL (tables, keys, indexes). Do not edit by hand. |
| `views.sql` | Rollup/calc views (margins, totals, balances). Hand-maintained. |
| `seed.sql` | NZ demo data (Auckland customers, products, jobs, invoices). |
| `data_model.sqlite` | **The database file** — open and play with it. |
| `backups/` | Automatic backups created before every rebuild. |
| `server.js` | Local web server for the browser app. |
| `public/index.html` | Browser app interface. |
| `public/app.js` | Browser app logic. |
| `db.js` | Command-line tool (optional). |
| `csv.js` | Export/import tables as CSV. |
| `csv/` | Exported CSV files (created by `csv.js`). |
| `Run and Debug.bat` | Runs the automated test suite, then offers to start the viewer. |
| `debug.js` | The test suite (27 checks: files, database, server, API, add/edit/delete, CLI tools). |
| `field_meta.json` | Generated field metadata (which fields are Choice/Lookup) used by the browser app. |

## How to use it

### 1. Browse and edit data (no coding)

Double-click **`Open Database.bat`**.

A small black window will appear (keep it open — that's the database server), and your browser will open at `http://localhost:4321`.

In the browser you can:
- See all 32 tables and their row counts
- Click any table to browse its rows in a grid
- Click a row to view or edit it
- Click "Add Row" to create new records
- Lookup fields show as dropdowns of linked records (e.g. pick an account from a list)
- Choice fields show as dropdowns (e.g. status, type, priority)
- Run ready-made reports (Project Financials, Invoice Balances, Task Board, etc.)
- Run your own SQL queries (read-only)
- Add, edit, and delete rows — changes save immediately
- Import CSV data into a table and export tables or views as CSV

### 1b. Run and Debug (check everything works)

Double-click **`Run and Debug.bat`**.

It runs 27 automated checks — files, database contents, web server, REST API,
money views, add/edit/delete cycle, and the command-line tools — and prints
PASS/FAIL for each. If all pass, it asks whether to start the viewer.

If a check fails, the report shows exactly what broke. Fix the problem (or
rebuild from Excel) and run it again.

Advanced: `node debug.js --rebuild` also stops the server and rebuilds the
database from Excel as part of the test (close the viewer first).

### 2. Change the design (edit Excel)

Edit `TigerTurf_Data_Model.xlsx`:
- Add or remove tables, fields, relationships
- Change field types, required flags, lookup targets
- Update choice list values

Then double-click **`Rebuild Database.bat`**.

This:
1. Reads the workbook
2. Validates it (checks all lookups and choice lists exist)
3. Backs up the current database to `backups/`
4. Recreates `data_model.sqlite` from scratch
5. Re-applies views and seed data

**Note:** A rebuild replaces all data. Data you typed in the browser won't carry over — use the CSV export/import to preserve it (see below).

### 3. Replace demo data with your real data

Use `csv.js` to export tables to CSV, edit them in Excel, and import back:

```
node csv.js export-all
```

This creates `csv/<table>.csv` files. Open them in Excel, replace the demo data with your real data, then import:

```
node csv.js import account csv/account.csv
```

Or use the browser app to edit rows one at a time.

## Database design

The workbook defines 32 tables with:
- **UUID primary keys** on every table
- **Soft delete** (`deleted_at` column — null means active)
- **Optimistic concurrency** (`row_version`)
- **Audit trail** (`audit_log` table)
- **Foreign keys** with cascade/restrict/set-null rules from the Relationships sheet
- **Polymorphic links** (`activity_link`, `document_link`) enforced by the app
- **Choice lists** stored in `choice_value` table (configurable in app Settings)

Calc and Rollup fields from the workbook are implemented as SQL views (prefixed `v_`), not stored columns.

## Command-line tools (optional)

```
node db.js tables           List all tables with row counts
node db.js columns account  Show columns for the account table
node db.js rows account 5   Show 5 rows from account
node db.js sql "SELECT * FROM project LIMIT 3"
node db.js reset            Delete the database (rebuild with build_db.js)
```

## Files not to edit by hand

- `schema.sql` — generated from the workbook; regenerated on every rebuild
- `data_model.sqlite` — the database file; modified by the browser app and rebuilds

## Backups

Every time you run `Rebuild Database.bat`, the previous `data_model.sqlite` is copied to `backups/` with a timestamp. If something goes wrong, you can restore from there.

## Support

The workbook's README sheet has the full design documentation. This database is a working implementation of that design.