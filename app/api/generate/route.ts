import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

export const maxDuration = 60;

// Configure the OpenAI provider to point to Groq's API
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  const { prompt, model, tone, keywords } = await req.json();

  const systemPrompt = `You are an expert content strategist and copywriter. Generate high-quality, engaging content based on the user's prompt.

Tone: ${tone}
Keywords to incorporate: ${keywords.join(", ")}

Format your response in clean markdown with:
- A compelling headline (# heading)
- Key sections (## subheadings)  
- Bullet points for scannable content
- A code block if relevant (for copywriting frameworks or templates)
- A "Next steps" section (### subheading)

Keep the content actionable, concise, and conversion-focused.`;

  // Dynamically select the provider based on the frontend selection
  let selectedModel;
  if (model === "Gemini 2.5 Flash") {
    selectedModel = google("gemini-2.5-flash");
  } else {
    // Default to Groq Llama 3
    selectedModel = groq("llama3-8b-8192");
  }

  try {
    const result = streamText({
      model: selectedModel,
      system: systemPrompt,
      prompt: prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI Generation Error:", error);
    return new Response("Failed to generate content", { status: 500 });
  }
}