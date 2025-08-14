'use server';
/**
 * @fileOverview An AI flow to categorize a list of prompts by their use case.
 *
 * - categorizePromptsByUsecase - Analyzes prompts and groups them into visual, use-case-driven categories.
 * - CategorizePromptsInput - The input type for the flow.
 * - CategorizePromptsOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PromptSchema } from '@/lib/types';

const CategorizePromptsInputSchema = z.object({
  prompts: z.array(PromptSchema).describe('The full list of prompts to be categorized.'),
});
export type CategorizePromptsInput = z.infer<typeof CategorizePromptsInputSchema>;

const UseCaseCategorySchema = z.object({
  name: z.string().describe('The name of the use-case category (e.g., "Content Creation", "Data Analysis").'),
  description: z.string().describe('A brief, one-sentence description of what this category is for.'),
  // icon: z.string().optional().describe('A relevant lucide-react icon name for this category.'),
  promptIds: z.array(z.string()).describe('An array of prompt IDs that belong to this category.'),
});

const CategorizePromptsOutputSchema = z.object({
  categories: z.array(UseCaseCategorySchema).describe('An array of use-case categories with their associated prompts.'),
});
export type CategorizePromptsOutput = z.infer<typeof CategorizePromptsOutputSchema>;


const categorizationPrompt = ai.definePrompt({
    name: 'categorizePromptsPrompt',
    input: { schema: CategorizePromptsInputSchema },
    output: { schema: CategorizePromptsOutputSchema },
    prompt: `You are a product manager AI specializing in organizing prompt engineering workflows. Your task is to analyze a list of user-created prompts and group them into logical, high-level use-case categories.

    Analyze the provided list of prompts, considering their names, descriptions, and templates.
    
    Based on your analysis, define 3-5 broad categories that represent the primary goals or use cases of these prompts. Examples of good categories are "Content Creation," "Marketing & Sales," "Software Development," "Data Analysis," or "Customer Communication."
    
    For each category you define, provide:
    1. A short, clear name.
    2. A one-sentence description of the use case.
    3. A list of all prompt IDs that fall into that category. A prompt can belong to only one category. Ensure every prompt is assigned to a category.

    List of Prompts to analyze:
    {{#each prompts}}
    - ID: {{this.id}}, Name: {{this.name}}, Description: {{this.description}}, Template: {{this.template}}
    {{/each}}
    
    Return your response as a single JSON object that conforms to the defined output schema.
    `,
});

export const categorizePromptsByUsecase = ai.defineFlow(
    {
        name: 'categorizePromptsByUsecaseFlow',
        inputSchema: CategorizePromptsInputSchema,
        outputSchema: CategorizePromptsOutputSchema,
    },
    async (input) => {
        const { output } = await categorizationPrompt(input);
        if (!output) {
            return { categories: [] };
        }
        return output;
    }
);
