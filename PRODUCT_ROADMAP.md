# Product Roadmap: roFl

## 1. Product Description

roFl is an intelligent, conversational prompt engineering workspace that streamlines the entire lifecycle of prompt creation, from ideation and generation to optimization and organization, all through an intuitive and fluid chat interface.

## 2. Feature Expansion (Roadmap)

**V1 (Current):**
- Conversational AI assistant.
- AI-driven prompt generation and optimization tools.
- Manual and AI-assisted prompt library management.
- In-memory data storage (mock database).

**V2: Production Ready MVP**
- **Firestore Integration:** Replace `mockPrompts.ts` with a Firestore database for persistent, scalable storage of prompts.
- **Firebase Authentication:** Introduce user accounts so individuals can have their own private prompt libraries.
- **Shared State Management:** Implement a state management solution (like Zustand or React Query) to synchronize data across the application (e.g., saving in chat immediately reflects in the dashboard).
- **Global Navigation:** Add a simple, persistent navigation element to switch between the chat and the prompt library dashboard.

**V3: Advanced Features & Collaboration**
- **Team Workspaces:** Allow users to create or join teams to share and collaborate on prompt libraries.
- **Prompt Versioning:** Automatically save previous versions of a prompt when edits are made, allowing users to view history and revert changes.
- **AI-Powered Search:** Instead of simple text search, use an embedding-based (vector) search to find prompts by semantic meaning, not just keywords.
- **Prompt A/B Testing:** Create a UI where a user can run two variations of a prompt against an LLM with the same inputs to see which one performs better, tracking the results.
- **Marketplace / Community Hub:** A section where users can share their best prompts with the community, with features for upvoting and commenting.

## 3. The Interface Innovation: Asymmetric Focus

### The Reasoning

Standard chat interfaces are boring, symmetrical, and predictable. They are a solved problem. For "roFl" to be a truly innovative *workspace*, its interface needs to reflect a new way of interacting. The goal is to break the rigid, centered-column layout and create a more dynamic, artistic, and focused user experience.

The core idea is **asymmetric design**. By de-centering the main content, we create negative space that can be used intentionally. It draws the user's eye, feels less like a utility and more like a creative canvas, and allows for future UI elements (like context panels or visualizations) to be introduced without cluttering the main interaction area. We move the conversation slightly off-center, making the interaction feel more personal and direct, and use the header and input fields to create a strong, unconventional visual anchor. This is not just a style choice; it's a statement that this is a different kind of tool.

### Applying the Revamp

The following changes will be applied to `src/app/chat/page.tsx` and `src/app/globals.css` to implement this vision:

1.  **Layout:** The entire chat view—header, message area, and input form—will be shifted to create an asymmetric layout, primarily anchored to the left.
2.  **Header:** The "roFl" title will be positioned fixed in the top-left, acting as a strong branding anchor.
3.  **Chat Area:** The message container will be given asymmetric margins, pushing it off-center. This creates a more dynamic visual flow for the conversation.
4.  **Input Form:** The text input and send button will be aligned with the chat area's asymmetric positioning, reinforcing the focused layout.
5.  **Styling:** We will introduce a "hairline" border on the input form for a sharp, technical feel and ensure the color palette from `globals.css` is applied consistently to create a polished, premium look.
