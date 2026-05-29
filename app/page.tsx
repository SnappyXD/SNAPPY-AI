"use client";

import type { ChangeEvent, KeyboardEvent, ReactNode } from "react";
import { useState, useCallback } from "react";
import {
  Bot,
  ChevronDown,
  ClipboardCopy,
  History,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Settings,
  SquareCode,
  Sparkles,
  UserCircle2,
  WandSparkles,
  X,
  Check,
  Trash2,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  id: string;
};

const navigation: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { label: "Content History", icon: History, id: "history" },
  { label: "Templates", icon: SquareCode, id: "templates" },
  { label: "API Keys", icon: KeyRound, id: "api-keys" },
  { label: "Settings", icon: Settings, id: "settings" },
];

const modelOptions = ["GPT-4o", "Claude 3 Opus"];
const toneOptions = ["Professional", "Casual", "Witty", "Formal", "Friendly"];

type HistoryItem = {
  id: string;
  prompt: string;
  output: string;
  model: string;
  tone: string;
  keywords: string[];
  createdAt: Date;
};

type Template = {
  id: string;
  name: string;
  prompt: string;
  keywords: string[];
  tone: string;
};

const defaultTemplates: Template[] = [
  {
    id: "1",
    name: "SaaS Launch Campaign",
    prompt: "Create a premium SaaS launch sequence for an AI product, emphasizing value, speed, and polished UX.",
    keywords: ["automation", "efficiency", "premium"],
    tone: "Professional",
  },
  {
    id: "2",
    name: "Social Media Thread",
    prompt: "Write a viral Twitter/X thread about startup growth strategies with actionable tips.",
    keywords: ["growth", "startups", "tips"],
    tone: "Casual",
  },
  {
    id: "3",
    name: "Email Subject Lines",
    prompt: "Generate 10 high-converting email subject lines for a product launch announcement.",
    keywords: ["launch", "exclusive", "limited"],
    tone: "Witty",
  },
  {
    id: "4",
    name: "Landing Page Copy",
    prompt: "Write compelling landing page copy for a productivity app targeting remote workers.",
    keywords: ["productivity", "remote", "focus"],
    tone: "Friendly",
  },
];

