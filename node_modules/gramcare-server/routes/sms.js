const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const healthFAQs = require('../data/healthFAQs.json');
const outbreakAlerts = require('../data/outbreakAlerts.json');
const { getCachedTranslation, detectLanguage, isLanguageSupported } = require('../utils/translator');
const logger = require('../utils/logger');
const { getAIResponse } = require('../utils/aiService');

// Initialize Twilio client
let twilioClient;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (error) {
  console.warn('Twilio not configured, SMS features will be limited');
}

// Store user sessions
const userSessions = new Map();

// Store verification codes temporarily
const verificationCodes = new Map(); // phoneNumber -> { code, expiresAt }

// Health-related keywords and responses
const healthKeywords = {
  symptoms: ['fever', 'cough', 'headache', 'pain', 'nausea', 'vomiting', 'diarrhea', 'fatigue'],
  diseases: ['covid', 'malaria', 'dengue', 'typhoid', 'diabetes', 'hypertension', 'tuberculosis'],
  prevention: ['vaccine', 'vaccination', 'immunization', 'hygiene', 'sanitize', 'mask'],
  emergency: ['emergency', 'urgent', 'severe', 'critical', 'hospital', 'ambulance']
};

// Get or create user session
const getUserSession = (phoneNumber) => {
  if (!userSessions.has(phoneNumber)) {
    userSessions.set(phoneNumber, {
      language: 'en',
      conversationHistory: [],
      lastActivity: new Date(),
      userProfile: {
        preferredLanguage: null,
        location: null,
        age: null
      }
    });
  }
  return userSessions.get(phoneNumber);
};

// Update user session
const updateUserSession = (phoneNumber, updates) => {
  const session = getUserSession(phoneNumber);
  Object.assign(session, updates);
  session.lastActivity = new Date();
  userSessions.set(phoneNumber, session);
};

// Clean up old sessions (older than 24 hours)
const cleanupSessions = () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  for (const [phoneNumber, session] of userSessions.entries()) {
    if (session.lastActivity < cutoff) {
      userSessions.delete(phoneNumber);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupSessions, 60 * 60 * 1000);

// Analyze message for health context
const analyzeHealthContext = (message) => {
  const lowerMessage = message.toLowerCase();
  const context = {
    category: 'general',
    urgency: 'low',
    keywords: []
  };

  // Check for emergency keywords
  if (healthKeywords.emergency.some(keyword => lowerMessage.includes(keyword))) {
    context.urgency = 'high';
    context.category = 'emergency';
  }
  
  // Check for symptoms
  const foundSymptoms = healthKeywords.symptoms.filter(symptom => lowerMessage.includes(symptom));
  if (foundSymptoms.length > 0) {
    context.category = 'symptoms';
    context.keywords = foundSymptoms;
    if (foundSymptoms.length > 2) context.urgency = 'medium';
  }
  
  // Check for diseases
  const foundDiseases = healthKeywords.diseases.filter(disease => lowerMessage.includes(disease));
  if (foundDiseases.length > 0) {
    context.category = 'disease_info';
    context.keywords = foundDiseases;
  }
  
  // Check for prevention
  if (healthKeywords.prevention.some(keyword => lowerMessage.includes(keyword))) {
    context.category = 'prevention';
  }

  return context;
};

// Generate health response based on context
const generateHealthResponse = async (message, context, language = 'en') => {
  let response = '';
  
  switch (context.category) {
    case 'emergency':
      response = 'This seems like an emergency situation. Please contact your nearest hospital or call emergency services immediately. For immediate help, call 108 (India) or your local emergency number.';
      break;
      
    case 'symptoms':
      response = `I understand you\'re experiencing ${context.keywords.join(', ')}. While I can provide general information, it\'s important to consult with a healthcare professional for proper diagnosis and treatment. Would you like me to provide some general care tips or help you find nearby healthcare facilities?`;
      break;
      
    case 'disease_info':
      response = `I can provide information about ${context.keywords.join(', ')}. What specific information would you like to know? For example: symptoms, prevention, treatment options, or when to see a doctor?`;
      break;
      
    case 'prevention':
      response = 'Prevention is key to good health! I can help you with information about vaccinations, hygiene practices, and preventive care. What specific prevention topic interests you?';
      break;
      
    default:
      response = 'Hello! I\'m GramCare, your health assistant. I can help you with health information, symptoms, disease prevention, and vaccination schedules. How can I assist you today?';
  }
  
  // Translate response if needed
  if (language !== 'en' && isLanguageSupported(language)) {
    try {
      response = await getCachedTranslation(response, language);
    } catch (error) {
      logger.error('Translation error in SMS response:', error);
    }
  }
  
  // Append disclaimer
  response += '\n\nDisclaimer: This is informational only, not a medical diagnosis.';
  
  return response;
};

// Helper function to find FAQ match (reused from chat.js)
const findBestMatch = (userMessage) => {
  const message = userMessage.toLowerCase();
  let bestMatch = null;
  let highestScore = 0;
  
  healthFAQs.faqs.forEach(faq => {
    let score = 0;
    
    faq.keywords.forEach(keyword => {
      if (message.includes(keyword.toLowerCase())) {
        score += 2;
      }
    });
    
    const questionWords = faq.question.toLowerCase().split(' ');
    questionWords.forEach(word => {
      if (message.includes(word) && word.length > 3) {
        score += 1;
      }
    });
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = faq;
    }
  });
  
  return highestScore > 0 ? bestMatch : null;
};

