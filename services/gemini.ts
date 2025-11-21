import { GoogleGenAI, Type } from "@google/genai";
import { Coefficients } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeConicSection = async (coeffs: Coefficients): Promise<string> => {
  const ai = getAI();
  if (!ai) return "API Key missing. Cannot fetch analysis.";

  const prompt = `
    Analyze the conic section defined by the equation:
    ${coeffs.a11}x^2 + ${coeffs.a12}xy + ${coeffs.a22}y^2 + ${coeffs.b1}x + ${coeffs.b2}y + ${coeffs.c} = 0.

    Please provide a structured analysis in Markdown format:
    1. **Classification**: Identify if it is an Ellipse, Hyperbola, Parabola, or a degenerate case.
    2. **Rotation**: Explain how to eliminate the xy term (if present) using the rotation angle formula tan(2θ) = B / (A - C). Calculate the angle.
    3. **Standard Form**: Provide the approximate standard form equation after rotation and translation.
    4. **Key Features**: Mention center, vertices, or foci if applicable.

    Keep the response concise and mathematically precise. Use LaTeX formatting for math equations (e.g., $x^2$).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful mathematics tutor specializing in geometry and linear algebra.",
        temperature: 0.2, // Low temperature for consistent math
      }
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while communicating with the AI service.";
  }
};
