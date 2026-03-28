import { getTenantQuery } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Get Clients
export const getClients = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { isActive } = req.query;
  let sql = "SELECT * FROM clients WHERE 1=1";
  const params = [];

  if (isActive !== undefined) {
    sql += " AND is_active = ?";
    params.push(isActive === "true" ? 1 : 0);
  }

  sql += " ORDER BY client_name";

  const results = await q(sql, params);
  return sendSuccess(res, results);
});

// Create Client
export const createClient = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const {
    clientName,
    contactPerson,
    email,
    phone,
    address,
    city,
    country,
    paymentTerms,
    currency,
    taxId,
  } = req.body;

  if (!clientName) {
    return sendError(res, "clientName is required", 400);
  }

  const insertSql = `
    INSERT INTO clients (
      client_name, contact_person, email, phone, address, city, country,
      payment_terms, currency, tax_id
    ) VALUES (?)
  `;
  await q(insertSql, [[
    clientName,
    contactPerson || null,
    email || null,
    phone || null,
    address || null,
    city || null,
    country || "UAE",
    paymentTerms || "net_30",
    currency || "AED",
    taxId || null,
  ]]);

  return sendSuccess(res, null, "Client created successfully");
});

// Update Client
export const updateClient = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const updateData = req.body;

  // Map camelCase to snake_case for database columns
  const fieldMapping = {
    clientName: "client_name",
    contactPerson: "contact_person",
    paymentTerms: "payment_terms",
    taxId: "tax_id",
    isActive: "is_active",
  };

  const fields = [];
  const values = [];

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) {
      // Use mapped field name if exists, otherwise use key as-is
      const dbField = fieldMapping[key] || key;
      fields.push(`${dbField} = ?`);
      values.push(updateData[key]);
    }
  });

  if (fields.length === 0) {
    return sendError(res, "No fields to update", 400);
  }

  values.push(id);
  const sql = `UPDATE clients SET ${fields.join(", ")} WHERE id = ?`;
  await q(sql, values);

  return sendSuccess(res, null, "Client updated successfully");
});

// Get Billing Rates
export const getBillingRates = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { employeeId, designation, projectId, isActive } = req.query;
  let sql = "SELECT br.*, e.employeeName, p.projectName FROM billing_rates br";
  sql += " LEFT JOIN employee e ON br.employee_id = e.id";
  sql += " LEFT JOIN project p ON br.project_id = p.id WHERE 1=1";
  const params = [];

  if (employeeId) {
    sql += " AND br.employee_id = ?";
    params.push(employeeId);
  }
  if (designation) {
    sql += " AND br.designation = ?";
    params.push(designation);
  }
  if (projectId) {
    sql += " AND br.project_id = ?";
    params.push(projectId);
  }
  if (isActive !== undefined) {
    sql += " AND br.is_active = ?";
    params.push(isActive === "true" ? 1 : 0);
  }

  sql += " ORDER BY br.effective_date DESC";

  const results = await q(sql, params);
  return sendSuccess(res, results);
});

