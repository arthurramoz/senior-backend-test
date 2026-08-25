import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./api/routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount routes
app.use("/api", apiRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "foxtly-hitl-approval-gate",
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`====================================================`);
  console.log(`🚀 Foxtly HITL Approval Gate running on port ${port}`);
  console.log(`📡 Endpoints:`);
  console.log(`   - POST /api/agent/trigger     (Start autonomous optimization)`);
  console.log(`   - GET  /api/approvals         (List pending/history)`);
  console.log(`   - POST /api/approvals/:id/approve (Authorize action)`);
  console.log(`   - POST /api/approvals/:id/reject  (Reject action)`);
  console.log(`====================================================`);
});

export default app;
