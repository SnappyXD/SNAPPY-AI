import { streamText } from "ai";

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

  const modelId = model === "GPT-4o" ? "openai/gpt-4o" : "anthropic/claude-sonnet-4-20250514";

  const result = streamText({
    model: modelId,
    system: systemPrompt,
    prompt: prompt,
  });

  return result.toTextStreamResponse();
}
