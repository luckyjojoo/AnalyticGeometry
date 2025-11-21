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
    c: -10,
  });

  const handleCoeffChange = (key: keyof Coefficients, value: number) => {
    setCoeffs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    /*
      Layout Strategy (fixed for mobile):

      Mobile (default): CSS grid with 3 rows
        row 1: auto  -> controls
        row 2: 1fr   -> graph (fills all remaining vertical space)
        row 3: auto  -> math display

      Desktop (lg+): 2 columns
        left column:  340px (controls + math stacked)
        right column: 1fr   (graph filling height)
    */
    <div
      className="
        w-screen
        min-h-[100dvh]
        bg-slate-950 text-slate-100 font-sans
        grid
        grid-rows-[auto_minmax(0,1fr)_auto]
        lg:grid-cols-[340px_minmax(0,1fr)]
        lg:grid-rows-[auto_minmax(0,1fr)]
      "
    >
      {/* Control Panel Area */}
      <div
        className="
          row-start-1 col-start-1
          z-20 shadow-sm
          lg:shadow-none
          lg:border-r lg:border-slate-800
        "
      >
        <ControlPanel coefficients={coeffs} onChange={handleCoeffChange} />
      </div>

      {/* Graph Area (fills all space between top and bottom) */}
      <div
        className="
          row-start-2 col-start-1
          min-h-0
          bg-slate-950
          lg:col-start-2 lg:row-span-2
        "
      >
        <div className="w-full h-full">
          <GraphPanel coeffs={coeffs} />
        </div>
      </div>

      {/* Math Display Area */}
      <div
        className="
          row-start-3 col-start-1
          z-20
          border-t border-slate-800
          bg-slate-900
          lg:row-start-2 lg:col-start-1
          lg:border-r
        "
      >
        <MathDisplay coeffs={coeffs} />
      </div>
    </div>
  );
};

export default App;
