'use client';

import { DynamicConfigForm } from './dynamic-config-form';

interface Tool {
  id: string;
  slug: string;
  title: string;
  toolTypeId: string;
  config?: unknown;
  toolType?: {
    id: string;
    name: string;
    displayName: string;
  };
}

interface Provider {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
}

interface ToolConfigFormProps {
  tool: Tool;
  providers: Provider[];
}

/**
 * Tool configuration form wrapper
 * Delegates to DynamicConfigForm which auto-generates form from tool definition
 */
export function ToolConfigForm({ tool, providers }: ToolConfigFormProps) {
  return <DynamicConfigForm tool={tool} providers={providers} />;
}
