import express from "express";
import {
  getClients,
  createClient,
  updateClient,
  getBillingRates,
  createBillingRate,
  updateBillingRate,
  deleteBillingRate,
  generateInvoice,
  getInvoices,
  getInvoiceDetails,
  updateInvoice,
  recordPayment,
} from "../controllers/billingController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.get("/clients", verifyUser, getClients);
router.post("/clients", verifyUser, createClient);
router.put("/clients/:id", verifyUser, updateClient);
router.get("/billing/rates", verifyUser, getBillingRates);
router.post("/billing/rates", verifyUser, createBillingRate);
router.put("/billing/rates/:id", verifyUser, updateBillingRate);
router.delete("/billing/rates/:id", verifyUser, deleteBillingRate);
router.post("/invoices/generate", verifyUser, generateInvoice);
router.get("/invoices", verifyUser, getInvoices);
router.get("/invoices/:id", verifyUser, getInvoiceDetails);
router.put("/invoices/:id", verifyUser, updateInvoice);
router.post("/invoices/:invoiceId/payments", verifyUser, recordPayment);

export default router;

