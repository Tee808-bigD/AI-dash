# AgentVerse — Secrets & Environment Variables

## Required Secrets

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (safe for client-side) | Supabase Dashboard → Settings → API |
| `VITE_NVIDIA_API_KEY` | NVIDIA NIM API key for AI agent responses | [build.nvidia.com](https://build.nvidia.com/) |

## Optional Secrets (configured via UI)

These are configured through the **Integrations** page in the dashboard UI, but can also be set as env vars:

| Variable | Provider | Description |
|----------|----------|-------------|
| OpenAI key | `openai` | For GPT models via `api.openai.com/v1` |
| Anthropic key | `anthropic` | For Claude models via `api.anthropic.com/v1` |
| Google AI key | `google` | For Gemini models via `generativelanguage.googleapis.com` |

## Streamlit App Secrets

When deploying the `streamlit_app.py` on Streamlit Community Cloud, set these in **Settings → Secrets**:

```toml
# .streamlit/secrets.toml
SUPABASE_URL = "https://emrgtjwfomsjiwfmsddi.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_..."
NVIDIA_API_KEY = "nvapi-..."
```

## Setup

```bash
# 1. Copy the example env file
cp .env.example .env

# 2. Edit .env with your keys
# 3. Run the app
npm run dev      # React dashboard
streamlit run streamlit_app.py  # Streamlit version
```

> ⚠ **Never commit `.env` to git.** It's already in `.gitignore`.
