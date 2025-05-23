'use server';

/**
 * @fileOverview An AI-powered prompt improvement tool.
 *
 * - optimizePrompt - A function that suggests ways to clarify or rephrase existing prompts.
 * - OptimizePromptInput - The input type for the optimizePrompt function.
 * - OptimizePromptOutput - The return type for the optimizePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizePromptInputSchema = z.object({
  prompt: z.string().describe('The prompt to be optimized.'),
  context: z.string().optional().describe('Context of the prompt, if any.'),
  successfulPrompts: z.array(z.string()).optional().describe('List of successful prompts to use as examples.'),
});
export type OptimizePromptInput = z.infer<typeof OptimizePromptInputSchema>;

const OptimizePromptOutputSchema = z.object({
  optimizedPrompt: z.string().describe('The optimized prompt suggestion.'),
  explanation: z.string().describe('Explanation of why the prompt was optimized in this way.'),
});
export type OptimizePromptOutput = z.infer<typeof OptimizePromptOutputSchema>;

export async function optimizePrompt(input: OptimizePromptInput): Promise<OptimizePromptOutput> {
  return optimizePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizePromptPrompt',
  input: {schema: OptimizePromptInputSchema},
  output: {schema: OptimizePromptOutputSchema},
  prompt: `You are an AI prompt optimizer. Your goal is to improve the given prompt so that it yields better results from LLMs.

  Here is the prompt to optimize:
  {{prompt}}

  {% if context %}Here is the context of the prompt:
  {{context}}{% endif %}

  {% if successfulPrompts %}Here are some examples of successful prompts that you can use as inspiration:
  {{#each successfulPrompts}}- {{{this}}}{{/each}}{% endif %}

  Please provide an optimized prompt and explain why you optimized it in this way. Return your response as a JSON object.
  `,
});

const optimizePromptFlow = ai.defineFlow(
  {
    name: 'optimizePromptFlow',
    inputSchema: OptimizePromptInputSchema,
    outputSchema: OptimizePromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
