import { GoogleGenAI, Type } from "@google/genai";

function extractJsonObject(text: string) {
  // Gemini should return ONLY JSON, but we still defensively extract the first object.
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in response.");
  return JSON.parse(match[0]);
}

export default {
  async fetch(request: Request) {
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "METHOD_NOT_ALLOWED" }),
        { status: 405, headers: { "Content-Type": "application/json" } },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "MISSING_API_KEY" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = (await request.json()) as {
      base64Image?: string;
      mimeType?: string;
    };

    const base64Image = body?.base64Image;
    const mimeType = body?.mimeType;
    if (!base64Image || !mimeType) {
      return new Response(JSON.stringify({ error: "INVALID_INPUT" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a Multimodal OCR specialist. I will provide an image of a phone's Screen Time settings. 
1. IGNORE the filename. Look at the text inside the image.
2. Find the top 5 apps and their usage times (e.g., 'Instagram: 1h 20m').
3. Convert all times into total minutes.
4. Return ONLY a JSON object: {"data": [{"app": "String", "mins": Number}]}.
5. If the image is not a Screen Time screenshot, return {"error": "INVALID_IMAGE"}.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              data: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    app: { type: Type.STRING },
                    mins: { type: Type.NUMBER },
                  },
                  required: ["app", "mins"],
                },
              },
              error: { type: Type.STRING },
            },
          },
        },
      });

      const text = response.text;
      if (!text) {
        return new Response(JSON.stringify({ error: "EMPTY_RESPONSE" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(extractJsonObject(text)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Gemini parse failed:", err);
      return new Response(JSON.stringify({ error: "Failed to parse image. Please try again." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

