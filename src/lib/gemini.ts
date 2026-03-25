export type ParseScreenTimeImageResult = {
  data?: Array<{ app: string; mins: number }>;
  error?: string;
};

export async function parseScreenTimeImage(base64Image: string, mimeType: string): Promise<ParseScreenTimeImageResult> {
  // Call our server-side proxy so the Gemini API key is never shipped to the browser.
  const res = await fetch("/api/parseScreenTimeImage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image, mimeType }),
  });

  if (!res.ok) {
    throw new Error(`Parse request failed: ${res.status}`);
  }

  const json = (await res.json()) as ParseScreenTimeImageResult;
  return json;
}