// Helper function to get location alerts
const getLocationAlerts = (location, language = 'english') => {
  const normalizedLocation = location.toLowerCase();
  const alerts = outbreakAlerts.alerts.filter(alert => 
    alert.location.toLowerCase().includes(normalizedLocation) ||
    alert.affectedAreas.some(area => 
      area.toLowerCase().includes(normalizedLocation)
    )
  );
  
  if (alerts.length === 0) {
    return language === 'hindi'
      ? `${location} के लिए कोई सक्रिय अलर्ट नहीं मिला। 🟢`
      : `No active alerts found for ${location}. 🟢`;
  }
  
  let response = language === 'hindi'
    ? `${location} के लिए स्वास्थ्य अलर्ट:\n\n`
    : `Health alerts for ${location}:\n\n`;
  
  alerts.slice(0, 2).forEach((alert, index) => {
    response += `${index + 1}. ${alert.message[language] || alert.message.english}\n\n`;
  });
  
  return response;
};

// Helper function to split long SMS messages
const splitSmsMessage = (message) => {
  const MAX_SMS_LENGTH = 160;
  const messages = [];
  let currentMessage = '';

  message.split(' ').forEach(word => {
    if ((currentMessage + word).length + 1 > MAX_SMS_LENGTH) {
      messages.push(currentMessage.trim());
      currentMessage = word + ' ';
    } else {
      currentMessage += word + ' ';
    }
  });

  if (currentMessage.trim().length > 0) {
    messages.push(currentMessage.trim());
  }
  return messages;
};