// Create Billing Rate
export const createBillingRate = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const {
    employeeId,
    designation,
    disciplineCode,
    projectId,
    hourlyRate,
    otRateMultiplier,
    effectiveDate,
  } = req.body;

  if (!hourlyRate || !effectiveDate) {
    return sendError(res, "hourlyRate and effectiveDate are required", 400);
  }

  const insertSql = `
    INSERT INTO billing_rates (
      employee_id, designation, discipline_code, project_id,
      hourly_rate, ot_rate_multiplier, effective_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  await q(insertSql, [
    employeeId || null,
    designation || null,
    disciplineCode || null,
    projectId || null,
    hourlyRate,
    otRateMultiplier || 1.5,
    effectiveDate,
  ]);

  return sendSuccess(res, null, "Billing rate created successfully");
});

// Update Billing Rate
export const updateBillingRate = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const updateData = req.body;

  // Map camelCase to snake_case for database columns
  const fieldMapping = {
    employeeId: "employee_id",
    designation: "designation",
    disciplineCode: "discipline_code",
    projectId: "project_id",
    hourlyRate: "hourly_rate",
    otRateMultiplier: "ot_rate_multiplier",
    effectiveDate: "effective_date",
    isActive: "is_active",
  };

  const fields = [];
  const values = [];

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined && key !== "currency") {
      // Use mapped field name if exists, otherwise use key as-is
      const dbField = fieldMapping[key] || key;
      fields.push(`${dbField} = ?`);
      values.push(updateData[key]);
    }
  });

  if (fields.length === 0) {
    return sendError(res, "No fields to update", 400);
  }

  values.push(id);
  const sql = `UPDATE billing_rates SET ${fields.join(", ")} WHERE id = ?`;
  await q(sql, values);

  return sendSuccess(res, null, "Billing rate updated successfully");
});

// Delete Billing Rate
export const deleteBillingRate = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;

  // Check if billing rate exists
  const checkSql = "SELECT id FROM billing_rates WHERE id = ?";
  const existing = await q(checkSql, [id]);

  if (existing.length === 0) {
    return sendError(res, "Billing rate not found", 404);
  }

  // Delete the billing rate
  const deleteSql = "DELETE FROM billing_rates WHERE id = ?";
  await q(deleteSql, [id]);

  return sendSuccess(res, null, "Billing rate deleted successfully");
});

// Generate Invoice
export const generateInvoice = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { clientId, projectId, startDate, endDate, taxRate, currency } = req.body;

  if (!clientId || !startDate || !endDate) {
    return sendError(res, "clientId, startDate, and endDate are required", 400);
  }

  // Get approved work details
  // workdetails table uses userName to link to employee, not employeeNo
  // workdetails table uses referenceNo or projectName, not projectNo
  let workSql = `
    SELECT wd.*, e.employeeName, e.id as employeeId, br.hourly_rate
    FROM workdetails wd
    LEFT JOIN employee e ON wd.userName = e.userName
    LEFT JOIN billing_rates br ON (
      br.employee_id = e.id OR 
      br.designation = e.designation OR
      br.discipline_code = wd.desciplineCode
    ) AND br.is_active = TRUE
    WHERE wd.status = 'approved'
    AND (
      DATE(STR_TO_DATE(SUBSTRING(wd.sentDate, 1, 10), '%Y-%m-%d')) BETWEEN ? AND ?
      OR DATE(STR_TO_DATE(wd.sentDate, '%Y-%m-%d')) BETWEEN ? AND ?
    )
  `;
  const params = [startDate, endDate, startDate, endDate];

  if (projectId) {
    // Use referenceNo or projectName to match project
    // First get the project details
    const projectSql = "SELECT projectNo, referenceNo, projectName FROM project WHERE id = ?";
    const projects = await q(projectSql, [projectId]);
    if (projects.length > 0) {
      const project = projects[0];
      // Match by referenceNo or projectName
      workSql += " AND (wd.referenceNo = ? OR wd.projectName = ?)";
      params.push(project.referenceNo || project.projectName, project.projectName);
    }
  }

  workSql += " ORDER BY wd.sentDate, wd.employeeName";

  const workDetails = await q(workSql, params);

  // Group by employee and calculate amounts
  const invoiceItems = [];
  const employeeGroups = {};

  workDetails.forEach((work) => {
    // Use employeeId or userName as key since employeeNo doesn't exist
    const key = work.employeeId || work.userName || work.employeeName;
    if (!employeeGroups[key]) {
      employeeGroups[key] = {
        employeeName: work.employeeName,
        hours: 0,
        rate: parseFloat(work.hourly_rate || 0),
        items: [],
      };
    }
    const hours = parseFloat(work.totalHours || 0);
    employeeGroups[key].hours += hours;
    employeeGroups[key].items.push({
      date: work.sentDate,
      project: work.projectName,
      hours: hours,
      description: `${work.areaofWork} - ${work.variation || ""}`,
    });
  });

  // Create invoice items
  Object.values(employeeGroups).forEach((group) => {
    if (group.hours > 0 && group.rate > 0) {
      invoiceItems.push({
        description: `${group.employeeName} - ${group.items.length} entries`,
        hours: group.hours,
        rate: group.rate,
        amount: group.hours * group.rate,
      });
    }
  });

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (parseFloat(taxRate || 0) / 100);
  const totalAmount = subtotal + taxAmount;

  // Generate invoice number
  const invoiceNumber = `INV-${Date.now()}-${clientId}`;

  // Calculate due date (default 30 days)
  const invoiceDate = new Date();
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 30);

  // Get client currency if not provided
  let invoiceCurrency = currency;
  if (!invoiceCurrency) {
    const clientSql = "SELECT currency FROM clients WHERE id = ?";
    const clientResult = await q(clientSql, [clientId]);
    invoiceCurrency = clientResult[0]?.currency || "AED";
  }

  // Create invoice
  const invoiceSql = `
    INSERT INTO invoices (
      invoice_number, client_id, project_id, invoice_date, due_date,
      subtotal, tax_rate, tax_amount, total_amount, status, currency
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
  `;
  const invoiceResult = await q(invoiceSql, [
    invoiceNumber,
    clientId,
    projectId || null,
    invoiceDate.toISOString().split("T")[0],
    dueDate.toISOString().split("T")[0],
    subtotal,
    taxRate || 0,
    taxAmount,
    totalAmount,
    invoiceCurrency,
  ]);

  const invoiceId = invoiceResult.insertId;

  // Insert invoice items
  if (invoiceItems.length > 0) {
    const itemsSql = `
      INSERT INTO invoice_items (invoice_id, description, hours, rate, amount)
      VALUES ?
    `;
    const itemsValues = invoiceItems.map((item) => [
      invoiceId,
      item.description,
      item.hours,
      item.rate,
      item.amount,
    ]);
    await q(itemsSql, [itemsValues]);
  }

  // Get created invoice with items
  const invoiceSql2 = `
    SELECT i.*, c.client_name, c.contact_person, c.email, c.phone, c.address
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?
  `;
  const invoice = await q(invoiceSql2, [invoiceId]);

  const itemsSql2 = "SELECT * FROM invoice_items WHERE invoice_id = ?";
  const items = await q(itemsSql2, [invoiceId]);

  return sendSuccess(res, {
    ...invoice[0],
    items,
  });
});

// Get Invoices
export const getInvoices = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { clientId, projectId, status, startDate, endDate } = req.query;
  let sql = `
    SELECT i.*, c.client_name, p.projectName
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN project p ON i.project_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (clientId) {
    sql += " AND i.client_id = ?";
    params.push(clientId);
  }
  if (projectId) {
    sql += " AND i.project_id = ?";
    params.push(projectId);
  }
  if (status) {
    sql += " AND i.status = ?";
    params.push(status);
  }
  if (startDate) {
    sql += " AND i.invoice_date >= ?";
    params.push(startDate);
  }
  if (endDate) {
    sql += " AND i.invoice_date <= ?";
    params.push(endDate);
  }

  sql += " ORDER BY i.invoice_date DESC";

  const results = await q(sql, params);
  return sendSuccess(res, results);
});

