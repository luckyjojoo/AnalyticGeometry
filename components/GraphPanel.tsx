import React, { useEffect, useRef, useState } from 'react';
import { Coefficients } from '../types';

interface GraphPanelProps {
  coeffs: Coefficients;
}

type AxisType = 'x' | 'y' | null;

export const GraphPanel: React.FC<GraphPanelProps> = ({ coeffs }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [hoveredAxis, setHoveredAxis] = useState<AxisType>(null);

  // Math Constants
  const SCALE = 40; // Pixels per unit

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Resize canvas to fit container
    const resizeCanvas = () => {
      const { width, height } = container.getBoundingClientRect();
      
      // Prevent operations on zero-sized elements
      if (width === 0 || height === 0) return;

      const dpr = window.devicePixelRatio || 1;
      // Force integer dimensions for the buffer
      const newWidth = Math.floor(width * dpr);
      const newHeight = Math.floor(height * dpr);

      // Only update buffer size if changed
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
      }
      
      draw();
    };

    // Use ResizeObserver for robust size detection
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    
    resizeObserver.observe(container);
    resizeCanvas(); // Initial call

    return () => {
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coeffs, hoveredAxis]); // Re-draw when coefficients OR hover state changes

  const getGeometry = (width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const { a11, a12, a22, b1, b2, c: termC } = coeffs;

    const det = 4 * a11 * a22 - a12 * a12;
    
    let xi = 0;
    let eta = 0;
    let theta = 0;

    // Determine Theta first
    if (Math.abs(a12) > 1e-6) {
      if (Math.abs(a11 - a22) < 1e-6) {
        theta = a12 > 0 ? Math.PI / 4 : -Math.PI / 4;
      } else {
        theta = 0.5 * Math.atan(a12 / (a11 - a22));
      }
    } else {
      theta = 0;
    }

    if (Math.abs(det) > 1e-6) {
      // Ellipse/Hyperbola Center
      xi = (a12 * b2 - 2 * a22 * b1) / det;
      eta = (a12 * b1 - 2 * a11 * b2) / det;
    } else {
      // Parabola Vertex
      const c_ = Math.cos(theta);
      const s_ = Math.sin(theta);
      
      const A_ = a11*c_*c_ + a12*c_*s_ + a22*s_*s_;
      const C_ = a11*s_*s_ - a12*c_*s_ + a22*c_*c_;
      const D_ = b1*c_ + b2*s_;
      const E_ = -b1*s_ + b2*c_;
      const F_ = termC;

      let xv_prime = 0;
      let yv_prime = 0;

      if (Math.abs(C_) < 1e-6) {
        if (Math.abs(A_) > 1e-6) {
           xv_prime = -D_ / (2 * A_);
           const K = F_ - (D_*D_)/(4*A_);
           if (Math.abs(E_) > 1e-6) yv_prime = -K / E_;
        }
      } else {
        if (Math.abs(C_) > 1e-6) {
           yv_prime = -E_ / (2 * C_);
           const K = F_ - (E_*E_)/(4*C_);
           if (Math.abs(D_) > 1e-6) xv_prime = -K / D_;
        }
      }

      xi = xv_prime * c_ - yv_prime * s_;
      eta = xv_prime * s_ + yv_prime * c_;
    }

    // Canvas coords for O'
    const cxPx = centerX + xi * SCALE;
    const cyPx = centerY - eta * SCALE;

    return { cxPx, cyPx, theta };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Mouse in Canvas Pixels
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;
    
    const geom = getGeometry(canvas.width, canvas.height);
    if (!geom) {
      if (hoveredAxis !== null) setHoveredAxis(null);
      return;
    }

    const { cxPx, cyPx, theta } = geom;

    // Vector from O' to Mouse
    const dx = mx - cxPx;
    const dy = my - cyPx;

    // Project mouse vector onto the rotated axes lines
    const angleX = -theta;
    const nx_X = -Math.sin(angleX);
    const ny_X = Math.cos(angleX);
    const distX = Math.abs(dx * nx_X + dy * ny_X);

    const angleY = -theta + (Math.PI / 2); // Perpendicular
    const nx_Y = -Math.sin(angleY);
    const ny_Y = Math.cos(angleY);
    const distY = Math.abs(dx * nx_Y + dy * ny_Y);

    const THRESHOLD = 20 * dpr;

    let newHover: AxisType = null;
    // prioritize closer one
    if (distX < THRESHOLD && distX < distY) {
      newHover = 'x';
    } else if (distY < THRESHOLD) {
      newHover = 'y';
    }

    if (newHover !== hoveredAxis) {
      setHoveredAxis(newHover);
    }
  };

  const handleMouseLeave = () => {
    setHoveredAxis(null);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    if (width === 0 || height === 0) return;

    // --- 1. Background & Grid ---
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.strokeStyle = '#1e293b'; // slate-800 (Very faint grid)
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = centerX % SCALE; x < width; x += SCALE) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = centerY % SCALE; y < height; y += SCALE) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // --- 2. Curve Plotting ---
    let imgData: ImageData;
    try {
      imgData = ctx.getImageData(0, 0, width, height);
    } catch (e) {
      console.warn("Canvas getImageData failed:", e);
      return;
    }

    const data = imgData.data;
    let pointsDrawn = 0;

    const { a11, a12, a22, b1, b2, c } = coeffs;

    for (let py = 0; py < height; py++) {
      const y = -(py - centerY) / SCALE;
      
      for (let px = 0; px < width; px++) {
        const x = (px - centerX) / SCALE;

        // f(x,y)
        const f = a11 * x * x + a12 * x * y + a22 * y * y + b1 * x + b2 * y + c;

        // Gradient for distance field
        const dfdx = 2 * a11 * x + a12 * y + b1;
        const dfdy = a12 * x + 2 * a22 * y + b2;
        const gradMag = Math.sqrt(dfdx * dfdx + dfdy * dfdy);
        
        const dist = Math.abs(f) / (gradMag + 1e-6);
        const distPx = dist * SCALE;

        if (distPx < 1.5) {
          const index = (py * width + px) * 4;
          const alpha = Math.max(0, 1.5 - distPx); 
          
          data[index] = 34; // R
          data[index + 1] = 211; // G
          data[index + 2] = 238; // B
          data[index + 3] = 255 * Math.min(1, alpha + 0.2); 
          
          pointsDrawn++;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    setIsEmpty(pointsDrawn === 0);

    // --- 3. Rotated Axes (x', y') and Center (O') ---
    const geom = getGeometry(width, height);
    
    if (geom) {
      const { cxPx, cyPx, theta } = geom;

      ctx.save();
      ctx.translate(cxPx, cyPx);
      ctx.rotate(-theta);

      const axisLen = Math.max(width, height) * 1.5;

      // Common Styles
      const baseColor = '#fbbf24'; // amber-400
      const activeColor = '#fef08a'; // yellow-200 (brighter)
      const dash = [5, 5];
      const solid: number[] = [];

      // Draw x' axis
      const isXHover = hoveredAxis === 'x';
      ctx.strokeStyle = isXHover ? activeColor : baseColor;
      ctx.lineWidth = isXHover ? 2 : 1;
      ctx.setLineDash(isXHover ? solid : dash);
      if (isXHover) {
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.moveTo(-axisLen, 0);
      ctx.lineTo(axisLen, 0);
      ctx.stroke();

      // Draw y' axis
      const isYHover = hoveredAxis === 'y';
      ctx.strokeStyle = isYHover ? activeColor : baseColor;
      ctx.lineWidth = isYHover ? 2 : 1;
      ctx.setLineDash(isYHover ? solid : dash);
      if (isYHover) {
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.moveTo(0, -axisLen);
      ctx.lineTo(0, axisLen);
      ctx.stroke();

      // Labels for new axes
      ctx.shadowBlur = 0; // Reset shadow for text
      ctx.fillStyle = isXHover ? activeColor : baseColor;
      ctx.font = `italic ${isXHover ? 'bold 16px' : '12px'} serif`;
      ctx.fillText("x'", axisLen/2 - 20, -5);

      ctx.fillStyle = isYHover ? activeColor : baseColor;
      ctx.font = `italic ${isYHover ? 'bold 16px' : '12px'} serif`;
      ctx.fillText("y'", 5, -axisLen/2 + 20);

      ctx.restore();

      // Draw Center Point O'
      ctx.fillStyle = (isXHover || isYHover) ? activeColor : baseColor;
      if (isXHover || isYHover) {
         ctx.shadowColor = activeColor;
         ctx.shadowBlur = 5;
      }
      ctx.beginPath();
      ctx.arc(cxPx, cyPx, (isXHover || isYHover) ? 5 : 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.fillText("O'", cxPx + 8, cyPx - 6);
    }

    // --- 4. Main Axes (Standard x, y) ---
    ctx.strokeStyle = '#94a3b8'; // slate-400
    ctx.lineWidth = 2;
    ctx.setLineDash([]); // Solid
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // --- 5. Integer Ticks & Labels ---
    ctx.fillStyle = '#cbd5e1'; // slate-300
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // X-Axis Ticks
    const startX = Math.ceil(-centerX / SCALE);
    const endX = Math.floor((width - centerX) / SCALE);
    
    for (let i = startX; i <= endX; i++) {
      if (i === 0) continue;
      const xPx = centerX + i * SCALE;
      
      ctx.beginPath();
      ctx.moveTo(xPx, centerY - 3);
      ctx.lineTo(xPx, centerY + 3);
      ctx.stroke();
      ctx.fillText(i.toString(), xPx, centerY + 6);
    }

    // Y-Axis Ticks
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    const minMathY = -Math.ceil((height - centerY) / SCALE);
    const maxMathY = Math.floor(centerY / SCALE);

    for (let i = minMathY; i <= maxMathY; i++) {
      if (i === 0) continue;
      const yPx = centerY - i * SCALE;

      ctx.beginPath();
      ctx.moveTo(centerX - 3, yPx);
      ctx.lineTo(centerX + 3, yPx);
      ctx.stroke();
      ctx.fillText(i.toString(), centerX - 6, yPx);
    }
    
    // --- 6. Axis Names (x, y, O) ---
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic bold 16px serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText("x", width - 10, centerY - 6);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText("y", centerX + 10, 10);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText("O", centerX - 6, centerY + 6);
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full min-h-[150px] bg-slate-950 overflow-hidden cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-xl max-w-xs md:max-w-md text-center mx-4">
            <h3 className="text-lg md:text-xl font-bold text-slate-200 mb-2">Curve Empty</h3>
            <p className="text-sm md:text-base text-slate-400">
              No real solution in visible range.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};