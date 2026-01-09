
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateIcebreakers = async (user1Interests: string[], user2Interests: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User A likes: ${user1Interests.join(', ')}. User B likes: ${user2Interests.join(', ')}. 
      Generate 3 unique, engaging, and low-pressure icebreaker questions for these two to start a chat on a dating app.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Icebreaker generation failed", error);
    return [
      "What's your favorite way to spend a weekend?",
      "If you could travel anywhere right now, where would you go?",
      "What's one thing that always makes you smile?"
    ];
  }
};

export const generateGhostIcebreaker = async (interests: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an anonymous matchmaker. Generate 1 intriguing icebreaker based on these interests: ${interests.join(', ')}. Make it sound mysterious but friendly.`,
    });
    return response.text;
  } catch (error) {
    return "Guess what we have in common?";
  }
};
