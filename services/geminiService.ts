import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

export const generateWakeUpMessage = async (label: string, time: string): Promise<string> => {
  if (!API_KEY) {
    return `Good morning! It's ${time}. Time to ${label || 'wake up'}!`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // We use flash for speed as the user is waiting/alarm is ringing
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      You are a smart alarm assistant.
      The user just woke up at ${time}.
      The alarm label is "${label}".
      
      Write a very short (max 2 sentences), energetic, and motivating wake-up message related to the label. 
      If the label is generic (like "Alarm"), just be generally positive.
      Do not use quotes. Just the text.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text?.trim() || `Rise and shine! It's ${time}.`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Good morning! It's ${time}. Let's get moving!`;
  }
};