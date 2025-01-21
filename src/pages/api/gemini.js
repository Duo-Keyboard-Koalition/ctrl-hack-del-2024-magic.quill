import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function geminiHandler(user_prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const response = await model.generateContent(user_prompt);

  return response.response.text();
}
