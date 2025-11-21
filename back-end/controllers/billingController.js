import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Get Clients
export const getClients = asyncHandler(async (req, res) => {
  const { isActive } = req.query;
  let sql = "SELECT * FROM clients WHERE 1=1";
  const params = [];

  if (isActive !== undefined) {
    sql += " AND is_active = ?";
    params.push(isActive === "true" ? 1 : 0);
  }

  sql += " ORDER BY client_name";

  const results = await query(sql, params);
  return sendSuccess(res, results);
});

// Create Client
export const createClient = asyncHandler(async (req, res) => {
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
  await query(insertSql, [[
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
  const { id } = req.params;
  const updateData = req.body;

  const fields = [];
  const values = [];

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    }
  });

  if (fields.length === 0) {
    return sendError(res, "No fields to update", 400);
  }

  values.push(id);
  const sql = `UPDATE clients SET ${fields.join(", ")} WHERE id = ?`;
  await query(sql, values);

  return sendSuccess(res, null, "Client updated successfully");
});

// Get Billing Rates
export const getBillingRates = asyncHandler(async (req, res) => {
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

  const results = await query(sql, params);
  return sendSuccess(res, results);
});

// Create Billing Rate
export const createBillingRate = asyncHandler(async (req, res) => {
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
  await query(insertSql, [
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

// Generate Invoice
export const generateInvoice = asyncHandler(async (req, res) => {
  const { clientId, projectId, startDate, endDate, taxRate } = req.body;

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
    const projects = await query(projectSql, [projectId]);
    if (projects.length > 0) {
      const project = projects[0];
      // Match by referenceNo or projectName
      workSql += " AND (wd.referenceNo = ? OR wd.projectName = ?)";
      params.push(project.referenceNo || project.projectName, project.projectName);
    }
  }

  workSql += " ORDER BY wd.sentDate, wd.employeeName";

  const workDetails = await query(workSql, params);

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

  // Create invoice
  const invoiceSql = `
    INSERT INTO invoices (
      invoice_number, client_id, project_id, invoice_date, due_date,
      subtotal, tax_rate, tax_amount, total_amount, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
  `;
  const invoiceResult = await query(invoiceSql, [
    invoiceNumber,
    clientId,
    projectId || null,
    invoiceDate.toISOString().split("T")[0],
    dueDate.toISOString().split("T")[0],
    subtotal,
    taxRate || 0,
    taxAmount,
    totalAmount,
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
    await query(itemsSql, [itemsValues]);
  }

  // Get created invoice with items
  const invoiceSql2 = `
    SELECT i.*, c.client_name, c.contact_person, c.email, c.phone, c.address
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?
  `;
  const invoice = await query(invoiceSql2, [invoiceId]);

  const itemsSql2 = "SELECT * FROM invoice_items WHERE invoice_id = ?";
  const items = await query(itemsSql2, [invoiceId]);

  return sendSuccess(res, {
    ...invoice[0],
    items,
  });
});

// Get Invoices
export const getInvoices = asyncHandler(async (req, res) => {
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

  const results = await query(sql, params);
  return sendSuccess(res, results);
});

// Get Invoice Details
export const getInvoiceDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invoiceSql = `
    SELECT i.*, c.client_name, c.contact_person, c.email, c.phone, c.address, c.tax_id, p.projectName
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN project p ON i.project_id = p.id
    WHERE i.id = ?
  `;
  const invoices = await query(invoiceSql, [id]);

  if (invoices.length === 0) {
    return sendError(res, "Invoice not found", 404);
  }

  const itemsSql = "SELECT * FROM invoice_items WHERE invoice_id = ?";
  const items = await query(itemsSql, [id]);

  const paymentsSql = "SELECT * FROM payments WHERE invoice_id = ?";
  const payments = await query(paymentsSql, [id]);

  return sendSuccess(res, {
    ...invoices[0],
    items,
    payments,
    paidAmount: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
    balance: parseFloat(invoices[0].total_amount) - payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
  });
});

// Record Payment
export const recordPayment = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  const { paymentDate, amount, paymentMethod, referenceNumber, notes } = req.body;

  if (!paymentDate || !amount) {
    return sendError(res, "paymentDate and amount are required", 400);
  }

  const insertSql = `
    INSERT INTO payments (invoice_id, payment_date, amount, payment_method, reference_number, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  await query(insertSql, [invoiceId, paymentDate, amount, paymentMethod, referenceNumber, notes]);

  // Update invoice status if fully paid
  const invoiceSql = "SELECT total_amount FROM invoices WHERE id = ?";
  const invoice = await query(invoiceSql, [invoiceId]);
  const totalAmount = parseFloat(invoice[0].total_amount);

  const paymentsSql = "SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?";
  const payments = await query(paymentsSql, [invoiceId]);
  const totalPaid = parseFloat(payments[0].total_paid || 0);

  let status = "sent";
  if (totalPaid >= totalAmount) {
    status = "paid";
  } else if (totalPaid > 0) {
    status = "partial";
  }

  await query("UPDATE invoices SET status = ? WHERE id = ?", [status, invoiceId]);

  return sendSuccess(res, null, "Payment recorded successfully");
});

