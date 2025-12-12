import React, { useState, useRef, useEffect } from 'react';

const CanvasHover = ({ width = 466, height = 466 }) => {
  const canvasRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 绘制canvas内容
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制一些示例元素
    ctx.fillStyle = '#1890ff';
    ctx.fillRect(50, 50, 100, 100);
    ctx.fillRect(250, 150, 100, 100);
    ctx.fillRect(150, 300, 100, 100);
  }, [width, height]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检测是否悬停在特定区域
    if ((x > 50 && x < 150 && y > 50 && y < 150) || 
        (x > 250 && x < 350 && y > 150 && y < 250) ||
        (x > 150 && x < 250 && y > 300 && y < 400)) {
      setHoverInfo(`区域: (${Math.floor(x)}, ${Math.floor(y)})`);
      setHoverPosition({ x: e.clientX, y: e.clientY });
    } else {
      setHoverInfo(null);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverInfo(null)}
        style={{ width: '100%', height: '100%', cursor: 'pointer' }}
      />
      
      {hoverInfo && (
        <div style={{
          position: 'absolute',
          left: hoverPosition.x + 10,
          top: hoverPosition.y + 10,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: 4,
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          {hoverInfo}
        </div>
      )}
    </div>
  );
};

export default CanvasHover;