import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

// Allow the serverless function to run for up to 60 seconds on Vercel
export const maxDuration = 60;

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

  // Dynamically select the correct model provider
  let selectedModel;
  if (model === "GPT-4o") {
    selectedModel = openai("gpt-4o");
  } else {
    selectedModel = anthropic("claude-3-opus-20240229");
  }

  try {
    const result = streamText({
      model: selectedModel,
      system: systemPrompt,
      prompt: prompt,
    });

    // Streams plain text back to your manual fetch reader in page.tsx
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI Generation Error:", error);
    return new Response("Failed to generate content", { status: 500 });
  }
}