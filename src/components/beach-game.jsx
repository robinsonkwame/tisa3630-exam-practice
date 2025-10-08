import React, { useEffect, useRef } from 'react';

function BeachBackground({ text }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ripples = [];
    const maxRipples = 0;

    class Ripple {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = Math.random() * 100 + 80;
        this.speed = Math.random() * 0.5 + 0.3;
        this.opacity = 0.4;
      }

      update() {
        this.radius += this.speed;
        this.opacity = Math.max(0, this.opacity - 0.002);
      }

      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      isFinished() {
        return this.radius >= this.maxRadius || this.opacity <= 0;
      }
    }

    function createRipple() {
      const x = Math.random() * canvas.width;
      const y = Math.random() * (canvas.height * 0.6); // Only in water area
      ripples.push(new Ripple(x, y));
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].update();
        ripples[i].draw(ctx);
        
        if (ripples[i].isFinished()) {
          ripples.splice(i, 1);
        }
      }

      requestAnimationFrame(animate);
    }

    // Create ripples at random intervals
    const rippleInterval = setInterval(() => {
      if (ripples.length < maxRipples) {
        createRipple();
      }
    }, 1500);

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(rippleInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full 
      /* Mobile: Cover full scrollable area */
      min-h-screen h-auto
      /* Desktop: Fixed height */
      md:h-screen 
      overflow-hidden
    ">
      {/* SVG Beach Background */}
      <img 
        src="/svg/svg_output.svg"
        alt="Beach background"
        className="absolute inset-0 w-full 
          /* Mobile: Cover scrollable area */
          min-h-full h-auto
          /* Desktop: Full height */
          md:h-full 
          object-cover object-center
        "
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200/30 via-cyan-300/40 to-amber-200/50">
        {/* Animated ripple canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ mixBlendMode: 'overlay' }}
        />
      </div>

      {/* Content layer */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {text && (
          <div className="text-white text-2xl font-bold drop-shadow-lg">
            {text}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BeachGame() {
  return <BeachBackground text="Beach Background Layer" />;
}
