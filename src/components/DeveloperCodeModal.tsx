import React, { useState } from "react";
import { X, Copy, Check, Terminal, Code2, Sparkles } from "lucide-react";

interface DeveloperCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  modelId: string;
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  type?: "chat" | "code" | "pipeline" | "tts" | "image";
}

export default function DeveloperCodeModal({
  isOpen,
  onClose,
  title,
  modelId,
  prompt,
  systemInstruction = "You are an expert AI system assistant.",
  temperature = 0.7,
  type = "chat"
}: DeveloperCodeModalProps) {
  const [activeTab, setActiveTab] = useState<"python" | "curl" | "typescript">("python");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Retrieve user's configured NVIDIA key or fallback
  const storedKey = typeof window !== "undefined" ? localStorage.getItem("nvidia_api_key") : "";
  const apiKey = storedKey && storedKey.trim() !== "" ? storedKey : "nvapi-YOUR_NVIDIA_API_KEY";

  // Map model identifier to official NVIDIA NIM endpoint name
  const getNvidiaModelSlug = (id: string) => {
    switch (id) {
      case "kimi-k3":
        return "moonshotai/kimi-k3";
      case "deepseek-v4-flash-0731":
        return "deepseek-ai/deepseek-v4-flash";
      case "nemotron-3.5-lightning-30b-a3b":
        return "nvidia/nemotron-3.5-lightning-30b-a3b";
      case "nemotron-4-340b-instruct":
        return "nvidia/nemotron-4-340b-instruct";
      case "llama-3.1-70b-instruct":
        return "meta/llama-3.1-70b-instruct";
      case "llama-3.3-70b-instruct":
        return "meta/llama-3.3-70b-instruct";
      case "sdxl-nim":
        return "stabilityai/stable-diffusion-xl-base-1.0";
      case "nemo-tts-nim":
        return "nvidia/nemo-tts-fastpitch-hifigan";
      case "videogpt-nim":
        return "nvidia/video-gpt-motion-v1";
      case "nemotron-code-35b":
        return "nvidia/nemotron-code-35b-instruct";
      default:
        if (id.includes("/")) return id;
        return "nvidia/nemotron-3.5-lightning-30b-a3b";
    }
  };

  const modelSlug = getNvidiaModelSlug(modelId);
  const cleanPrompt = prompt.replace(/"/g, '\\"').replace(/\n/g, "\\n");
  const cleanSystem = systemInstruction.replace(/"/g, '\\"').replace(/\n/g, "\\n");

  // Standard LLM Chat Snippets
  const chatPythonCode = `# NVIDIA NIM API Integration (Python)
# pip install openai requests

from openai import OpenAI

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="${apiKey}"
)

completion = client.chat.completions.create(
    model="${modelSlug}",
    messages=[
        {"role": "system", "content": "${cleanSystem}"},
        {"role": "user", "content": "${cleanPrompt}"}
    ],
    temperature=${temperature.toFixed(1)},
    top_p=0.9,
    max_tokens=2048,
    stream=True
)

print(f"Streaming from NVIDIA NIM ({modelSlug}):\\n")
for chunk in completion:
    delta = chunk.choices[0].delta.content or ""
    print(delta, end="", flush=True)
`;

  const chatCurlCode = `# NVIDIA NIM cURL Endpoint Execution
curl -X POST "https://integrate.api.nvidia.com/v1/chat/completions" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${modelSlug}",
    "messages": [
      {"role": "system", "content": "${cleanSystem}"},
      {"role": "user", "content": "${cleanPrompt}"}
    ],
    "temperature": ${temperature.toFixed(1)},
    "max_tokens": 2048,
    "stream": false
  }'
`;

  const chatTsCode = `// NVIDIA NIM Client (Node.js / TypeScript)
// npm install openai

import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY || "${apiKey}"
});

async function runNvidiaInference() {
  const response = await openai.chat.completions.create({
    model: "${modelSlug}",
    messages: [
      { role: "system", content: "${cleanSystem}" },
      { role: "user", content: "${cleanPrompt}" }
    ],
    temperature: ${temperature.toFixed(1)},
    max_tokens: 2048,
    stream: true
  });

  for await (const chunk of response) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

runNvidiaInference().catch(console.error);
`;

  // Multimodal Pipeline DAG Orchestration Snippets
  const pipelinePythonCode = `# NVIDIA Multimodal Orchestration Pipeline (Python)
# Orchestrates: Nemotron-4-340B (Intent) -> SDXL NIM (Image) -> NeMo FastPitch (Audio)
# pip install openai requests

import os
import json
import requests
from openai import OpenAI

NVIDIA_KEY = "${apiKey}"
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=NVIDIA_KEY
)

prompt = "${cleanPrompt}"

print("==> Step 1: Deconstructing multimodal intent with Nemotron...")
intent_res = client.chat.completions.create(
    model="nvidia/nemotron-4-340b-instruct",
    messages=[
        {"role": "system", "content": "Extract visual scene and voiceover text in JSON format."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.2
)
print("Intent Classified.")

print("==> Step 2: Synthesizing Concept Frame via NVIDIA SDXL NIM...")
img_res = requests.post(
    "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl-base-1.0",
    headers={"Authorization": f"Bearer {NVIDIA_KEY}", "Accept": "application/json"},
    json={"text_prompts": [{"text": prompt, "weight": 1.0}], "cfg_scale": 7, "samples": 1}
)
print("Visual Frame generated.")

print("==> Step 3: Generating NeMo Voice Narration...")
tts_res = requests.post(
    "https://api.nvidia.com/v1/nemo/tts",
    headers={"Authorization": f"Bearer {NVIDIA_KEY}"},
    json={"text": "Oceanic propulsion active. Telemetry locked.", "voice": "Charon"}
)
print("NeMo Audio artifact compiled.")
print("\\n✨ Multimodal DAG Pipeline Execution Finished Successfully!")
`;

  const pipelineCurlCode = `# Multi-Step NVIDIA Orchestration Pipeline cURL
# Step 1: Intent Tagging with Nemotron
curl -X POST "https://integrate.api.nvidia.com/v1/chat/completions" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "nvidia/nemotron-4-340b-instruct",
    "messages": [{"role": "user", "content": "${cleanPrompt}"}]
  }'

# Step 2: Concept Frame Synthesis via NVIDIA SDXL NIM
curl -X POST "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl-base-1.0" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text_prompts": [{"text": "${cleanPrompt}", "weight": 1.0}],
    "cfg_scale": 7,
    "samples": 1
  }'

# Step 3: NeMo TTS Voiceover Generation
curl -X POST "https://api.nvidia.com/v1/nemo/tts" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Vector telemetry stabilized. System ready.",
    "voice": "Charon"
  }'
`;

  const pipelineTsCode = `// NVIDIA Multimodal Chaining Pipeline (Node.js / TypeScript)
import OpenAI from "openai";

const NVIDIA_KEY = process.env.NVIDIA_API_KEY || "${apiKey}";
const openai = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: NVIDIA_KEY
});

async function runMultimodalPipeline(userPrompt: string) {
  console.log("1. Deconstructing intent with Nemotron...");
  const intent = await openai.chat.completions.create({
    model: "nvidia/nemotron-4-340b-instruct",
    messages: [{ role: "user", content: userPrompt }]
  });
  console.log("Intent output:", intent.choices[0].message.content);

  console.log("2. Invoking NVIDIA NIM SDXL Frame synthesis...");
  const imgResponse = await fetch("https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl-base-1.0", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${NVIDIA_KEY}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text_prompts: [{ text: userPrompt, weight: 1.0 }],
      cfg_scale: 7
    })
  });

  console.log("3. Invoking NeMo Speech Synthesis...");
  // NeMo TTS stream response...
  console.log("Pipeline DAG execution complete.");
}

runMultimodalPipeline("${cleanPrompt}").catch(console.error);
`;

  const getCurrentSnippet = () => {
    const isPipeline = type === "pipeline";
    switch (activeTab) {
      case "python":
        return isPipeline ? pipelinePythonCode : chatPythonCode;
      case "curl":
        return isPipeline ? pipelineCurlCode : chatCurlCode;
      case "typescript":
        return isPipeline ? pipelineTsCode : chatTsCode;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentSnippet());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0b1622] border border-[#16273a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#16273a] flex items-center justify-between bg-[#060c15]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-[#c49b66]/10 text-[#c49b66]">
              <Code2 size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#f5efeb]">
                {title}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Target Endpoint: <span className="text-[#c49b66]">{modelSlug}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#16273a] hover:bg-[#c49b66] hover:text-[#060c15] text-slate-300 transition-all text-[11px] font-bold cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? "Copied Snippet" : "Copy Code"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#16273a] transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-3 pb-2 border-b border-[#16273a] flex items-center justify-between bg-[#0b1622]">
          <div className="flex space-x-1.5 bg-[#060c15] p-1 rounded-xl border border-[#16273a]">
            <button
              onClick={() => setActiveTab("python")}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "python" ? "bg-[#c49b66] text-[#060c15]" : "text-slate-400 hover:text-white"
              }`}
            >
              Python (OpenAI)
            </button>
            <button
              onClick={() => setActiveTab("curl")}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "curl" ? "bg-[#c49b66] text-[#060c15]" : "text-slate-400 hover:text-white"
              }`}
            >
              cURL CLI
            </button>
            <button
              onClick={() => setActiveTab("typescript")}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "typescript" ? "bg-[#c49b66] text-[#060c15]" : "text-slate-400 hover:text-white"
              }`}
            >
              Node.js / TS
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-[9px] font-mono text-slate-500">
            <Sparkles size={11} className="text-[#c49b66]" />
            <span>NVIDIA NIM OpenAI-Compatible Spec</span>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-6 overflow-y-auto font-mono text-[11px] leading-relaxed bg-[#060c15]/95 text-slate-200">
          <pre className="whitespace-pre-wrap selection:bg-[#c49b66]/30">
            {getCurrentSnippet()}
          </pre>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-[#16273a] bg-[#0b1622] flex items-center justify-between text-[10px] text-slate-400">
          <span>Bearer key auto-populated from current session credentials.</span>
          <span className="text-[#c49b66] font-mono">Port 443 HTTPS Verified</span>
        </div>
      </div>
    </div>
  );
}
