import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Bell, BarChart3, Settings, Home } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      id: 'home',
      icon: Home,
      label: 'Home',
      path: '/'
    },
    {
      id: 'chat',
      icon: MessageCircle,
      label: 'Chat',
      path: '/chat'
    },
    {
      id: 'alerts',
      icon: Bell,
      label: 'Alerts',
      path: '/alerts'
    },
    {
      id: 'dashboard',
      icon: BarChart3,
      label: 'Stats',
      path: '/dashboard'
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      path: '/settings'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Bottom Navigation for all screen sizes */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="bg-white/95 backdrop-blur-md border-t border-gray-200/50 px-2 py-2"
        >
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                    active
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className={`p-2 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-blue-100'
                      : 'hover:bg-gray-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      active ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                  </div>
                  <span className={`text-xs mt-1 font-medium ${
                    active ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {item.label}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 w-8 h-1 bg-blue-600 rounded-full"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
      
      {/* Spacer for bottom navigation */}
      <div className="h-20" />
    </>
  );
};

export default BottomNavigation;