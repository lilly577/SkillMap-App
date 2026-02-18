const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  chatId: { 
    type: String, 
    required: true, 
    index: true 
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    refPath: 'senderModel' 
  },
  senderModel: { 
    type: String, 
    required: true, 
    enum: ['Company', 'Specialist'] 
  },
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    refPath: 'recipientModel' 
  },
  recipientModel: { 
    type: String, 
    required: true, 
    enum: ['Company', 'Specialist'] 
  },
  content: { 
    type: String, 
    required: true 
  },
  messageType: { 
    type: String, 
    default: 'text',
    enum: ['text', 'file', 'system'] 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound index for efficient chat queries
MessageSchema.index({ chatId: 1, timestamp: 1 });

module.exports = mongoose.model('Message', MessageSchema);