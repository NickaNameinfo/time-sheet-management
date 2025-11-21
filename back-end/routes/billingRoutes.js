import express from "express";
import {
  getClients,
  createClient,
  updateClient,
  getBillingRates,
  createBillingRate,
  generateInvoice,
  getInvoices,
  getInvoiceDetails,
  recordPayment,
} from "../controllers/billingController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.get("/clients", verifyUser, getClients);
router.post("/clients", verifyUser, createClient);
router.put("/clients/:id", verifyUser, updateClient);
router.get("/billing/rates", verifyUser, getBillingRates);
router.post("/billing/rates", verifyUser, createBillingRate);
router.post("/invoices/generate", verifyUser, generateInvoice);
router.get("/invoices", verifyUser, getInvoices);
router.get("/invoices/:id", verifyUser, getInvoiceDetails);
router.post("/invoices/:invoiceId/payments", verifyUser, recordPayment);

export default router;

