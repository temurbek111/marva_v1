import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is missing from environment variables (.env.local). Please ask your developer to set it up.",
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Enable Google Search tools to properly independently search the product
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert in dental supplies and materials.
        Please search for the dental product named "${name}" and return a JSON object with exactly two keys:
        - "description": A short, 1-2 sentence description (in Uzbek).
        - "full_description": A detailed markdown description including indications, features, composite details, etc. (in Uzbek).
        
        If you are unable to find the product, provide generic realistic definitions for a dental product. Provide strictly valid JSON.`,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        temperature: 0.2, // Low temperature for more factual responses
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(text);

    return NextResponse.json({
      description: data.description || "",
      full_description: data.full_description || "",
    });
  } catch (error: any) {
    console.error("AI Generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate description" },
      { status: 500 }
    );
  }
}
