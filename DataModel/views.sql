-- views.sql - Rollup and calculated field views
-- These implement the "Calc" and "Rollup" fields from the Rollups sheet.
-- They are read-only; the underlying data lives in the base tables.
-- Edit view definitions here if your rollup logic changes.

-- View: quote totals (subtotal, tax, total)
CREATE VIEW IF NOT EXISTS v_quote_totals AS
SELECT
  q.id,
  q.quote_number,
  q.opportunity_id,
  q.status,
  q.tax_rate,
  COALESCE(SUM(q_line.quantity * q_line.unit_price * (1 - COALESCE(q_line.discount_pct, 0))), 0) AS subtotal,
  q.discount_amount,
  ROUND(COALESCE(SUM(q_line.quantity * q_line.unit_price * (1 - COALESCE(q_line.discount_pct, 0))), 0) * q.tax_rate, 2) AS tax_amount,
  ROUND(COALESCE(SUM(q_line.quantity * q_line.unit_price * (1 - COALESCE(q_line.discount_pct, 0))), 0) - q.discount_amount + ROUND(COALESCE(SUM(q_line.quantity * q_line.unit_price * (1 - COALESCE(q_line.discount_pct, 0))), 0) * q.tax_rate, 2), 2) AS total
FROM quote q
LEFT JOIN quote_line q_line ON q_line.quote_id = q.id AND q_line.deleted_at IS NULL
WHERE q.deleted_at IS NULL
GROUP BY q.id;

-- View: invoice balances (paid, balance, effective status)
-- Invoice total is a rollup of invoice_line rows; payments are summed separately
-- so the two joins cannot multiply each other's rows.
CREATE VIEW IF NOT EXISTS v_invoice_balances AS
SELECT
  i.id,
  i.invoice_number,
  i.sale_id,
  i.project_id,
  i.account_id,
  i.invoice_type,
  i.status,
  COALESCE(tot.total, 0) AS total,
  COALESCE(paid.paid_amount, 0) AS paid_amount,
  ROUND(COALESCE(tot.total, 0) - COALESCE(paid.paid_amount, 0), 2) AS balance
FROM invoice i
LEFT JOIN (
  SELECT invoice_id, SUM(quantity * unit_price) AS total
  FROM invoice_line
  WHERE deleted_at IS NULL
  GROUP BY invoice_id
) tot ON tot.invoice_id = i.id
LEFT JOIN (
  SELECT invoice_id, SUM(amount) AS paid_amount
  FROM payment
  WHERE deleted_at IS NULL
  GROUP BY invoice_id
) paid ON paid.invoice_id = i.id
WHERE i.deleted_at IS NULL;

-- View: opportunity pipeline (weighted value)
CREATE VIEW IF NOT EXISTS v_opportunity_pipeline AS
SELECT
  o.id,
  o.opportunity_number,
  o.name,
  o.account_id,
  o.sale_type,
  o.status,
  o.estimated_value,
  o.probability_pct,
  ROUND(o.estimated_value * o.probability_pct, 2) AS weighted_value,
  o.expected_close_date,
  o.owner_user_id
FROM opportunity o
WHERE o.deleted_at IS NULL;

