import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import authRoutes from './routes/auth.route';
import hospitalRoutes from "./routes/hospitals.route";
import superAdminRoutes from "./routes/superadmin.route";
import profileRoutes from "./routes/profile.route";
import hospitalAdminRoutes from "./routes/hospitalAdmin.route";
import doctorRoutes from "./routes/doctor.route";
import assistantRoutes from "./routes/assistant.route";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/hospital-admin", hospitalAdminRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/assistant", assistantRoutes);

app.get('/', (_req, res) => {
  res.send('Backend is running');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});