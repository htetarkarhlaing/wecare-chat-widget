# WeCare Chat Widget

Embeddable customer-support chat widget built with **React 19**, **Vite**, **TypeScript**, **Redux Toolkit**, and **Socket.IO**. This package bundles everything needed to drop a chat bubble into any storefront or marketing site while keeping the configuration surface small and declarative.

## Features

- 🎨 Themeable widget (brand colors + button position)
- 🌐 Locale-aware copy with cookie persistence
- 🔌 REST + Socket.IO connectivity helpers
- 🧩 Redux Toolkit store for predictable state management
- ⛶ One-click fullscreen mode for focused conversations
- 🧪 Playground UI (home page) to explore configuration options

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

## Environment Variables

Create a `.env` (or `.env.production`) file before running `vite build`:

```bash
VITE_API_BASE_URL=https://api.wecare.com
VITE_SOCKET_URL=https://ws.wecare.com
```

These values are baked into the compiled widget and used whenever the host page does not explicitly provide overrides.
