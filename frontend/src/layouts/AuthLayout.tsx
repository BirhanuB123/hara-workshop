import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Hammer } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-metal-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Top back button */}
      <div className="absolute top-6 left-6 z-10">
        <Link 
          to="/" 
          className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white bg-metal-900 hover:bg-metal-800 px-3 py-2 rounded-md border border-metal-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Logo & Headline */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <Link to="/" className="inline-block mb-3">
          <img 
            src="/hara-logo-transparent.png" 
            alt="HARA WORKSHOP Logo" 
            className="h-16 w-16 mx-auto object-contain p-1 rounded-full bg-white border-2 border-brand-red shadow-xl" 
          />
        </Link>
        <h2 className="text-2xl font-black tracking-wider text-white uppercase">
          HARA <span className="text-brand-red">WORKSHOP</span>
        </h2>
        <p className="mt-1 text-xs tracking-widest text-metal-400 uppercase font-medium">
          Metal and Wood Solution • Addis Ababa
        </p>
      </div>

      {/* Card Form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-metal-900/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-xl border border-metal-800">
          <Outlet />
        </div>

        {/* Security badges */}
        <div className="mt-6 flex items-center justify-center space-x-4 text-xs text-metal-500">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-red" />
            <span>Encrypted Session</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <Hammer className="w-3.5 h-3.5 text-metal-400" />
            <span>Master Craftsmen Platform</span>
          </span>
        </div>
      </div>
    </div>
  );
};
