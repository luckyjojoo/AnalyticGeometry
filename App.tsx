import React, { useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { GraphPanel } from './components/GraphPanel';
import { MathDisplay } from './components/MathDisplay';
import { Coefficients } from './types';

const App: React.FC = () => {
  // Initial State: A nice Ellipse roughly centered
  // 4x^2 - 2xy + 4y^2 - 20 = 0 (Rotated ellipse)
  const [coeffs, setCoeffs] = useState<Coefficients>({
    a11: 1,
    a12: 1,
    a22: 1,
    b1: 0,
    b2: 0,
    c: -10
  });

  const handleCoeffChange = (key: keyof Coefficients, value: number) => {
    setCoeffs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    /* 
      Layout Strategy:
      Mobile: Flex Column. 
      - Controls (flex-none): Auto height
      - Graph (flex-1): Fills remaining space
      - Math (flex-none): Auto height
      
      lg: Grid Layout
    */
    <div className="w-screen h-[100dvh] bg-slate-950 text-slate-100 font-sans overflow-hidden flex flex-col lg:grid lg:grid-cols-[360px_1fr] lg:grid-rows-[auto_1fr]">
      //<div style={{ background: "white", color: "black", minHeight: "100vh" }}>
      {/* Control Panel Area */}
      <div className="flex-none z-20 shadow-sm lg:shadow-none lg:col-start-1 lg:row-start-1 lg:border-r lg:border-slate-800">
        <ControlPanel coefficients={coeffs} onChange={handleCoeffChange} />
      </div>

      {/* Graph Area */}
      <div className="flex-1 relative bg-slate-950 lg:col-start-2 lg:row-span-2 lg:h-full w-full min-h-0">
        <GraphPanel coeffs={coeffs} />
      </div>

      {/* Math Display Area */}
      <div className="flex-none z-20 border-t border-slate-800 lg:border-t lg:shadow-none lg:col-start-1 lg:row-start-2 lg:border-r bg-slate-900">
        <MathDisplay coeffs={coeffs} />
      </div>
    </div>
  );
};

export default App;
