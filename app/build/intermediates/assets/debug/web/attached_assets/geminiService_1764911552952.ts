import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePodcastDescription = async (title: string, category: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model: model,
      contents: `Generate a catchy, professional podcast description (max 2 sentences) for a podcast titled "${title}" in the category "${category}". Do not use quotes.`,
    });
    return response.text || "No description generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "A fascinating podcast about " + category + ".";
  }
};