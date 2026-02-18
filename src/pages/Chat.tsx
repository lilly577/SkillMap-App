import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Users, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/user";
import { useToast } from "@/hooks/use-toast";
import { chatApi, connectChatWebSocket, sendChatMessage } from "@/lib/api";

interface Chat {
  id: string;
  chatId: string;
  otherUser: {
    id: string;
    name: string;
    type: string;
    email: string;
  };
  lastMessage?: {
    content: string;
    timestamp: string;
  };
  unreadCount: number;
  updatedAt: string;
}

interface Message {
  id: string;
  messageId: string;
  chatId?: string; // Make this optional since it might not come from WebSocket
  senderId: string;
  senderType: string;
  recipientId: string;
  content: string;
  timestamp: string;
  status?: string;
  read?: boolean;
}

const Chat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Get URL parameters for direct chat access
  const urlChatId = searchParams.get('chatId');
  const urlRecipientId = searchParams.get('recipientId');
  const urlRecipientName = searchParams.get('recipientName');
  const urlRecipientType = searchParams.get('recipientType');

  // Load chats on component mount
  useEffect(() => {
    loadChats();
    setupWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  //debugging
  useEffect(() => {
    console.log('Current messages state:', messages);
    console.log('Messages breakdown - Sent:', messages.filter(m => m.senderId === user?.id).length,
      'Received:', messages.filter(m => m.senderId !== user?.id).length);
  }, [messages, user]);

  // Handle URL parameters to start new chat or select existing one
  useEffect(() => {
    if (urlChatId && urlRecipientId && urlRecipientName && urlRecipientType) {
      const existingChat = chats.find(chat => chat.chatId === urlChatId);
      if (existingChat) {
        setSelectedChat(existingChat);
        loadMessages(existingChat.chatId);
      } else {
        // Create a proper temporary chat for the URL parameters
        const tempChat: Chat = {
          id: urlChatId,
          chatId: urlChatId,
          otherUser: {
            id: urlRecipientId,
            name: decodeURIComponent(urlRecipientName),
            type: urlRecipientType,
            email: ''
          },
          unreadCount: 0,
          updatedAt: new Date().toISOString()
        };
        setSelectedChat(tempChat);
        loadMessages(urlChatId);
      }
    }
  }, [chats, urlChatId, urlRecipientId, urlRecipientName, urlRecipientType]);
  // new updates
  // Update the setupWebSocket function in the Chat component
  const setupWebSocket = () => {
    try {
      const websocket = connectChatWebSocket(
        handleWebSocketMessage,
        handleWebSocketError,
        handleWebSocketOpen,
        handleWebSocketClose
      );

      setWs(websocket);
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to chat server",
        variant: "destructive",
      });
    }
  };

  // Add these new WebSocket handlers
  const handleWebSocketOpen = () => {
    console.log('WebSocket connection opened');
    setIsConnected(true);
  };

  const handleWebSocketClose = () => {
    console.log('WebSocket connection closed');
    setIsConnected(false);

    // Try to reconnect after 3 seconds
    setTimeout(() => {
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        console.log('Attempting to reconnect WebSocket...');
        setupWebSocket();
      }
    }, 3000);
  };

  // handleWebSocketMessage function
  const handleWebSocketMessage = (data: any) => {
    console.log('WebSocket message received - FULL DATA:', data);

    switch (data.type) {
      case 'connection_established':
        setIsConnected(true);
        console.log('WebSocket connection confirmed');
        break;

      case 'message':
        console.log('Received new message - Checking properties:', {
          hasChatId: !!data.chatId,
          chatId: data.chatId,
          senderId: data.senderId,
          recipientId: data.recipientId,
          content: data.content
        });
        handleIncomingMessage(data);
        break;

      case 'typing':
        console.log('Typing indicator:', data.senderId, 'is typing');
        break;

      case 'error':
        console.error('WebSocket error:', data.message);
        toast({
          title: "Chat Error",
          description: data.message,
          variant: "destructive",
        });
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };
  // Set up WebSocket connection olderrrrrr
  const handleWebSocketError = (error: Event) => {
    console.error('WebSocket error:', error);
    setIsConnected(false);
  };

  const handleIncomingMessage = (message: Message) => {
    console.log('Handling incoming message:', message);

    // Determine if this message belongs to the current chat
    // Method 1: Check if message has chatId and matches selected chat
    // Method 2: Check if the sender/recipient matches the selected chat's other user
    let belongsToCurrentChat = false;

    if (selectedChat) {
      if (message.chatId && message.chatId === selectedChat.chatId) {
        belongsToCurrentChat = true;
      } else if (
        // If no chatId, check if the participants match
        message.senderId === selectedChat.otherUser.id ||
        message.recipientId === selectedChat.otherUser.id
      ) {
        belongsToCurrentChat = true;
        // Update the message with the correct chatId
        message.chatId = selectedChat.chatId;
      }
    }

    if (belongsToCurrentChat) {
      // Check if we already have this message (avoid duplicates)
      const messageExists = messages.some(
        m => m.messageId === message.messageId || m.id === message.id
      );

      if (!messageExists) {
        console.log('Adding new message to current chat:', message);
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    }

    // Update chats list with new last message - use the chatId from message or find the right chat
    setChats(prev => prev.map(chat => {
      const chatMatches =
        (message.chatId && chat.chatId === message.chatId) ||
        chat.otherUser.id === message.senderId ||
        chat.otherUser.id === message.recipientId;

      if (chatMatches) {
        return {
          ...chat,
          lastMessage: {
            content: message.content,
            timestamp: message.timestamp
          },
          updatedAt: new Date().toISOString()
        };
      }
      return chat;
    }));
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await chatApi.getChats();

      if (response.success) {
        const loadedChats = response.chats || [];
        setChats(loadedChats);

        // If we have URL parameters, prioritize them
        if (urlChatId && urlRecipientId && urlRecipientName && urlRecipientType) {
          const chatFromUrl = loadedChats.find(chat => chat.chatId === urlChatId);
          if (chatFromUrl) {
            setSelectedChat(chatFromUrl);
            loadMessages(chatFromUrl.chatId);
          } else {
            // Create temporary chat from URL parameters
            const tempChat: Chat = {
              id: urlChatId,
              chatId: urlChatId,
              otherUser: {
                id: urlRecipientId,
                name: decodeURIComponent(urlRecipientName),
                type: urlRecipientType,
                email: ''
              },
              unreadCount: 0,
              updatedAt: new Date().toISOString()
            };
            setSelectedChat(tempChat);
            // Try to load messages for this chat (might be empty for new chats)
            loadMessages(urlChatId);
          }
        } else if (loadedChats.length > 0 && !selectedChat) {
          // Auto-select first chat if no URL params and no selection
          setSelectedChat(loadedChats[0]);
          loadMessages(loadedChats[0].chatId);
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast({
        title: "Error",
        description: "Failed to load chats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      console.log('Loading messages for chat:', chatId);
      const response = await chatApi.getChatMessages(chatId);

      if (response.success) {
        console.log('Messages loaded:', response.messages?.length || 0);
        setMessages(response.messages || []);
        scrollToBottom();
      } else {
        console.error('Failed to load messages:', response);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // If loading messages fails, it might be a new chat - show empty messages
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    // For new chats started via URL, ensure we have a proper chat ID
    let finalChatId = selectedChat.chatId;

    // If this is a temporary chat (doesn't exist in chats), create it properly
    const isTemporaryChat = !chats.find(chat => chat.chatId === selectedChat.chatId);

    if (isTemporaryChat) {
      try {
        const chatResponse = await chatApi.startChat(
          selectedChat.otherUser.id,
          selectedChat.otherUser.type as 'company' | 'specialist'
        );

        if (chatResponse.success) {
          finalChatId = chatResponse.chat._id;

          // Update the selected chat with the real chat data
          const updatedChat: Chat = {
            ...selectedChat,
            id: chatResponse.chat._id,
            chatId: chatResponse.chat._id
          };
          setSelectedChat(updatedChat);

          // Reload chats to include the new one
          loadChats();
        }
      } catch (error) {
        console.error('Error creating chat:', error);
        toast({
          title: "Error",
          description: "Failed to create chat",
          variant: "destructive",
        });
        return;
      }
    }

    // Create temporary message for immediate UI update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      messageId: `temp-${Date.now()}`,
      senderId: user.id,
      senderType: user.userType,
      recipientId: selectedChat.otherUser.id,
      content: messageContent,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      // Try to send via WebSocket first
      let wsSuccess = false;
      if (ws && isConnected) {
        wsSuccess = sendChatMessage(ws, messageContent, selectedChat.otherUser.id, finalChatId);
      }

      // Always save to database via API (this will also trigger WebSocket delivery from backend)
      await chatApi.saveMessage({
        chatId: finalChatId,
        senderId: user.id,
        recipientId: selectedChat.otherUser.id,
        content: messageContent
      });

      // Update message status based on WebSocket success
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessage.id
          ? {
            ...msg,
            status: wsSuccess ? 'sent' : 'sent-via-api',
            id: `api-${Date.now()}` // Update ID to avoid conflicts
          }
          : msg
      ));

      if (!wsSuccess) {
        console.log('Message sent via API (WebSocket not available)');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Update message status to failed
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessage.id
          ? { ...msg, status: 'failed' }
          : msg
      ));

      toast({
        title: "Send Failed",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';

    const nameParts = name.trim().split(' ');
    if (nameParts.length === 0) return 'U';

    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
  };

  // Check if current selected chat is a temporary one (not in the chats list)
  const isTemporarySelectedChat = selectedChat && !chats.find(chat => chat.chatId === selectedChat.chatId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Messages</h1>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              {!isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={setupWebSocket}
                  className="ml-2"
                >
                  Reconnect
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Chats List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {chats.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Start a conversation from your matches!</p>
                  </div>
                ) : (
                  chats.map(chat => (
                    <div
                      key={chat.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      onClick={() => {
                        setSelectedChat(chat);
                        loadMessages(chat.chatId);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-800">
                            {getInitials(chat.otherUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold truncate">
                              {chat.otherUser.name}
                            </p>
                            {chat.unreadCount > 0 && (
                              <Badge variant="destructive" className="ml-2">
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {chat.lastMessage?.content || 'No messages yet'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {chat.lastMessage
                              ? formatTime(chat.lastMessage.timestamp)
                              : formatTime(chat.updatedAt)
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card className="lg:col-span-3 flex flex-col">
            {selectedChat ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-green-100 text-green-800">
                        {getInitials(selectedChat.otherUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-lg font-semibold">{selectedChat.otherUser.name}</p>
                      <p className="text-sm font-normal text-gray-500 capitalize">
                        {selectedChat.otherUser.type}
                        {isTemporarySelectedChat && " • New Chat"}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 p-0">
                  <ScrollArea
                    ref={scrollAreaRef}
                    className="h-[400px] p-4"
                  >
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium mb-2">No messages yet</p>
                        <p>Start the conversation by sending a message!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map(message => (
                          <div
                            key={message.id || message.messageId}
                            className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'
                              }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.senderId === user?.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                                } ${message.status === 'failed' ? 'opacity-50' : ''
                                }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${message.senderId === user?.id
                                  ? 'text-blue-100'
                                  : 'text-gray-500'
                                  }`}
                              >
                                {formatTime(message.timestamp)}
                                {message.status === 'sending' && ' • Sending...'}
                                {message.status === 'failed' && ' • Failed'}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input - ALWAYS SHOW WHEN CHAT IS SELECTED */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        disabled={!isConnected && isTemporarySelectedChat}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || (!isConnected && isTemporarySelectedChat)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {!isConnected && (
                      <p className="text-sm text-red-500 mt-2">
                        Connection lost. Reconnecting...
                      </p>
                    )}
                    {isTemporarySelectedChat && (
                      <p className="text-sm text-blue-500 mt-2">
                        Starting new conversation with {selectedChat.otherUser.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Select a conversation</p>
                  <p>Choose a conversation from the list or start a new one from your matches</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;