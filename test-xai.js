import { OpenAI } from 'openai';

const apiKey = 'sk-U9NsC9lnxfKvxWSMXNBUDCFI7tUIxYI4fbmLtPcers2u7bwT';
const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.x.ai/v1'
});

async function test() {
  try {
    const response = await openai.images.generate({
      prompt: "a cat",
      model: "grok-4.20-fast"
    });
    console.log("Success:", response.data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