const sampleMarkdown = `# Weekly Content Strategy

Generate a fast-paced, conversion-focused content plan for the AI Content Generator dashboard.

## Highlights
- Build 3 social posts
- Draft 1 landing page headline set
- Create 5 email subject lines
- Repurpose one idea across channels

## Prompt Framework
\`\`\`ts
const prompt = "Turn a product idea into a premium SaaS launch campaign";
\`\`\`

### Recommended next step
Ship the strongest variant first, then iterate on tone and channel.
`;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function parseKeywords(raw: string) {
  return raw
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function MarkdownPreview({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const nodes: ReactNode[] = [];
  let inCode = false;
  let codeBuffer: string[] = [];

  const flushCode = () => {
    if (codeBuffer.length === 0) return;
    nodes.push(
      <pre
        key={`code-${nodes.length}`}
        className="overflow-x-auto rounded-md border border-zinc-800 bg-zinc-950/90 p-4 text-sm text-zinc-200"
      >
        <code>{codeBuffer.join("\n")}</code>
      </pre>,
    );
    codeBuffer = [];
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        inCode = false;
        flushCode();
      } else {
        inCode = true;
      }
      return;
    }

    if (inCode) {
      codeBuffer.push(line);
      return;
    }

    if (line.startsWith("# ")) {
      nodes.push(
        <h1 key={index} className="text-2xl font-semibold tracking-tight text-zinc-50">
          {line.replace("# ", "")}
        </h1>,
      );
      return;
    }

    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={index} className="text-lg font-medium text-zinc-100">
          {line.replace("## ", "")}
        </h2>,
      );
      return;
    }

    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={index} className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          {line.replace("### ", "")}
        </h3>,
      );
      return;
    }

    if (line.startsWith("- ")) {
      nodes.push(
        <li key={index} className="ml-6 list-disc text-sm leading-7 text-zinc-300">
          {line.replace("- ", "")}
        </li>,
      );
      return;
    }

    if (line.trim()) {
      const processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-100 font-semibold">$1</strong>');
      nodes.push(
        <p
          key={index}
          className="text-sm leading-7 text-zinc-300"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />,
      );
    } else {
      nodes.push(<div key={index} className="h-2" />);
    }
  });

  flushCode();

  return <div className="space-y-3">{nodes}</div>;
}

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [model, setModel] = useState(modelOptions[0]);
  const [tone, setTone] = useState(toneOptions[0]);
  const [prompt, setPrompt] = useState(
    "Create a premium SaaS launch sequence for an AI content generator, emphasizing value, speed, and polished UX.",
  );
  const [keywords, setKeywords] = useState(["automation", "branding", "conversion"]);
  const [keywordInput, setKeywordInput] = useState("");
  const [generated, setGenerated] = useState(false);
  const [output, setOutput] = useState(sampleMarkdown);
  const [copyLabel, setCopyLabel] = useState("Copy to Clipboard");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [templates] = useState<Template[]>(defaultTemplates);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [totalTokens] = useState(10000);

  const promptCount = prompt.length;
  const keywordCount = keywords.length;
  const tokensLeft = totalTokens - tokensUsed;
  const tokenProgress = Math.round((tokensUsed / totalTokens) * 100);

  const handleAddKeyword = () => {
    const nextKeywords = parseKeywords(keywordInput);
    if (!nextKeywords.length) return;
    setKeywords((current: string[]) => Array.from(new Set([...current, ...nextKeywords])));
    setKeywordInput("");
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setGenerated(true);
    setOutput("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model,
          tone,
          keywords,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setOutput(fullContent);
      }

      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        prompt,
        output: fullContent,
        model,
        tone,
        keywords: [...keywords],
        createdAt: new Date(),
      };
      setHistory((prev) => [historyItem, ...prev]);
      
      setTokensUsed((prev) => Math.min(prev + Math.floor(fullContent.length / 4), totalTokens));
    } catch (error) {
      console.error("[v0] Error generating content:", error);
      setOutput("# Error\n\nFailed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, model, tone, keywords, totalTokens]);

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords((current: string[]) => current.filter((item) => item !== keyword));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopyLabel("Copied!");
    window.setTimeout(() => setCopyLabel("Copy to Clipboard"), 1400);
  };

  const handleSaveToDrafts = () => {
    if (!output || output === sampleMarkdown) return;
    
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      prompt,
      output,
      model,
      tone,
      keywords: [...keywords],
      createdAt: new Date(),
    };
    
    if (!history.some(h => h.output === output)) {
      setHistory((prev) => [historyItem, ...prev]);
    }
  };

  const handleLoadFromHistory = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setOutput(item.output);
    setModel(item.model);
    setTone(item.tone);
    setKeywords(item.keywords);
    setGenerated(true);
    setActiveNav("dashboard");
  };

  const handleDeleteFromHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleLoadTemplate = (template: Template) => {
    setPrompt(template.prompt);
    setKeywords(template.keywords);
    setTone(template.tone);
    setActiveNav("dashboard");
  };

  const renderContent = () => {
    switch (activeNav) {
      case "history":
        return (
          <div className="space-y-6">
            <header className="rounded-md border border-zinc-800 bg-zinc-900/40 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <History className="h-3.5 w-3.5" />
                Content History
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                Your Generated Content
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                View and reuse your previously generated content drafts.
              </p>
            </header>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/50 p-12 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800">
                  <History className="h-5 w-5 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-50">No content yet</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Generated content will appear here for easy access.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-md border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-100 line-clamp-1">{item.prompt}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                          <span>{item.model}</span>
                          <span>•</span>
                          <span>{item.tone}</span>
                          <span>•</span>
                          <span>{item.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadFromHistory(item)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteFromHistory(item.id)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-red-500/30 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-xs text-zinc-400"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        );

      case "templates":
        return (
          <div className="space-y-6">
            <header className="rounded-md border border-zinc-800 bg-zinc-900/40 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <SquareCode className="h-3.5 w-3.5" />
                Templates
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                Quick Start Templates
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Choose a template to quickly generate targeted content.
              </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
              {templates.map((template) => (
                <article
                  key={template.id}
                  className="rounded-md border border-zinc-800 bg-zinc-900/50 p-5 transition hover:-translate-y-1 hover:border-zinc-700"
                >
                  <h3 className="text-lg font-semibold text-zinc-50">{template.name}</h3>
                  <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{template.prompt}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {template.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-xs text-zinc-400"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">{template.tone} tone</span>
                    <button
                      onClick={() => handleLoadTemplate(template)}
                      className="inline-flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500 px-3 py-1.5 text-xs font-medium text-zinc-950 transition hover:-translate-y-0.5 hover:bg-emerald-400"
                    >
                      <WandSparkles className="h-3.5 w-3.5" />
                      Use Template
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        );

      case "api-keys":
        return (
          <div className="space-y-6">
            <header className="rounded-md border border-zinc-800 bg-zinc-900/40 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <KeyRound className="h-3.5 w-3.5" />
                API Keys
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                API Configuration
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Manage your API keys for AI model access.
              </p>
            </header>

            <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="flex items-center gap-3 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4">
                <Check className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-300">Using Vercel AI Gateway</p>
                  <p className="text-xs text-emerald-300/70">
                    Your app is configured to use the Vercel AI Gateway for model access. No additional API keys required.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-medium text-zinc-200">Available Models</h4>
                <div className="space-y-2">
                  {modelOptions.map((m) => (
                    <div
                      key={m}
                      className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 p-3"
                    >
                      <span className="text-sm text-zinc-300">{m}</span>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <header className="rounded-md border border-zinc-800 bg-zinc-900/40 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                App Settings
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Configure your content generation preferences.
              </p>
            </header>

            <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-zinc-200">Default AI Model</label>
                  <div className="relative mt-2">
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full appearance-none rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 pr-10 text-sm text-zinc-100 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
                    >
                      {modelOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-200">Default Tone</label>
                  <div className="relative mt-2">
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full appearance-none rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 pr-10 text-sm text-zinc-100 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
                    >
                      {toneOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  </div>
                </div>

                <div className="rounded-md border border-zinc-800 bg-zinc-950 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Token Usage</p>
                      <p className="text-xs text-zinc-500">
                        {tokensUsed.toLocaleString()} / {totalTokens.toLocaleString()} tokens used
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      {tokenProgress}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${tokenProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <header className="flex flex-col gap-4 rounded-md border border-zinc-800 bg-zinc-900/40 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Create New Content
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                  AI Content Generator
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                  Build, refine, and ship AI-generated content from a premium workspace with a calm, focused interface.
                </p>
              </div>

              <div className="w-full max-w-sm rounded-md border border-zinc-800 bg-zinc-950 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Remaining Tokens</p>
                    <p className="mt-1 text-sm font-medium text-zinc-100">
                      {tokensLeft.toLocaleString()} / {totalTokens.toLocaleString()} Tokens Left
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    {100 - tokenProgress}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${100 - tokenProgress}%` }}
                  />
                </div>
              </div>
            </header>

            <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
              <article className="rounded-md border border-zinc-800 bg-zinc-900/50 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)] transition-transform duration-200 hover:-translate-y-1 hover:border-zinc-700">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-50">AI Input</h3>
                    <p className="text-sm text-zinc-500">Configure your content generation request.</p>
                  </div>
                  <div className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
                    {keywordCount} keywords
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-200">AI Model</label>
                    <div className="relative">
                      <select
                        value={model}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) => setModel(event.target.value)}
                        className="w-full appearance-none rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 pr-10 text-sm text-zinc-100 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
                      >
                        {modelOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-200">Tone of Voice</label>
                    <div className="relative">
                      <select
                        value={tone}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) => setTone(event.target.value)}
                        className="w-full appearance-none rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 pr-10 text-sm text-zinc-100 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
                      >
                        {toneOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-200">Your Prompt/Context</label>
                    <textarea
                      value={prompt}
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setPrompt(event.target.value)}
                      rows={8}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
                      placeholder="Tell the AI what to write..."
                    />
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Write a clear context prompt for best results.</span>
                      <span>{promptCount} characters</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-200">Add Keywords</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          value={keywordInput}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => setKeywordInput(event.target.value)}
                          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleAddKeyword();
                            }
                          }}
                          placeholder="automation, growth, launch"
                          className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        className="inline-flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500 px-4 py-3 text-sm font-medium text-zinc-950 transition hover:-translate-y-0.5 hover:bg-emerald-400"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-300"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(keyword)}
                            className="rounded-full p-0.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 shadow-[0_10px_30px_rgba(16,185,129,0.22)] transition hover:-translate-y-0.5 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <WandSparkles className="h-4 w-4" />
                        Generate Content
                      </>
                    )}
                  </button>
                </div>
              </article>

              <article className="relative overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/50 shadow-[0_20px_70px_rgba(0,0,0,0.22)] transition-transform duration-200 hover:-translate-y-1 hover:border-zinc-700">
                <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-50">Output Preview</h3>
                    <p className="text-sm text-zinc-500">
                      {isGenerating ? "Generating content..." : "Generated markdown appears here with a clean, readable viewer."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!generated || isGenerating}
                      className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ClipboardCopy className="h-4 w-4" />
                      {copyLabel}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveToDrafts}
                      disabled={!generated || isGenerating}
                      className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      Save to Drafts
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                      className="inline-flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:-translate-y-0.5 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Regenerate
                    </button>
                  </div>
                </div>

                <div className="relative min-h-[560px] p-5">
                  {!generated && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/30 backdrop-blur-sm">
                      <div className="max-w-md rounded-md border border-zinc-800 bg-zinc-950/95 p-6 text-center shadow-2xl">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10">
                          <Sparkles className="h-5 w-5 text-emerald-300" />
                        </div>
                        <h4 className="text-lg font-semibold text-zinc-50">Ready to generate</h4>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                          The preview is blurred until content is generated. Click the button to unlock your draft.
                        </p>
                      </div>
                    </div>
                  )}

                  {isGenerating && (
                    <div className="absolute right-5 top-5 z-20">
                      <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Streaming...
                      </div>
                    </div>
                  )}

                  <div className={cn("space-y-4 transition-all duration-300", !generated && "blur-sm")}>
                    <MarkdownPreview markdown={output} />
                  </div>
                </div>
              </article>
            </section>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-zinc-800 bg-zinc-950/95 px-5 py-6 lg:min-h-screen lg:w-[280px] lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]">
                <Bot className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Micro SaaS</p>
                <h1 className="text-lg font-semibold text-zinc-50">Snappy AI</h1>
              </div>
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.label}
                    onClick={() => setActiveNav(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left text-sm transition-all duration-200",
                      isActive
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.12)]"
                        : "border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900 hover:text-zinc-100",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.id === "history" && history.length > 0 && (
                      <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                        {history.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto">
              <button className="flex w-full items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-3 text-left transition hover:border-zinc-700 hover:bg-zinc-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800">
                  <UserCircle2 className="h-5 w-5 text-zinc-300" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-100">Creator</p>
                  <p className="truncate text-xs text-zinc-500">Free workspace</p>
                </div>
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{renderContent()}</main>
      </div>
    </div>
  );
}
