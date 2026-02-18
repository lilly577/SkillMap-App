const mongoose = require('mongoose');
const Chat = require('../models/Chat');
require('dotenv').config();

async function cleanupDuplicateChats() {
  await mongoose.connect(process.env.MONGO_URI);
  
  console.log('Cleaning up duplicate chats...');
  
  const chats = await Chat.find();
  const seen = new Set();
  const duplicates = [];
  
  for (const chat of chats) {
    // Create a unique key for the participant combination
    const key = chat.participants
      .map(p => `${p.userId.toString()}-${p.userType}`)
      .sort()
      .join('|');
    
    if (seen.has(key)) {
      duplicates.push(chat._id);
      console.log(`Found duplicate chat: ${chat._id} with key: ${key}`);
    } else {
      seen.add(key);
    }
  }
  
  if (duplicates.length > 0) {
    console.log(`Removing ${duplicates.length} duplicate chats...`);
    await Chat.deleteMany({ _id: { $in: duplicates } });
    console.log('Duplicate chats removed successfully');
  } else {
    console.log('No duplicate chats found');
  }
  
  await mongoose.disconnect();
}

// Run if called directly
if (require.main === module) {
  cleanupDuplicateChats().catch(console.error);
}

module.exports = cleanupDuplicateChats;