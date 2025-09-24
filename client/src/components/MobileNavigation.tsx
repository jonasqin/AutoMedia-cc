import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Zap,
  BookOpen,
  Target,
  User,
} from 'lucide-react';

const MobileNavigation: React.FC = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Collect', href: '/collection', icon: Search },
    { name: 'Generate', href: '/ai-generation', icon: Zap },
    { name: 'Library', href: '/library', icon: BookOpen },
    { name: 'Topics', href: '/topics', icon: Target },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors touch-target ${
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon
                className={`w-5 h-5 mb-1 ${
                  isActive ? 'text-primary-600' : 'text-gray-400'
                }`}
              />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;