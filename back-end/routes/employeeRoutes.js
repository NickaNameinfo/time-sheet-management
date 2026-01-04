import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeCount,
} from "../controllers/employeeController.js";
import multer from "multer";
import path from "path";
import config from "../config/index.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

// Handle multiple file uploads (employeeImage and id_proof)
const uploadFields = upload.fields([
  { name: "employeeImage", maxCount: 1 },
  { name: "id_proof", maxCount: 1 },
]);

router.post("/create", uploadFields, createEmployee);
router.get("/getEmployee", getEmployees);
router.get("/get/:id", getEmployeeById);
router.put("/update/:id", uploadFields, updateEmployee);
router.delete("/delete/:id", deleteEmployee);
router.get("/employeeCount", getEmployeeCount);

export default router;

