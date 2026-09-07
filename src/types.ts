export interface ModelOutput {
  modelId: string;
  modelName: string;
  text: string;
  tokens: number;
  latencyMs: number;
  loading: boolean;
  error?: string;
}

export interface ComparisonResult {
  model: string;
  text: string;
  tokens: number;
  latencyMs: number;
  error?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  type: "comparison" | "chat";
  prompt: string;
  model?: string;
  text?: string;
  latencyMs?: number;
  tokens?: number;
  results?: ComparisonResult[];
}

export interface MetricsData {
  totalTokensUsed: number;
  totalRuns: number;
  totalLatencySum: number;
  totalCostSavings: number;
  history: HistoryItem[];
}

export type ActiveTab = 
  | "overview" 
  | "multimodal" 
  | "video" 
  | "playground" 
  | "chat" 
  | "rag" 
  | "benchmark" 
  | "analytics" 
  | "settings";

export interface VideoScene {
  sceneNumber: number;
  duration: number;
  visualDescription: string;
  narration: string;
  textOverlay: string;
  cameraMotion: string;
  imageUrl?: string;
  voiceAudioUrl?: string;
}

export interface VideoScriptResponse {
  title: string;
  estimatedDuration: number;
  summary: string;
  scenes: VideoScene[];
  isSimulated?: boolean;
}

// NeMo Retriever RAG Types
export interface RAGChunk {
  id: string;
  docId: string;
  docTitle: string;
  text: string;
  tokenCount: number;
  similarityScore?: number;
  rerankScore?: number;
}

export interface RAGDocument {
  id: string;
  title: string;
  category: string;
  rawContent: string;
  chunks: RAGChunk[];
  uploadDate: string;
  fileSize: string;
}

export interface RAGCitations {
  chunkId: string;
  docTitle: string;
  snippet: string;
  relevanceScore: number;
}

export interface RAGResponse {
  answerWithRag: string;
  answerWithoutRag: string;
  citations: RAGCitations[];
  latencyMs: number;
  embeddingLatencyMs: number;
  retrieverModel: string;
  llmModel: string;
}

// Benchmark Matrix Types
export interface BenchmarkPrompt {
  id: string;
  title: string;
  category: "Reasoning" | "Code Synthesis" | "JSON Schema" | "Safety & Red Teaming" | "Multimodal Planning";
  prompt: string;
  expectedFormat: string;
  difficulty: "Standard" | "Complex" | "Extreme";
}

export interface BenchmarkModelScore {
  modelId: string;
  modelName: string;
  output: string;
  latencyMs: number;
  tokensGenerated: number;
  tokensPerSecond: number;
  passedValidation: boolean;
  score: number; // 0 - 100
  notes: string;
}

export interface BenchmarkRunResult {
  promptId: string;
  promptTitle: string;
  timestamp: string;
  results: Record<string, BenchmarkModelScore>;
}

// Media Asset Bin Item
export interface MediaAssetItem {
  id: string;
  title: string;
  type: "image" | "video" | "audio" | "code";
  url: string;
  prompt: string;
  modelUsed: string;
  createdAt: string;
  size?: string;
  metadata?: Record<string, any>;
}

// Budget Guardrails
export interface BudgetConfig {
  monthlyLimitUsd: number;
  spentUsd: number;
  tokenLimit: number;
  tokensUsed: number;
  autoDowngradeEnabled: boolean;
  downgradeThresholdPercent: number; // e.g. 85%
  fallbackModelId: string;
  customGatewayUrl?: string;
}
