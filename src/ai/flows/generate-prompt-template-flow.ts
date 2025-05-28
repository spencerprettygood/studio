
'use server';
/**
 * @fileOverview A Genkit flow to generate a prompt template based on user requirements.
 *
 * - generatePromptTemplate - Generates a prompt template, suggested name, and explanation.
 * - GeneratePromptTemplateInput - The input type for the flow.
 * - GeneratePromptTemplateOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePromptTemplateInputSchema = z.object({
  purpose: z.string().describe('The main goal or purpose of the prompt.'),
  requiredInputs: z.array(z.string()).optional().describe('A list of placeholder variable names (without curly braces) that the prompt template should include. E.g., ["topic", "audience"].'),
  desiredOutputDescription: z.string().describe('A description of what the output from the LLM should look like or achieve.'),
  additionalContext: z.string().optional().describe('Any other context, such as tone, style, constraints, or examples.'),
});
export type GeneratePromptTemplateInput = z.infer<typeof GeneratePromptTemplateInputSchema>;

const GeneratePromptTemplateOutputSchema = z.object({
  suggestedName: z.string().describe('A concise, descriptive name for the generated prompt template (e.g., "Blog Post Idea Generator").'),
  generatedTemplate: z.string().describe('The generated prompt template string, incorporating the required inputs as {{variableName}} placeholders.'),
  explanation: z.string().describe('A brief explanation of how the generated prompt template works or how it was designed based on the input.'),
});
export type GeneratePromptTemplateOutput = z.infer<typeof GeneratePromptTemplateOutputSchema>;


export const generatePromptTemplate = ai.defineFlow(
  {
    name: 'generatePromptTemplateFlow',
    inputSchema: GeneratePromptTemplateInputSchema,
    outputSchema: GeneratePromptTemplateOutputSchema,
  },
  async (input) => {
    // Construct the prompt string for the LLM
    let llmInstruction = `You are an expert prompt engineer. Your task is to generate a high-quality LLM prompt template based on the user's requirements.

User's Requirements:
- Purpose of the prompt: ${input.purpose}
- Desired output: ${input.desiredOutputDescription}`;

    if (input.requiredInputs && input.requiredInputs.length > 0) {
      llmInstruction += `\n- Key inputs/variables to include: ${input.requiredInputs.map(v => `{{${v}}}`).join(', ')}`;
    }
    if (input.additionalContext) {
      llmInstruction += `\n- Additional context/constraints: ${input.additionalContext}`;
    }

    llmInstruction += `

Based on these requirements, provide:
1.  A concise, descriptive name for this prompt template.
2.  The prompt template itself. Ensure all specified key inputs are included as {{variableName}} placeholders.
3.  A brief explanation of how the prompt is designed to meet the user's needs.

Return ONLY a JSON object matching the output schema description.`;

    const { output } = await ai.generate({
      prompt: llmInstruction,
      output: {
        format: 'json',
        schema: GeneratePromptTemplateOutputSchema,
      },
      model: 'googleai/gemini-2.0-flash', 
    });

    if (!output) {
      throw new Error('Failed to generate prompt template. AI model did not return output.');
    }
    return output;
  }
);
