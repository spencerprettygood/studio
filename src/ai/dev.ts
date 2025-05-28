
import { config } from 'dotenv';
config();

import '@/ai/flows/optimize-prompt.ts';
import '@/ai/flows/process-unstructured-prompts.ts';
import '@/ai/flows/conversational-chat-flow.ts';
import '@/ai/flows/generate-prompt-template-flow.ts';
