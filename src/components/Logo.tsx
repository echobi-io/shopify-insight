import React from 'react';
import { BarChart3 } from 'lucide-react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <BarChart3 className="h-5 w-5 text-white" />
      </div>
      <span className="text-xl font-bold text-gray-900">echoSignal</span>
    </div>
  );
};

export default Logo;