-- View: project financials (revenue, margin, invoicing)
CREATE VIEW IF NOT EXISTS v_project_financials AS
SELECT
  p.id,
  p.project_number,
  p.name,
  p.account_id,
  p.sale_id,
  p.status,
  p.current_stage_id,
  p.project_manager_user_id,
  -- Revenue: frozen sale total
  COALESCE(s.total_value, 0) AS revenue,
  -- Cost estimates: approved only
  COALESCE((
    SELECT SUM(ce.estimated_cost)
    FROM cost_estimate ce
    WHERE ce.project_id = p.id AND ce.deleted_at IS NULL AND ce.status = 'Approved'
  ), 0) AS cost_estimates_total,
  -- Approved variations
  COALESCE((
    SELECT SUM(sv.price_impact)
    FROM scope_variation sv
    WHERE sv.project_id = p.id AND sv.deleted_at IS NULL AND sv.status = 'Approved'
  ), 0) AS approved_variations_price,
  COALESCE((
    SELECT SUM(sv.cost_impact)
    FROM scope_variation sv
    WHERE sv.project_id = p.id AND sv.deleted_at IS NULL AND sv.status = 'Approved'
  ), 0) AS approved_variations_cost,
  -- Adjusted revenue
  ROUND(COALESCE(s.total_value, 0) + COALESCE((
    SELECT SUM(sv.price_impact)
    FROM scope_variation sv
    WHERE sv.project_id = p.id AND sv.deleted_at IS NULL AND sv.status = 'Approved'
  ), 0), 2) AS adjusted_revenue,
  -- Gross margin
  ROUND(
    COALESCE(s.total_value, 0) + COALESCE((
      SELECT SUM(sv.price_impact)
      FROM scope_variation sv
      WHERE sv.project_id = p.id AND sv.deleted_at IS NULL AND sv.status = 'Approved'
    ), 0)
    - COALESCE((
      SELECT SUM(ce.estimated_cost)
      FROM cost_estimate ce
      WHERE ce.project_id = p.id AND ce.deleted_at IS NULL AND ce.status = 'Approved'
    ), 0)
    - COALESCE((
      SELECT SUM(sv.cost_impact)
      FROM scope_variation sv
      WHERE sv.project_id = p.id AND sv.deleted_at IS NULL AND sv.status = 'Approved'
    ), 0)
  , 2) AS gross_margin_amount,
  -- Gross margin %
  CASE
    WHEN COALESCE(s.total_value, 0) + COALESCE((
      SELECT SUM(sv.price_impact)
      FROM scope_variation sv
      WHERE sv.project_id = p.id AND sv.deleted_at IS NULL AND sv.status = 'Approved'
    ), 0) = 0 THEN 0
    ELSE ROUND(
      (
        COALESCE(s.total_value, 0) + COALESCE((
          SELECT SUM(sv.price_impact)
          FROM scope_variation sv
          WHERE sv.project_id = p.id AND sv.deleted_at IS NULL AND sv.status = 'Approved'
        ), 0)
        - COALESCE((
          SELECT SUM(ce.estimated_cost)
          FROM cost_estimate ce
          WHERE ce.project_id = p.id AND ce.deleted_at IS NULL AND ce.status = 'Approved'
        ), 0)
        - COALESCE((
          SELECT SUM(sv.cost_impact)
          FROM scope_variation sv
          WHERE sv.project_id = p.id AND sv.deleted_at IS NULL AND sv.status = 'Approved'
        ), 0)
      )
      / (COALESCE(s.total_value, 0) + COALESCE((
        SELECT SUM(sv.price_impact)
        FROM scope_variation sv
        WHERE sv.project_id = p.id AND sv.deleted_at IS NULL AND sv.status = 'Approved'
      ), 0))
    * 100, 2)
  END AS gross_margin_pct,
  -- Invoicing
  COALESCE((
    SELECT SUM(i.total)
    FROM invoice i
    WHERE i.project_id = p.id AND i.deleted_at IS NULL AND i.status NOT IN ('Draft', 'Void')
  ), 0) AS total_invoiced,
  COALESCE((
    SELECT SUM(pay.amount)
    FROM payment pay
    JOIN invoice i2 ON i2.id = pay.invoice_id
    WHERE i2.project_id = p.id AND i2.deleted_at IS NULL AND pay.deleted_at IS NULL
  ), 0) AS paid_amount,
  ROUND(
    COALESCE((
      SELECT SUM(i.total)
      FROM invoice i
      WHERE i.project_id = p.id AND i.deleted_at IS NULL AND i.status NOT IN ('Draft', 'Void')
    ), 0)
    - COALESCE((
      SELECT SUM(pay.amount)
      FROM payment pay
      JOIN invoice i2 ON i2.id = pay.invoice_id
      WHERE i2.project_id = p.id AND i2.deleted_at IS NULL AND pay.deleted_at IS NULL
    ), 0)
  , 2) AS outstanding,
  ROUND(
    COALESCE(s.total_value, 0) + COALESCE((
      SELECT SUM(sv.price_impact)
      FROM scope_variation sv
      WHERE sv.project_id = p.id AND sv.deleted_at IS NULL AND sv.status = 'Approved'
    ), 0)
    - COALESCE((
      SELECT SUM(i.total)
      FROM invoice i
      WHERE i.project_id = p.id AND i.deleted_at IS NULL AND i.status NOT IN ('Draft', 'Void')
    ), 0)
  , 2) AS uninvoiced
