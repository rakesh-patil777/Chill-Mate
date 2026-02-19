import { Router } from "express";
import db from "./db.js";

const router = Router();

router.get("/", (_req, res) => {
  try {
    const launchModeRow = db
      .prepare("SELECT value FROM app_config WHERE key = 'launchMode'")
      .get() as { value?: string } | undefined;
    const thresholdRow = db
      .prepare("SELECT value FROM app_config WHERE key = 'campusUnlockThreshold'")
      .get() as { value?: string } | undefined;
    const currentUserCount = Number(
      (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c
    );

    res.json({
      launchMode: launchModeRow?.value || "open",
      currentUserCount,
      campusUnlockThreshold: Number(thresholdRow?.value || 100),
    });
  } catch (err) {
    console.error("Config read error:", err);
    res.status(500).json({ error: "Failed to load app config" });
  }
});

export default router;

