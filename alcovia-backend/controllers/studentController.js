import db from "../db.js";
import axios from "axios";

export const dailyCheckin = async (req, res) => {
  const { student_id, quiz_score, focus_minutes } = req.body;

  await db.query(
    "INSERT INTO daily_logs (student_id, quiz_score, focus_minutes) VALUES (?, ?, ?)",
    [student_id, quiz_score, focus_minutes]
  );

  if (quiz_score > 7 && focus_minutes > 60) {
    await db.query("UPDATE students SET status = 'On Track' WHERE id = ?", [
      student_id,
    ]);
    return res.json({ status: "On Track" });
  }

  await db.query(
    "UPDATE students SET status = 'Needs Intervention' WHERE id = ?",
    [student_id]
  );

  try {
    await axios.post("http://localhost:5678/webhook/daily-fail", {
      student_id,
      quiz_score,
      focus_minutes,
    });
  } catch (err) {
    console.log("Webhook Error:", err.message);
  }

  return res.json({ status: "Pending Mentor Review" });
};

export const assignIntervention = async (req, res) => {
  const { student_id, task } = req.body;

  await db.query(
    "INSERT INTO interventions (student_id, task) VALUES (?, ?)",
    [student_id, task]
  );

  await db.query("UPDATE students SET status = 'Remedial' WHERE id = ?", [
    student_id,
  ]);

  res.json({ status: "Remedial Task Assigned" });
};

export const getStudentStatus = async (req, res) => {
  const student_id = req.params.id;

  try {
  
    const [rows] = await db.query(
      "SELECT id, status FROM students WHERE id = ?",
      [student_id]
    );

    if (rows.length > 0) {
      return res.json({
        student_id: rows[0].id,
        status: rows[0].status
      });
    }

    const [insertResult] = await db.query(
      "INSERT INTO students (status) VALUES ('On Track')"
    );

    const newId = insertResult.insertId;

    return res.json({
      student_id: newId,
      status: "On Track"
    });

  } catch (err) {
    console.log("getStudentStatus Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


//mark complete remedial
export const completeRemedial = async (req, res) => {
  const student_id = req.params.id;

  try {
    await db.query(
      "UPDATE students SET status = 'On Track' WHERE id = ?",
      [student_id]
    );

    return res.json({ status: "Completed" });
  } catch (err) {
    console.log("Complete Remedial Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


//get latest task for remedial student
export const getLatestTask = async (req, res) => {
  const student_id = req.params.id;

  try {
    const [rows] = await db.query(
      `SELECT task 
       FROM interventions 
       WHERE student_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [student_id]
    );

    if (rows.length === 0) {
      return res.json({ task: null });
    }

    return res.json({ task: rows[0].task });
  } catch (err) {
    console.log("Latest Task Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const cheatingDetected = async (req, res) => {
  const { student_id } = req.body;

  try {
    await db.query(
      "UPDATE students SET status = 'Needs Intervention' WHERE id = ?",
      [student_id]
    );

    try {
      await axios.post("http://localhost:5678/webhook/daily-fail", {
        student_id,
        quiz_score: 0,
        focus_minutes: 0,
      });
    } catch (err) {
      console.log("Webhook Error:", err.message);
    }

    return res.json({ status: "Cheating Logged" });

  } catch (err) {
    console.log("Cheating Detection Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

