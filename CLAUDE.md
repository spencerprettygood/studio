# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application with Firebase integration, built as a prompt management system called "roFl". The application helps users create, organize, optimize, and manage LLM prompts through an AI-powered conversational interface.

## Key Commands

### Development
- `npm run dev` - Start Next.js development server with Turbopack on port 9002
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit with file watching for hot reload

### Build & Production
- `npm run build` - Build the Next.js application for production
- `npm start` - Start the production server
- `npm run lint` - Run Next.js linting
- `npm run typecheck` - Run TypeScript type checking (tsc --noEmit)

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with TypeScript
- **Database**: Firebase Firestore
- **AI Integration**: Google Genkit with Gemini 2.0 Flash model
- **UI Components**: Radix UI with shadcn/ui components
- **Styling**: Tailwind CSS with custom animations
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form with Zod validation

### Project Structure
- `/src/app/` - Next.js app router pages and layouts
  - Main entry redirects to `/chat`
  - `/prompts/` - Prompt management pages (list, new, edit)
  - `/chat/` - AI conversational interface
- `/src/ai/` - AI integration layer
  - `genkit.ts` - Genkit configuration with Google AI
  - `/flows/` - AI workflow definitions (chat, categorization, optimization)
  - `/tools/` - Custom Genkit tools
- `/src/components/` - React components
  - `/ui/` - Reusable UI components (shadcn/ui based)
  - Business components (PromptCard, PromptForm, etc.)
- `/src/lib/` - Shared utilities and configurations
  - `firebase.ts` - Firebase initialization
  - `types.ts` - TypeScript type definitions
  - `utils.ts` - Utility functions

### Key Data Models

The main data structure is the `Prompt` interface (src/lib/types.ts:4-13):
- `id`, `name`, `description`, `template`
- `tags` array, `category` (optional)
- `createdAt`, `updatedAt` timestamps

### AI Flow Architecture

The application uses Genkit flows for AI operations:
1. **conversational-chat-flow** - Main chat interface that handles user interactions
2. **process-unstructured-prompts** - Batch processes multiple prompts from text
3. **generate-prompt-template-flow** - Creates new prompt templates
4. **optimize-prompt** - Improves existing prompts
5. **categorize-prompts-flow** - Auto-categorizes prompts

### Environment Configuration

Required environment variables (.env):
- `GEMINI_API_KEY` - Google AI API key for Genkit
- `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration (API key, auth domain, project ID, etc.)

### Firebase Integration

The app uses Firebase for:
- Firestore database for prompt storage
- Potential authentication (Firebase Auth setup present)
- App Hosting deployment configuration (apphosting.yaml)

### Important Configuration Notes

- TypeScript build errors are ignored in production (`ignoreBuildErrors: true` in next.config.ts:7)
- ESLint errors are ignored during builds (`ignoreDuringBuilds: true` in next.config.ts:10)
- Path alias configured: `@/*` maps to `./src/*`
- Turbopack enabled for faster development builds

### AI Assistant Persona

The AI assistant "roFl" has a specific personality defined in conversational-chat-flow.ts:102-103:
- Witty, highly intelligent, slightly irreverent
- Focused on prompt management tasks
- Provides helpful suggestions for prompt optimization