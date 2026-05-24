import { apiRequest } from './api'

export const chatMessageService = {
  crear: async (messageData) => {
    const response = await apiRequest('/chatbot/chat-messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    })

    return response.data
  },

  listarPorSession: async (chatSessionId) => {
    const response = await apiRequest(`/chatbot/chat-messages/session/${chatSessionId}`, {
      method: 'GET',
    })

    return response.data
  },
}
