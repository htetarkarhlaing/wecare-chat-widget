# WeCare Chat Widget

Embeddable customer-support chat widget built with **React 19**, **Vite**, **TypeScript**, **Redux Toolkit**, and **Socket.IO**. This package bundles everything needed to drop a chat bubble into any storefront or marketing site while keeping the configuration surface small and declarative.

## Features

- 🎨 Themeable widget (brand colors + button position)
- 🌐 Locale-aware copy with cookie persistence
- 🔌 REST + Socket.IO connectivity helpers
- 🧩 Redux Toolkit store for predictable state management
- ⛶ One-click fullscreen mode for focused conversations
- 🧪 Playground UI (home page) to explore configuration options
- 🔐 Session-token persistence so visitors can resume conversations without re-entering info
- ⭐️ Built-in post-chat rating + optional feedback capture

## Getting Started

```bash
npm install
npm run dev   # start playground at http://localhost:5173
npm run build # type-check + production bundle
```

The widget entry file (`src/widget.tsx`) is what gets shipped to consuming sites. The playground (`src/App.tsx`) is only for local testing/documentation.

## Embedding the Widget

1. **Configure endpoints** – set `VITE_API_BASE_URL` and `VITE_SOCKET_URL` in your `.env` before building (see [Environment Variables](#environment-variables)).
2. **Host the bundle** – upload the generated `chat-widget.js` to your CDN or static host and add the script tag once per page:

```html
<script
  src="https://example.com/chat-widget.js"
  data-chat-widget
  data-api-key="YOUR_API_KEY"
  data-locale="en"
  data-primary-color="#3b82f6"
  data-secondary-color="#64748b"
  data-position="bottom-right"
  data-welcome-message="Hello! How can we help?"
  data-placeholder="Type a message"
  data-send-label="Send"
></script>
```

3. **Optional: control via JS** – the script auto-initializes when it sees `data-chat-widget`, but you can also manage it manually:

```js
window.ChatWidget.init({
  apiKey: 'YOUR_API_KEY',
  locale: 'en',
  theme: {
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
  },
})
window.ChatWidget.destroy()
```

### Configuration Reference

| Option | Type | Description |
| --- | --- | --- |
| `apiKey`* | `string` | Vendor API key (required). |
| `apiBaseUrl` | `string` | Automatically injected via `VITE_API_BASE_URL` at build time (can still be overridden programmatically). |
| `socketUrl` | `string` | Pulled from `VITE_SOCKET_URL` unless explicitly provided in code. |
| `locale` | `'en' \| 'my' \| 'zh'` | Used for labels + HTTP headers. |
| `theme.primaryColor` | `string` | Button + bubble primary hex. |
| `theme.secondaryColor` | `string` | Accent color. |
| `theme.position` | `'bottom-left' \| 'bottom-right'` | Dock position. |
| `labels.welcomeMessage` | `string` | Welcome copy shown after starting a session. |
| `labels.placeholder` | `string` | Chat input placeholder. |
| `labels.sendButton` | `string` | CTA label. |

### State Management

All widget UI + network state is handled by `Redux Toolkit`. If you embed the widget multiple times on the same page, `window.ChatWidget.init` spins up an isolated store instance for each call to avoid data bleed.

## Development Workflow

- `npm run dev`: Vite dev server with hot reload
- `npm run build`: Type-check + production build (used by deploy pipelines)
- `npm run preview`: Serve build artifacts locally

The playground home page doubles as living documentation—adjust the config form, verify behavior live, and copy the generated `<script>` snippet straight into your host site.

## Post-Chat Feedback Flow

1. **Session bootstrap** – the backend now returns both `sessionId` and `sessionToken`. The widget stores this token locally (scoped per browser) and automatically resumes the conversation, including full history, after refreshes.
2. **Secure messaging** – every session REST request (`GET /widget/chat/session/:id`, `POST /widget/chat/message`, `POST /widget/chat/session/:id/rating`) and the consumer Socket.IO `joinConversation` event attach `x-session-token` so only the initiating visitor can read/send data.
3. **Rating UX** – visitors can end any active chat via “End chat & leave a rating,” or they are prompted automatically once the conversation is closed by an agent. Ratings (1–5 stars) plus optional text feed `/widget/chat/session/:id/rating`, which resolves the conversation and broadcasts updates back to the partner dashboard.
4. **Success + reset** – after submitting feedback, the widget shows a thank-you state with a “Start a new conversation” CTA that clears local session storage.

## Testing Checklist

### Widget

- Start a new chat, reload the page, and verify the session + history resume automatically (network requests should include `x-session-token`).
- Exchange consumer ↔ agent messages and confirm they continue to stream live through Socket.IO after a reload.
- Trigger “End chat & leave a rating,” submit stars + feedback, and ensure the thank-you state appears and the conversation switches to a non-active status on the partner dashboard.
- Attempt to fetch/send messages after manually clearing `localStorage` to confirm the widget falls back to the user-info form.

### Partner Dashboard

- Load `/dashboard/chat`, confirm the conversation list populates via Redux + REST, and that selecting a conversation fetches detail history.
- Send an agent reply and watch it appear immediately in both the list preview and detail pane while Socket.IO listeners run.
- Close a conversation in the backend (or after a rating) and refresh the dashboard to ensure rating stars + feedback snippets render in the header/list.

## Environment Variables

Create a `.env` (or `.env.production`) file before running `vite build`:

```bash
VITE_API_BASE_URL=https://api.wecare.com
VITE_SOCKET_URL=https://ws.wecare.com
```

These values are baked into the compiled widget and used whenever the host page does not explicitly provide overrides.
