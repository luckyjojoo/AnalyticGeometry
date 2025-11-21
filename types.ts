export interface Coefficients {
  a11: number; // x^2
  a12: number; // xy
  a22: number; // y^2
  b1: number;  // x
  b2: number;  // y
  c: number;   // constant
}

export interface RotationMatrix {
  cosTheta: number;
  sinTheta: number;
  angleRad: number;
  angleDeg: number;
}

export interface GeminiAnalysis {
  classification: string;
  standardForm: string;
  explanation: string;
}
