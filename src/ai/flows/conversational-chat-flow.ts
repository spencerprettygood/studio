
'use server';
/**
 * @fileOverview A conversational AI flow that can also process unstructured prompts.
 *
 * - conversationalChat - Handles user input, either generating an AI response or processing prompts.
 * - ConversationalChatInput - The input type for the flow.
 * - ConversationalChatOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { processUnstructuredPrompts, type ProcessUnstructuredPromptsOutput, type ProcessedPromptData } from '@/ai/flows/process-unstructured-prompts';

const ConversationalChatInputSchema = z.object({
  userInput: z.string().describe('The text input from the user.'),
});
export type ConversationalChatInput = z.infer<typeof ConversationalChatInputSchema>;

const ConversationalChatOutputSchema = z.object({
  aiResponse: z.string().describe('The AI-generated response to the user input.'),
});
export type ConversationalChatOutput = z.infer<typeof ConversationalChatOutputSchema>;

// Thresholds for detecting if input is a batch of prompts
const PROMPT_BATCH_MIN_LENGTH = 250; // Minimum characters
const PROMPT_BATCH_MIN_NEWLINES = 1; // Minimum newline characters

function formatProcessedPrompts(processedPrompts: ProcessedPromptData[]): string {
  if (!processedPrompts || processedPrompts.length === 0) {
    return "I tried to process the text you sent, but I couldn't identify any distinct prompts. You can try rephrasing or adding more details. Or, ask me to create a new prompt!";
  }

  let response = `I've processed the text and found ${processedPrompts.length} prompt(s):\n\n`;
  processedPrompts.forEach((prompt, index) => {
    response += `--- Prompt ${index + 1} ---\n`;
    response += `Title: ${prompt.generatedTitle}\n`;
    response += `Identified Prompt: "${prompt.identifiedPrompt}"\n`;
    response += `Description: ${prompt.description}\n`;
    response += `Suggested Category: ${prompt.suggestedCategory}\n`;
    response += `Suggested Tags: ${prompt.suggestedTags.join(', ')}\n`;
    response += `Quality Analysis: ${prompt.qualityAnalysis}\n`;
    if (prompt.followUpPromptSuggestion) {
      response += `Follow-up Suggestion: ${prompt.followUpPromptSuggestion}\n`;
    }
    response += `\n`;
  });
  response += "You can now ask me to save any of these, or refine them further!";
  return response;
}

export async function conversationalChat(input: ConversationalChatInput): Promise<ConversationalChatOutput> {
  const containsNewlines = (input.userInput.match(/\n/g) || []).length >= PROMPT_BATCH_MIN_NEWLINES;

  if (input.userInput.length > PROMPT_BATCH_MIN_LENGTH && containsNewlines) {
    // Likely a batch of prompts, attempt to process them
    try {
      const processingResult: ProcessUnstructuredPromptsOutput = await processUnstructuredPrompts({ unstructuredPrompts: input.userInput });
      const formattedResponse = formatProcessedPrompts(processingResult.processedPrompts);
      return { aiResponse: formattedResponse };
    } catch (error) {
      console.error("Error calling processUnstructuredPrompts flow from conversationalChat:", error);
      return { aiResponse: "I encountered an error while trying to process your prompts. Please try again, or ask me something else." };
    }
  } else {
    // Regular conversational input
    return conversationalChatFlow(input);
  }
}

const llmPrompt = ai.definePrompt({
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
    name: 'conversationalChatFlowInternal', // Renamed to avoid conflict if we export the top-level one too
    inputSchema: ConversationalChatInputSchema,
    outputSchema: ConversationalChatOutputSchema,
  },
  async (input) => {
    const {output} = await llmPrompt(input);
    if (!output) {
        return { aiResponse: "I'm sorry, I couldn't generate a response right now." };
    }
    return output;
  }
);
