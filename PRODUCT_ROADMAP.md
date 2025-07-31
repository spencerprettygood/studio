# Product Roadmap: roFl

## 1. Product Description

roFl is an intelligent, conversational prompt engineering workspace that streamlines the entire lifecycle of prompt creation, from ideation and generation to optimization and organization, all through an intuitive and fluid chat interface.

## 2. Feature Expansion (Roadmap)

### Phase 1: MVP (Current Implemented Features)

This is the foundational version of the application, proving the core concepts of conversational and AI-assisted prompt management.

*   **Product Description:** An AI-powered, single-user tool for generating, analyzing, and managing a personal library of prompts. All data is stored in-memory for the current session, making it a powerful scratchpad and development environment.
*   **Core Feature Set:**
    *   **Conversational AI Assistant:** A chat interface for interacting with the "roFl" AI.
    *   **Batch Prompt Processor:** Ability to paste unstructured text and have the AI identify and analyze potential prompts.
    *   **Interactive Prompt Generation:** The AI asks clarifying questions to help users create new, well-structured prompt templates.
    *   **Prompt Library Dashboard:** A UI to view, filter, search, create, edit, and delete prompts.
    *   **AI Prompt Optimizer:** An integrated tool in the edit form to get AI-driven suggestions for improving a prompt.
    *   **Export to JSON:** Ability to save individual prompts as JSON files.
*   **Necessary Fixes to Complete the MVP:**
    *   **State Synchronization:** The most critical issue. Actions in the `/chat` page (like saving a new prompt) are not reflected in the `/prompts` dashboard without a full page reload. This breaks the feeling of a cohesive application.
    *   **Global Navigation:** There are no UI links to navigate between the core sections (`/chat` and `/prompts`), forcing the user to change the URL manually. This is a major usability gap.

### Phase 2: Production-Ready & Foundational Enhancements

This phase focuses on transforming the MVP from a session-based tool into a persistent, multi-user-ready application.

*   **Product Description:** A robust, secure, and persistent web application that allows individual users to create, save, and manage their own private prompt libraries with a seamless, interconnected user experience.
*   **Development Plan:**
    *   **Firebase Firestore Integration:** Replace the entire `src/lib/mockPrompts.ts` system with a real-time, scalable NoSQL database (Firestore). This will provide data persistence.
    *   **Firebase Authentication:** Implement a full authentication system so users can sign up and have their own secure, private prompt libraries.
    *   **Shared State Management:** Introduce a lightweight state management library (like Zustand) or a data-fetching library (like React Query) to synchronize state across the entire application, fixing the MVP's state issue.
    *   **Global Navigation UI:** Implement a persistent sidebar or header navigation component that allows users to easily switch between the chat interface and the prompt library dashboard.

### Phase 3: Advanced Features & Collaboration

This phase expands "roFl" from a personal tool into a collaborative, professional-grade prompt engineering platform.

*   **Product Description:** A collaborative, intelligent workspace for teams to build, share, test, and deploy enterprise-grade prompt systems, enhanced with version control and advanced AI-powered analytics.
*   **Development Plan:**
    *   **Team Workspaces:** Allow users to create or join teams to collaborate on shared prompt libraries, with role-based access controls.
    *   **Prompt Versioning:** Automatically save a history of changes for each prompt. Users can view, compare, and revert to previous versions.
    *   **AI-Powered Semantic Search:** Move beyond keyword search. Implement vector embeddings to allow users to search for prompts based on their meaning and intent, not just the words they contain.
    *   **Prompt A/B Testing Module:** Create a UI where a user can run two versions of a prompt against an LLM with the same inputs to compare performance and track results.
    *   **Community Marketplace:** A hub where users can publish their best prompts for the community to use, with features for upvoting, commenting, and forking.

## 3. The Interface Innovation: Asymmetric Focus

### The Reasoning

Standard chat interfaces are a solved problem—they are symmetrical, predictable, and utilitarian. For "roFl" to be a truly innovative *workspace*, its interface must reflect a new, more dynamic way of interacting. The goal is to break the rigid, centered-column layout to create a more artistic, focused, and creative user experience.

The core idea is **asymmetric design**. By de-centering the main content, we create intentional negative space that draws the user's eye and makes the application feel less like a simple utility and more like a creative canvas. This allows for future UI elements (like context panels or data visualizations) to be introduced without cluttering the primary interaction area. We will move the conversation slightly off-center, making the interaction feel more personal and direct, while using the header and input fields to create a strong, unconventional visual anchor. This is not just a style choice; it is a statement that "roFl" is a different kind of tool.

### Applying the Revamp

The following changes should be applied to `src/app/chat/page.tsx` and `src/app/globals.css` to implement this vision:

1.  **Layout:** The entire chat view—header, message area, and input form—will be shifted to create an asymmetric layout, primarily anchored to the left.
2.  **Header:** The "roFl" title will be positioned fixed in the top-left, acting as a strong branding anchor.
3.  **Chat Area:** The message container will be given asymmetric margins, pushing it off-center and creating a more dynamic visual flow for the conversation.
4.  **Input Form:** The text input and send button will be aligned with the chat area's asymmetric positioning, reinforcing the focused layout.
5.  **Styling:** A "hairline" border will be introduced on the input form for a sharp, technical feel, and the color palette from `globals.css` will be consistently applied to create a polished, premium look.
