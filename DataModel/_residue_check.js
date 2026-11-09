const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync("data_model.sqlite", { readOnly: true });
const residue = db.prepare("SELECT COUNT(*) n FROM task WHERE id LIKE 'dbg_%' OR title LIKE 'DBG-%'").get().n;
const taskRows = db.prepare("SELECT COUNT(*) n FROM task").get().n;
const tables = db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get().n;
const invoices = db.prepare("SELECT COUNT(*) n FROM v_invoice_balances").get().n;
console.log(`dbg residue: ${residue} | task rows: ${taskRows} | tables: ${tables} | v_invoice_balances: ${invoices}`);
db.close();
