const express = require('express');
const { auth } = require('../middleware/auth');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');
const router = express.Router();

// Get all chats for the current user
router.get('/chats', auth, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const userType = req.userType;
    console.log("UserId: ", userId)
    const chats = await Chat.find({
      'participants': {
        $elemMatch: {
          userId: req.user._id,
          userType: userType
        }
      }
    })
      .populate('participants.userId', 'companyName fullName email')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      chats: chats.map(chat => {
        const otherParticipant = chat.participants.find(
          p => p.userId._id.toString() !== userId
        );

        return {
          id: chat._id,
          chatId: chat._id,
          otherUser: otherParticipant ? {
            id: otherParticipant.userId._id,
            name: otherParticipant.userId.companyName || otherParticipant.userId.fullName,
            type: otherParticipant.userType,
            email: otherParticipant.userId.email
          } : null,
          lastMessage: chat.lastMessage,
          unreadCount: 0, // You can implement this based on read status
          updatedAt: chat.updatedAt
        };
      })
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chats'
    });
  }
});

// Get messages for a specific chat
router.get('/chats/:chatId/messages', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, before } = req.query;

    // First, verify the user has access to this chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is a participant in this chat
    const isParticipant = chat.participants.some(
      p => p.userId.toString() === req.user._id.toString() && p.userType === req.userType
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat'
      });
    }

    const query = { chatId };
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    // Get messages without population first to see the raw data
    const messages = await Message.find(query)
      .sort({ timestamp: 1 })
      .limit(parseInt(limit));

    console.log("Raw messages from DB:", messages.map(m => ({
      id: m._id,
      senderId: m.senderId,
      senderModel: m.senderModel,
      recipientId: m.recipientId,
      recipientModel: m.recipientModel,
      content: m.content
    })));

    // Manually populate sender and recipient based on their models
    const populatedMessages = await Promise.all(
      messages.map(async (message) => {
        let senderData = null;
        let recipientData = null;

        // Populate sender
        if (message.senderModel === 'Company') {
          senderData = await mongoose.model('Company').findById(message.senderId).select('companyName email');
        } else if (message.senderModel === 'Specialist') {
          senderData = await mongoose.model('Specialist').findById(message.senderId).select('fullName email');
        }

        // Populate recipient
        if (message.recipientModel === 'Company') {
          recipientData = await mongoose.model('Company').findById(message.recipientId).select('companyName email');
        } else if (message.recipientModel === 'Specialist') {
          recipientData = await mongoose.model('Specialist').findById(message.recipientId).select('fullName email');
        }

        return {
          id: message._id.toString(),
          messageId: message._id.toString(),
          chatId: message.chatId,
          senderId: message.senderId.toString(),
          senderType: message.senderModel.toLowerCase(),
          senderName: senderData ? (senderData.companyName || senderData.fullName) : 'Unknown',
          recipientId: message.recipientId.toString(),
          recipientName: recipientData ? (recipientData.companyName || recipientData.fullName) : 'Unknown',
          content: message.content,
          timestamp: message.timestamp.toISOString(),
          read: message.read,
          status: 'delivered'
        };
      })
    );

    console.log("Populated messages:", populatedMessages);

    // Mark messages as read for the current user
    await Message.updateMany(
      {
        chatId,
        recipientId: req.user._id,
        read: false
      },
      { read: true }
    );

    res.json({
      success: true,
      messages: populatedMessages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Start a new chat
router.post('/chats/start', auth, async (req, res) => {
  try {
    const { recipientId, recipientType } = req.body;

    if (!recipientId || !recipientType) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and type are required'
      });
    }

    // Create participant arrays for comparison
    const participants = [
      { userId: req.user._id, userType: req.userType },
      { userId: recipientId, userType: recipientType }
    ];

    // Check if chat already exists using our custom method
    const existingChat = await Chat.findByParticipants(participants);

    if (existingChat) {
      await existingChat.populate('participants.userId', 'companyName fullName email');

      return res.json({
        success: true,
        chat: existingChat,
        message: 'Chat already exists'
      });
    }

    // Create new chat
    const chat = await Chat.create({
      participants: participants
    });

    await chat.populate('participants.userId', 'companyName fullName email');

    res.json({
      success: true,
      chat,
      message: 'Chat started successfully'
    });
  } catch (error) {
    console.error('Error starting chat:', error);

    // Handle duplicate key error specifically
    if (error.code === 11000) {
      // If we still get a duplicate, try to find the existing chat
      try {
        const { recipientId, recipientType } = req.body;
        const participants = [
          { userId: req.user._id, userType: req.userType },
          { userId: recipientId, userType: recipientType }
        ];

        const existingChat = await Chat.findByParticipants(participants);
        if (existingChat) {
          await existingChat.populate('participants.userId', 'companyName fullName email');
          return res.json({
            success: true,
            chat: existingChat,
            message: 'Chat found after duplicate error'
          });
        }
      } catch (findError) {
        console.error('Error finding chat after duplicate:', findError);
      }

      return res.status(400).json({
        success: false,
        message: 'Chat already exists between these users'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to start chat'
    });
  }
});

// Save message to database (called from WebSocket)
router.post('/messages', auth, async (req, res) => {
  try {
    const { chatId, senderId, recipientId, content, messageType = 'text' } = req.body;

    const message = await Message.create({
      chatId,
      senderId,
      senderModel: req.userType === 'company' ? 'Company' : 'Specialist',
      recipientId,
      recipientModel: req.userType === 'company' ? 'Specialist' : 'Company',
      content,
      messageType
    });

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        content,
        timestamp: new Date(),
        senderId
      },
      updatedAt: new Date()
    });

    await message.populate('senderId', 'companyName fullName');
    await message.populate('recipientId', 'companyName fullName');

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save message'
    });
  }
});

module.exports = router;