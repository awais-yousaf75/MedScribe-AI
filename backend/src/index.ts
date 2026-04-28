import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route";
import hospitalRoutes from "./routes/hospitals.route";
import superAdminRoutes from "./routes/superadmin.route";
import profileRoutes from "./routes/profile.route";
import hospitalAdminRoutes from "./routes/hospitalAdmin.route";
import doctorRoutes from "./routes/doctor.route";
import assistantRoutes from "./routes/assistant.route";
import doctorConsultationsRouter from "./routes/doctorConsultations.route";
import transcribe from "./routes/transcribe.route";

dotenv.config();

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.static("public"));

app.use("/api/auth", authRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/hospital-admin", hospitalAdminRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/doctor", doctorConsultationsRouter);
app.use("/api", transcribe);

// app.get("/", (_req, res) => {
//   res.send("Backend is running");
// });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
