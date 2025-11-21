import React, { useMemo } from 'react';
import { Coefficients } from '../types';

interface MathDisplayProps {
  coeffs: Coefficients;
}

// Helper component for rendering vertical fractions
const Fraction: React.FC<{ num: React.ReactNode; den: React.ReactNode; sign?: number }> = ({ num, den, sign = 1 }) => (
  <div className="inline-flex items-center">
    {sign < 0 && <span className="mr-1">-</span>}
    <div className="flex flex-col items-center inline-flex mx-0.5">
      <div className="text-center border-b border-slate-400 px-0.5 pb-[1px] mb-[1px] leading-none text-xs">{num}</div>
      <div className="text-center leading-none text-xs">{den}</div>
    </div>
  </div>
);

// Helper for Square Root
const Surd: React.FC<{ val: number }> = ({ val }) => {
  if (val === 1) return <span>1</span>;
  return <span>√{val}</span>;
};

export const MathDisplay: React.FC<MathDisplayProps> = ({ coeffs }) => {
  // GCD Helper
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const mathData = useMemo(() => {
    const { a11, a12, a22, b1, b2, c: termC } = coeffs;

    // 1. Rotation (Decimal)
    let theta = 0;
    if (Math.abs(a12) > 1e-6) {
      if (Math.abs(a11 - a22) < 1e-6) {
        theta = a12 > 0 ? Math.PI / 4 : -Math.PI / 4;
      } else {
        theta = 0.5 * Math.atan(a12 / (a11 - a22));
      }
    } else {
      theta = 0;
    }

    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    const angleDeg = (theta * 180) / Math.PI;

    // 2. Exact Rotation Values
    const A = a11 - a22;
    const B = a12;
    
    let exactCos: React.ReactNode = null;
    let exactSin: React.ReactNode = null;

    if (Math.abs(B) < 1e-9) {
      exactCos = <span>1</span>;
      exactSin = <span>0</span>;
    } else if (Math.abs(A) < 1e-9) {
      exactCos = <Fraction num={<Surd val={2} />} den={2} />;
      exactSin = <Fraction num={<Surd val={2} />} den={2} sign={Math.sign(B)} />;
    } else {
      const D = A * A + B * B;
      const H = Math.sqrt(D);
      
      if (Math.abs(H - Math.round(H)) < 1e-6) {
        const hInt = Math.round(H);
        const aAbs = Math.abs(A);
        const numC = hInt + aAbs;
        const numS = hInt - aAbs;
        const den = 2 * hInt;
        
        const formatRootFraction = (n: number, d: number, sign: number) => {
            const common = gcd(n, d);
            const sn = n / common;
            const sd = d / common;
            
            const snRoot = Math.sqrt(sn);
            const sdRoot = Math.sqrt(sd);
            
            const isSnSquare = Math.abs(snRoot % 1) < 1e-9;
            const isSdSquare = Math.abs(sdRoot % 1) < 1e-9;
            
            let topNode: React.ReactNode = isSnSquare ? snRoot : <Surd val={sn} />;
            let botNode: React.ReactNode = isSdSquare ? sdRoot : <Surd val={sd} />;
            
            if (sd === 1) {
                 return (
                    <div className="inline-flex items-center">
                        {sign < 0 && <span className="mr-1">-</span>}
                        {topNode}
                    </div>
                 );
            }
            return <Fraction num={topNode} den={botNode} sign={sign} />;
        };
        
        exactCos = formatRootFraction(numC, den, 1); 
        const sinSign = Math.sign(sinTheta);
        exactSin = formatRootFraction(numS, den, sinSign);
      }
    }

    // 3. Translation Vector (Center or Vertex)
    const det = 4 * a11 * a22 - a12 * a12;
    let translation = null;
    let isVertex = false;

    if (Math.abs(det) > 1e-6) {
      // Ellipse / Hyperbola -> Unique Center
      const xi = (a12 * b2 - 2 * a22 * b1) / det;
      const eta = (a12 * b1 - 2 * a11 * b2) / det;
      translation = { xi, eta };
    } else {
      // Parabola -> Calculate Vertex
      isVertex = true;
      
      // Rotate coefficients to align with axes
      // x = x'c - y's, y = x's + y'c
      const c_ = cosTheta;
      const s_ = sinTheta;
      
      const A_ = a11*c_*c_ + a12*c_*s_ + a22*s_*s_;
      const C_ = a11*s_*s_ - a12*c_*s_ + a22*c_*c_;
      const D_ = b1*c_ + b2*s_;
      const E_ = -b1*s_ + b2*c_;
      const F_ = termC;

      let xv_prime = 0;
      let yv_prime = 0;

      // Check which quadratic term is non-zero (A' or C')
      // For a standard parabola, one is zero.
      
      if (Math.abs(C_) < 1e-6) {
        // Case: A'x'^2 + D'x' + E'y' + F' = 0 (y' = ax'^2 type)
        if (Math.abs(A_) > 1e-6) {
           // Vertex x coordinate in prime frame: -D' / 2A'
           xv_prime = -D_ / (2 * A_);
           // Residual constant K = F' - D'^2 / 4A'
           const K = F_ - (D_*D_)/(4*A_);
           // If E' != 0, y' vertex is -K/E'
           if (Math.abs(E_) > 1e-6) {
             yv_prime = -K / E_;
           }
        }
      } else {
        // Case: C'y'^2 + D'x' + E'y' + F' = 0 (x' = ay'^2 type)
        if (Math.abs(C_) > 1e-6) {
           yv_prime = -E_ / (2 * C_);
           const K = F_ - (E_*E_)/(4*C_);
           if (Math.abs(D_) > 1e-6) {
             xv_prime = -K / D_;
           }
        }
      }

      // Rotate vertex back to global frame
      const xi = xv_prime * c_ - yv_prime * s_;
      const eta = xv_prime * s_ + yv_prime * c_;
      
      // Only show if valid numbers
      if (!isNaN(xi) && !isNaN(eta)) {
         translation = { xi, eta };
      }
    }

    return {
      angleDeg,
      cosTheta,
      sinTheta,
      exactCos,
      exactSin,
      translation,
      isVertex
    };
  }, [coeffs]);

  const formatNum = (n: number) => {
    const s = n.toFixed(3);
    return s === "-0.000" ? "0.000" : s;
  };

  return (
    <div className="bg-slate-900 border-t lg:border-t-0 lg:border-b border-slate-800 p-2 md:p-4 lg:p-6 flex flex-col lg:h-full justify-center">
      
      <div className="hidden lg:block text-sm font-semibold text-slate-300 uppercase tracking-widest mb-2 border-b border-slate-800 pb-2">
        Analysis
      </div>

      {/* Container for Matrix & Vector */}
      <div className="flex flex-row items-stretch justify-center gap-2 md:gap-8 mb-2 lg:flex-col lg:gap-6 lg:mb-0">
        
        {/* Rotation Matrix */}
        <div className="flex flex-col items-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Rotation {formatNum(mathData.angleDeg)}°</div>
            <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-serif italic text-sm">R=</span>
                <div className="relative px-2 border-l border-r border-slate-600 rounded py-1 bg-slate-950/50">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-center font-mono text-xs md:text-sm text-blue-200 items-center">
                        <div className="flex justify-center min-w-[2.5rem]">
                            {mathData.exactCos ? mathData.exactCos : formatNum(mathData.cosTheta)}
                        </div>
                        <div className="flex justify-center min-w-[2.5rem]">
                            {mathData.exactSin ? (
                                <div className="flex items-center">
                                    <span className="mr-0.5">-</span>
                                    <div className="origin-left">({mathData.exactSin})</div>
                                </div>
                            ) : formatNum(-mathData.sinTheta)}
                        </div>
                        <div className="flex justify-center min-w-[2.5rem]">
                             {mathData.exactSin ? mathData.exactSin : formatNum(mathData.sinTheta)}
                        </div>
                        <div className="flex justify-center min-w-[2.5rem]">
                             {mathData.exactCos ? mathData.exactCos : formatNum(mathData.cosTheta)}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Divider for mobile */}
        <div className="w-px bg-slate-800 lg:hidden"></div>

        {/* Translation Vector */}
        <div className="flex flex-col items-center">
             <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
               {mathData.isVertex ? 'Vertex' : 'Center'}
             </div>
             {mathData.translation ? (
                 <div className="flex items-center gap-1.5 h-full">
                    <span className="text-slate-500 font-serif italic text-sm">T=</span>
                    <div className="relative px-2 border-l border-r border-slate-600 rounded py-1 bg-slate-950/50 flex items-center">
                        <div className="flex flex-col gap-1 text-center font-mono text-xs md:text-sm text-green-300">
                            <div>{formatNum(mathData.translation.xi)}</div>
                            <div>{formatNum(mathData.translation.eta)}</div>
                        </div>
                    </div>
                 </div>
             ) : (
                 <div className="text-[10px] text-amber-500 font-mono py-2 px-2 bg-slate-950/30 rounded border border-amber-900/30">
                   Undefined
                 </div>
             )}
        </div>
      </div>

      {/* Formula */}
      <div className="text-center pt-1 lg:mt-auto">
          <div className="text-slate-400 text-[10px] md:text-xs font-medium inline-block px-2 py-0.5 rounded bg-slate-800/30">
              <span className="font-serif italic opacity-70">(x,y)<sup>T</sup></span>
              <span className="mx-1">=</span>
              <span className="text-blue-400">R</span>
              <span className="font-serif italic opacity-70">(x',y')<sup>T</sup></span>
              <span className="mx-1">+</span>
              <span className="text-green-400">T</span>
          </div>
      </div>
    </div>
  );
};