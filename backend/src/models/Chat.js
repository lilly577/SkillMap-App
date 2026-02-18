const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  participants: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true 
    },
    userType: { 
      type: String, 
      required: true, 
      enum: ['company', 'specialist'] 
    },
    lastRead: { 
      type: Date, 
      default: Date.now 
    }
  }],
  lastMessage: {
    content: String,
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    senderId: mongoose.Schema.Types.ObjectId
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound index to ensure unique chat between two specific users
ChatSchema.index({ 
  'participants.userId': 1,
  'participants.userType': 1 
}, { 
  unique: false // Remove uniqueness from this index
});

// Create a compound index that ensures unique combination of participants
// This prevents duplicate chats between the same two users
ChatSchema.index(
  { 
    'participants.userId': 1,
    'participants.userType': 1 
  },
  { 
    unique: true,
    partialFilterExpression: {
      $and: [
        { 'participants.0': { $exists: true } },
        { 'participants.1': { $exists: true } }
      ]
    }
  }
);

// Better approach: Create a virtual for the participant combination and ensure uniqueness
ChatSchema.pre('save', function(next) {
  // Sort participants to ensure consistent ordering for uniqueness check
  this.participants.sort((a, b) => {
    const aStr = a.userId.toString() + a.userType;
    const bStr = b.userId.toString() + b.userType;
    return aStr.localeCompare(bStr);
  });
  next();
});

// Method to find chat by participants
ChatSchema.statics.findByParticipants = function(participants) {
  const sortedParticipants = participants
    .map(p => ({ userId: p.userId, userType: p.userType }))
    .sort((a, b) => {
      const aStr = a.userId.toString() + a.userType;
      const bStr = b.userId.toString() + b.userType;
      return aStr.localeCompare(bStr);
    });
  
  return this.findOne({
    $and: sortedParticipants.map(participant => ({
      'participants': {
        $elemMatch: {
          userId: participant.userId,
          userType: participant.userType
        }
      }
    }))
  });
};

module.exports = mongoose.model('Chat', ChatSchema);