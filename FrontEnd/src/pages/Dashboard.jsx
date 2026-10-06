import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Image, ArrowLeft, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  // Live monitoring is locked for now
  const [feedMode, setFeedMode] = useState(false);
  const [modeText, setModeText] = useState('Live Monitoring Locked');

  const handleToggle = () => {
    // intentionally disabled while live monitoring is locked
    return;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
        <a href="/" className="text-2xl font-black tracking-tighter">
          Trace<span className="text-red-600">X</span>
          <span className="text-red-600 ml-1 text-xs align-top">●</span>
        </a>
        <div className="hidden md:flex space-x-8 text-xs font-bold tracking-widest text-gray-500 uppercase">
          <a href="/" className="hover:text-black transition">Home</a>
          <a href="/dashboard" className="hover:text-black transition text-black">Dashboard</a>
          <a href="/workbench" className="hover:text-black transition">Workbench</a>
          <a href="#" className="hover:text-black transition">Docs</a>
        </div>
        <a href="/">
          <button className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition flex items-center">
            Home <ChevronRight size={16} className="ml-1" />
          </button>
        </a>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full pt-12 pb-12">
        <main className="flex-1 p-6 w-full">
          <div className="w-full max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center bg-red-50 text-red-600 px-3 py-1 rounded-md text-xs font-bold tracking-widest uppercase mb-4">
                Surveillance Dashboard
              </div>
              <h2 className="text-4xl font-black tracking-tighter">Live Monitoring System</h2>
            </div>

            {/* Video Feed Container */}
            <div className="relative">
              <h3 className="text-lg font-bold mb-4 text-gray-900">Live Video Feed</h3>
              
              <div className="w-full max-w-6xl h-96 bg-gray-100 rounded-lg mb-5 flex items-center justify-center overflow-hidden relative mx-auto border-2 border-gray-200 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-50/10 to-transparent opacity-30"></div>
                
                {/* Live Video Feed (locked) */}
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <p className="text-lg font-semibold mb-2">Live monitoring is currently locked</p>
                    <p className="text-sm">The live feed has been disabled for maintenance.</p>
                  </div>
                </div>
                
                {/* Fallback Message */}
                <div 
                  id="fallback-message" 
                  className="hidden flex-col items-center justify-center text-gray-400 relative z-10 bg-white rounded-lg p-8"
                >
                  <WifiOff className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-lg font-semibold mb-2">Video feed unavailable</p>
                  <p className="text-sm">Make sure the Flask server is running on port 5000</p>
                </div>
              </div>

              {/* Feed Mode Toggle */}
              <div className="mt-8 flex flex-col items-center bg-gray-50 p-8 rounded-xl border border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest">Camera Feed Mode</h4>
                <div className="relative inline-flex items-center">
                  <input 
                    type="checkbox" 
                    id="toggle" 
                    checked={feedMode}
                    onChange={handleToggle}
                    className="sr-only"
                    disabled
                  />
                  <label 
                    htmlFor="toggle" 
                    className={`relative inline-block w-16 h-8 rounded-full transition-all duration-300 border-2 cursor-not-allowed ${
                      feedMode ? 'bg-red-50 border-red-600' : 'bg-white border-gray-300'
                    }`}
                  >
                    <span 
                      className={`absolute top-1 w-6 h-6 bg-gray-800 rounded-full transition-transform duration-300 ${
                        feedMode ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </label>
                </div>
                <p className="text-center text-sm font-semibold text-gray-700 mt-4 h-6 flex items-center">
                  {modeText}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 w-full mt-8">
              <button className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition font-semibold shadow-lg">
                <Image className="w-5 h-5" />
                <span>Place Evidence</span>
              </button>
              <button className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg flex items-center gap-2 transition font-semibold">
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full bg-white text-gray-900 border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-8 flex justify-between items-center text-xs font-bold tracking-widest text-gray-500 uppercase">
          <div>TRACEX DASHBOARD // 2026_SEC_CORP</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-black transition">Privacy</a>
            <a href="#" className="hover:text-black transition">Terms</a>
            <a href="#" className="hover:text-black transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
