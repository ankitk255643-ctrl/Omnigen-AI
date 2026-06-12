import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import CloudConvert from "cloudconvert";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { exec } from "child_process";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = process.env.PORT || 3000;

  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  app.post("/api/convert", upload.single("file"), async (req, res) => {
    try {
      const apiKey = process.env.CLOUDCONVERT_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: "CloudConvert API Key is not configured." });
      }
      const file = req.file;
      const targetFormat = req.body.targetFormat;
      if (!file || !targetFormat) {
        return res.status(400).json({ error: "Missing file or target format." });
      }
      const cloudConvert = new CloudConvert(apiKey);
      const job = await cloudConvert.jobs.create({
        tasks: {
          "import-my-file": { operation: "import/base64", file: file.buffer.toString("base64"), filename: file.originalname },
          "convert-my-file": { operation: "convert", input: "import-my-file", output_format: targetFormat },
          "export-my-file": { operation: "export/url", input: "convert-my-file" },
        },
      });
      const finishedJob = await cloudConvert.jobs.wait(job.id);
      const exportTask = finishedJob.tasks.find((t) => t.name === "export-my-file");
      if (exportTask && exportTask.result && exportTask.result.files) {
        const resultFile = exportTask.result.files[0];
        res.json({ url: resultFile.url, filename: resultFile.filename });
      } else {
        res.status(500).json({ error: "Conversion failed." });
      }
    } catch (error) {
      console.error("CloudConvert Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/open-app", (req, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: "Missing target app/url" });
    exec(`start ${target}`, (error) => {
      if (error) {
        console.error("Failed to open:", error);
        return res.status(500).json({ error: "Failed to open" });
      }
      res.json({ success: true });
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
