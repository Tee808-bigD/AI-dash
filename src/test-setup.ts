import '@testing-library/jest-dom';

// Reset VITE_ env vars for all tests.
// Vitest reads process.env.VITE_* into import.meta.env.VITE_*
process.env.VITE_NVIDIA_API_KEY = '';
process.env.VITE_SUPABASE_URL = '';
process.env.VITE_SUPABASE_ANON_KEY = '';
