import express from "express";
import {
  dailyCheckin,
  assignIntervention,
  getStudentStatus,
  completeRemedial,
  getLatestTask,
  cheatingDetected
} from "../controllers/studentController.js";

const router = express.Router();

router.post("/daily-checkin", dailyCheckin);
router.post("/assign-intervention", assignIntervention);
router.get("/student-status/:id", getStudentStatus);
router.post("/student/:id/complete-remedial", completeRemedial);
router.get("/student-latest-task/:id", getLatestTask);
router.post("/cheating-detected", cheatingDetected);

export default router;
