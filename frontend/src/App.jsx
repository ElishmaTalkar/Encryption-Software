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
import { saveIdentity, getIdentity, saveMessage, getChatHistory, markAsRead } from './db'

import Landing from './Landing'
import Auth from './Auth'
import Dashboard from './Dashboard'
import ChatRoom from './ChatRoom'
import './App.css'

// The URL to the FastAPI websocket backend (assumed to run locally on 8000)
const WS_URL = 'ws://localhost:8000/ws'

function App() {
  const [userId, setUserId] = useState(null)
  const [ws, setWs] = useState(null)
  const [connected, setConnected] = useState(false)

  // Dummy Bots
  const BOTS = [
    { id: 'CyberGuard', name: 'Cyber Guard', bio: 'Security System' },
    { id: 'EchoBot', name: 'Echo Bot', bio: 'Protocol Tester' },
    { id: 'Alice_PRV', name: 'Alice', bio: 'Verified Contact' }
  ]

  const [users, setUsers] = useState(BOTS.map(b => b.id))
  const [selectedUser, setSelectedUser] = useState(null)

  // Crypto State
  const [localKeyPair, setLocalKeyPair] = useState(null)
  const [sharedSecrets, setSharedSecrets] = useState({}) // user_id -> CryptoKey
  const [typingUsers, setTypingUsers] = useState({}) // user_id -> boolean

  // Chat State
  const [messages, setMessages] = useState({}) // target_id -> [{sender, text, isEncrypted}]
  const [inputText, setInputText] = useState('')
  const [showSecurityInfo, setShowSecurityInfo] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const secretsRef = useRef({}) // Ref to avoid WS reconnections on state change

  // Routing State: 'landing' | 'auth' | 'dashboard'
  const [view, setView] = useState('landing')
  const [sessionName, setSessionName] = useState('')

  // 1. Load or Generate Identity
  useEffect(() => {
    async function initIdentity() {
      const saved = await getIdentity()
      if (saved) {
        setUserId(saved.userId)
        setLocalKeyPair(saved.keyPair)
        // If they have an identity, we can skip landing potentially, 
        // but for now we follow the Landing -> Auth flow as requested.
      }
    }
    initIdentity()
  }, [])

  // WebSocket Connection Setup
  useEffect(() => {
    if (!localKeyPair || !userId) return

    const socket = new WebSocket(`${WS_URL}/${userId}`)

    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'users') {
        const realUsers = data.users.filter(u => u !== userId)
        // Keep bots at the top
        setUsers([...BOTS.map(b => b.id), ...realUsers])
      }
      else if (data.type === 'key_exchange') {
        const foreignPublicKey = await importPublicKey(data.publicKey)
        const secret = await deriveSharedSecret(localKeyPair.privateKey, foreignPublicKey)

        setSharedSecrets(prev => {
            const next = { ...prev, [data.sender]: secret }
            secretsRef.current = next
            return next
        })

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
      else if (data.type === 'typing') {
        setTypingUsers(prev => ({ ...prev, [data.sender]: data.isTyping }))
      }
      else if (data.type === 'chat') {
        const sender = data.sender
        const secret = secretsRef.current[sender] // Using ref to avoid closure issues

        if (!secret) return

        try {
          const decryptedText = await decryptMessage(secret, data.payload)
          const timestamp = data.timestamp || Date.now()
          
          await saveMessage(userId, { sender, text: decryptedText, timestamp, isRead: selectedUser === sender })

          setMessages(prev => {
            const history = prev[sender] || []
            return {
              ...prev,
              [sender]: [...history, { sender, text: decryptedText, isEncrypted: true, timestamp, isRead: selectedUser === sender }]
            }
          })
        } catch (err) {
          console.error('Failed to decrypt message:', err)
        }
      }
    }

    setWs(socket)
    return () => socket.close()
  }, [localKeyPair, userId]) // Removed sharedSecrets from dependencies to stop the loop

  // Typing signal logic
  const handleInputChange = (val) => {
    setInputText(val)
    if (!ws || !selectedUser) return

    ws.send(JSON.stringify({ type: 'typing', target: selectedUser, isTyping: true }))
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      ws.send(JSON.stringify({ type: 'typing', target: selectedUser, isTyping: false }))
    }, 2000)
  }

  // 2. Load History when selecting a user
  useEffect(() => {
    if (!selectedUser || !userId) return
    async function loadHistory() {
      const history = await getChatHistory(userId, selectedUser)
      
      // Mark as read in DB
      await markAsRead(userId, selectedUser)
      
      // Update state instantly so Dashboard clears notifications
      setMessages(prev => ({ 
        ...prev, 
        [selectedUser]: history.map(m => ({ ...m, isRead: true })) 
      }))
    }
    loadHistory()
  }, [selectedUser, userId])

  // 3. Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedUser])

  // UI Actions
  const initiateKeyExchange = async (targetUserId) => {
    if (!ws || !localKeyPair) return
    if (selectedUser === targetUserId) return

    setSelectedUser(targetUserId)
    setView('chatroom')

    // Handle Bot Handshake
    const isBot = BOTS.find(b => b.id === targetUserId)
    if (isBot) {
        // Bots "accept" keys instantly for demo
        const botKP = await generateKeyPair()
        const botSecret = await deriveSharedSecret(localKeyPair.privateKey, botKP.publicKey)
        setSharedSecrets(prev => {
            const next = { ...prev, [targetUserId]: botSecret }
            secretsRef.current = next
            return next
        })
        return
    }

    const myPublicKeyRaw = await exportPublicKey(localKeyPair.publicKey)
    ws.send(JSON.stringify({
      type: 'key_exchange',
      target: targetUserId,
      publicKey: myPublicKeyRaw,
      isInitiator: true
    }))
  }

  const getBotResponse = (botId, userMsg) => {
    const responses = {
        'CyberGuard': ["Your connection is fully audited.", "Quantum-safe protocols active.", "No leaks detected in your session."],
        'EchoBot': [`Encrypted echo: "${userMsg}"`, "Encryption looks solid on this end.", "Relay test successful."],
        'Alice_PRV': ["Hey! This channel is much safer.", "Did you see the new Security Dashboard?", "I'm only talking here from now on."]
    }
    const r = responses[botId] || ["Received."]
    return r[Math.floor(Math.random() * r.length)]
  }
  const sendMessage = async (e) => {
    if (e) e.preventDefault()
    await performSendMessage(inputText)
    setInputText('')
  }

  const handleSendMessageFromRoom = async (text) => {
    // Adapter for ChatRoom which sends raw text
    setInputText(text)
    // We delay slightly to let state update or just pass text directly
    // Let's refactor sendMessage to accept text directly
    await performSendMessage(text)
  }

  const performSendMessage = async (textToPulse) => {
    if (!textToPulse.trim() || !selectedUser || !ws) return

    const secret = sharedSecrets[selectedUser]
    if (!secret) return

    try {
      const encryptedBlob = await encryptMessage(secret, textToPulse)
      const isBot = BOTS.find(b => b.id === selectedUser)

      if (!isBot) {
        ws.send(JSON.stringify({
          type: 'chat',
          target: selectedUser,
          payload: encryptedBlob
        }))
      }

      const msgObj = { sender: userId, text: textToPulse, isEncrypted: true, timestamp: Date.now(), isRead: true }
      await saveMessage(selectedUser, msgObj)

      setMessages(prev => {
        const history = prev[selectedUser] || []
        return {
          ...prev,
          [selectedUser]: [...history, msgObj]
        }
      })

      if (!isBot) {
        ws.send(JSON.stringify({ type: 'typing', target: selectedUser, isTyping: false }))
      } else {
        setTypingUsers(prev => ({ ...prev, [selectedUser]: true }))
        setTimeout(async () => {
          const reply = getBotResponse(selectedUser, textToPulse)
          const timestamp = Date.now()
          const replyObj = { sender: selectedUser, text: reply, isEncrypted: true, timestamp, isRead: true }
          await saveMessage(userId, replyObj)
          setMessages(prev => {
            const h = prev[selectedUser] || []
            return { ...prev, [selectedUser]: [...h, replyObj] }
          })
          setTypingUsers(prev => ({ ...prev, [selectedUser]: false }))
        }, 1500)
      }
    } catch (err) {
      console.error('Encryption error:', err)
    }
  }

  const activeMessages = selectedUser ? (messages[selectedUser] || []) : []
  const hasSecret = selectedUser ? !!sharedSecrets[selectedUser] : false
  const isTargetTyping = selectedUser ? typingUsers[selectedUser] : false

  // Authentication Handler
  const handleAuthSuccess = async (name) => {
    setSessionName(name)
    
    // If no identity exists, create one
    if (!userId) {
      const newId = uuidv4().substring(0, 8)
      const kp = await generateKeyPair()
      setUserId(newId)
      setLocalKeyPair(kp)
      await saveIdentity(newId, kp)
    }
    
    setView('dashboard')
  }

  // --- Render Views ---

  if (view === 'landing') {
    return <Landing onGetStarted={() => setView('auth')} />
  }

  if (view === 'auth') {
    return (
      <>
        <div className="bg-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>
        <Auth onAuthSuccess={handleAuthSuccess} />
      </>
    )
  }

  if (view === 'dashboard') {
    return (
      <Dashboard 
        userId={userId}
        connected={connected}
        users={users}
        BOTS={BOTS}
        messages={messages}
        typingUsers={typingUsers}
        selectedUser={selectedUser}
        onUserSelect={initiateKeyExchange}
        onSendMessage={sendMessage}
      />
    )
  }

  return (
    <ChatRoom 
      selectedUser={selectedUser}
      messages={messages}
      onSendMessage={handleSendMessageFromRoom}
      onBack={() => {
        setSelectedUser(null)
        setView('dashboard')
      }}
      userId={userId}
      typingUsers={typingUsers}
      hasSecret={hasSecret}
      bots={BOTS}
    />
  )
}

export default App
