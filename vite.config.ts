import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

import { GoogleGenAI, Type } from "@google/genai";

function createLocalParseProxy() {
  // Temporary dev-only proxy so `/api/parseScreenTimeImage` works in local Vite.
  // In production on Vercel, the real implementation lives in `api/parseScreenTimeImage.ts`.
  return {
    name: "local-parse-screen-time-proxy",
    configureServer(server: any) {
      server.middlewares.use("/api/parseScreenTimeImage", async (req: any, res: any) => {
        try {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }));
            return;
          }

          const chunks: Buffer[] = [];
          req.on("data", (c: Buffer) => chunks.push(c));
          await new Promise<void>((resolve, reject) => {
            req.on("end", () => resolve());
            req.on("error", reject);
          });

          const raw = Buffer.concat(chunks).toString("utf8");
          const body = raw ? JSON.parse(raw) : {};
          const base64Image = body?.base64Image as string | undefined;
          const mimeType = body?.mimeType as string | undefined;
          if (!base64Image || !mimeType) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "INVALID_INPUT" }));
            return;
          }

          const apiKey = process.env.GEMINI_API_KEY;

          // If no key is configured, return stub data so you can validate the UI.
          if (!apiKey) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                data: [
                  { app: "Instagram", mins: 95 },
                  { app: "YouTube", mins: 78 },
                  { app: "TikTok", mins: 54 },
                  { app: "Reddit", mins: 47 },
                  { app: "X", mins: 36 },
                ],
              }),
            );
            return;
          }

          const ai = new GoogleGenAI({ apiKey });

          const prompt = `You are a Multimodal OCR specialist. I will provide an image of a phone's Screen Time settings. 
1. IGNORE the filename. Look at the text inside the image.
2. Find the top 5 apps and their usage times (e.g., 'Instagram: 1h 20m').
3. Convert all times into total minutes.
4. Return ONLY a JSON object: {"data": [{"app": "String", "mins": Number}]}.
5. If the image is not a Screen Time screenshot, return {"error": "INVALID_IMAGE"}.`;

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
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "EMPTY_RESPONSE" }));
            return;
          }

          const match = text.match(/\{[\s\S]*\}/);
          const json = match ? JSON.parse(match[0]) : { error: "EMPTY_RESPONSE" };

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(json));
        } catch (e: any) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "PARSE_FAILED" }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), createLocalParseProxy()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify -- file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
