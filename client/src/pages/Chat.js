import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Loader, 
  Globe, 
  Mic, 
  MicOff,
  RefreshCw,
  Heart,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { chatAPI } from '../utils/api';
import LanguageSelection from '../components/LanguageSelection';

const Chat = () => {
  const [languageSelected, setLanguageSelected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [supportedLanguages, setSupportedLanguages] = useState({});
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const quickReplies = [
    { text: 'Dengue symptoms', icon: '🦟' },
    { text: 'Malaria prevention', icon: '🛡️' },
    { text: 'Child vaccination', icon: '💉' },
    { text: 'Diarrhea treatment', icon: '💊' },
    { text: 'Nearest health center', icon: '🏥' },
    { text: 'COVID-19 guidelines', icon: '😷' }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'as', name: 'অসমীয়া', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch supported languages on component mount
    fetchSupportedLanguages();
  }, []);

  const fetchSupportedLanguages = async () => {
    try {
      const data = await chatAPI.getSupportedLanguages();
      if (data.success) {
        setSupportedLanguages(data.languages);
      }
    } catch (error) {
      console.error('Error fetching supported languages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date(),
      language: currentLanguage
    };

    // Clear any previous error messages and add the new user message
    setMessages(prev => [...prev.filter(msg => !msg.isError), userMessage]);
    const currentMessage = messageText;
    setInputMessage('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Send message to backend
      const data = await chatAPI.sendMessage(
        currentMessage,
        autoDetectLanguage ? 'auto' : currentLanguage,
        'demo-user',
        'web-session-' + Date.now()
      );
      
      if (data.success) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.response || 'I apologize, but I\'m having trouble processing your request right now. Please try again.',
          timestamp: new Date(),
          language: data.language || currentLanguage,
          confidence: data.confidence,
          category: data.category,
          suggestions: data.suggestions || []
        };

        setMessages(prev => [...prev, botMessage]);
        
        // Update detected language if auto-detect is enabled
        if (autoDetectLanguage && data.language && data.language !== currentLanguage) {
          setCurrentLanguage(data.language);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'I\'m sorry, I\'m having trouble connecting right now. Please check your internet connection and try again.',
        timestamp: new Date(),
        language: currentLanguage,
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Connection error. Please try again.');
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-US';

      if (!isListening) {
        setIsListening(true);
        recognition.start();
        toast.success('Listening... Speak now!');

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
          toast.error('Voice recognition failed. Please try again.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };
      } else {
        recognition.stop();
        setIsListening(false);
      }
    } else {
      toast.error('Voice recognition is not supported in your browser.');
    }
  };

  const handleQuickReply = async (suggestion) => {
    await sendMessage(suggestion);
  };

  const detectLanguage = async (text) => {
    try {
      const data = await chatAPI.detectLanguage(text);
      if (data.success) {
        return data.detectedLanguage;
      }
    } catch (error) {
      console.error('Language detection error:', error);
    }
    return 'en'; // Default to English
  };

  const handleLanguageSelection = (selectedLanguage) => {
    setCurrentLanguage(selectedLanguage);
    setLanguageSelected(true);
    
    // Initialize chat with welcome message in selected language
    const welcomeMessages = {
      'en': 'Hello! I\'m your GramCare health assistant. I can help you with any questions, provide information, and share helpful tips. How can I assist you today?',
      'hi': 'नमस्ते! मैं आपका ग्रामकेयर सहायक हूँ। मैं आपके किसी भी प्रश्न में मदद कर सकता हूँ, जानकारी प्रदान कर सकता हूँ और उपयोगी सुझाव दे सकता हूँ। आज मैं आपकी कैसे सहायता कर सकता हूँ?',
      'bn': 'নমস্কার! আমি আপনার গ্রামকেয়ার সহায়ক। আমি আপনার যেকোনো প্রশ্নে সাহায্য করতে পারি, তথ্য প্রদান করতে পারি এবং সহায়ক পরামর্শ দিতে পারি। আজ আমি কীভাবে আপনাকে সহায়তা করতে পারি?',
      'as': 'নমস্কাৰ! মই আপোনাৰ গ্ৰামকেয়াৰ সহায়ক। মই আপোনাৰ যিকোনো প্ৰশ্নত সহায় কৰিব পাৰোঁ, তথ্য প্ৰদান কৰিব পাৰোঁ আৰু সহায়ক পৰামৰ্শ দিব পাৰোঁ। আজি মই আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?',
      'te': 'నమస్కారం! నేను మీ గ్రామకేయర్ సహాయకుడను। నేను మీ ఏ ప్రశ్నకైనా సహాయం చేయగలను, సమాచారం అందించగలను మరియు సహాయకరమైన సలహాలు ఇవ్వగలను। ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?'
    };
    
    setMessages([{
      id: 1,
      type: 'bot',
      content: welcomeMessages[selectedLanguage] || welcomeMessages['en'],
      timestamp: new Date(),
      language: selectedLanguage
    }]);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: 'Chat cleared! How can I help you today?',
        timestamp: new Date(),
        language: currentLanguage
      }
    ]);
    toast.success('Chat cleared successfully!');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show language selection screen if language not selected
  if (!languageSelected) {
    return <LanguageSelection onLanguageSelect={handleLanguageSelection} />;
  }

  return (
    <div className="min-h-screen pt-0 bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-4xl mx-auto h-screen flex flex-col px-4">
        {/* Mobile-friendly Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 p-3 flex items-center justify-between sticky top-0 z-10"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">GramCare</h1>
              <p className="text-xs text-gray-500">Your AI Health Assistant</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={autoDetectLanguage}
                  onChange={(e) => setAutoDetectLanguage(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Auto-detect</span>
              </label>
              
              <select
                value={currentLanguage}
                onChange={(e) => setCurrentLanguage(e.target.value)}
                disabled={autoDetectLanguage}
                className={`px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  autoDetectLanguage ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {Object.keys(supportedLanguages).length > 0 ? 
                  Object.entries(supportedLanguages).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  )) :
                  languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))
                }
              </select>
            </div>

            {/* Clear Chat Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearChat}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear chat"
            >
              <RefreshCw className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-xs sm:max-w-md lg:max-w-lg ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === 'user' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-green-500 to-teal-600'}`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`relative px-4 py-3 rounded-2xl ${message.type === 'user' ? 'chat-bubble-user' : message.isError ? 'bg-red-100 border border-red-200 text-red-800' : 'chat-bubble-bot'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    
                    {/* Message metadata */}
                    <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                      <span>{formatTime(message.timestamp)}</span>
                      {message.confidence && (
                        <div className="flex items-center space-x-1">
                          {message.confidence > 0.8 ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          <span>{Math.round(message.confidence * 100)}%</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Quick reply suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs opacity-70">Quick replies:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.suggestions.slice(0, 3).map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleQuickReply(suggestion)}
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {messages.length <= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2"
          >
            <p className="text-sm text-gray-500 mb-3">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage(reply.text)}
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <span>{reply.icon}</span>
                  <span>{reply.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Mobile-friendly Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-md border-t border-gray-200/50 p-3 safe-area-inset-bottom"
        >
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask me anything...`}
                className="w-full px-4 py-4 pr-14 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                rows={1}
                style={{ minHeight: '56px', maxHeight: '120px' }}
                disabled={isLoading}
              />
              
              {/* Voice Input Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleVoiceInput}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
                  isListening 
                    ? 'bg-red-500 text-white' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                disabled={isLoading}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </motion.button>
            </div>

            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className={`p-4 rounded-2xl transition-all duration-200 min-w-[56px] ${
                inputMessage.trim() && !isLoading
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 mt-2 text-center">
            This is for informational purposes only. Always consult healthcare professionals for medical advice.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Chat;