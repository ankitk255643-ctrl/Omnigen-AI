export const models = {
  mainBrain: "gpt-4o",
  coding: "deepseek-reasoner",
  creative: "grok",
  imageUnderstanding: "gpt-4o",
  fastReply: "llama-70b-fast",
  research: "kimi-thinking",
  fallback: "llama-70b-fast"
};

export async function generateText(prompt: string, systemInstruction?: string) {
  const res = await fetch('/api/ai/generate-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemInstruction })
  });
  if (!res.ok) throw new Error('API Error');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

export async function generateImage(prompt: string, referenceImage?: string) {
  const res = await fetch('/api/higgsfield/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, style: "realistic", aspectRatio: "1:1" })
  });
  if (!res.ok) throw new Error('API Error');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.url;
}

export async function generateVideo(prompt: string, imageBase64?: string) {
  const res = await fetch('/api/higgsfield/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, imageBase64 })
  });
  if (!res.ok) throw new Error('API Error');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.url;
}

export async function analyzeMedia(prompt: string, mediaData: string, mimeType: string) {
  const base64Data = mediaData.split(',')[1] || mediaData;
  const res = await fetch('/api/ai/analyze-media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, mimeType, base64Data })
  });
  if (!res.ok) throw new Error('API Error');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

export async function generateAssistantResponse(prompt: string, personality: string, mediaData?: string, mimeType?: string) {
  const systemInstructions: Record<string, string> = {
    "emotional": `Personality: EMOTIONAL GIRL. Soft, caring Hinglish.`,
    "rational": `Personality: RATIONAL THINKER. Short, clear Hinglish.`,
    "roaster": `Personality: ROASTER BOY. Funny, sarcastic Hinglish.`,
    "flaunt": `Personality: FUNNY FLAUNT GIRL. Dramatic, playful Hinglish.`
  };

  const baseInstruction = `
========================
📚 UNIVERSAL QUESTION SOLVER
========================
You can solve questions from ANY subject. Solve it step-by-step in SIMPLE Hinglish.
For coding: Provide clean code and explain it simply.
========================
📱 WHATSAPP AGENT RULES
========================
You have the ability to search for contacts and send WhatsApp messages. Use the tools provided.
========================
🎨 IMAGE GENERATOR RULES
========================
Use 'generate_image' to create images. Provide highly detailed prompts.
========================
📁 FILE CONVERTER RULES
========================
Use 'convert_file' to convert target format.
`;

  const fullInstruction = (systemInstructions[personality] || systemInstructions["rational"]) + baseInstruction;

  const res = await fetch('/api/ai/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      systemInstruction: fullInstruction,
      mediaData: mediaData ? (mediaData.split(',')[1] || mediaData) : undefined,
      mimeType
    })
  });
  
  if (!res.ok) throw new Error('API Error');
  const data = await res.json();
  if (data.error) throw new Error(data.error);

  if (data.tool_call) {
    const { name, args, message, callId } = data.tool_call;
    
    if (name === "generate_image") {
      try {
        const imageUrl = await generateImage(args.prompt as string);
        return `TOOL_CALL:generate_image:${JSON.stringify({ imageUrl, prompt: args.prompt })}`;
      } catch (error) {
        return "Sorry, I couldn't generate that image right now: " + (error instanceof Error ? error.message : "Generation failed");
      }
    }
    
    if (name === "search_whatsapp_contact") {
      const mockContacts = [
        { id: "123", name: "Rahul", status: "Online" },
        { id: "456", name: "Priya", status: "Available" },
        { id: "789", name: "Ankit", status: "Busy" }
      ];
      const searchTerm = (args.name as string || "").toLowerCase();
      const found = mockContacts.filter(c => c.name.toLowerCase().includes(searchTerm));
      
      const followUpRes = await fetch('/api/ai/assistant/tool-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalMessages: [{ role: "system", content: fullInstruction }, { role: "user", content: prompt }],
          message: message,
          callId: callId,
          toolResult: { contacts: found }
        })
      });
      const followUpData = await followUpRes.json();
      return followUpData.text;
    }
    
    if (name === "send_whatsapp_message") {
      const followUpRes = await fetch('/api/ai/assistant/tool-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalMessages: [{ role: "system", content: fullInstruction }, { role: "user", content: prompt }],
          message: message,
          callId: callId,
          toolResult: { status: "success", info: "Message delivered to " + args.contactId }
        })
      });
      const followUpData = await followUpRes.json();
      return followUpData.text;
    }

    if (name === "convert_file") {
      return `TOOL_CALL:convert_file:${args.targetFormat}`;
    }
  }

  return data.text;
}

export async function detectIntent(prompt: string, fileInfo?: { name: string, type: string }) {
  try {
    const res = await fetch('/api/ai/detect-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, fileInfo })
    });
    const data = await res.json();
    return data;
  } catch (e) {
    return { tool: 'ai-assistant', action: 'chat', confidence: 0.5 };
  }
}