// Get Invoice Details
export const getInvoiceDetails = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;

  const invoiceSql = `
    SELECT i.*, c.client_name, c.contact_person, c.email, c.phone, c.address, c.tax_id, p.projectName
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN project p ON i.project_id = p.id
    WHERE i.id = ?
  `;
  const invoices = await q(invoiceSql, [id]);

  if (invoices.length === 0) {
    return sendError(res, "Invoice not found", 404);
  }

  const itemsSql = "SELECT * FROM invoice_items WHERE invoice_id = ?";
  const items = await q(itemsSql, [id]);

  const paymentsSql = "SELECT * FROM payments WHERE invoice_id = ?";
  const payments = await q(paymentsSql, [id]);

  return sendSuccess(res, {
    ...invoices[0],
    items,
    payments,
    paidAmount: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
    balance: parseFloat(invoices[0].total_amount) - payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
  });
});

// Update Invoice
export const updateInvoice = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { id } = req.params;
  const { 
    clientId, 
    projectId, 
    invoiceDate, 
    dueDate, 
    subtotal, 
    taxRate, 
    taxAmount, 
    totalAmount, 
    currency,
    status,
    notes 
  } = req.body;

  // Check if invoice exists
  const checkSql = "SELECT id FROM invoices WHERE id = ?";
  const existing = await q(checkSql, [id]);
  
  if (existing.length === 0) {
    return sendError(res, "Invoice not found", 404);
  }

  // Build update query dynamically
  const updateFields = [];
  const updateParams = [];

  if (clientId !== undefined) {
    updateFields.push("client_id = ?");
    updateParams.push(clientId);
  }
  if (projectId !== undefined) {
    updateFields.push("project_id = ?");
    updateParams.push(projectId);
  }
  if (invoiceDate !== undefined) {
    updateFields.push("invoice_date = ?");
    updateParams.push(invoiceDate);
  }
  if (dueDate !== undefined) {
    updateFields.push("due_date = ?");
    updateParams.push(dueDate);
  }
  if (subtotal !== undefined) {
    updateFields.push("subtotal = ?");
    updateParams.push(subtotal);
  }
  if (taxRate !== undefined) {
    updateFields.push("tax_rate = ?");
    updateParams.push(taxRate);
  }
  if (taxAmount !== undefined) {
    updateFields.push("tax_amount = ?");
    updateParams.push(taxAmount);
  }
  if (totalAmount !== undefined) {
    updateFields.push("total_amount = ?");
    updateParams.push(totalAmount);
  }
  if (currency !== undefined) {
    updateFields.push("currency = ?");
    updateParams.push(currency);
  }
  if (status !== undefined) {
    updateFields.push("status = ?");
    updateParams.push(status);
  }
  if (notes !== undefined) {
    updateFields.push("notes = ?");
    updateParams.push(notes);
  }

  if (updateFields.length === 0) {
    return sendError(res, "No fields provided for update", 400);
  }

  updateParams.push(id);
  const updateSql = `UPDATE invoices SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  await q(updateSql, updateParams);

  // Get updated invoice
  const invoiceSql = `
    SELECT i.*, c.client_name, c.contact_person, c.email, c.phone, c.address, p.projectName
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN project p ON i.project_id = p.id
    WHERE i.id = ?
  `;
  const invoice = await q(invoiceSql, [id]);

  const itemsSql = "SELECT * FROM invoice_items WHERE invoice_id = ?";
  const items = await q(itemsSql, [id]);

  return sendSuccess(res, {
    ...invoice[0],
    items,
  }, "Invoice updated successfully");
});

// Record Payment
export const recordPayment = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const { invoiceId } = req.params;
  const { paymentDate, amount, paymentMethod, referenceNumber, notes } = req.body;

  if (!paymentDate || !amount) {
    return sendError(res, "paymentDate and amount are required", 400);
  }

  const insertSql = `
    INSERT INTO payments (invoice_id, payment_date, amount, payment_method, reference_number, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  await q(insertSql, [invoiceId, paymentDate, amount, paymentMethod, referenceNumber, notes]);

  // Update invoice status if fully paid
  const invoiceSql = "SELECT total_amount FROM invoices WHERE id = ?";
  const invoice = await q(invoiceSql, [invoiceId]);
  const totalAmount = parseFloat(invoice[0].total_amount);

  const paymentsSql = "SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?";
  const payments = await q(paymentsSql, [invoiceId]);
  const totalPaid = parseFloat(payments[0].total_paid || 0);

  let status = "sent";
  if (totalPaid >= totalAmount) {
    status = "paid";
  } else if (totalPaid > 0) {
    status = "partial";
  }

  await q("UPDATE invoices SET status = ? WHERE id = ?", [status, invoiceId]);

  return sendSuccess(res, null, "Payment recorded successfully");
});

