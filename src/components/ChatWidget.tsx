import React from "react";
import type { ChatConfig, ChatLocale } from "../types/chat";
import { ChatButton } from "./ChatButton";
import { ChatWindow } from "./ChatWindow";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
	setChatOpen,
	toggleChat as toggleChatAction,
} from "../store/chatSlice";

interface ChatWidgetProps {
	config: ChatConfig;
}

const SUPPORTED_LOCALES: ChatLocale[] = ["en", "my", "zh"];
const LOCALE_COOKIE_NAME = "wecare_locale";

const normalizeLocale = (value?: string | null): ChatLocale | null => {
	if (!value) return null;
	const base = value.toLowerCase().split("-")[0];
	return SUPPORTED_LOCALES.includes(base as ChatLocale)
		? (base as ChatLocale)
		: null;
};

const detectLocale = (candidate?: string | null): ChatLocale => {
	const fromCandidate = normalizeLocale(candidate);
	if (fromCandidate) return fromCandidate;

	if (typeof document !== "undefined") {
		const attrLocale = normalizeLocale(
			document.documentElement.getAttribute("lang")
		);
		if (attrLocale) return attrLocale;

		const cookieValue = document.cookie
			.split(";")
			.map((part) => part.trim())
			.find((part) => part.startsWith(`${LOCALE_COOKIE_NAME}=`));
		if (cookieValue) {
			const [, rawValue] = cookieValue.split("=");
			const cookieLocale = normalizeLocale(rawValue);
			if (cookieLocale) return cookieLocale;
		}
	}

	if (typeof navigator !== "undefined") {
		const browserLocale = normalizeLocale(navigator.language);
		if (browserLocale) return browserLocale;

		if (Array.isArray(navigator.languages)) {
			for (const lang of navigator.languages) {
				const detected = normalizeLocale(lang);
				if (detected) return detected;
			}
		}
	}

	return "en";
};

export function ChatWidget({ config }: ChatWidgetProps) {
	const dispatch = useAppDispatch();
	const isOpen = useAppSelector((state) => state.chat.isOpen);
	const isFullscreen = useAppSelector((state) => state.chat.isFullscreen);

	const resolvedConfig = React.useMemo(() => {
		const fallbackApi =
			config.apiBaseUrl ||
			(import.meta.env.VITE_API_BASE_URL as string) ||
			"http://localhost:8000";
		const fallbackSocket =
			config.socketUrl ||
			(import.meta.env.VITE_SOCKET_URL as string) ||
			fallbackApi;
		const locale = detectLocale(config.locale);

		return {
			...config,
			apiBaseUrl: fallbackApi,
			socketUrl: fallbackSocket,
			locale,
		} satisfies ChatConfig;
	}, [config]);

	const theme = React.useMemo(() => {
		const primary = resolvedConfig.theme?.primaryColor || "#2563eb";
		const secondary = resolvedConfig.theme?.secondaryColor || "#f97316";
		const position = resolvedConfig.theme?.position || "bottom-right";

		return { primary, secondary, position };
	}, [resolvedConfig.theme]);

	const handleToggleChat = () => dispatch(toggleChatAction());
	const closeChat = () => dispatch(setChatOpen(false));

	React.useEffect(() => {
		if (!resolvedConfig.locale) return;
		const maxAge = 60 * 60 * 24 * 365; // 1 year
		document.cookie = `${LOCALE_COOKIE_NAME}=${resolvedConfig.locale}; path=/; max-age=${maxAge}`;
	}, [resolvedConfig.locale]);

	return (
		<>
			{!isFullscreen && (
				<ChatButton
					onClick={handleToggleChat}
					isOpen={isOpen}
					position={theme.position}
					primaryColor={theme.primary}
				/>
			)}
			<ChatWindow
				isOpen={isOpen}
				onClose={closeChat}
				config={resolvedConfig}
				primaryColor={theme.primary}
				secondaryColor={theme.secondary}
			/>
		</>
	);
}
