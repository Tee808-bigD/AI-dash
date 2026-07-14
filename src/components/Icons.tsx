import React from 'react';
import { Search, Code2, BarChart3, PenTool, Bot } from 'lucide-react';

// Role-specific icon mapping for agents
export const ROLE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  researcher: Search,
  coder: Code2,
  analyst: BarChart3,
  writer: PenTool,
  assistant: Bot,
};
