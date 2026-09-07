import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Trash2, 
  SlidersHorizontal,
  Clock,
  Database,
  UserCheck,
  Cpu
} from "lucide-react";
import { MODELS_CATALOG } from "../models-data";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  latencyMs?: number;
  tokens?: number;
  modelUsed?: string;
}

interface ChatAssistantsProps {
  onChatCompleted: () => void;
  preselectedModelId?: string | null;
  onClearPreselected?: () => void;
}

const PRESET_PERSONAS = [
  { id: "general", name: "Default Assistant", prompt: "You are a professional, helpful assistant. Give short, elegant, concise answers." },
  { id: "coder", name: "Expert Software Architect", prompt: "You are a senior principal engineer and software architect. Answer technical questions with extreme depth, code snippets in typescript/node, and solid design patterns." },
  { id: "writer", name: "Copywriter & Editor", prompt: "You are a professional marketing copywriter and editor. Compose copy that is engaging, fluid, and persuasive, avoiding jargon and fluff." }
];

export default function ChatAssistants({ 
  onChatCompleted,
  preselectedModelId,
  onClearPreselected
}: ChatAssistantsProps) {
  const [model, setModel] = useState("kimi-k3");
  const modelInfo = MODELS_CATALOG.find(m => m.id === model) || MODELS_CATALOG[0];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m0",
      role: "assistant",
      content: `Hello! I am your server-side assistant running ${modelInfo.name}. Choose any Open Foundation or NVIDIA NIM model from the panel to start a custom session.`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPreset, setSystemPreset] = useState("general");
  const [customSystemInstruction, setCustomSystemInstruction] = useState(PRESET_PERSONAS[0].prompt);

  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle incoming pre-selected model hook from Overview
  useEffect(() => {
    if (preselectedModelId) {
      setModel(preselectedModelId);
      const info = MODELS_CATALOG.find(m => m.id === preselectedModelId);
      if (info) {
        setMessages([
          {
            id: "m_init_" + Date.now(),
            role: "assistant",
            content: `Connected successfully to **${info.name}** (${info.provider}).\n\n*Specs:* ${info.desc}\n\nAsk me anything!`,
            timestamp: new Date().toISOString()
          }
        ]);
      }
      if (onClearPreselected) {
        onClearPreselected();
      }
    }
  }, [preselectedModelId]);

  // Update initial system prompt preset on model switch
  useEffect(() => {
    // If we're on a coding model, default to expert developer, else default general
    const isCoding = model.includes("coding") || model.includes("deepseek") || model.includes("kimi") || model.includes("laguna");
    const targetPreset = isCoding ? "coder" : "general";
    
    setSystemPreset(targetPreset);
    const foundPreset = PRESET_PERSONAS.find(p => p.id === targetPreset);
    if (foundPreset) {
      setCustomSystemInstruction(foundPreset.prompt);
    }
  }, [model]);

  const handlePresetChange = (presetId: string) => {
    setSystemPreset(presetId);
    const foundPreset = PRESET_PERSONAS.find(p => p.id === presetId);
    if (foundPreset) {
      setCustomSystemInstruction(foundPreset.prompt);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 11),
      role: "user",
      content: userText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const chatHistory = messages
        .filter(m => !m.id.startsWith("m0") && !m.id.startsWith("m_init_")) // Skip welcome greetings
        .map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content
        }));

      const clientKey = localStorage.getItem("nvidia_api_key") || "";
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-nvidia-api-key": clientKey
        },
        body: JSON.stringify({
          model,
          message: userText,
          history: chatHistory,
          systemInstruction: customSystemInstruction,
          temperature
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(2, 11),
        role: "assistant",
        content: data.text,
        timestamp: new Date().toISOString(),
        latencyMs: data.latencyMs,
        tokens: data.tokens,
        modelUsed: modelInfo.name
      };

      setMessages(prev => [...prev, assistantMessage]);
      onChatCompleted(); // refresh global telemetry stats in layout

    } catch (error: any) {
      console.error("Chat API error:", error);
      const errorMessage: Message = {
        id: Math.random().toString(36).substring(2, 11),
        role: "assistant",
        content: `Error: ${error?.message || "Failed to establish secure gateway bridge to the foundation model server."}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "m0",
        role: "assistant",
        content: `Conversation thread refreshed for **${modelInfo.name}**. Let's start fresh!`,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-14rem)] min-h-[460px]">
      
      {/* Parameter Adjustment Panel - 1 Column (Horizon UI Specification) */}
      <div className="bg-[#111c44]/75 border border-[#1e2a5d]/75 backdrop-blur-md p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-white pb-2.5 border-b border-[#1e2a5d]/50">
            <SlidersHorizontal size={14} className="text-[#868CFF]" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#868CFF]">Specs & Persona</h3>
          </div>

          {/* Model selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Target Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[#0b1437]/80 border border-[#1e2a5d]/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#4318FF] cursor-pointer font-sans"
            >
              {MODELS_CATALOG.map(m => (
                <option key={m.id} value={m.id} className="bg-[#0b1437] text-white">{m.provider} - {m.name}</option>
              ))}
            </select>
          </div>

          {/* Preset System Persona */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Persona Preset</label>
            <div className="space-y-1.5">
              {PRESET_PERSONAS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetChange(preset.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all border ${
                    systemPreset === preset.id 
                      ? "bg-[#4318FF]/15 border-[#4318FF] text-[#868CFF]" 
                      : "bg-[#0b1437]/40 border-[#1e2a5d]/40 text-slate-400 hover:text-white hover:bg-[#1b254b]/40"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px]">
              <label className="font-extrabold uppercase tracking-wider text-slate-400">Temperature</label>
              <span className="font-mono text-[#868CFF] font-black">{temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-1 bg-[#111c44] rounded appearance-none cursor-pointer accent-[#868CFF]"
            />
          </div>

          {/* Custom System Prompt box */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Persona Instruction</label>
            <textarea
              rows={3}
              value={customSystemInstruction}
              onChange={(e) => {
                setCustomSystemInstruction(e.target.value);
                setSystemPreset("custom");
              }}
              className="w-full bg-[#0b1437]/80 border border-[#1e2a5d]/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#4318FF] resize-none font-sans leading-relaxed"
              placeholder="Inject custom system instructions..."
            />
          </div>
        </div>

        <button
          onClick={clearChat}
          className="w-full bg-[#0b1437]/60 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-[#1e2a5d]/60 hover:border-rose-500/20 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <Trash2 size={12} />
          <span>Clear Conversation</span>
        </button>
      </div>

      {/* Main Chat Interface - 3 Columns (Assistant UI + Horizon UI Mix) */}
      <div className="bg-[#111c44]/75 border border-[#1e2a5d]/75 backdrop-blur-md rounded-2xl shadow-xl flex flex-col lg:col-span-3 h-full overflow-hidden">
        {/* Chat window viewport */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-[#0b1437]/40 select-text">
          {messages.map((msg) => {
            const isBot = msg.role === "assistant";
            return (
              <div 
                key={msg.id} 
                className={`flex w-full ${isBot ? "justify-start" : "justify-end"}`}
              >
                <div className={`flex items-start space-x-3.5 max-w-[85%] ${isBot ? "" : "flex-row-reverse space-x-reverse"}`}>
                  {/* Assistant UI Icon Avatar */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 transition-all ${
                    isBot 
                      ? "bg-[#1b254b] border-[#1e2a5d] text-[#868CFF] shadow-md shadow-[#4318FF]/10" 
                      : "bg-[#4318FF] border-[#4318FF] text-white shadow-md shadow-[#4318FF]/10"
                  }`}>
                    {isBot ? <Cpu size={15} /> : <User size={15} />}
                  </div>

                  {/* Message Bubble wrapper */}
                  <div className="space-y-1.5">
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-lg ${
                      isBot 
                        ? "bg-[#0b1437]/90 border border-[#1e2a5d]/80 text-slate-100 rounded-tl-none" 
                        : "bg-gradient-to-r from-[#868CFF] to-[#4318FF] text-white rounded-tr-none"
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Assistant UI Telemetry Metadata */}
                    {isBot && msg.latencyMs && (
                      <div className="flex items-center space-x-2 px-1 text-[9px] font-mono text-slate-400">
                        <span className="text-[#868CFF] font-black uppercase tracking-wider">{msg.modelUsed}</span>
                        <span>•</span>
                        <span className="flex items-center space-x-0.5 bg-[#1b254b]/40 px-1.5 py-0.5 rounded border border-[#1e2a5d]/40">
                          <Clock size={8.5} className="text-slate-400" />
                          <span>{msg.latencyMs}ms</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-0.5 bg-[#1b254b]/40 px-1.5 py-0.5 rounded border border-[#1e2a5d]/40">
                          <Cpu size={8.5} className="text-slate-400" />
                          <span>{msg.tokens} tokens</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Skeleton Loader during generation */}
          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="flex items-start space-x-3.5 max-w-[85%]">
                <div className="w-9 h-9 rounded-xl bg-[#1b254b] border border-[#1e2a5d] text-[#868CFF] flex items-center justify-center">
                  <Bot size={15} />
                </div>
                <div className="bg-[#0b1437]/90 border border-[#1e2a5d]/80 p-4 rounded-2xl rounded-tl-none space-y-2.5 w-64 animate-pulse shadow-lg">
                  <div className="h-2.5 bg-[#1b254b] rounded-full w-5/6"></div>
                  <div className="h-2.5 bg-[#1b254b] rounded-full w-1/2"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Action input bar */}
        <div className="p-4 border-t border-[#1e2a5d]/70 bg-[#0b1437]/80 flex items-center space-x-2.5">
          <input
            type="text"
            disabled={isLoading}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Ask ${modelInfo.name} anything...`}
            className="flex-1 bg-[#111c44] border border-[#1e2a5d]/60 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#4318FF] placeholder-slate-500 font-sans"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3.5 bg-gradient-to-r from-[#868CFF] to-[#4318FF] hover:opacity-90 hover:shadow-lg hover:shadow-[#4318FF]/20 text-white rounded-xl transition-all disabled:opacity-40 cursor-pointer flex-shrink-0"
          >
            <Send size={13} fill="currentColor" />
          </button>
        </div>
      </div>

    </div>
  );
}
