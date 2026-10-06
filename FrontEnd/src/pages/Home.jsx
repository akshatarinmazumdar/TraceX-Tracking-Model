import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, Download, Play, Map, Focus, 
  Fingerprint, Car, Shield, Activity, 
  ShieldCheck, Database, Users, ChevronRight
} from 'lucide-react';

// --- INTRO ENTRY SCREEN ---
const IntroScreen = ({ onEnter }) => {
  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center cursor-pointer"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 5 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      onClick={onEnter}
    >
      <motion.div
        animate={{ y: [-15, 15, -15] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="flex flex-col items-center group"
      >
        <Eye size={80} strokeWidth={1.5} className="text-black group-hover:text-red-600 transition-colors duration-300" />
        <p className="mt-4 text-sm tracking-widest text-gray-400 font-semibold uppercase">Click to Initialize</p>
      </motion.div>
    </motion.div>
  );
};

// --- MAIN NAVBAR ---
const Navbar = () => {
  const navigate = window.location;
  return (
    <nav className="flex items-center justify-between px-10 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
      <div className="text-2xl font-black tracking-tighter">
        Trace<span className="text-red-600">X</span>
        <span className="text-red-600 ml-1 text-xs align-top">●</span>
      </div>
      <div className="hidden md:flex space-x-8 text-xs font-bold tracking-widest text-gray-500 uppercase">
        <a href="/" className="hover:text-black transition">Home</a>
        <a href="/dashboard" className="hover:text-black transition">Dashboard</a>
        <a href="/workbench" className="hover:text-black transition">Workbench</a>
        <a href="#" className="hover:text-black transition">Docs</a>
        <a href="#" className="hover:text-black transition">Pricing</a>
      </div>
      <a href="/dashboard">
        <button className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition flex items-center">
          Access Dashboard <ChevronRight size={16} className="ml-1" />
        </button>
      </a>
    </nav>
  );
};

// --- HERO SECTION ---
const Hero = () => (
  <section className="relative pt-20 pb-32 px-4 flex flex-col items-center text-center overflow-hidden">
    {/* Grid Background Pattern */}
    <div 
      className="absolute inset-0 pointer-events-none opacity-[0.03]" 
      style={{ 
        backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
        backgroundSize: '40px 40px' 
      }}
    />
    
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className="z-10"
    >
      <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 mb-8 shadow-sm">
        <span className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse" />
        <span className="text-xs font-bold tracking-widest text-gray-800 uppercase">AI Surveillance Engine</span>
      </div>
      
      <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-none mb-6">
        Track the <br /> untrackable with <br /> Trace<span className="text-red-600">X</span>
      </h1>
      
      <p className="max-w-2xl mx-auto text-gray-500 text-lg mb-10 leading-relaxed">
        An AI-powered investigation system designed to search, identify, and monitor suspects 
        or vehicles across CCTV footage and live camera feeds in real time.
      </p>
      
      <div className="flex justify-center space-x-4">
        <a href="/dashboard">
          <button className="bg-black text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition flex items-center shadow-lg">
            <Download size={20} className="mr-2" /> Access Dashboard
          </button>
        </a>
        <a href="#workbench">
          <button className="bg-white text-black border border-gray-200 px-8 py-4 rounded-full font-semibold hover:bg-gray-50 transition flex items-center shadow-sm">
            <Play size={20} className="mr-2" /> View Live Demo
          </button>
        </a>
      </div>
    </motion.div>
  </section>
);

// --- FEATURES CARDS ROW ---
const FeatureCards = () => {
  const features = [
    { 
      title: "Real-Time Scanning", 
      desc: "Scan multiple camera feeds simultaneously using AI to detect suspect photos or license plates instantly." 
    },
    { 
      title: "Route Prediction", 
      desc: "Advanced algorithms track movement patterns and predict the suspect's likely route across city-wide camera networks." 
    },
    { 
      title: "Evidence Engine", 
      desc: "Automatically generate snapshots, video clips, and confidence scores for rock-solid investigative evidence." 
    }
  ];

  return (
    <section className="px-10 py-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((feat, idx) => (
        <motion.div 
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.2 }}
          className="bg-gray-50 border border-gray-100 p-8 rounded-3xl relative overflow-hidden group hover:shadow-lg transition"
        >
          <div className="flex items-center mb-4">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2" />
            <h3 className="font-bold text-lg">{feat.title}</h3>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">{feat.desc}</p>
        </motion.div>
      ))}
    </section>
  );
};

