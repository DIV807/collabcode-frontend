import React, { useState, useEffect } from 'react';

function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const codeSnippets = [
    '{ "collaboration": true }',
    'function code() { return "together"; }',
    'const team = developers.unite();',
    'git commit -m "real-time magic"',
    '// Building the future, together'
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-black text-white font-mono overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Dynamic gradient orbs */}
        <div 
          className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl transition-all duration-1000 ease-out"
          style={{
            background: 'radial-gradient(circle, #3b82f6, #8b5cf6)',
            left: `${mousePos.x / 20}px`,
            top: `${mousePos.y / 20}px`,
            transform: 'translate(-50%, -50%)'
          }}
        />
        <div 
          className="absolute w-80 h-80 rounded-full opacity-15 blur-3xl transition-all duration-1000 ease-out"
          style={{
            background: 'radial-gradient(circle, #10b981, #06b6d4)',
            right: `${mousePos.x / 30}px`,
            bottom: `${mousePos.y / 30}px`,
            transform: 'translate(50%, 50%)'
          }}
        />

        {/* Floating code snippets */}
        {codeSnippets.map((snippet, index) => (
          <div
            key={index}
            className={`absolute text-xs text-gray-600 opacity-30 font-mono animate-float-${index + 1}`}
            style={{
              left: `${20 + (index * 15)}%`,
              top: `${20 + (index * 10)}%`,
              animationDelay: `${index * 2}s`
            }}
          >
            {snippet}
          </div>
        ))}

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-12 gap-4 h-full w-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="border border-gray-800 h-16"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 w-full flex items-center justify-between p-6 md:px-12 backdrop-blur-sm bg-black/20">
        <div className={`flex items-center space-x-3 transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-10 h-10 text-cyan-400 animate-pulse">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
            <div className="absolute inset-0 w-10 h-10 border-2 border-cyan-400 rounded-full animate-ping opacity-20"></div>
          </div>
          <span className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            CollabCode
          </span>
        </div>

        <div className={`flex items-center space-x-8 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
          <a href="#features" className="text-gray-300 hover:text-cyan-400 transition-all duration-300 hidden md:block font-semibold hover:scale-110">
            Features
          </a>
          <a href="#about" className="text-gray-300 hover:text-green-400 transition-all duration-300 hidden md:block font-semibold hover:scale-110">
            About
          </a>
          <a href="#contact" className="text-gray-300 hover:text-purple-400 transition-all duration-300 hidden md:block font-semibold hover:scale-110">
            Contact
          </a>

          <a
            href="/login"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-2xl hover:from-blue-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/25"
          >
            Login
          </a>
          <a
            href="/register"
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-2xl hover:from-green-400 hover:to-emerald-500 transition-all duration-300 transform hover:scale-105 hover:shadow-green-500/25"
          >
            Sign Up
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center text-center px-4 py-16 md:py-24">
        <div className={`transform transition-all duration-1200 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="mb-8">
            <span className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-semibold backdrop-blur-sm">
              🚀 The Future of Collaborative Coding
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-8 max-w-6xl">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
              Code Together,
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-emerald-500 to-cyan-500 bg-clip-text text-transparent animate-gradient-x">
              Build Faster
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl leading-relaxed">
            Experience the power of real-time collaboration with our revolutionary code editor. 
            <span className="text-cyan-400 font-semibold"> Sync instantly</span>, 
            <span className="text-green-400 font-semibold"> share seamlessly</span>, and 
            <span className="text-purple-400 font-semibold"> build together</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
            <a
              href="/dashboard"
              className="group relative px-12 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xl font-bold rounded-2xl shadow-2xl hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/30"
            >
              <span className="relative z-10">Start Coding Now</span>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            </a>
            
            <a
              href="/demo"
              className="px-12 py-5 border-2 border-gray-600 text-gray-300 text-xl font-bold rounded-2xl hover:border-white hover:text-white hover:bg-white/5 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            >
              Watch Demo
            </a>
          </div>
        </div>

        {/* Feature highlights */}
        <div className={`mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl transform transition-all duration-1200 delay-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-8 rounded-2xl backdrop-blur-sm border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 transform hover:scale-105">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-cyan-400 mb-3">Lightning Fast</h3>
            <p className="text-gray-300">Real-time synchronization with zero latency. See changes as they happen.</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 p-8 rounded-2xl backdrop-blur-sm border border-green-500/20 hover:border-green-400/40 transition-all duration-300 transform hover:scale-105">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-bold text-green-400 mb-3">Team-First</h3>
            <p className="text-gray-300">Built for teams with advanced collaboration tools and permissions.</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-8 rounded-2xl backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 transform hover:scale-105">
            <div className="text-4xl mb-4">🛠️</div>
            <h3 className="text-xl font-bold text-purple-400 mb-3">Full-Stack</h3>
            <p className="text-gray-300">Integrated terminal, debugging, and deployment tools in one place.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-gray-500 text-sm w-full p-6 text-center backdrop-blur-sm bg-black/20">
        <p>&copy; {new Date().getFullYear()} CollabCode. Empowering developers worldwide.</p>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-size: 200% 200%; background-position: left center; }
          50% { background-size: 200% 200%; background-position: right center; }
        }
        
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
        
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-25px, -40px) rotate(-120deg); }
          66% { transform: translate(35px, 15px) rotate(-240deg); }
        }
        
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(20px, -25px) rotate(90deg); }
          66% { transform: translate(-30px, 30px) rotate(180deg); }
        }
        
        @keyframes float-4 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-35px, -20px) rotate(-90deg); }
          66% { transform: translate(25px, 35px) rotate(-180deg); }
        }
        
        @keyframes float-5 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(40px, -35px) rotate(60deg); }
          66% { transform: translate(-15px, 25px) rotate(300deg); }
        }
        
        .animate-gradient-x { animation: gradient-x 3s ease infinite; }
        .animate-float-1 { animation: float-1 20s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 25s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 30s ease-in-out infinite; }
        .animate-float-4 { animation: float-4 22s ease-in-out infinite; }
        .animate-float-5 { animation: float-5 28s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default LandingPage;