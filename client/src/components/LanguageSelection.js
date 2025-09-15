import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, ArrowRight, Heart } from 'lucide-react';

const LanguageSelection = ({ onLanguageSelect }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('');

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳', nativeName: 'हिंदी' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩', nativeName: 'বাংলা' },
    { code: 'as', name: 'অসমীয়া', flag: '🇮🇳', nativeName: 'অসমীয়া' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳', nativeName: 'తెలుగు' }
  ];

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      onLanguageSelect(selectedLanguage);
    }
  };

  const getWelcomeText = () => {
    const welcomeTexts = {
      'en': 'Welcome to GramCare',
      'hi': 'ग्रामकेयर में आपका स्वागत है',
      'bn': 'গ্রামকেয়ারে আপনাকে স্বাগতম',
      'as': 'গ্ৰামকেয়াৰলৈ আপোনাক স্বাগতম',
      'te': 'గ్రామకేయర్‌కు స్వాగతం'
    };
    return welcomeTexts[selectedLanguage] || 'Welcome to GramCare';
  };

  const getSubtitleText = () => {
    const subtitleTexts = {
      'en': 'Your AI Health Assistant',
      'hi': 'आपका AI स्वास्थ्य सहायक',
      'bn': 'আপনার AI স্বাস্থ্য সহায়ক',
      'as': 'আপোনাৰ AI স্বাস্থ্য সহায়ক',
      'te': 'మీ AI ఆరోగ్య సహాయకుడు'
    };
    return subtitleTexts[selectedLanguage] || 'Your AI Health Assistant';
  };

  const getSelectLanguageText = () => {
    const selectTexts = {
      'en': 'Please select your preferred language',
      'hi': 'कृपया अपनी पसंदीदा भाषा चुनें',
      'bn': 'অনুগ্রহ করে আপনার পছন্দের ভাষা নির্বাচন করুন',
      'as': 'অনুগ্ৰহ কৰি আপোনাৰ পছন্দৰ ভাষা নিৰ্বাচন কৰক',
      'te': 'దయచేసి మీ ఇష్టమైన భాషను ఎంచుకోండి'
    };
    return selectTexts[selectedLanguage] || 'Please select your preferred language';
  };

  const getContinueText = () => {
    const continueTexts = {
      'en': 'Continue',
      'hi': 'जारी रखें',
      'bn': 'চালিয়ে যান',
      'as': 'আগবাঢ়ক',
      'te': 'కొనసాగించు'
    };
    return continueTexts[selectedLanguage] || 'Continue';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Heart className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-gray-900 mb-2"
          >
            {getWelcomeText()}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600"
          >
            {getSubtitleText()}
          </motion.p>
        </div>

        {/* Language Selection */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center mb-6"
          >
            <Globe className="w-5 h-5 text-blue-500 mr-2" />
            <p className="text-gray-700 font-medium">
              {getSelectLanguageText()}
            </p>
          </motion.div>

          <div className="space-y-3">
            {languages.map((language, index) => (
              <motion.button
                key={language.code}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                onClick={() => handleLanguageSelect(language.code)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${
                  selectedLanguage === language.code
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{language.flag}</span>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{language.nativeName}</p>
                    <p className="text-sm text-gray-500">{language.name}</p>
                  </div>
                </div>
                {selectedLanguage === language.code && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                  >
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          onClick={handleContinue}
          disabled={!selectedLanguage}
          className={`w-full py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center ${
            selectedLanguage
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {getContinueText()}
          {selectedLanguage && (
            <ArrowRight className="w-5 h-5 ml-2" />
          )}
        </motion.button>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="text-center text-xs text-gray-500 mt-6"
        >
          You can change the language anytime in settings
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LanguageSelection;