// POST /api/sms/webhook - Twilio SMS webhook
router.post('/webhook', async (req, res) => {
  try {
    const twiml = new twilio.twiml.MessagingResponse();
    const incomingMessage = req.body.Body?.trim() || '';
    const fromNumber = req.body.From || '';
    const phoneNumber = fromNumber.replace('whatsapp:', ''); // SMS numbers don't have 'whatsapp:' prefix

    logger.info(`SMS message from ${fromNumber}: ${incomingMessage}`);

    // Get user session
    const session = getUserSession(phoneNumber);

    let responseText = '';
    let language = 'english';

    // Detect language if not set (basic detection for Hindi)
    const hindiPattern = /[\u0900-\u097F]/;
    if (hindiPattern.test(incomingMessage)) {
      language = 'hindi';
      session.userProfile.preferredLanguage = 'hi';
      session.language = 'hi';
    } else if (!session.userProfile.preferredLanguage && incomingMessage.length > 10) {
      try {
        const detectedLang = await detectLanguage(incomingMessage);
        if (detectedLang && isLanguageSupported(detectedLang)) {
          session.userProfile.preferredLanguage = detectedLang;
          session.language = detectedLang;
        }
      } catch (error) {
        logger.error('Language detection error:', error);
      }
    }

    // Handle different message types
    if (!incomingMessage) {
      responseText = language === 'hindi'
        ? 'नमस्ते! मैं ग्रामकेयर हूँ, आपका स्वास्थ्य सहायक। मैं आपको स्वास्थ्य संबंधी जानकारी, लक्षणों, बीमारियों की रोकथाम और टीकाकरण कार्यक्रमों में मदद कर सकता हूँ। आज मैं आपकी कैसे सहायता कर सकता हूँ?'
        : 'Hello! I\'m GramCare, your health assistant. I can help you with health information, symptoms, disease prevention, and vaccination schedules. How can I assist you today?';
    } else if (incomingMessage.toLowerCase() === 'hi') {
      responseText = 'नमस्ते! मैं ग्रामकेयर हूँ, आपका स्वास्थ्य सहायक। मैं आपको स्वास्थ्य संबंधी जानकारी, लक्षणों, बीमारियों की रोकथाम और टीकाकरण कार्यक्रमों में मदद कर सकता हूँ। आज मैं आपकी कैसे सहायता कर सकता हूँ?'
      session.userProfile.preferredLanguage = 'hi';
      session.language = 'hi';
    } else if (incomingMessage.toLowerCase() === 'en') {
      responseText = 'Hello! I\'m GramCare, your health assistant. I can help you with health information, symptoms, disease prevention, and vaccination schedules. How can I assist you today?';
      session.userProfile.preferredLanguage = 'en';
      session.language = 'en';
    } else if (incomingMessage.toLowerCase() === 'help') {
      responseText = language === 'hindi'
        ? 'मैं आपकी कैसे मदद कर सकता हूँ? आप मुझसे लक्षणों, बीमारियों, रोकथाम, टीकाकरण या स्वास्थ्य अलर्ट के बारे में पूछ सकते हैं।'
        : 'How can I help you? You can ask me about symptoms, diseases, prevention, vaccination, or health alerts.';
    } else if (incomingMessage.toLowerCase().startsWith('alerts')) {
      const parts = incomingMessage.split(' ');
      const location = parts[1] || 'all';
      responseText = getLocationAlerts(location, session.language);
    } else {
      const aiEnabled = process.env.AI_ENABLED === 'true';
      let usedAI = false;
      if (aiEnabled) {
        try {
          const ai = await getAIResponse(incomingMessage, session.language || 'en', process.env.PREFERRED_AI_SERVICE || 'auto');
          if (ai.success) {
            responseText = ai.response + '\n\nDisclaimer: This is informational only, not a medical diagnosis.';
            usedAI = true;
          }
        } catch (e) {
          logger.error('AI error for SMS webhook:', e);
        }
      }
      if (!usedAI) {
        // Analyze health context
        const healthContext = analyzeHealthContext(incomingMessage);
        responseText = await generateHealthResponse(incomingMessage, healthContext, session.language);
        // FAQ fallback
        if (responseText.includes('How can I assist you today?') || responseText.includes('मैं आपकी कैसे सहायता कर सकता हूँ?')) {
          const faqMatch = findBestMatch(incomingMessage);
          if (faqMatch) {
            responseText = faqMatch.answer[session.language] || faqMatch.answer.english;
          }
        }
      }
    }

    // Add to conversation history
    session.conversationHistory.push({ role: 'user', message: incomingMessage });
    session.conversationHistory.push({ role: 'assistant', message: responseText });
    session.conversationHistory = session.conversationHistory.slice(-10);

    updateUserSession(phoneNumber, session);

    // Split long messages into multiple SMS messages
    const smsResponses = splitSmsMessage(responseText);
    smsResponses.forEach(msg => {
      twiml.message(msg);
    });

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());

  } catch (error) {
    logger.error('SMS webhook error:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Sorry, I encountered an error. Please try again later.');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

// POST /api/sms/send - Send an outbound SMS and get AI response
router.post('/message', async (req, res) => {
  const { smsNumber, message, language } = req.body;

  if (!smsNumber || !message) {
    return res.status(400).json({ error: 'Both "smsNumber" and "message" are required.' });
  }

  if (!twilioClient) {
    return res.status(500).json({ error: 'Twilio client not configured.' });
  }

  try {
    logger.info(`SMS message from web to ${smsNumber}: ${message}`);

    // Get user session (or create a temporary one for web-initiated SMS)
    const session = getUserSession(smsNumber);
    let responseText = '';
    let detectedLanguage = language || 'en';

    // If language is auto, detect it
    if (language === 'auto') {
      try {
        const lang = await detectLanguage(message);
        if (lang && isLanguageSupported(lang)) {
          detectedLanguage = lang;
        }
      } catch (error) {
        logger.error('Language detection error for web SMS:', error);
      }
    }
    session.language = detectedLanguage;

    // Prefer AI response if enabled
    const aiEnabled = process.env.AI_ENABLED === 'true';
    let usedAI = false;
    if (aiEnabled) {
      try {
        const ai = await getAIResponse(message, session.language || 'en', process.env.PREFERRED_AI_SERVICE || 'auto');
        if (ai.success) {
          responseText = ai.response + '\n\nDisclaimer: This is informational only, not a medical diagnosis.';
          usedAI = true;
        }
      } catch (e) {
        logger.error('AI error for outbound SMS:', e);
      }
    }
    if (!usedAI) {
      // Analyze health context
      const healthContext = analyzeHealthContext(message);
      responseText = await generateHealthResponse(message, healthContext, session.language);
      // If no specific health response, try FAQ
      if (responseText.includes('How can I assist you today?') || responseText.includes('मैं आपकी कैसे सहायता कर सकता हूँ?')) {
        const faqMatch = findBestMatch(message);
        if (faqMatch) {
          responseText = faqMatch.answer[session.language] || faqMatch.answer.english;
        }
      }
    }

    // Add to conversation history
    session.conversationHistory.push({ role: 'user', message: message });
    session.conversationHistory.push({ role: 'assistant', message: responseText });
    session.conversationHistory = session.conversationHistory.slice(-10);
    updateUserSession(smsNumber, session);

    // Send the AI response back to the client (not via Twilio for this endpoint)
    res.status(200).json({ success: true, response: responseText, language: session.language });

  } catch (error) {
    logger.error('Error processing outbound SMS with AI:', error);
    res.status(500).json({ error: 'Failed to process SMS with AI.', details: error.message });
  }
});

// POST /api/sms/send - Send an outbound SMS
router.post('/send', async (req, res) => {
  const { to, body } = req.body;

  if (!to || !body) {
    return res.status(400).json({ error: 'Both "to" and "body" are required.' });
  }

  if (!twilioClient) {
    return res.status(500).json({ error: 'Twilio client not configured.' });
  }

  try {
    const message = await twilioClient.messages.create({
      to: to,
      from: process.env.SMS_FROM_NUMBER,
      body: body,
    });
    logger.info(`SMS sent to ${to}: ${message.sid}`);
    res.status(200).json({ success: true, sid: message.sid });
  } catch (error) {
    logger.error('Error sending SMS:', error);
    res.status(500).json({ error: 'Failed to send SMS.', details: error.message });
  }
});

// POST /api/sms/send-verification - Send SMS verification code
router.post('/send-verification', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required.' });
  }

  if (!twilioClient) {
    return res.status(500).json({ error: 'Twilio client not configured.' });
  }

  try {
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
    const expiresAt = Date.now() + 5 * 60 * 1000; // Code valid for 5 minutes

    verificationCodes.set(phoneNumber, { code: verificationCode, expiresAt });
    logger.info(`Generated verification code for ${phoneNumber}: ${verificationCode}`);

    await twilioClient.messages.create({
      to: phoneNumber,
      from: process.env.SMS_FROM_NUMBER,
      body: `Your GramCare verification code is: ${verificationCode}. It is valid for 5 minutes.`,
    });

    logger.info(`Verification code sent to ${phoneNumber}`);
    res.status(200).json({ success: true, message: 'Verification code sent!' });
  } catch (error) {
    logger.error('Error sending verification code:', error);
    res.status(500).json({ error: 'Failed to send verification code.', details: error.message });
  }
});

