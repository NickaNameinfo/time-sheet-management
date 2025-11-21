import express from "express";
import {
  getSettings,
  createUpdate,
  deleteUpdate,
  getDisciplines,
  createDiscipline,
  deleteDiscipline,
  getDesignations,
  createDesignation,
  deleteDesignation,
  getAreaOfWork,
  createAreaOfWork,
  deleteAreaOfWork,
  getVariations,
  createVariation,
  deleteVariation,
  getAdminCount,
} from "../controllers/settingsController.js";

const router = express.Router();

// Settings/Updates
router.get("/settings", getSettings);
router.post("/create/updates", createUpdate);
router.delete("/updates/delete/:id", deleteUpdate);

// Discipline
router.get("/discipline", getDisciplines);
router.post("/create/discipline", createDiscipline);
router.delete("/discipline/delete/:id", deleteDiscipline);

// Designation
router.get("/designation", getDesignations);
router.post("/create/designation", createDesignation);
router.delete("/designation/delete/:id", deleteDesignation);

// Area of Work
router.get("/areaofwork", getAreaOfWork);
router.post("/create/areaofwork", createAreaOfWork);
router.delete("/areaofwork/delete/:id", deleteAreaOfWork);

// Variation
router.get("/variation", getVariations);
router.post("/create/variation", createVariation);
router.delete("/variation/delete/:id", deleteVariation);

// Admin Count
router.get("/adminCount", getAdminCount);

export default router;

