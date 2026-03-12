import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Shield, Lock, Send, User, Server } from 'lucide-react'
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedSecret,
  encryptMessage,
  decryptMessage
} from './crypto'

import './App.css'

// The URL to the FastAPI websocket backend (assumed to run locally on 8000)
const WS_URL = 'ws://localhost:8000/ws'

function App() {
  const [userId] = useState(() => uuidv4().substring(0, 8))
  const [ws, setWs] = useState(null)
  const [connected, setConnected] = useState(false)

  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)

  // Crypto State
  const [localKeyPair, setLocalKeyPair] = useState(null)
  const [sharedSecrets, setSharedSecrets] = useState({}) // user_id -> CryptoKey

  // Chat State
  const [messages, setMessages] = useState({}) // target_id -> [{sender, text, isEncrypted}]
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)

  // Initialization
  useEffect(() => {
    async function initCrypto() {
      const kp = await generateKeyPair()
      setLocalKeyPair(kp)
      console.log('Generated ECDH Keypair for', userId)
    }
    initCrypto()
  }, [userId])

  // WebSocket Connection Setup
  useEffect(() => {
    if (!localKeyPair) return

    console.log('Connecting to WS...')
    const socket = new WebSocket(`${WS_URL}/${userId}`)

    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'users') {
        // Filter out ourselves
        setUsers(data.users.filter(u => u !== userId))
      }
      else if (data.type === 'key_exchange') {
        console.log(`Received public key from ${data.sender}`)
        // When someone sends us their public key, we derive a shared secret
        const foreignPublicKey = await importPublicKey(data.publicKey)
        const secret = await deriveSharedSecret(localKeyPair.privateKey, foreignPublicKey)

        setSharedSecrets(prev => ({ ...prev, [data.sender]: secret }))

        // If they initiated, we should send our public key back so they can talk to us
        if (data.isInitiator) {
          const myPublicKeyRaw = await exportPublicKey(localKeyPair.publicKey)
          socket.send(JSON.stringify({
            type: 'key_exchange',
            target: data.sender,
            publicKey: myPublicKeyRaw,
            isInitiator: false
          }))
        }
      }
      else if (data.type === 'chat') {
        const sender = data.sender
        const secret = sharedSecrets[sender]

        if (!secret) {
          console.error(`Received encrypted message from ${sender} but we have no shared secret!`)
          return
        }

        try {
          // Decrypt!
          const decryptedText = await decryptMessage(secret, data.payload)

          setMessages(prev => {
            const history = prev[sender] || []
            return {
              ...prev,
              [sender]: [...history, { sender, text: decryptedText, isEncrypted: true }]
            }
          })
        } catch (err) {
          console.error('Failed to decrypt message:', err)
        }
      }
    }

    setWs(socket)

    return () => socket.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localKeyPair, userId, sharedSecrets])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedUser])

  // UI Actions
  const initiateKeyExchange = async (targetUserId) => {
    if (!ws || !localKeyPair) return

    const myPublicKeyRaw = await exportPublicKey(localKeyPair.publicKey)
    ws.send(JSON.stringify({
      type: 'key_exchange',
      target: targetUserId,
      publicKey: myPublicKeyRaw,
      isInitiator: true
    }))

    setSelectedUser(targetUserId)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || !selectedUser || !ws) return

    const secret = sharedSecrets[selectedUser]
    if (!secret) {
      alert("Please wait for Key Exchange to finish before sending messages.")
      return
    }

    try {
      const encryptedBlob = await encryptMessage(secret, inputText)

      // Send ciphertext to server
      ws.send(JSON.stringify({
        type: 'chat',
        target: selectedUser,
        payload: encryptedBlob
      }))

      // Record locally as plaintext
      setMessages(prev => {
        const history = prev[selectedUser] || []
        return {
          ...prev,
          [selectedUser]: [...history, { sender: userId, text: inputText, isEncrypted: true }]
        }
      })

      setInputText('')
    } catch (err) {
      console.error('Failed to encrypt/send:', err)
    }
  }

  const activeMessages = selectedUser ? (messages[selectedUser] || []) : []
  const hasSecret = selectedUser ? !!sharedSecrets[selectedUser] : false

  return (
    <div className="app-container">
      <header className="glass-panel app-header">
        <div className="header-title">
          <Shield className="icon-shield" size={28} />
          <h1>Zero-Knowledge Chat</h1>
        </div>
        <div className="header-status">
          <span className={`status-dot ${connected ? 'status-green' : 'status-red'}`}></span>
          <span className="status-text">{connected ? 'Connected to Relay' : 'Connecting...'}</span>
          <div className="user-badge">
            <User size={16} /> ID: <strong>{userId}</strong>
          </div>
        </div>
      </header>

      <main className="main-layout">
        {/* Sidebar - Users */}
        <aside className="glass-panel sidebar">
          <h2><Server size={18} /> Online Users</h2>
          {users.length === 0 ? (
            <p className="empty-text">Waiting for others to join...</p>
          ) : (
            <div className="user-list">
              {users.map(u => (
                <div
                  key={u}
                  className={`user-item ${selectedUser === u ? 'active' : ''}`}
                  onClick={() => initiateKeyExchange(u)}
                >
                  <User size={16} /> User {u}
                  {sharedSecrets[u] && <Lock size={14} className="lock-icon" />}
                </div>
              ))}
            </div>
          )}

          <div className="crypto-status">
            <h3>Local ECDH Keypair</h3>
            <p>{localKeyPair ? '✅ Generated (P-256)' : '⏳ Generating...'}</p>
          </div>
        </aside>

        {/* Chat Area */}
        <section className="glass-panel chat-area">
          {!selectedUser ? (
            <div className="idle-state">
              <Lock size={48} className="idle-icon" />
              <h2>End-to-End Encrypted</h2>
              <p>Select a user to initiate WebCrypto ECDH Key Exchange and start chatting securely.</p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <h3>Chatting with {selectedUser}</h3>
                <div className={`e2e-badge ${hasSecret ? 'secure' : 'pending'}`}>
                  <Lock size={14} />
                  {hasSecret ? ' AES-GCM Secured' : ' Negotiating Keys...'}
                </div>
              </div>

              <div className="message-list">
                {activeMessages.length === 0 ? (
                  <p className="empty-chat">Start the secure conversation.</p>
                ) : (
                  activeMessages.map((m, idx) => (
                    <div key={idx} className={`message-wrapper ${m.sender === userId ? 'outgoing' : 'incoming'}`}>
                      <div className="message-bubble">
                        <p>{m.text}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="chat-input-area">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type an encrypted message..."
                  disabled={!hasSecret}
                />
                <button type="submit" disabled={!hasSecret || !inputText.trim()} className="button-primary icon-btn">
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
