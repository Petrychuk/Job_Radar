import { useEffect, useRef } from 'react';

export default function MatrixBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix characters - mix of katakana, latin, numbers, symbols
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*(){}[]|;:<>?/\\~`';
    const charArray = chars.split('');
    
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    // Array to track the y position of each column
    const drops = Array(columns).fill(1);
    
    // Vary the starting positions randomly
    for (let i = 0; i < drops.length; i++) {
      drops[i] = Math.random() * -100;
    }

    const draw = () => {
      // Semi-transparent black to create fade effect
      ctx.fillStyle = 'rgba(2, 4, 10, 0.04)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Green text with varying brightness
      ctx.font = `${fontSize}px "Courier New", monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = charArray[Math.floor(Math.random() * charArray.length)];
        
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        // Vary the green color intensity
        const brightness = Math.random();
        if (brightness > 0.95) {
          // Bright leading character
          ctx.fillStyle = '#ffffff';
        } else if (brightness > 0.8) {
          ctx.fillStyle = '#00ff41';
        } else if (brightness > 0.5) {
          ctx.fillStyle = 'rgba(0, 255, 65, 0.7)';
        } else {
          ctx.fillStyle = 'rgba(0, 255, 65, 0.3)';
        }
        
        ctx.fillText(char, x, y);

        // Reset drop to top with random delay when it reaches bottom
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        // Move drop down - slower speed for subtlety
        drops[i] += 0.5;
      }
    };

    // Slower interval for subtle animation (60ms instead of 33ms)
    const interval = setInterval(draw, 60);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 0,
        opacity: 0.4 // Reduce overall opacity for subtlety
      }}
    />
  );
}
