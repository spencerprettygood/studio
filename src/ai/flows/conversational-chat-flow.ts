
'use server';
/**
 * @fileOverview A basic conversational AI flow for PromptFlow.
 *
 * - conversationalChatFlow - Handles user input and generates an AI response.
 * - ConversationalChatInput - The input type for the flow.
 * - ConversationalChatOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConversationalChatInputSchema = z.object({
  userInput: z.string().describe('The text input from the user.'),
});
export type ConversationalChatInput = z.infer<typeof ConversationalChatInputSchema>;

const ConversationalChatOutputSchema = z.object({
  aiResponse: z.string().describe('The AI-generated response to the user input.'),
});
export type ConversationalChatOutput = z.infer<typeof ConversationalChatOutputSchema>;

export async function conversationalChat(input: ConversationalChatInput): Promise<ConversationalChatOutput> {
  return conversationalChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'conversationalChatPrompt',
  input: {schema: ConversationalChatInputSchema},
  output: {schema: ConversationalChatOutputSchema},
  prompt: `You are PromptFlow AI, a helpful and creative assistant for managing and optimizing LLM prompts.
  Engage in a friendly conversation and assist the user with their prompt-related tasks.
  Keep your responses concise and helpful.
  The user said: {{userInput}}`,
});

const conversationalChatFlow = ai.defineFlow(
  {
    name: 'conversationalChatFlow',
    inputSchema: ConversationalChatInputSchema,
    outputSchema: ConversationalChatOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        return { aiResponse: "I'm sorry, I couldn't generate a response right now." };
    }
    return output;
  }
);
