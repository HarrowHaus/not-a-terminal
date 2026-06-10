import { create } from 'zustand'

export interface ChatOption {
  id: string
  name: string
  similarity: number
}

interface ChatMessage {
  id: string
  sender: 'you' | 'nat'
  text: string
  /** "Did you mean" template suggestions (0.4–0.6 confidence band). */
  options?: ChatOption[]
}

interface ChatState {
  messages: ChatMessage[]
  addMessage: (sender: 'you' | 'nat', text: string) => void
  updateLastNatMessage: (text: string, options?: ChatOption[]) => void
}

let nextId = 0

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    { id: 'seed-1', sender: 'you', text: 'Build a landing page for a free app builder called Not A Terminal' },
    { id: 'seed-2', sender: 'nat', text: 'Here it is. Type anything below to start building your own.' },
  ],
  addMessage: (sender, text) =>
    set((s) => ({
      messages: [...s.messages, { id: `msg-${++nextId}`, sender, text }],
    })),
  updateLastNatMessage: (text, options) =>
    set((s) => {
      const msgs = [...s.messages]
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].sender === 'nat') {
          msgs[i] = { ...msgs[i], text, options }
          break
        }
      }
      return { messages: msgs }
    }),
}))
