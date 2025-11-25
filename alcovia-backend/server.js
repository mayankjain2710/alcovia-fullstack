import express from "express";
import cors from "cors";
import studentRoutes from "./routes/studentRoutes.js";

const app = express();

app.use(cors({
  origin: '*'
}));
app.use(express.json());

app.use("/api", studentRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
