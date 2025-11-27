import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const generatePodcastDescription = async (title: string, category: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `Write a short, engaging description (max 2 sentences) for a podcast titled "${title}" in the category "${category}".`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No description generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate description at this time.";
  }
};
