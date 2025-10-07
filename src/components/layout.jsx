import React from 'react';

function GameLayout() {
  return (
    <div className="relative z-10 w-full h-screen p-2 md:p-4">
        {/* Top bar container - B1 and B3 side by side */}
        <div className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 w-11/12 flex flex-row gap-2 items-center justify-center">
          {/* B1 Top bar chart metrics */}
          <div className="flex-1 md:w-64 lg:w-80 h-20 md:h-24 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm md:text-base">B1 Top bar chart metrics</span>
          </div>
          
          {/* B3 Game difficulty slider */}
          <div className="w-32 md:w-44 h-20 md:h-24 bg-white/20 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
            <span className="text-white font-bold text-sm">Difficulty</span>
            <span className="text-white text-sm">Mode: Easy</span>
          </div>
        </div>

        {/* C3 Swiper Stack Left - Desktop: Left, Mobile: Top */}
        <div className="absolute left-1/2 md:left-8 top-36 md:top-1/2 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 w-40 md:w-44 h-52 md:h-60 bg-white/20 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
          <span className="text-white font-bold text-center text-sm mb-3">C3 Swiper<br/>Stack Left</span>
          {/* C4 Choice Indicators */}
          <div className="flex gap-2 mt-3">
            <div className="w-6 h-6 rounded-full bg-red-400 border-2 border-white"></div>
            <div className="w-6 h-6 rounded-full bg-green-400 border-2 border-white"></div>
            <div className="w-6 h-6 rounded-full bg-green-400 border-2 border-white"></div>
          </div>
        </div>

        {/* C3 Swiper Stack Right - Desktop: Right, Mobile: Bottom (above footer) */}
        <div className="absolute left-1/2 md:left-auto md:right-8 bottom-24 md:bottom-auto md:top-1/2 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 w-40 md:w-44 h-52 md:h-60 bg-white/20 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
          <span className="text-white font-bold text-center text-sm mb-3">C3 Swiper<br/>Stack Right</span>
          {/* C4 Choice Indicators */}
          <div className="flex gap-2 mt-3">
            <div className="w-6 h-6 rounded-full bg-red-400 border-2 border-white"></div>
            <div className="w-6 h-6 rounded-full bg-red-400 border-2 border-white"></div>
            <div className="w-6 h-6 rounded-full bg-green-400 border-2 border-white"></div>
          </div>
        </div>

        {/* C5 Main Card (Center) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 md:w-80 lg:w-96 h-64 md:h-80 bg-white/30 backdrop-blur-md rounded-xl shadow-2xl flex flex-col items-center justify-center p-4">
          <div className="text-white font-bold text-base md:text-lg mb-3">Question</div>
          <div className="text-white font-bold text-xl md:text-2xl mb-5">C5 Main Card Top</div>
          <div className="text-white font-bold text-base md:text-lg mb-4">Category</div>
          <div className="text-white font-bold text-lg md:text-xl mb-3">Choices</div>
          <div className="text-white text-sm md:text-base">C5 Main Card Bottom</div>
        </div>

        {/* Bottom scores bar */}
        <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-3 md:gap-4">
          {/* B2 User Score */}
          <div className="w-36 md:w-40 h-16 md:h-18 bg-white/20 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
            <span className="text-white font-bold text-sm">Your Score</span>
            <span className="text-green-300 text-base md:text-lg font-bold">XYZ %</span>
          </div>

          {/* B2 Computer Score */}
          <div className="w-36 md:w-40 h-16 md:h-18 bg-white/20 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
            <span className="text-white font-bold text-sm">Computer</span>
            <span className="text-red-300 text-base md:text-lg font-bold">XYZ %</span>
          </div>
        </div>
    </div>
  );
}

export default GameLayout;
