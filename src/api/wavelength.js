const CLASS_PROXY_URL = "https://cse2004.com/api/openai/responses";
const CLASS_PROXY_API_KEY = "eld9hywq8wox";
const DEFAULT_MODEL = "gpt-5-mini";

const WAVELENGTH_SCHEMA = {
  type: "json_schema",
  name: "wavelength_round",
  strict: true,
  schema: {
    type: "object",
    properties: {
      topicLeft: {
        type: "string",
        description: "Short label for the left (0%) end of the spectrum.",
      },
      topicRight: {
        type: "string",
        description: "Short label for the right (100%) end of the spectrum.",
      },
      clueWord: {
        type: "string",
        description: "A word or very short phrase to place on the spectrum.",
      },
    },
    required: ["topicLeft", "topicRight", "clueWord"],
    additionalProperties: false,
  },
};

function buildPrompt(userLine) {
  const trimmed = (userLine || "").trim();
  const theme =
    trimmed ||
    "Pick any fun, creative theme (no need to repeat a single word — invent a spectrum).";
  return (
    "You are preparing one round of a party game like Wavelength.\n\n" +
    "Player request / theme:\n" +
    theme +
    "\n\n" +
    "Invent two short opposing spectrum poles as topicLeft (0%) and topicRight (100%). " +
    "They should be clear opposites or a natural gradient (not obscure inside jokes). " +
    "Pick a single clueWord (or a very short phrase, under 5 words) that could reasonably sit somewhere between those poles — the human players will decide exactly where. " +
    "Do not output any numeric position; return only topicLeft, topicRight, and clueWord."
  );
}

function parseStructuredText(textField) {
  if (textField == null) return null;
  if (typeof textField === "object") return textField;
  if (typeof textField === "string") {
    const s = textField.trim();
    if (!s) return null;
    return JSON.parse(s);
  }
  return null;
}

function extractRoundFromResponse(data) {
  let parsed = parseStructuredText(data.text);
  if (parsed && typeof parsed === "object") return parsed;
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    parsed = parseStructuredText(data.output_text);
    if (parsed && typeof parsed === "object") return parsed;
  }
  const out = data.output;
  if (Array.isArray(out)) {
    for (let i = out.length - 1; i >= 0; i--) {
      const item = out[i];
      if (item.type === "message" && Array.isArray(item.content)) {
        for (let j = item.content.length - 1; j >= 0; j--) {
          const c = item.content[j];
          if (c.type === "output_text" && c.text) {
            parsed = parseStructuredText(c.text);
            if (parsed && typeof parsed === "object") return parsed;
          }
        }
      }
    }
  }
  return null;
}

function formatApiError(data, raw, status) {
  if (data && data.error) {
    if (typeof data.error === "string") return data.error;
    if (data.error.message) return data.error.message;
  }
  if (data && data.message) return data.message;
  if (raw && raw.length) return raw.slice(0, 280);
  return "Request failed (" + status + ").";
}

export async function fetchRound(userLine, model = DEFAULT_MODEL) {
  const res = await fetch(CLASS_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + CLASS_PROXY_API_KEY,
    },
    body: JSON.stringify({
      model,
      input: buildPrompt(userLine),
      text: { format: WAVELENGTH_SCHEMA },
    }),
  });
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Bad response from class API.");
  }
  if (!res.ok) {
    throw new Error(formatApiError(data, raw, res.status));
  }
  const parsed = extractRoundFromResponse(data);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Could not read structured result. Try again.");
  }
  return parsed;
}

export function normalizeRound(raw) {
  const left = String(raw.topicLeft || "").trim() || "Left";
  const right = String(raw.topicRight || "").trim() || "Right";
  const clue = String(raw.clueWord || "").trim() || "—";
  return { topicLeft: left, topicRight: right, clueWord: clue };
}

export function scoreBand(delta) {
  const d = Math.abs(delta);
  if (d <= 2) return { label: "In the bullseye!" };
  if (d <= 5) return { label: "Almost perfect." };
  if (d <= 12) return { label: "Great wave." };
  if (d <= 25) return { label: "Good instincts." };
  return { label: "Rough seas — try another round!" };
}

export function percentToDeg(p) {
  const clamped = Math.max(0, Math.min(100, Number(p)));
  return -90 + (clamped / 100) * 180;
}
