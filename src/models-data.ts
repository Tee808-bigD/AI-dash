export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  desc: string;
  downloadable: boolean;
  freeEndpoint: boolean;
  tags: string[];
  launchTime: string;
  downloads?: string;
  useCase: string;
}

export const MODELS_CATALOG: ModelInfo[] = [
  {
    id: "kimi-k3",
    name: "kimi-k3",
    provider: "Moonshotai",
    desc: "~2.8T hybrid KDA+MLA multimodal MoE for long-horizon coding, agentic tool use, and image understanding.",
    downloadable: true,
    freeEndpoint: true,
    tags: ["multimodal", "MoE", "agentic", "coding"],
    launchTime: "Today",
    useCase: "Speech-to-Text"
  },
  {
    id: "deepseek-v4-pro-0813",
    name: "deepseek-v4-pro-0813",
    provider: "DeepSeek AI",
    desc: "DeepSeek V4 scales to 1M-token context windows with efficient MoE architecture for coding tasks.",
    downloadable: false,
    freeEndpoint: true,
    tags: ["coding", "long-context", "MoE"],
    launchTime: "1d",
    useCase: "Coding"
  },
  {
    id: "wan2.2-animate-2-14b",
    name: "wan2.2-animate-2-14b",
    provider: "Wan-ai",
    desc: "Wan2.2-Animate-2 is a novel end-to-end character animation framework.",
    downloadable: true,
    freeEndpoint: false,
    tags: ["video editing", "animation"],
    launchTime: "9d",
    useCase: "Image Generation"
  },
  {
    id: "deepseek-v4-flash-0731",
    name: "deepseek-v4-flash-0731",
    provider: "DeepSeek AI",
    desc: "284B MoE (13B active) model ideal for long-context workloads optimized for coding, chat, and agentic workflows.",
    downloadable: false,
    freeEndpoint: true,
    tags: ["MoE", "coding", "agentic", "chat"],
    launchTime: "9d",
    useCase: "Coding"
  },
  {
    id: "nemotron-3.5-lightning-30b-a3b",
    name: "nemotron-3.5-lightning-30b-a3b",
    provider: "NVIDIA",
    desc: "Fastest 30B A3B MoE model with leading domain accuracy for specialized agentic tasks.",
    downloadable: true,
    freeEndpoint: true,
    tags: ["Customization", "agentic", "MoE"],
    launchTime: "17d",
    useCase: "Synthetic Data Generation"
  },
  {
    id: "muse-glimmer-30b",
    name: "muse-glimmer-30b",
    provider: "Meta",
    desc: "Muse Glimmer 30B is a multimodal reasoning model accepting text and images, with native tool-calling and separate reasoning output.",
    downloadable: true,
    freeEndpoint: true,
    tags: ["Multimodal", "reasoning", "tool-calling"],
    launchTime: "18d",
    useCase: "Speech-to-Text"
  },
  {
    id: "riva-translate-4b-instruct-v2",
    name: "riva-translate-4b-instruct-v2",
    provider: "NVIDIA",
    desc: "Translation model in 37 languages with few-shots example prompts capability.",
    downloadable: false,
    freeEndpoint: true,
    tags: ["nvidia nim", "translation", "few-shot"],
    launchTime: "1mo",
    useCase: "Speech-to-Text"
  },
  {
    id: "ising-calibration-1.5-31b",
    name: "ising-calibration-1.5-31b",
    provider: "NVIDIA",
    desc: "NVIDIA-Ising-Calibration-1.5 is a dense multimodal vision-language model built on Gemma 4 31B. It analyzes quantum computing calibration experiment plots and generates structured technical text.",
    downloadable: false,
    freeEndpoint: true,
    tags: ["Quantum Computing", "multimodal", "structured-output"],
    launchTime: "1mo",
    useCase: "Drug Discovery"
  },
  {
    id: "video-super-resolution-nim",
    name: "Video Super Resolution NIM",
    provider: "NVIDIA",
    desc: "Upscale encoded or ST 2110 video to higher resolutions with NVIDIA Video Super Resolution.",
    downloadable: true,
    freeEndpoint: false,
    tags: ["broadcast", "super-resolution", "video"],
    launchTime: "1mo",
    useCase: "Image Generation"
  },
  {
    id: "nemotron-3-embed-1b",
    name: "nemotron-3-embed-1b",
    provider: "NVIDIA",
    desc: "1B embedding model for semantic search, retrieval, and RAG applications.",
    downloadable: false,
    freeEndpoint: true,
    tags: ["Nemotron Retriever", "embeddings", "RAG"],
    launchTime: "1mo",
    useCase: "Drug Discovery"
  },
  {
    id: "laguna-xs-2.1",
    name: "laguna-xs-2.1",
    provider: "Poolside",
    desc: "Efficient 33B MoE for local, long-horizon agentic coding and terminal tasks.",
    downloadable: false,
    freeEndpoint: true,
    tags: ["Agentic AI", "MoE", "coding", "terminal"],
    launchTime: "1mo",
    useCase: "Coding"
  },
  {
    id: "qwen-image-edit-nvpcb-ovsl2sl",
    name: "qwen-image-edit-nvpcb-ovsl2sl",
    provider: "NVIDIA",
    desc: "An image edit model specialized for Omniverse synthetic to photographic solder-light style captured at NVIDIA PCB inspection stations.",
    downloadable: true,
    freeEndpoint: false,
    tags: ["Synthetic Data Generation", "omniverse", "image-editing"],
    launchTime: "1mo",
    useCase: "Synthetic Data Generation"
  },
  {
    id: "nemotron-ocr-v2",
    name: "nemotron-ocr-v2",
    provider: "NVIDIA",
    desc: "Nemotron OCR v2 is a state-of-the-art multilingual text recognition model designed for robust end-to-end optical character recognition (OCR) on complex real-world images.",
    downloadable: true,
    freeEndpoint: false,
    tags: ["Table Extraction", "OCR", "multilingual"],
    launchTime: "2mo",
    downloads: "338K",
    useCase: "Speech-to-Text"
  },
  {
    id: "minimax-m3",
    name: "minimax-m3",
    provider: "Minimaxai",
    desc: "MiniMax M3 Preview is a multimodal MoE vision-language model with strong reasoning, coding, and tool-calling capabilities.",
    downloadable: false,
    freeEndpoint: true,
    tags: ["coding", "MoE", "multimodal", "reasoning"],
    launchTime: "2mo",
    downloads: "10M",
    useCase: "Coding"
  },
  {
    id: "diffusiongemma-26b-a4b-it",
    name: "diffusiongemma-26b-a4b-it",
    provider: "Google",
    desc: "Diffusion-based 26B parameter LLM enabling parallel token generation for real-time text apps.",
    downloadable: true,
    freeEndpoint: true,
    tags: ["diffusion-llm", "fast-generation"],
    launchTime: "2mo",
    downloads: "4M",
    useCase: "Text-to-Image"
  },
  {
    id: "nemotron-3-ultra-550b-a55b",
    name: "nemotron-3-ultra-550b-a55b",
    provider: "NVIDIA",
    desc: "Open, efficient hybrid Mamba-Transformer MoE with 1M context, excelling in agentic reasoning, coding, planning, tool calling, and more.",
    downloadable: true,
    freeEndpoint: true,
    tags: ["Agent", "Mamba", "MoE", "large-context"],
    launchTime: "2mo",
    downloads: "52M",
    useCase: "Synthetic Data Generation"
  },
  {
    id: "chatterbox-multilingual-tts",
    name: "chatterbox-multilingual-tts",
    provider: "Resemble.AI",
    desc: "Natural and expressive voices in 23 languages. For voice agents and brand ambassadors.",
    downloadable: true,
    freeEndpoint: false,
    tags: ["TTS", "multilingual", "audio"],
    launchTime: "2mo",
    downloads: "22K",
    useCase: "Speech-to-Text"
  },
  {
    id: "nemotron-3.5-content-safety",
    name: "nemotron-3.5-content-safety",
    provider: "NVIDIA",
    desc: "Multilingual, multimodal model for detecting unsafe and toxic content.",
    downloadable: true,
    freeEndpoint: true,
    tags: ["llm safety", "moderation"],
    launchTime: "2mo",
    downloads: "2M",
    useCase: "Drug Discovery"
  },
  {
    id: "cosmos3-nano",
    name: "cosmos3-nano",
    provider: "NVIDIA",
    desc: "Generates physics-aware videos from text prompts or an image prompt for physical AI development.",
    downloadable: true,
    freeEndpoint: true,
    tags: ["autonomous vehicles", "video-generation", "physics-aware"],
    launchTime: "2mo",
    downloads: "2K",
    useCase: "Image Generation"
  },
  {
    id: "cosmos3-nano-reasoner",
    name: "cosmos3-nano-reasoner",
    provider: "NVIDIA",
    desc: "Vision language model that excels in understanding the physical world using structured reasoning on videos or images.",
    downloadable: true,
    freeEndpoint: true,
    tags: ["video understanding", "reasoning", "multimodal"],
    launchTime: "2mo",
    downloads: "2K",
    useCase: "Drug Discovery"
  },
  {
    id: "qwen-image",
    name: "qwen-image",
    provider: "Qwen",
    desc: "Qwen-Image is a text-to-image foundation model with advanced multilingual text rendering.",
    downloadable: true,
    freeEndpoint: false,
    tags: ["Text-to-Image", "multilingual"],
    launchTime: "3mo",
    useCase: "Text-to-Image"
  },
  {
    id: "qwen-image-edit",
    name: "qwen-image-edit",
    provider: "qwen-image-edit",
    desc: "Qwen-Image-Edit is an image editing model with multilingual text editing and strong subject consistency.",
    downloadable: true,
    freeEndpoint: false,
    tags: ["Text-to-Image", "image-editing"],
    launchTime: "3mo",
    useCase: "Text-to-Image"
  },
  {
    id: "nemotron-3-nano-omni-30b-a3b-reasoning",
    name: "nemotron-3-nano-omni-30b-a3b-reasoning",
    provider: "NVIDIA",
    desc: "Nemotron 3 Nano Omni is an omni-modal reasoning model that understands images, video, speech, text.",
    downloadable: true,
    freeEndpoint: true,
    tags: ["Image-to-Text", "multimodal", "omni-modal", "reasoning"],
    launchTime: "4mo",
    downloads: "8M",
    useCase: "Speech-to-Text"
  }
];
