
import { z } from 'zod';

export interface Prompt {
  id: string;
  name: string;
  description: string;
  // For single prompts. For sequences, this might be a structured object.
  template: string; 
  tags: string[];
  // Consider using Date objects if performing date operations, otherwise ISO strings are fine.
  createdAt: string; 
  updatedAt: string;
  // Example for future prompt sequence structure:
  // steps?: Array<{ type: 'llmCall', prompt: string, model?: string } | { type: 'logic', condition: string }>;
  category?: string; // Optional category
}

export const PromptSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  template: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string().describe("ISO date string for when the prompt was created."),
  updatedAt: z.string().describe("ISO date string for when the prompt was last updated."),
  category: z.string().optional(),
});

export type PromptFormData = Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

export interface ProcessedPromptData {
  generatedTitle: string;
  identifiedPrompt: string;
  description: string;
  suggestedCategory: string;
  suggestedTags: string[];
  qualityAnalysis: string;
  followUpPromptSuggestion?: string;
}
