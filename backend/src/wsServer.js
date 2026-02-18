const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./middleware/auth');
const Message = require('./models/Message');
const Chat = require('./models/Chat');
const mongoose = require('mongoose');

class ChatServer {
  constructor(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/chat'
    });
    this.clients = new Map(); 
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection attempted');

      // Extract token from URL query string
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId.toString();
        const userType = decoded.userType;

        console.log(`WebSocket authenticated: ${userType} ${userId}`);

        // Store the connection
        this.clients.set(userId, ws);

        // Store user info on the websocket
        ws.userId = userId;
        ws.userType = userType;

        // Send connection confirmation
        ws.send(JSON.stringify({
          type: 'connection_established',
          message: 'WebSocket connection established successfully',
          userId: userId
        }));

        ws.on('message', async (data) => {
          try {
            const message = JSON.parse(data);
            await this.handleMessage(ws, message);
          } catch (error) {
            console.error('Error parsing message:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid message format'
            }));
          }
        });

        ws.on('close', () => {
          console.log(`WebSocket disconnected: ${userId}`);
          this.clients.delete(userId);
        });

        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.clients.delete(userId);
        });

      } catch (error) {
        console.error('WebSocket authentication failed:', error);
        ws.close(1008, 'Invalid token');
      }
    });
  }

  async handleMessage(senderWs, message) {
    const { type, recipientId, content, chatId } = message;

    switch (type) {
      case 'message':
        await this.sendMessage(senderWs, recipientId, content, chatId);
        break;
      case 'typing':
        this.sendTypingIndicator(senderWs, recipientId);
        break;
      case 'read_receipt':
        this.sendReadReceipt(senderWs, recipientId, chatId);
        break;
      default:
        senderWs.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  async sendMessage(senderWs, recipientId, content, chatId) {
    if (!recipientId || !content) {
      senderWs.send(JSON.stringify({
        type: 'error',
        message: 'Recipient ID and content are required'
      }));
      return;
    }

    try {
      // Save message to database first
      const messageDoc = await Message.create({
        chatId,
        senderId: senderWs.userId,
        senderModel: senderWs.userType === 'company' ? 'Company' : 'Specialist',
        recipientId,
        recipientModel: senderWs.userType === 'company' ? 'Specialist' : 'Company',
        content,
        messageType: 'text'
      });

      // Update chat's last message
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: {
          content,
          timestamp: new Date(),
          senderId: senderWs.userId
        },
        updatedAt: new Date()
      });

      // Manually populate sender and recipient
      let senderData = null;
      let recipientData = null;

      if (messageDoc.senderModel === 'Company') {
        senderData = await mongoose.model('Company').findById(messageDoc.senderId).select('companyName');
      } else {
        senderData = await mongoose.model('Specialist').findById(messageDoc.senderId).select('fullName');
      }

      if (messageDoc.recipientModel === 'Company') {
        recipientData = await mongoose.model('Company').findById(messageDoc.recipientId).select('companyName');
      } else {
        recipientData = await mongoose.model('Specialist').findById(messageDoc.recipientId).select('fullName');
      }

      const messageData = {
        type: 'message',
        id: messageDoc._id.toString(),
        messageId: messageDoc._id.toString(),
        chatId: messageDoc.chatId,
        senderId: messageDoc.senderId.toString(),
        senderName: senderData ? (senderData.companyName || senderData.fullName) : 'Unknown',
        senderType: senderWs.userType,
        recipientId: messageDoc.recipientId.toString(),
        recipientName: recipientData ? (recipientData.companyName || recipientData.fullName) : 'Unknown',
        content: messageDoc.content,
        timestamp: messageDoc.timestamp.toISOString(),
        read: false,
        status: 'delivered'
      };

      // Send to recipient if online
      const recipientWs = this.clients.get(recipientId);
      if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
        console.log(`Sending message to recipient: ${recipientId}`);
        recipientWs.send(JSON.stringify(messageData));

        // Mark as read if recipient is online
        await Message.findByIdAndUpdate(messageDoc._id, { read: true });
        messageData.read = true;
      } else {
        console.log(`Recipient ${recipientId} is offline`);
      }

      // Send confirmation to sender (with updated read status)
      senderWs.send(JSON.stringify({
        ...messageData,
        status: 'sent'
      }));

      console.log(`Message sent from ${senderWs.userId} to ${recipientId}, saved to DB: ${messageDoc._id}`);

    } catch (error) {
      console.error('Error sending message:', error);
      senderWs.send(JSON.stringify({
        type: 'error',
        message: 'Failed to send message'
      }));
    }
  }

  sendTypingIndicator(senderWs, recipientId) {
    const typingMessage = {
      type: 'typing',
      senderId: senderWs.userId,
      senderType: senderWs.userType,
      recipientId,
      timestamp: new Date().toISOString()
    };

    const recipientWs = this.clients.get(recipientId);
    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
      recipientWs.send(JSON.stringify(typingMessage));
    }
  }

  sendReadReceipt(senderWs, recipientId, chatId) {
    const readReceipt = {
      type: 'read_receipt',
      senderId: senderWs.userId,
      recipientId,
      chatId,
      timestamp: new Date().toISOString()
    };

    const recipientWs = this.clients.get(recipientId);
    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
      recipientWs.send(JSON.stringify(readReceipt));
    }
  }

  // Method to send system messages (like match notifications)
  sendSystemMessage(userId, message) {
    const userWs = this.clients.get(userId.toString());
    if (userWs && userWs.readyState === WebSocket.OPEN) {
      userWs.send(JSON.stringify({
        type: 'system',
        content: message,
        timestamp: new Date().toISOString()
      }));
    }
  }
}

module.exports = ChatServer;