// POST /api/sms/verify-code - Verify SMS code
router.post('/verify-code', async (req, res) => {
  const { phoneNumber, code } = req.body;

  if (!phoneNumber || !code) {
    return res.status(400).json({ error: 'Phone number and code are required.' });
  }

  const storedCode = verificationCodes.get(phoneNumber);

  if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired verification code.' });
  }

  // If code is valid, remove it and mark phone number as verified (in a real app, this would be persisted)
  verificationCodes.delete(phoneNumber);
  // In a real application, you would associate this phone number with a user account
  logger.info(`Phone number ${phoneNumber} verified successfully.`);

  res.status(200).json({ success: true, message: 'Phone number verified successfully!' });
});

// POST /api/sms/webhook - Twilio SMS webhook
router.post('/webhook', async (req, res) => {
  try {
    const twiml = new twilio.twiml.MessagingResponse();
    const incomingMessage = req.body.Body?.trim() || '';
    const fromNumber = req.body.From || '';
    const phoneNumber = fromNumber.replace('whatsapp:', ''); // SMS numbers don't have 'whatsapp:' prefix

    logger.info(`SMS message from ${fromNumber}: ${incomingMessage}`);

    // Get user session
    const session = getUserSession(phoneNumber);

    let responseText = '';
    let language = 'english';

    // Detect language if not set (basic detection for Hindi)
    const hindiPattern = /[\u0900-\u097F]/;
    if (hindiPattern.test(incomingMessage)) {
      language = 'hindi';
      session.userProfile.preferredLanguage = 'hi';
      session.language = 'hi';
    } else if (!session.userProfile.preferredLanguage && incomingMessage.length > 10) {
      try {
        const detectedLang = await detectLanguage(incomingMessage);
        if (detectedLang && isLanguageSupported(detectedLang)) {
          session.userProfile.preferredLanguage = detectedLang;
          session.language = detectedLang;
        }
      } catch (error) {
        logger.error('Language detection error:', error);
      }
    }

    // Handle different message types
    if (!incomingMessage) {
      responseText = language === 'hindi'
        ? 'नमस्ते! मैं ग्रामकेयर हूँ, आपका स्वास्थ्य सहायक। मैं आपको स्वास्थ्य संबंधी जानकारी, लक्षणों, बीमारियों की रोकथाम और टीकाकरण कार्यक्रमों में मदद कर सकता हूँ। आज मैं आपकी कैसे सहायता कर सकता हूँ?'
        : 'Hello! I\'m GramCare, your health assistant. I can help you with health information, symptoms, disease prevention, and vaccination schedules. How can I assist you today?';
    } else if (incomingMessage.toLowerCase() === 'hi') {
      responseText = 'नमस्ते! मैं ग्रामकेयर हूँ, आपका स्वास्थ्य सहायक। मैं आपको स्वास्थ्य संबंधी जानकारी, लक्षणों, बीमारियों की रोकथाम और टीकाकरण कार्यक्रमों में मदद कर सकता हूँ। आज मैं आपकी कैसे सहायता कर सकता हूँ?'
      session.userProfile.preferredLanguage = 'hi';
      session.language = 'hi';
    } else if (incomingMessage.toLowerCase() === 'en') {
      responseText = 'Hello! I\'m GramCare, your health assistant. I can help you with health information, symptoms, disease prevention, and vaccination schedules. How can I assist you today?';
      session.userProfile.preferredLanguage = 'en';
      session.language = 'en';
    } else if (incomingMessage.toLowerCase() === 'help') {
      responseText = language === 'hindi'
        ? 'मैं आपकी कैसे मदद कर सकता हूँ? आप मुझसे लक्षणों, बीमारियों, रोकथाम, टीकाकरण या स्वास्थ्य अलर्ट के बारे में पूछ सकते हैं।'
        : 'How can I help you? You can ask me about symptoms, diseases, prevention, vaccination, or health alerts.';
    } else if (incomingMessage.toLowerCase().startsWith('alerts')) {
      const parts = incomingMessage.split(' ');
      const location = parts[1] || 'all';
      responseText = getLocationAlerts(location, session.language);
    } else {
      const aiEnabled = process.env.AI_ENABLED === 'true';
      let usedAI = false;
      if (aiEnabled) {
        try {
          const ai = await getAIResponse(incomingMessage, session.language || 'en', process.env.PREFERRED_AI_SERVICE || 'auto');
          if (ai.success) {
            responseText = ai.response + '\n\nDisclaimer: This is informational only, not a medical diagnosis.';
            usedAI = true;
          }
        } catch (e) {
          logger.error('AI error for SMS webhook:', e);
        }
      }
      if (!usedAI) {
        // Analyze health context
        const healthContext = analyzeHealthContext(incomingMessage);
        responseText = await generateHealthResponse(incomingMessage, healthContext, session.language);
        // FAQ fallback
        if (responseText.includes('How can I assist you today?') || responseText.includes('मैं आपकी कैसे सहायता कर सकता हूँ?')) {
          const faqMatch = findBestMatch(incomingMessage);
          if (faqMatch) {
            responseText = faqMatch.answer[session.language] || faqMatch.answer.english;
          }
        }
      }
    }

    // Add to conversation history
    session.conversationHistory.push({ role: 'user', message: incomingMessage });
    session.conversationHistory.push({ role: 'assistant', message: responseText });
    session.conversationHistory = session.conversationHistory.slice(-10);

    updateUserSession(phoneNumber, session);

    // Split long messages into multiple SMS messages
    const smsResponses = splitSmsMessage(responseText);
    smsResponses.forEach(msg => {
      twiml.message(msg);
    });

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());

  } catch (error) {
    logger.error('SMS webhook error:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Sorry, I encountered an error. Please try again later.');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

// POST /api/sms/send - Send an outbound SMS and get AI response
router.post('/message', async (req, res) => {
  const { smsNumber, message, language } = req.body;

  if (!smsNumber || !message) {
    return res.status(400).json({ error: 'Both "smsNumber" and "message" are required.' });
  }

  if (!twilioClient) {
    return res.status(500).json({ error: 'Twilio client not configured.' });
  }

  try {
    logger.info(`SMS message from web to ${smsNumber}: ${message}`);

    // Get user session (or create a temporary one for web-initiated SMS)
    const session = getUserSession(smsNumber);
    let responseText = '';
    let detectedLanguage = language || 'en';

    // If language is auto, detect it
    if (language === 'auto') {
      try {
        const lang = await detectLanguage(message);
        if (lang && isLanguageSupported(lang)) {
          detectedLanguage = lang;
        }
      } catch (error) {
        logger.error('Language detection error for web SMS:', error);
      }
    }
    session.language = detectedLanguage;

    // Prefer AI response if enabled
    const aiEnabled = process.env.AI_ENABLED === 'true';
    let usedAI = false;
    if (aiEnabled) {
      try {
        const ai = await getAIResponse(message, session.language || 'en', process.env.PREFERRED_AI_SERVICE || 'auto');
        if (ai.success) {
          responseText = ai.response + '\n\nDisclaimer: This is informational only, not a medical diagnosis.';
          usedAI = true;
        }
      } catch (e) {
        logger.error('AI error for outbound SMS:', e);
      }
    }
    if (!usedAI) {
      // Analyze health context
      const healthContext = analyzeHealthContext(message);
      responseText = await generateHealthResponse(message, healthContext, session.language);
      // If no specific health response, try FAQ
      if (responseText.includes('How can I assist you today?') || responseText.includes('मैं आपकी कैसे सहायता कर सकता हूँ?')) {
        const faqMatch = findBestMatch(message);
        if (faqMatch) {
          responseText = faqMatch.answer[session.language] || faqMatch.answer.english;
        }
      }
    }

    // Add to conversation history
    session.conversationHistory.push({ role: 'user', message: message });
    session.conversationHistory.push({ role: 'assistant', message: responseText });
    session.conversationHistory = session.conversationHistory.slice(-10);
    updateUserSession(smsNumber, session);

    // Send the AI response back to the client (not via Twilio for this endpoint)
    res.status(200).json({ success: true, response: responseText, language: session.language });

  } catch (error) {
    logger.error('Error processing outbound SMS with AI:', error);
    res.status(500).json({ error: 'Failed to process SMS with AI.', details: error.message });
  }
});

// POST /api/sms/send - Send an outbound SMS
router.post('/send', async (req, res) => {
  const { to, body } = req.body;

  if (!to || !body) {
    return res.status(400).json({ error: 'Both "to" and "body" are required.' });
  }

  if (!twilioClient) {
    return res.status(500).json({ error: 'Twilio client not configured.' });
  }

  try {
    const message = await twilioClient.messages.create({
      to: to,
      from: process.env.SMS_FROM_NUMBER,
      body: body,
    });
    logger.info(`SMS sent to ${to}: ${message.sid}`);
    res.status(200).json({ success: true, sid: message.sid });
  } catch (error) {
    logger.error('Error sending SMS:', error);
    res.status(500).json({ error: 'Failed to send SMS.', details: error.message });
  }
});

module.exports = router;