// --- VIDEO SHOWCASE SECTION ---
const VideoShowcase = () => (
  <section id="future" className="w-full px-4 py-16">
    <div className="max-w-6xl mx-auto bg-black rounded-xl overflow-hidden shadow-2xl relative aspect-video flex items-end p-8 border-4 border-gray-900">
      {/* Autoplay looping muted hero video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/hero_video.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      {/* Dark gradient overlay so text is legible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="z-10 relative">
        <div className="inline-flex items-center bg-black/60 backdrop-blur text-white px-3 py-1 rounded border border-gray-700 text-xs font-mono tracking-widest mb-4">
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2 animate-pulse" />
          LIVE INVESTIGATION: ID_TRACER_01
        </div>
        <h2 className="text-white text-5xl font-bold">The future of investigation.</h2>
      </div>
    </div>
  </section>
);

// --- HORIZONTAL ICON NAVIGATION ---
const IconNav = () => {
  const icons = [
    { icon: Eye,         label: "CCTV FEED"    },
    { icon: Focus,       label: "SURVEILLANCE"  },
    { icon: Map,         label: "ROUTE TRACK"  },
    { icon: Focus,       label: "FACE SCAN"    },
    { icon: Fingerprint, label: "BIOMETRICS"   },
    { icon: Car,         label: "PLATE ID"     },
    { icon: Shield,      label: "SECURITY"     },
    { icon: Activity,    label: "LIVE ANALYSIS" }
  ];

  return (
    <section className="py-20 border-y border-gray-100 bg-white relative overflow-hidden">
      {/* Subtle red glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-100 blur-[100px] rounded-full opacity-50 pointer-events-none" />

      <div className="max-w-6xl mx-auto flex justify-between items-center px-10 relative z-10">
        {icons.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center group cursor-pointer">
            <div className="bg-white shadow-sm border border-gray-100 p-4 rounded-full mb-4 group-hover:-translate-y-2 group-hover:shadow-md transition-all duration-300">
              <item.icon size={24} className="text-black" />
            </div>
            <span className="text-[10px] font-bold tracking-widest text-gray-400 group-hover:text-black uppercase">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

// --- CORE ENGINE SECTION ---
const CoreSection = () => (
  <section className="py-32 px-10 max-w-7xl mx-auto">
    <div className="inline-flex items-center bg-red-50 text-red-600 px-3 py-1 rounded-md text-xs font-bold tracking-widest uppercase mb-6">
      Advanced Engine Modules
    </div>
    <h2 className="text-6xl font-black tracking-tighter mb-16">
      The Core of <span className="text-red-600">TraceX.</span>
    </h2>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
      {/* Left List */}
      <div className="space-y-4">
        <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-2xl flex items-start cursor-pointer hover:border-red-200 transition">
          <div className="bg-red-600 p-3 rounded-xl mr-4 text-white flex-shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center justify-between">
              Behavioral Analytics <ChevronRight className="text-red-600" size={18} />
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Advanced shoplifting detection system using YOLO Pose Estimation to identify 
              suspicious handling of items in real-time.
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-2xl flex items-start cursor-pointer hover:shadow-md transition opacity-60 hover:opacity-100">
          <div className="bg-gray-100 p-3 rounded-xl mr-4 text-gray-500 flex-shrink-0">
            <Database size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Evidence Vault</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Direct access to our senior blockchain architects. No bots, just 24/7 human 
              intelligence to resolve your complex synchronization and encryption challenges.
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-2xl flex items-start cursor-pointer hover:shadow-md transition opacity-60 hover:opacity-100">
          <div className="bg-gray-100 p-3 rounded-xl mr-4 text-gray-500 flex-shrink-0">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Predictive Intelligence</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              High-precision AI people counting and crowd density analysis for optimizing 
              traffic control and safety management.
            </p>
          </div>
        </div>
      </div>

      {/* Right Media Display */}
      <div className="bg-black rounded-3xl overflow-hidden aspect-[4/3] relative flex items-center justify-center border-8 border-gray-900 shadow-2xl">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/core_video.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer
    className="w-full bg-white text-black font-sans relative border-t border-gray-100 overflow-hidden pt-16 pb-12"
    style={{
      backgroundImage: `
        linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    }}
  >
    <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
      <div className="flex flex-col justify-start space-y-2">
        <span className="text-[10px] font-bold tracking-[0.25em] text-gray-400 uppercase">
          GLOBAL SURVEILLANCE ENGINE
        </span>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-black uppercase">
          EXPERIENCE LIFTOFF.
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-8 md:justify-items-end">
        <div className="flex flex-col space-y-3">
          {['DOWNLOAD', 'PRODUCT', 'DOCS', 'CHANGELOG', 'PRESS', 'RELEASES'].map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-xs font-bold tracking-[0.15em] text-gray-500 hover:text-black transition-colors duration-200 uppercase"
            >
              {link}
            </a>
          ))}
        </div>
        <div className="flex flex-col space-y-3 md:pl-12">
          {['BLOG', 'PRICING', 'USE CASES'].map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(' ', '-')}`}
              className="text-xs font-bold tracking-[0.15em] text-gray-500 hover:text-black transition-colors duration-200 uppercase"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </div>

    <div className="w-full text-center my-8 select-none pointer-events-none relative z-0 mix-blend-multiply">
      <h1 className="text-[12rem] md:text-[18rem] font-black tracking-tighter leading-none text-black inline-block transform translate-y-6">
        trace<span className="text-red-600">X</span>
      </h1>
    </div>

    <div className="max-w-7xl mx-auto px-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 text-[11px] font-medium tracking-wider text-gray-400 uppercase">
      <div>TRACEX // 2026_SEC_CORP</div>
      <div className="flex flex-wrap gap-x-6 md:justify-end">
        {['ABOUT TRACEX', 'PRODUCTS', 'PRIVACY', 'TERMS'].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase().replace(' ', '-')}`}
            className="hover:text-black transition-colors duration-200"
          >
            {item}
          </a>
        ))}
      </div>
    </div>

    <div className="w-full flex flex-col items-center justify-center mt-12 relative z-10">
      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mb-2"></div>
      <span className="text-[9px] font-bold tracking-[0.4em] text-gray-400 uppercase">
        END OF TRANSMISSION
      </span>
    </div>
  </footer>
);

// --- HOME PAGE COMPONENT ---
export default function Home() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-red-200">
      <AnimatePresence>
        {!introDone && (
          <IntroScreen key="intro" onEnter={() => setIntroDone(true)} />
        )}
      </AnimatePresence>

      {introDone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <Navbar />
          <Hero />
          <FeatureCards />
          <VideoShowcase />
          <IconNav />
          <CoreSection />
          <Footer />
        </motion.div>
      )}
    </div>
  );
}
