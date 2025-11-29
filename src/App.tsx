import { useMemo, useState } from 'react'
import { ChatWidget } from './components/ChatWidget'
import type { ChatConfig } from './types/chat'
import './App.css'

const buildDefaultConfig = (): ChatConfig => ({
  apiKey: 'VENDOR1-API-KEY',
  locale: 'en',
  theme: {
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    position: 'bottom-right',
  },
  labels: {
    welcomeMessage: 'Hello! Welcome to our store. How can I help you today?',
    placeholder: 'Type your message...',
    sendButton: 'Send',
  },
})

const optionalValue = (value: string) => (value.trim().length ? value : undefined)

function App() {
  const [config, setConfig] = useState<ChatConfig>(() => buildDefaultConfig())

  const scriptSnippet = useMemo(() => {
    const attrs: Array<[string, string | undefined]> = [
      ['data-api-key', config.apiKey],
      ['data-locale', config.locale],
      ['data-primary-color', config.theme?.primaryColor],
      ['data-secondary-color', config.theme?.secondaryColor],
      ['data-position', config.theme?.position],
      ['data-welcome-message', config.labels?.welcomeMessage],
      ['data-placeholder', config.labels?.placeholder],
      ['data-send-label', config.labels?.sendButton],
    ]

    const renderedAttrs = attrs
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => `  ${key}="${value}"`)
      .join('\n')

    return `<script src="https://wecare-chat-widget.vercel.app/chat-widget.js"\n  data-chat-widget\n${renderedAttrs}\n></script>`
  }, [config])

  const handleReset = () => setConfig(buildDefaultConfig())

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 sm:p-8 shadow-lg">
            <p className="uppercase text-sm tracking-wide text-white/70 mb-2">WeCare</p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">Chat Widget Playground</h1>
            <p className="text-base sm:text-lg text-white/90 max-w-3xl">
              Experiment with configuration, preview the embedded widget, and copy the exact script tag you
              need to drop into your storefront.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-6">
              <a
                href="https://github.com/htetarkarhlaing/wecare-chat-widget"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                View Repository
              </a>
              <a
                href="https://github.com/htetarkarhlaing/wecare-chat-widget/blob/main/README.md"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Read Documentation
              </a>
            </div>
          </header>

          <section className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
            <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-xl">
                <p className="font-semibold text-gray-900">1. Prepare</p>
                <p className="text-gray-600 text-sm mt-2">Set `VITE_API_BASE_URL` and `VITE_SOCKET_URL`, then build & host the bundle.</p>
              </div>
              <div className="p-4 border rounded-xl">
                <p className="font-semibold text-gray-900">2. Configure</p>
                <p className="text-gray-600 text-sm mt-2">Provide your API key plus optional locale + branding via `data-*` attributes.</p>
              </div>
              <div className="p-4 border rounded-xl">
                <p className="font-semibold text-gray-900">3. Launch</p>
                <p className="text-gray-600 text-sm mt-2">Widget auto-initializes or call `window.ChatWidget.init` manually.</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Configuration Playground</h2>
                <p className="text-gray-600">Adjust the values below—the live widget and script snippet update instantly.</p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-lg border text-sm font-semibold text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              >
                Reset to Defaults
              </button>
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
              <form className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Credentials</h3>
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">API Key *</span>
                      <input
                        type="text"
                        required
                        value={config.apiKey}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            apiKey: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-4 border rounded-xl bg-blue-50 text-sm text-blue-900">
                  API + WebSocket endpoints now come from your build-time `.env` (`VITE_API_BASE_URL`, `VITE_SOCKET_URL`). Override
                  them programmatically only if you have multiple backends per page.
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Primary Color</span>
                    <input
                      type="color"
                      value={config.theme?.primaryColor ?? '#3b82f6'}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          theme: {
                            ...prev.theme,
                            primaryColor: e.target.value,
                          },
                        }))
                      }
                      className="mt-1 h-10 w-full rounded-lg border-gray-300"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Secondary Color</span>
                    <input
                      type="color"
                      value={config.theme?.secondaryColor ?? '#64748b'}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          theme: {
                            ...prev.theme,
                            secondaryColor: e.target.value,
                          },
                        }))
                      }
                      className="mt-1 h-10 w-full rounded-lg border-gray-300"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Widget Position</span>
                  <select
                    className="mt-1 w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    value={config.theme?.position ?? 'bottom-right'}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        theme: {
                          ...prev.theme,
                          position: e.target.value as NonNullable<ChatConfig['theme']>['position'],
                        },
                      }))
                    }
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </label>

                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Locale</span>
                    <select
                      className="mt-1 w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      value={config.locale ?? 'en'}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          locale: e.target.value as ChatConfig['locale'],
                        }))
                      }
                    >
                      <option value="en">English</option>
                      <option value="my">Burmese</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Send Button Label</span>
                    <input
                      type="text"
                      value={config.labels?.sendButton ?? ''}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          labels: {
                            ...prev.labels,
                            sendButton: optionalValue(e.target.value),
                          },
                        }))
                      }
                      className="mt-1 w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Send"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Welcome Message</span>
                  <textarea
                    rows={3}
                    value={config.labels?.welcomeMessage ?? ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        labels: {
                          ...prev.labels,
                          welcomeMessage: optionalValue(e.target.value),
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Input Placeholder</span>
                  <input
                    type="text"
                    value={config.labels?.placeholder ?? ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        labels: {
                          ...prev.labels,
                          placeholder: optionalValue(e.target.value),
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </label>
              </form>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Embed Snippet</h3>
                  <pre className="bg-gray-900 text-gray-50 rounded-xl p-4 text-sm overflow-x-auto">
                    <code>{scriptSnippet}</code>
                  </pre>
                </div>
                <div className="p-4 border rounded-2xl bg-white text-sm text-gray-700">
                  Tip: Click the fullscreen button in the widget header to let the chat occupy the entire viewport when you
                  need more room.
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Live Config</h3>
                  <pre className="bg-gray-100 rounded-xl p-4 text-xs text-gray-800 overflow-x-auto">
                    {JSON.stringify(config, null, 2)}
                  </pre>
                </div>
                <div className="p-4 border rounded-2xl bg-blue-50 text-sm text-blue-900">
                  ⚠️ Use demo credentials only in this playground. Production widgets should use environment-specific keys.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ChatWidget config={config} />
    </div>
  )
}

export default App
