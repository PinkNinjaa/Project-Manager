const API = window.TIGERTURF_API_BASE || 'http://127.0.0.1:4321/api';

const app = {
  currentTable: null,
  currentIsView: false,
  currentPage: 1,
  pageSize: 50,
  sortCol: null,
  sortDir: 'asc',
  fieldMeta: {},

  async init() {
    try {
      const r = await fetch(`${API}/field-meta`);
      this.fieldMeta = await r.json();
    } catch (e) {
      this.fieldMeta = {};
    }
    await this.loadTables();
    await this.loadViews();
  },

  async loadTables() {
    const res = await fetch(`${API}/tables`);
    const tables = await res.json();
    const grid = document.getElementById('tables-grid');
    grid.innerHTML = '';
    for (const t of tables) {
      try {
        const r = await fetch(`${API}/table/${t}/rows?limit=1`);
        const data = await r.json();
        const card = document.createElement('div');
        card.className = 'table-card';
        card.onclick = () => this.openTable(t);
        card.innerHTML = `<h3>${t}</h3><div class="count"><b>${data.total}</b> rows</div>`;
        grid.appendChild(card);
      } catch (e) {
        grid.innerHTML += `<div class="table-card"><h3>${t}</h3><div class="count">Error loading</div></div>`;
      }
    }
  },

  async openView(viewName, title) {
    this.currentTable = viewName;
    this.currentIsView = true;
    this.currentPage = 1;
    document.getElementById('tables-view').style.display = 'none';
    document.getElementById('table-view').style.display = 'block';
    document.getElementById('table-title').textContent = title;
    document.getElementById('add-row-btn').hidden = true;
    document.getElementById('import-entity-label').hidden = true;
    document.getElementById('export-entity-btn').hidden = false;
    await this.loadTableData();
  },

  async loadViews() {
    const views = [
      { name: 'v_quote_totals', title: 'Quote Totals', desc: 'Quote subtotals, tax, and totals' },
      { name: 'v_invoice_balances', title: 'Invoice Balances', desc: 'Invoice paid amounts and balances' },
      { name: 'v_opportunity_pipeline', title: 'Opportunity Pipeline', desc: 'Weighted pipeline value by opportunity' },
      { name: 'v_project_financials', title: 'Project Financials', desc: 'Revenue, cost, margin and invoicing by project' },
      { name: 'v_stage_progress', title: 'Stage Progress', desc: 'Job stage progress and days in stage' },
      { name: 'v_task_board', title: 'Task Board', desc: 'Tasks with sub-task counts' },
      { name: 'v_activity_timeline', title: 'Activity Timeline', desc: 'Activities with linked records' },
      { name: 'v_document_links', title: 'Document Links', desc: 'Documents with linked entities' },
      { name: 'v_quote_lines', title: 'Quote Lines', desc: 'Quote line items with calculated totals' },
      { name: 'v_invoice_lines', title: 'Invoice Lines', desc: 'Invoice line items with calculated totals' },
      { name: 'v_cost_estimates', title: 'Cost Estimates', desc: 'Cost estimates with calculated totals' },
    ];
    const list = document.getElementById('views-list');
    list.innerHTML = '';
    for (const v of views) {
      const item = document.createElement('div');
      item.className = 'view-item';
      item.onclick = () => this.openView(v.name, v.title);
      item.innerHTML = `<h4>${v.title}</h4><p>${v.desc}</p>`;
      list.appendChild(item);
    }
  },

  showTables() {
    document.getElementById('tables-view').style.display = 'block';
    document.getElementById('table-view').style.display = 'none';
    document.getElementById('edit-modal').classList.remove('active');
    this.currentTable = null;
    this.currentIsView = false;
    this.currentPage = 1;
    this.sortCol = null;
    document.getElementById('add-row-btn').hidden = false;
    document.getElementById('import-entity-label').hidden = false;
    document.getElementById('export-entity-btn').hidden = true;
  },

  async openTable(tableName) {
    this.currentTable = tableName;
    this.currentIsView = false;
    this.currentPage = 1;
    document.getElementById('tables-view').style.display = 'none';
    document.getElementById('table-view').style.display = 'block';
    document.getElementById('table-title').textContent = tableName;
    document.getElementById('add-row-btn').hidden = false;
    document.getElementById('import-entity-label').hidden = false;
    document.getElementById('export-entity-btn').hidden = false;
    await this.loadTableData();
  },

  async loadTableData() {
    const t = this.currentTable;
    const offset = (this.currentPage - 1) * this.pageSize;
    const params = new URLSearchParams({
      limit: String(this.pageSize),
      offset: String(offset),
    });
    if (this.sortCol) {
      params.set('sort', this.sortCol);
      params.set('direction', this.sortDir);
    }
    let url = `${API}/table/${encodeURIComponent(t)}/rows?${params}`;
    try {
      const r = await fetch(url);
      const data = await r.json();
      const colsRes = await fetch(`${API}/table/${t}/columns`);
      const columns = await colsRes.json();

      document.getElementById('table-info').textContent = `${data.total} total rows · showing ${offset + 1}-${Math.min(offset + data.rows.length, data.total)}`;
      this.renderTable(columns, data.rows);

      const pag = document.getElementById('table-pagination');
      const totalPages = Math.ceil(data.total / this.pageSize);
      pag.innerHTML = `
        <button class="btn" onclick="app.goPage(${this.currentPage - 1})" ${this.currentPage <= 1 ? 'disabled' : ''}>Prev</button>
        <span>Page ${this.currentPage} of ${totalPages}</span>
        <button class="btn" onclick="app.goPage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''}>Next</button>
      `;
    } catch (e) {
      alert('Error loading table: ' + e.message);
    }
  },

  renderTable(columns, rows) {
    const thead = document.getElementById('table-thead');
    const tbody = document.getElementById('table-tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    const tr = document.createElement('tr');
    for (const c of columns) {
      const th = document.createElement('th');
      th.textContent = c.name;
      th.style.cursor = 'pointer';
      th.onclick = () => this.sortColumn(c.name);
      tr.appendChild(th);
    }
    // Actions column
    if (!this.currentIsView) {
      const thAct = document.createElement('th');
      thAct.textContent = 'Actions';
      thAct.style.width = '120px';
      tr.appendChild(thAct);
    }
    thead.appendChild(tr);

    for (const row of rows) {
      const tr = document.createElement('tr');
      tr.onclick = (e) => {
        if (!e.target.classList.contains('cell-link')) {
          this.viewRow(row.id);
        }
      };
      for (const c of columns) {
        const td = document.createElement('td');
        const val = row[c.name];
        if (val === null || val === undefined || val === '') {
          td.className = 'cell-null';
          td.textContent = '(null)';
        } else if (c.type.toLowerCase().includes('lookup') || c.name.endsWith('_id')) {
          // Check if it's a lookup field - show as link
          const link = document.createElement('button');
          link.type = 'button';
          link.className = 'cell-link';
          link.textContent = String(val);
          link.addEventListener('click', (event) => {
            event.stopPropagation();
            this.lookupRow(c.name, val);
          });
          td.appendChild(link);
        } else {
          td.textContent = String(val).length > 80 ? String(val).slice(0, 80) + '...' : String(val);
          td.title = String(val);
        }
        tr.appendChild(td);
      }
      // Actions
      if (!this.currentIsView) {
        const tdAct = document.createElement('td');
        tdAct.style.whiteSpace = 'nowrap';
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'cell-link';
        edit.textContent = 'Edit';
        edit.addEventListener('click', (event) => {
          event.stopPropagation();
          this.editRow(row.id);
        });
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'cell-link';
        remove.style.color = '#ff3b30';
        remove.textContent = 'Delete';
        remove.addEventListener('click', (event) => {
          event.stopPropagation();
          this.deleteRow(row.id);
        });
        tdAct.append(edit, document.createTextNode(' '), remove);
        tr.appendChild(tdAct);
      }
      tbody.appendChild(tr);
    }
  },

  sortColumn(col) {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'asc';
    }
    this.currentPage = 1;
    this.loadTableData();
  },

  goPage(page) {
    this.currentPage = page;
    this.loadTableData();
  },

  async viewRow(rowId) {
    const row = await (await fetch(`${API}/table/${this.currentTable}/row/${rowId}`)).json();
    this.openEditModal('View Row', row, true);
  },

  async editRow(rowId) {
    const row = await (await fetch(`${API}/table/${this.currentTable}/row/${rowId}`)).json();
    this.openEditModal('Edit Row', row, false);
  },

  async addRow() {
    const colsRes = await fetch(`${API}/table/${this.currentTable}/columns`);
    const columns = await colsRes.json();
    const emptyRow = {};
    for (const c of columns) {
      emptyRow[c.name] = c.pk ? '' : (c.notnull ? '' : null);
    }
    this.openEditModal('Add Row', emptyRow, false, true);
  },

  openEditModal(title, row, viewOnly, isNew = false) {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-form');
    const fields = document.getElementById('form-fields');
    document.getElementById('modal-title').textContent = title;
    fields.innerHTML = '';

    this.currentEditRow = { table: this.currentTable, id: row.id, row, viewOnly, isNew };

    for (const [colName, val] of Object.entries(row)) {
      if (colName === 'id' && !isNew) continue; // Don't edit id for existing rows
      if (colName === 'created_at' || colName === 'updated_at' || colName === 'deleted_at' || colName === 'row_version') continue; // Skip system fields

      const group = document.createElement('div');
      group.className = 'form-group';

      const meta = (this.fieldMeta[this.currentTable] || {})[colName] || null;
      const label = document.createElement('label');
      label.textContent = colName + (meta && meta.required ? ' *' : '');
      group.appendChild(label);

      let input;
      const ftype = meta ? meta.type : '';

      if (ftype === 'Choice' && meta.look) {
        // Choice field: dropdown with values from the workbook's choice list
        input = document.createElement('select');
        input.innerHTML = '<option value="">Loading...</option>';
        this.loadChoiceOptions(input, meta.look, val);
      } else if (ftype === 'Lookup' && meta.look && meta.look !== colName.replace(/_id$/, '')) {
        // Lookup field: dropdown of rows from the target table
        input = document.createElement('select');
        input.innerHTML = '<option value="">(null)</option><option value="">Loading options...</option>';
        this.loadFkOptions(input, meta.look, val);
      } else if (ftype === 'Lookup' || (colName.endsWith('_id') && colName !== 'id')) {
        // Lookup field without metadata: guess the table from the column name
        input = document.createElement('select');
        input.innerHTML = '<option value="">(null)</option><option value="">Loading options...</option>';
        this.loadFkOptions(input, colName.replace(/_id$/, ''), val);
      } else if (ftype === 'Bool' || val === 0 || val === 1) {
        input = document.createElement('select');
        input.innerHTML = '<option value="0">No / False</option><option value="1">Yes / True</option>';
        input.value = val == 1 || val === true ? '1' : '0';
      } else if (['Int', 'Decimal', 'Money'].includes(ftype) || (val !== null && val !== '' && !isNaN(val) && typeof val === 'number')) {
        input = document.createElement('input');
        input.type = 'number';
        input.step = ['Decimal', 'Money'].includes(ftype) ? '0.01' : (ftype === 'Int' ? '1' : 'any');
        input.value = val == null ? '' : val;
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.value = val == null ? '' : val;
      }

      input.name = colName;
      if (viewOnly) input.disabled = true;
      group.appendChild(input);

      const hint = document.createElement('div');
      hint.className = 'form-hint';
      if (viewOnly) {
        hint.textContent = 'View only';
      } else if (colName === 'id' && isNew) {
        hint.textContent = 'Leave blank to auto-generate';
      } else if (meta && meta.note) {
        hint.textContent = meta.note;
      } else if (meta && meta.required) {
        hint.textContent = 'Required';
      } else {
        hint.textContent = '';
      }
      group.appendChild(hint);

      fields.appendChild(group);
    }

    modal.classList.add('active');
  },

  async loadChoiceOptions(select, fieldName, currentVal) {
    // Map field names to choice list keys
    const listMap = {
      'role': 'user_role',
      'account_type': 'account_type',
      'source': 'lead_source',
      'status': null, // generic - handled below
      'unit': 'unit',
      'sale_type': 'sale_type',
      'opportunity_status': 'opportunity_status',
      'quote_status': 'quote_status',
      'sale_status': 'sale_status',
      'project_status': 'project_status',
      'estimate_status': 'estimate_status',
      'variation_status': 'variation_status',
      'schedule_status': 'schedule_status',
      'visit_type': 'visit_type',
      'task_status': 'task_status',
      'task_priority': 'task_priority',
      'doc_type': 'doc_type',
      'invoice_type': 'invoice_type',
      'invoice_status': 'invoice_status',
      'payment_method': 'payment_method',
      'activity_type': 'activity_type',
      'direction': 'direction',
      'schedule_type': 'schedule_type',
      'audit_action': 'audit_action',
      'stage_status': 'stage_status',
      'requirement_type': 'requirement_type',
      'attendance': 'attendance',
      'stage_applies_to': 'stage_applies_to',
      'contact_method': 'contact_method',
      'lead_status': 'lead_status',
    };

    // Try exact match first, then prefix match
    let listKey = listMap[fieldName];
    if (!listKey) {
      for (const [key, val] of Object.entries(listMap)) {
        if (fieldName.includes(key)) { listKey = val; break; }
      }
    }

    if (listKey) {
      try {
        const r = await fetch(`${API}/choices/${listKey}`);
        const options = await r.json();
        select.innerHTML = '<option value="">(null)</option>';
        for (const o of options) {
          const opt = document.createElement('option');
          opt.value = o.value;
          opt.textContent = o.value;
          if (o.value == currentVal) opt.selected = true;
          select.appendChild(opt);
        }
      } catch (e) {
        select.innerHTML = '<option value="">(error loading)</option>';
      }
    } else {
      select.innerHTML = '<option value="">(null)</option><option value="' + (currentVal || '') + '">' + (currentVal || '(null)') + '</option>';
    }
  },

  async loadFkOptions(select, fkTable, currentVal) {
    try {
      const r = await fetch(`${API}/fk-options/${fkTable}`);
      const options = await r.json();
      select.innerHTML = '<option value="">(null)</option>';
      for (const o of options) {
        const opt = document.createElement('option');
        opt.value = o.id;
        opt.textContent = o.name || o.full_name || o.title || o.label || o.email || o.id;
        if (o.id == currentVal) opt.selected = true;
        select.appendChild(opt);
      }
    } catch (e) {
      select.innerHTML = '<option value="">(error loading)</option>';
    }
  },

  closeModal() {
    document.getElementById('edit-modal').classList.remove('active');
    this.currentEditRow = null;
  },

  async saveRow() {
    const form = document.getElementById('edit-form');
    const inputs = form.querySelectorAll('input, select');
    const values = {};
    for (const inp of inputs) {
      if (!inp.name) continue;
      const val = inp.type === 'number' ? (inp.value === '' ? null : parseFloat(inp.value)) : inp.value;
      values[inp.name] = val === '' ? null : val;
    }
    if (!this.currentEditRow.isNew && this.currentEditRow.row.row_version !== undefined) {
      values.row_version = this.currentEditRow.row.row_version;
    }

    try {
      let res;
      if (this.currentEditRow.isNew) {
        res = await fetch(`${API}/table/${this.currentEditRow.table}/row`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
      } else {
        res = await fetch(`${API}/table/${this.currentEditRow.table}/row/${this.currentEditRow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        alert('Error saving: ' + (data.error || ('HTTP ' + res.status)));
        return;
      }
      this.closeModal();
      this.loadTableData();
    } catch (e) {
      alert('Error saving: ' + e.message);
    }
  },

  async deleteRow(rowId) {
    if (!confirm('Delete this row? It will be marked as deleted (soft delete — the record stays in the database with a deleted_at timestamp).')) return;
    try {
      const res = await fetch(`${API}/table/${this.currentTable}/row/${rowId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        alert('Error deleting: ' + (data.error || ('HTTP ' + res.status)));
        return;
      }
      this.loadTableData();
    } catch (e) {
      alert('Error deleting: ' + e.message);
    }
  },

  async lookupRow(fieldName, val) {
    // Determine the table from field name
    const fkTable = fieldName.replace(/_id$/, '');
    try {
      const r = await fetch(`${API}/table/${fkTable}/row/${val}`);
      const row = await r.json();
      this.openEditModal(`View ${fkTable}`, row, true);
    } catch (e) {
      alert('Error loading linked record: ' + e.message);
    }
  },

  async runQuery() {
    const sql = document.getElementById('query-sql').value;
    const resultDiv = document.getElementById('query-result');
    resultDiv.textContent = 'Running...';
    try {
      const r = await fetch(`${API}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });
      const rows = await r.json();
      if (rows.error) {
        resultDiv.textContent = 'Error: ' + rows.error;
        resultDiv.style.color = '#ff3b30';
      } else {
        resultDiv.textContent = `${rows.length} row(s) returned`;
        resultDiv.style.color = '#1d1d1f';
        if (rows.length > 0) {
          const cols = Object.keys(rows[0]);
          const table = document.createElement('table');
          table.style.cssText = 'width:100%;font-size:12px;margin-top:8px;';
          const thead = table.createTHead();
          const headerRow = thead.insertRow();
          for (const column of cols) {
            const th = document.createElement('th');
            th.textContent = column;
            headerRow.appendChild(th);
          }
          const tbody = table.createTBody();
          for (const row of rows) {
            const tr = tbody.insertRow();
            for (const column of cols) {
              const td = tr.insertCell();
              td.textContent = row[column] == null ? '(null)' : String(row[column]);
            }
          }
          resultDiv.replaceChildren(document.createTextNode(`${rows.length} row(s) returned`), table);
        }
      }
    } catch (e) {
      resultDiv.textContent = 'Error: ' + e.message;
      resultDiv.style.color = '#ff3b30';
    }
  },

  refresh() {
    if (this.currentTable) {
      this.loadTableData();
    } else {
      this.loadTables();
    }
  },

  async exportCsv() {
    if (!this.currentTable) return;
    try {
      const response = await fetch(`${API}/export/${encodeURIComponent(this.currentTable)}`);
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || `HTTP ${response.status}`);
      const csv = [result.columns, ...result.rows.map((row) => result.columns.map((column) => row[column]))]
        .map((row) => row.map((value) => {
          const text = value == null ? '' : String(value);
          return `"${text.replace(/"/g, '""')}"`;
        }).join(','))
        .join('\r\n');
      const link = document.createElement('a');
      const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
      link.href = url;
      link.download = `${this.currentTable}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Error exporting CSV: ${error.message}`);
    }
  },

  async importCsv(file) {
    if (!file || !this.currentTable || this.currentIsView) return;
    try {
      const text = await file.text();
      const records = parseCsv(text);
      if (records.length < 2) throw new Error('CSV must include a header and at least one data row.');
      const [columns, ...lines] = records;
      const rows = lines.filter((line) => line.some((cell) => cell !== '')).map((line) => {
        if (line.length !== columns.length) throw new Error('Every row must have the same number of columns as the header.');
        return Object.fromEntries(columns.map((column, index) => [column, line[index] === '' ? null : line[index]]));
      });
      if (!rows.length) throw new Error('CSV does not contain any data rows.');
      if (!confirm(`Import ${rows.length} row(s) into ${this.currentTable}? This cannot be undone.`)) return;
      const response = await fetch(`${API}/import/${encodeURIComponent(this.currentTable)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows })
      });
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || `HTTP ${response.status}`);
      alert(`Imported ${result.imported} row(s).`);
      await this.loadTableData();
    } catch (error) {
      alert(`Error importing CSV: ${error.message}`);
    }
  },
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"' && value === '') {
      quoted = true;
    } else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  if (value !== '' || row.length) {
    row.push(value);
    rows.push(row);
  }
  if (rows[0]?.[0]?.startsWith('\ufeff')) rows[0][0] = rows[0][0].slice(1);
  return rows;
}

document.getElementById('import-csv-file').addEventListener('change', (event) => {
  app.importCsv(event.target.files[0]).finally(() => {
    event.target.value = '';
  });
});

app.init();
