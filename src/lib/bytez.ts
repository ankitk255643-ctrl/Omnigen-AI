export async function generateGemmaResponse(prompt: string) {
  const apiKey = (import.meta as any).env.VITE_BYTEZ_API_KEY || "40f10119ce13d90306423fd7adfbd090";
  const modelId = "google/gemma-4-31B-it";
  
  try {
    const response = await fetch(`https://api.bytez.com/v1/models/${modelId}/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            "content": prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.output;
  } catch (error) {
    console.error("Bytez API Error:", error);
    throw error;
  }
}
