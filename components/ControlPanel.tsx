import React, { useState, useEffect } from 'react';
import { Coefficients } from '../types';

interface ControlPanelProps {
  coefficients: Coefficients;
  onChange: (key: keyof Coefficients, value: number) => void;
}

const InputField: React.FC<{
  label: string;
  sub: string;
  value: number;
  colorClass: string;
  onChange: (val: number) => void;
}> = ({ label, sub, value, colorClass, onChange }) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(prev => {
      const parsed = parseFloat(prev);
      if (!isNaN(parsed) && parsed === value) {
        return prev;
      }
      return value.toString();
    });
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);

    const parsed = parseFloat(newVal);
    if (!isNaN(parsed) && isFinite(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(localValue);
    if (isNaN(parsed)) {
      setLocalValue(value.toString());
    } else {
      setLocalValue(parsed.toString());
      onChange(parsed);
    }
  };

  return (
    <div className={`flex items-center bg-slate-800 rounded border border-slate-700 px-1.5 py-1.5 focus-within:ring-1 focus-within:ring-blue-500 transition-all`}>
      <label className={`text-xs mr-1 font-serif select-none italic ${colorClass} font-bold opacity-90`}>
        {label}<sub>{sub}</sub>
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full bg-transparent focus:outline-none text-sm font-mono text-right ${colorClass} brightness-125`}
      />
    </div>
  );
};

export const ControlPanel: React.FC<ControlPanelProps> = ({ coefficients, onChange }) => {
  return (
    <div className="p-2 pt-10 md:pt-4 bg-slate-900 border-b lg:border-b-0 border-slate-800 flex flex-col gap-2">
      
      {/* Mobile Equation Header & FaceID Space */}
      <div className="block md:hidden text-center mb-0.5">
         <div className="text-[10px] font-serif text-slate-300 italic opacity-80 leading-tight">
            <span className="text-rose-400">a<sub>11</sub></span>x² + <span className="text-rose-400">a<sub>12</sub></span>xy + <span className="text-rose-400">a<sub>22</sub></span>y² + <span className="text-cyan-400">b<sub>1</sub></span>x + <span className="text-cyan-400">b<sub>2</sub></span>y + <span className="text-emerald-400">c</span> = 0
         </div>
      </div>

      {/* Desktop/Tablet Header */}
      <div className="hidden md:block mb-2">
        <h1 className="text-xl font-bold text-slate-100">Conic Explorer</h1>
        <p className="text-xs text-slate-400 font-serif italic">
          <span className="text-rose-400">a<sub>11</sub></span>x² + <span className="text-rose-400">a<sub>12</sub></span>xy + <span className="text-rose-400">a<sub>22</sub></span>y² + <span className="text-cyan-400">b<sub>1</sub></span>x + <span className="text-cyan-400">b<sub>2</sub></span>y + <span className="text-emerald-400">c</span> = 0
        </p>
      </div>

      {/* Inputs Grouped */}
      <div className="flex flex-col gap-1.5">
        {/* Quadratic Part */}
        <div className="grid grid-cols-3 gap-1.5">
          <InputField label="a" sub="11" value={coefficients.a11} colorClass="text-rose-400" onChange={(v) => onChange('a11', v)} />
          <InputField label="a" sub="12" value={coefficients.a12} colorClass="text-rose-400" onChange={(v) => onChange('a12', v)} />
          <InputField label="a" sub="22" value={coefficients.a22} colorClass="text-rose-400" onChange={(v) => onChange('a22', v)} />
        </div>
        
        {/* Linear Part & Constant */}
        <div className="grid grid-cols-3 gap-1.5">
          <InputField label="b" sub="1" value={coefficients.b1} colorClass="text-cyan-400" onChange={(v) => onChange('b1', v)} />
          <InputField label="b" sub="2" value={coefficients.b2} colorClass="text-cyan-400" onChange={(v) => onChange('b2', v)} />
          <InputField label="c" sub="" value={coefficients.c} colorClass="text-emerald-400" onChange={(v) => onChange('c', v)} />
        </div>
      </div>
    </div>
  );
};