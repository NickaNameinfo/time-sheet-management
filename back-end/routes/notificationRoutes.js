import express from "express";
import { sendNotification, getNotifications } from "../controllers/notificationController.js";

const router = express.Router();

router.post("/sendNotification", sendNotification);
router.get("/notifications", getNotifications);

export default router;

