import { set } from "mongoose";
import React, { useEffect, useState } from "react";

const BASE_URL = "http://localhost:8080";

export default function Form() {
  const [studentId, setStudentId] = useState(
    localStorage.getItem("studentId") || null
  );

  const [state, setState] = useState("loading");
  const [remedialTask, setRemedialTask] = useState("");

  const [focusTime, setFocusTime] = useState("");
  const [quizScore, setQuizScore] = useState("");


  // Fetch student state from backend
  async function fetchStudentState() {
    try {
      const res = await fetch(
        `${BASE_URL}/api/student-status/${studentId === null ? 0 : studentId}`
      );
      const data = await res.json();

      console.log("Fetched Status:", data);

      if (studentId === null && data.student_id) {
        setStudentId(data.student_id);
        localStorage.setItem("studentId", data.student_id);
        return;
      }

      setState(data.status);

      if (data.status === "Remedial") {
        const taskRes = await fetch(
          `${BASE_URL}/api/student-latest-task/${data.student_id}`
        );
        const taskData = await taskRes.json();
        setRemedialTask(taskData.task);
      }
    } catch (err) {
      console.log("Error fetching state", err);
    }
  }

  useEffect(() => {
    function handleVisibilityChange() {
      if (
        state === "locked" ||
        state === "Needs Intervention" ||
        state === "Remedial"
      ) {
        return;
      }

      if (document.hidden) {
        reportCheating();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state]);

  // Load state on page load + poll every 4 sec
  useEffect(() => {
    // First fetch
    fetchStudentState();

    if (studentId !== null) {
      const interval = setInterval(fetchStudentState, 4000);
      return () => clearInterval(interval);
    }
  }, [studentId]);


  // Submit daily check-in
  async function handleSubmit() {
    if (!focusTime || !quizScore) {
      alert("Please enter focus time and quiz score.");
      return;
    }

    const payload = {
      student_id: studentId,
      focus_minutes: Number(focusTime),
      quiz_score: Number(quizScore),
    };

    const res = await fetch(`${BASE_URL}/api/daily-checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("Submission Response:", data);

    if (data.status === "Pending Mentor Review") {
      setState("locked"); 
      return;
    }

    if (data.status === "On Track") {
      alert("Your progress is good!");

      setFocusTime("");
      setQuizScore("");

      setState("normal");
    }
  }

  // Mark remedial complete → back to normal
  async function handleComplete() {
    fetch(`${BASE_URL}/api/student/${studentId}/complete-remedial`, {
      method: "POST",
    });

    setState("normal");
    setRemedialTask("");
    setFocusTime("");
    setQuizScore("");
  }

  async function reportCheating() {
    try {
      await fetch(`${BASE_URL}/api/cheating-detected`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId }),
      });

      setState("locked");
      alert("Cheating detected! The mentor will review your activity.");
    } catch (err) {
      console.log("Cheating report error:", err);
    }
  }


  // UI
  if (state === "loading") {
    return <p>Loading...</p>;
  }

  if (state === "locked" || state === "Needs Intervention") {
    return (
      <div style={styles.box}>
        <h2 style={{ color: "red" }}>Analysis in progress.</h2>
        <p>Waiting for Mentor...</p>
      </div>
    );
  }

  if (state === "Remedial") {
    return (
      <div style={styles.box}>
        <h2>Remedial Task</h2>
        <p>
          <strong>{remedialTask}</strong>
        </p>

        <button style={styles.btn} onClick={handleComplete}>
          Mark Complete
        </button>
      </div>
    );
  }

  // NORMAL STATE UI
  return (
    <div style={styles.box}>
      <h2>Daily Check-In</h2>

      <div style={styles.row}>
        <label>Enter Focus Time (minutes):</label>
        <input
          type="number"
          value={focusTime}
          onChange={(e) => setFocusTime(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.row}>
        <label>Quiz Score (0-10):</label>
        <input
          type="number"
          value={quizScore}
          onChange={(e) => setQuizScore(e.target.value)}
          style={styles.input}
        />
      </div>

      <button style={styles.btn} onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
}

const styles = {
  box: {
    width: "400px",
    margin: "30px auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontFamily: "Arial",
    textAlign: "center",
  },
  row: {
    marginBottom: "12px",
    textAlign: "left",
  },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #aaa",
    marginTop: "5px",
  },
  btn: {
    padding: "10px 16px",
    background: "#0d6efd",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "10px",
  },
};
