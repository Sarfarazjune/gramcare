import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Shield, 
  Globe, 
  Users, 
  Heart, 
  AlertTriangle,
  BarChart3,
  Phone,
  Clock,
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: MessageCircle,
      title: 'AI Health Assistant',
      description: 'Get instant answers to your health questions in your preferred language',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Globe,
      title: 'Multilingual Support',
      description: 'Available in English, Hindi, and other regional languages',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: AlertTriangle,
      title: 'Disease Alerts',
      description: 'Real-time outbreak notifications and prevention tips for your area',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Shield,
      title: 'Preventive Care',
      description: 'Evidence-based health information and preventive care guidance',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Phone,
      title: 'WhatsApp Integration',
      description: 'Access health support directly through WhatsApp messaging',
      color: 'from-teal-500 to-blue-500'
    },
    {
      icon: BarChart3,
      title: 'Health Analytics',
      description: 'Track community health trends and get personalized insights',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Users Helped', icon: Users },
    { number: '50+', label: 'Health Topics', icon: Heart },
    { number: '24/7', label: 'Available', icon: Clock },
    { number: '5+', label: 'Languages', icon: Globe }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
                <Heart className="w-4 h-4 mr-2" />
                Empowering Rural Healthcare
              </span>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Personal
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                  Health Assistant
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Get instant, reliable health information in your language. From disease prevention 
                to outbreak alerts, GramCare brings healthcare knowledge to your fingertips.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/chat" className="btn-primary inline-flex items-center justify-center group">
                <MessageCircle className="w-5 h-5 mr-2" />
                Start Chatting
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button className="btn-outline inline-flex items-center justify-center group">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-3">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                    <div className="text-gray-600">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Health Support
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need for better health outcomes in rural communities
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="card p-8 group cursor-pointer"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How GramCare Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, fast, and reliable health assistance in three easy steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Ask Your Question',
                description: 'Type your health question in English, Hindi, or your local language',
                icon: MessageCircle
              },
              {
                step: '02',
                title: 'Get Instant Answer',
                description: 'Our AI provides evidence-based health information immediately',
                icon: CheckCircle
              },
              {
                step: '03',
                title: 'Take Action',
                description: 'Follow the guidance or get connected to local healthcare services',
                icon: ArrowRight
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="text-center relative"
                >
                  {/* Connection line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-purple-200 transform -translate-y-1/2 z-0" />
                  )}
                  
                  <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="text-sm font-bold text-blue-600 mb-2">
                      STEP {item.step}
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Join thousands of users who trust GramCare for their health information needs.
              Start your conversation today!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/chat" 
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Start Chatting Now
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                to="/alerts" 
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105"
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                View Health Alerts
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;