FROM project p
LEFT JOIN sale s ON s.id = p.sale_id AND s.deleted_at IS NULL
WHERE p.deleted_at IS NULL;

-- View: stage progress per job
CREATE VIEW IF NOT EXISTS v_stage_progress AS
SELECT
  si.id,
  si.opportunity_id,
  si.project_id,
  si.stage_id,
  sd.code AS stage_code,
  sd.name AS stage_name,
  sd.sequence,
  sd.owner_department_id,
  si.status,
  si.entered_at,
  si.completed_at,
  si.completed_by_user_id,
  si.hold_reason,
  si.override_reason,
  CASE WHEN si.entered_at IS NOT NULL
    THEN ROUND((julianday('now') - julianday(si.entered_at)), 1)
  END AS days_in_stage
FROM stage_instance si
JOIN stage_definition sd ON sd.id = si.stage_id AND sd.deleted_at IS NULL
WHERE si.deleted_at IS NULL;

-- View: task board (Kanban-friendly)
CREATE VIEW IF NOT EXISTS v_task_board AS
SELECT
  t.id,
  t.title,
  t.description,
  t.project_id,
  t.opportunity_id,
  t.parent_task_id,
  t.stage_id,
  t.assigned_user_id,
  t.department_id,
  t.status,
  t.priority,
  t.due_date,
  t.completed_at,
  t.estimate_hours,
  t.sort_order,
  (SELECT COUNT(*) FROM task subt WHERE subt.parent_task_id = t.id AND subt.deleted_at IS NULL) AS sub_task_count
FROM task t
WHERE t.deleted_at IS NULL;

-- View: activity timeline with resolved polymorphic links
CREATE VIEW IF NOT EXISTS v_activity_timeline AS
SELECT
  a.id,
  a.activity_type,
  a.subject,
  a.direction,
  a.occurred_at,
  a.contact_id,
  a.meeting_id,
  a.site_visit_id,
  a.task_id,
  a.is_decision,
  a.logged_by_user_id,
  al.entity_type,
  al.entity_id
FROM activity a
LEFT JOIN activity_link al ON al.activity_id = a.id AND al.deleted_at IS NULL
WHERE a.deleted_at IS NULL;

-- View: document links with resolved polymorphic targets
CREATE VIEW IF NOT EXISTS v_document_links AS
SELECT
  d.id,
  d.name,
  d.doc_type,
  d.storage_ref,
  d.satisfies_stage_id,
  d.uploaded_by_user_id,
  dl.entity_type,
  dl.entity_id
FROM document d
LEFT JOIN document_link dl ON dl.document_id = d.id AND dl.deleted_at IS NULL
WHERE d.deleted_at IS NULL;

-- View: quote lines with line totals
CREATE VIEW IF NOT EXISTS v_quote_lines AS
SELECT
  ql.id,
  ql.quote_id,
  ql.product_id,
  ql.description,
  ql.area_label,
  ql.quantity,
  ql.unit,
  ql.unit_price,
  ql.discount_pct,
  ROUND(ql.quantity * ql.unit_price * (1 - COALESCE(ql.discount_pct, 0)), 2) AS line_total,
  ql.sort_order
FROM quote_line ql
WHERE ql.deleted_at IS NULL;

-- View: invoice lines with line totals
CREATE VIEW IF NOT EXISTS v_invoice_lines AS
SELECT
  il.id,
  il.invoice_id,
  il.product_id,
  il.description,
  il.quantity,
  il.unit_price,
  ROUND(il.quantity * il.unit_price, 2) AS line_total,
  il.sort_order
FROM invoice_line il
WHERE il.deleted_at IS NULL;

-- View: cost estimates with estimated cost
CREATE VIEW IF NOT EXISTS v_cost_estimates AS
SELECT
  ce.id,
  ce.project_id,
  ce.category,
  ce.description,
  ce.quantity,
  ce.unit,
  ce.unit_cost,
  ROUND(ce.quantity * ce.unit_cost, 2) AS estimated_cost,
  ce.supplier,
  ce.status,
  ce.version,
  ce.approved_by_user_id,
  ce.approved_at
FROM cost_estimate ce
WHERE ce.deleted_at IS NULL;
