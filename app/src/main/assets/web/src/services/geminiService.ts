declare const process: { env: { API_KEY?: string; GEMINI_API_KEY?: string } };

export const generatePodcastDescription = async (title: string, category: string): Promise<string> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return "A fascinating podcast about " + category + ".";
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a catchy, professional podcast description (max 2 sentences) for a podcast titled "${title}" in the category "${category}". Do not use quotes.`
            }]
          }]
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || "No description generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "A fascinating podcast about " + category + ".";
  }
};
