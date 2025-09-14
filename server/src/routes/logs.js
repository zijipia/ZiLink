import express from "express";
import fs from "node:fs";
import path from "node:path";
import passport from "../config/passport.js";

const router = express.Router();

// Protect logs with user auth
router.use(passport.authenticate("jwt", { session: false }));

const readLastLines = (filePath, limit = 200) => {
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, "utf8");
    const lines = data.split(/\r?\n/).filter(Boolean);
    return lines.slice(-limit);
  } catch {
    return [];
  }
};

const parseLine = (line, level) => {
  // Format: [ISO_TIMESTAMP] message
  const m = line.match(/^\[(.*?)\]\s*(.*)$/);
  if (!m) return null;
  return {
    timestamp: m[1],
    level,
    message: m[2],
    source: "server",
  };
};

router.get("/recent", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "200", 10), 1000);
  const level = (req.query.level || "all").toString();

  const logsDir = path.resolve("logs");
  const infoLines = level === "all" || level === "info" ? readLastLines(path.join(logsDir, "server.log"), limit) : [];
  const errorLines = level === "all" || level === "error" ? readLastLines(path.join(logsDir, "error.log"), limit) : [];

  const parsed = [
    ...infoLines.map((l) => parseLine(l, "info")).filter(Boolean),
    ...errorLines.map((l) => parseLine(l, "error")).filter(Boolean),
  ];

  parsed.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  res.json({ success: true, data: parsed.slice(-limit) });
});

export default router;

