import { apiRequest } from './api'

export const messageDeliveryLogService = {
  crear: async (deliveryData) => {
    const response = await apiRequest('/chatbot/message-delivery-logs', {
      method: 'POST',
      body: JSON.stringify(deliveryData),
    })

    return response.data
  },

  listarPorMessage: async (chatMessageId) => {
    const response = await apiRequest(`/chatbot/message-delivery-logs/message/${chatMessageId}`, {
      method: 'GET',
    })

    return response.data
  },
}
