import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import CloudConvert from "cloudconvert";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { exec } from "child_process";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

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

  // --- OMNIGEN MULTI-AGENT SECURE BACKEND ---
  
  const getAgentClient = (modelName) => {
    let apiKey = process.env.GROK_API_KEY; // Default
    let baseURL = "https://api.aimlapi.com";
    
    if (modelName === 'deepseek-reasoner') apiKey = process.env.DEEPSEEK_API_KEY;
    if (modelName === 'llama-70b-fast') apiKey = process.env['LAMA_70B-FAST_API_KEY'];
    if (modelName === 'gpt-4o') {
      apiKey = process.env.GPT_4O_API_KEY;
      baseURL = apiKey && !apiKey.startsWith('sk-vIg') ? "https://api.openai.com/v1" : "https://api.aimlapi.com";
    }
    if (modelName === 'kimi-thinking') apiKey = process.env.KIMI_API_KEY;
    if (modelName === 'grok-beta') apiKey = process.env.GROK_API_KEY;

    // Use default OpenAI behavior if it's an actual OpenAI key, else AIML proxy
    return {
      client: new OpenAI({ apiKey, baseURL: (apiKey && apiKey.startsWith('sk-proj') ? undefined : "https://api.aimlapi.com") }),
      model: modelName
    };
  };

  app.post("/api/ai/detect-intent", express.json({limit: '50mb'}), async (req, res) => {
    try {
      const { prompt, fileInfo } = req.body;
      const { client, model } = getAgentClient('llama-70b-fast'); // Fast Backup Agent
      
      const systemInstruction = `
        You are an intent detection engine for OmniGen AI.
        Analyze the user's prompt and file information to determine the required action and tool.
        Return ONLY a JSON object in this format:
        { "action": "string", "input_type": "string", "output_type": "string", "tool": "string", "confidence": number, "reasoning": "string" }
        Available tools: text-to-image, text-to-video, text-to-script, text-to-prompt, text-to-code, image-to-text, video-to-text, image-to-video, text-to-pdf, word-to-pdf, image-merger, bg-remover, text-to-song, watermark-remover, pdf-editor, whatsapp-agent, file-converter, ai-assistant.
      `;
      const input = `Prompt: "${prompt}"\nFile: ${fileInfo ? `${fileInfo.name} (${fileInfo.type})` : 'None'}`;
      
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: "system", content: systemInstruction }, { role: "user", content: input }],
        response_format: { type: "json_object" }
      });
      res.json(JSON.parse(response.choices[0].message.content));
    } catch (e) {
      console.error(e);
      res.json({ tool: 'ai-assistant', action: 'chat', confidence: 0.5 });
    }
  });

  app.post("/api/ai/generate-text", express.json({limit: '50mb'}), async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      
      let agentKey = 'grok-beta'; // Creative Fast Agent
      if (systemInstruction?.includes('software engineer')) agentKey = 'deepseek-reasoner'; // Coding Agent
      else if (systemInstruction?.includes('prompt engineering')) agentKey = 'gpt-4o'; // Main Brain
      else if (systemInstruction?.includes('research')) agentKey = 'kimi-thinking'; // Research Agent

      let { client, model } = getAgentClient(agentKey);

      try {
        const response = await client.chat.completions.create({
          model,
          messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt }
          ]
        });
        res.json({ text: response.choices[0].message.content });
      } catch (err) {
        console.error(`Error with ${agentKey}, falling back to Llama:`, err);
        const fallback = getAgentClient('llama-70b-fast'); // Fast Backup
        const fallbackRes = await fallback.client.chat.completions.create({
          model: fallback.model,
          messages: [{ role: "user", content: prompt }]
        });
        res.json({ text: fallbackRes.choices[0].message.content });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/analyze-media", express.json({limit: '50mb'}), async (req, res) => {
    try {
      const { prompt, mimeType, base64Data } = req.body;
      const { client, model } = getAgentClient('gpt-4o'); // Image Understanding
      
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
            ]
          }
        ]
      });
      res.json({ text: response.choices[0].message.content });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/assistant", express.json({limit: '50mb'}), async (req, res) => {
    try {
      const { prompt, systemInstruction, mediaData, mimeType } = req.body;
      const { client, model } = getAgentClient('gpt-4o'); // Main Brain
      
      const messages = [{ role: "system", content: systemInstruction }];
      if (mediaData && mimeType) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${mediaData}` } }
          ]
        });
      } else {
        messages.push({ role: "user", content: prompt });
      }

      const openaiTools = [
        { type: "function", function: { name: "search_whatsapp_contact", description: "Search for WhatsApp contact.", parameters: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } } },
        { type: "function", function: { name: "send_whatsapp_message", description: "Send WhatsApp message.", parameters: { type: "object", properties: { contactId: { type: "string" }, message: { type: "string" } }, required: ["contactId", "message"] } } },
        { type: "function", function: { name: "convert_file", description: "Convert file format.", parameters: { type: "object", properties: { targetFormat: { type: "string" } }, required: ["targetFormat"] } } },
        { type: "function", function: { name: "generate_image", description: "Generate image.", parameters: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] } } }
      ];

      const response = await client.chat.completions.create({
        model,
        messages,
        tools: openaiTools
      });

      const message = response.choices[0].message;
      if (message.tool_calls && message.tool_calls.length > 0) {
        const call = message.tool_calls[0];
        return res.json({ tool_call: { name: call.function.name, args: JSON.parse(call.function.arguments), message: message, callId: call.id } });
      }
      res.json({ text: message.content });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/ai/assistant/tool-reply", express.json({limit: '50mb'}), async (req, res) => {
     try {
       const { originalMessages, message, callId, toolResult } = req.body;
       const { client, model } = getAgentClient('gpt-4o');
       
       const response = await client.chat.completions.create({
          model,
          messages: [
            ...originalMessages,
            message,
            { role: "tool", tool_call_id: callId, content: JSON.stringify(toolResult) }
          ]
       });
       res.json({ text: response.choices[0].message.content });
     } catch (err) {
       res.status(500).json({ error: err.message });
     }
  });

  // --- END OMNIGEN SECURE BACKEND ---

  // Higgsfield Mock APIs
  app.post("/api/higgsfield/generate-image", async (req, res) => {
    try {
      // Use GEMINI_API_KEY as fallback since Grok doesn't have public image generation yet
      const apiKey = process.env.HIGGSFIELD_API_KEY?.startsWith('sk-') ? process.env.GEMINI_API_KEY : (process.env.HIGGSFIELD_API_KEY || process.env.GEMINI_API_KEY);
      
      if (!apiKey) {
        return res.status(401).json({ error: "API Key is not configured in the backend." });
      }
      const { prompt, style, aspectRatio } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }
      
      const fullPrompt = `${style ? style + ' style, ' : ''}${prompt}`;
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio === '16:9' ? '16:9' : aspectRatio === '9:16' ? '9:16' : '1:1',
            imageSize: "1K"
          }
        }
      });

      let imageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
      
      if (!imageUrl) {
        throw new Error("No image was generated by the model.");
      }
      
      res.json({ success: true, url: imageUrl });
    } catch (error) {
      console.error("Higgsfield Image Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/higgsfield/generate-video", async (req, res) => {
    try {
      const apiKey = process.env.HIGGSFIELD_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: "Higgsfield API Key is not configured in the backend." });
      }
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }
      
      // Mock generation delay
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Mock response video
      const mockVideoUrl = `https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-particle-background-3134-large.mp4`;
      res.json({ success: true, url: mockVideoUrl });
    } catch (error) {
      console.error("Higgsfield Video Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
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
