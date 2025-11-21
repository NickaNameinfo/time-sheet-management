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

router.post("/create", upload.single("employeeImage"), createEmployee);
router.get("/getEmployee", getEmployees);
router.get("/get/:id", getEmployeeById);
router.put("/update/:id", upload.single("employeeImage"), updateEmployee);
router.delete("/delete/:id", deleteEmployee);
router.get("/employeeCount", getEmployeeCount);

export default router;

