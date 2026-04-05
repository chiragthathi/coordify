export const createSocketClient = ({ url, onMessage, onOpen, onClose }) => {
  if (!url) {
    return { close: () => {} }
  }

  const socket = new WebSocket(url)

  socket.addEventListener('open', () => {
    if (typeof onOpen === 'function') onOpen()
  })

  socket.addEventListener('message', (event) => {
    if (typeof onMessage === 'function') {
      onMessage(event)
    }
  })

  socket.addEventListener('close', () => {
    if (typeof onClose === 'function') onClose()
  })

  return {
    close: () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close()
      }
    },
  }
}
