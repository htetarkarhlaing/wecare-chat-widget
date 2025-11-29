import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ChatWidget } from "./components/ChatWidget";
import type { ChatConfig, ChatLocale } from "./types/chat";
import { createChatStore, type AppStore } from "./store";
import widgetStylesHref from "./index.css?url";

// Global interface for the widget
declare global {
	interface Window {
		ChatWidget: {
			init: (config: ChatConfig) => void;
			destroy: () => void;
		};
	}
}

let currentRoot: ReturnType<typeof createRoot> | null = null;
let currentStore: AppStore | null = null;
let stylesInjected = false;

const ensureStyles = () => {
	if (stylesInjected || typeof document === "undefined") return;
	const link = document.createElement("link");
	link.id = "wecare-chat-widget-styles";
	link.rel = "stylesheet";
	link.href = widgetStylesHref;
	document.head.appendChild(link);
	stylesInjected = true;
};

// Widget API
window.ChatWidget = {
	init: (config: ChatConfig) => {
		// Clean up any existing instance
		if (currentRoot) {
			window.ChatWidget.destroy();
		}

		// Create container
		const container = document.createElement("div");
		container.id = "chat-widget-container";

		document.body.appendChild(container);
		ensureStyles();

		// Create React root and render
		currentStore = createChatStore();
		currentRoot = createRoot(container);
		currentRoot.render(
			<Provider store={currentStore}>
				<ChatWidget config={config} />
			</Provider>,
		);
	},

	destroy: () => {
		if (currentRoot) {
			currentRoot.unmount();
			currentRoot = null;
		}

		currentStore = null;

		const container = document.getElementById("chat-widget-container");
		if (container) {
			container.remove();
		}
	},
};

// Auto-init if config is provided via data attributes
const isSupportedLocale = (value?: string | null): value is ChatLocale => {
	if (!value) return false;
	return ["en", "my", "zh"].includes(value.toLowerCase());
};

const isSupportedPosition = (
	value?: string | null,
): value is NonNullable<ChatConfig["theme"]>["position"] => {
	return value === "bottom-left" || value === "bottom-right";
};

document.addEventListener("DOMContentLoaded", () => {
	const script = document.querySelector("script[data-chat-widget]");
	if (!script) return;

	const apiKey = script.getAttribute("data-api-key");
	if (!apiKey) return;

	const primaryColor = script.getAttribute("data-primary-color") || "#3b82f6";
	const secondaryColor = script.getAttribute("data-secondary-color") || undefined;
	const positionAttr = script.getAttribute("data-position");
	const localeAttr = script.getAttribute("data-locale");
	const welcomeMessage = script.getAttribute("data-welcome-message") || undefined;
	const placeholder = script.getAttribute("data-placeholder") || undefined;
	const sendLabel = script.getAttribute("data-send-label") || undefined;

		const config: ChatConfig = {
		apiKey,
		locale: isSupportedLocale(localeAttr) ? localeAttr : undefined,
		theme: {
			primaryColor,
			secondaryColor,
			position: isSupportedPosition(positionAttr)
				? (positionAttr as NonNullable<ChatConfig["theme"]>["position"])
				: "bottom-right",
		},
		labels: {
			welcomeMessage: welcomeMessage || "Hello! How can we help you today?",
			placeholder,
			sendButton: sendLabel,
		},
	};

	window.ChatWidget.init(config);
});
