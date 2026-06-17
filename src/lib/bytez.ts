export async function generateGemmaResponse(prompt: string) {
  try {
    const res = await fetch('/api/ai/generate-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        systemInstruction: "You are an expert software engineer." // Routes to deepseek-reasoner
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    return data.text;
  } catch (error) {
    console.error("DeepSeek Proxy Error:", error);
    throw error;
  }
}
