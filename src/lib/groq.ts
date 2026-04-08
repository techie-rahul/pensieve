/* ------------------------------------------------------------------ */
/*  Pensieve — Groq LLM Service (llama-3.3-70b-versatile)            */
/* ------------------------------------------------------------------ */

import { concepts, formatConceptsForPrompt } from './concepts'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

export interface ReflectionResult {
  reflection: string
  concept: string
  confidence: number          // 0–80 (capped)
}

/**
 * Calls Groq's chat completions API to generate a pattern-based reflection.
 * Returns structured JSON with the reflection text, matched concept, and confidence.
 */
export async function generateReflection(entries: string[]): Promise<ReflectionResult> {
  // Build RAG context: structured JSON + human-readable descriptions
  const conceptsBlock = formatConceptsForPrompt()
  const conceptsJson = JSON.stringify(
    concepts.map(({ id, name, description, citation }) => ({ id, name, description, citation })),
    null,
    2,
  )

  const systemPrompt = `You are the Pensieve Pattern Observer — a thoughtful, humble companion that helps people understand their own thinking.

## CONCEPT DATABASE (RAG Context)
The following concepts are your ONLY reference frame. Match journal entries to these concepts exclusively.

${conceptsBlock}

<concept_data>
${conceptsJson}
</concept_data>

TASK:
Analyze the user's recent journal entries for emotional trends and linguistic patterns. Compare these patterns against the CONCEPT DATABASE above.

RULES:
1. Match the writing to the SINGLE most relevant concept above.
2. Explain WHY the writing matches using humble, probabilistic language: "may suggest", "appears to reflect", "could indicate", "seems consistent with".
3. NEVER diagnose, prescribe, or make definitive claims about the user's mental health.
4. Limit your reflection to 100 words maximum.
5. End with the source citation for the matched concept.
6. Include a confidence score (0-80). Be conservative — 80 is the maximum allowed.

CRITICAL: You MUST respond in valid JSON format only. Do not include any conversational filler, markdown fences, or explanation outside the JSON object. Your entire response must be a single JSON object.

Example response:
{"concept": "Growth Mindset", "reflection": "Your recent entries appear to reflect a pattern of embracing challenges and viewing setbacks as learning opportunities, which may suggest alignment with Dweck's Growth Mindset framework. The language you use — focusing on effort and progress rather than fixed outcomes — seems consistent with this concept. Source: Dweck, C. S. (2006). Mindset: The New Psychology of Success.", "confidence": 75}`

  const userMessage = entries
    .map((entry, i) => `--- Entry ${i + 1} ---\n${entry}`)
    .join('\n\n')

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Groq API error (${response.status}): ${errText}`)
  }

  const data = await response.json()
  const raw: string = data.choices?.[0]?.message?.content ?? ''

  // --- Three-layer parsing defense ---
  const fallback: ReflectionResult = {
    reflection: 'Your writing reveals interesting patterns worth exploring further. Continue journaling to deepen self-understanding.',
    concept: 'General Observation',
    confidence: 70,
  }

  let parsed: ReflectionResult

  // Layer 1: Direct JSON parse (strip markdown fences first)
  const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // Layer 2: Regex extraction — find the outermost { ... }
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch {
        // Layer 3: Hardcoded fallback
        parsed = { ...fallback }
      }
    } else {
      parsed = { ...fallback }
    }
  }

  // --- Validate and sanitise every field ---
  parsed.reflection = typeof parsed.reflection === 'string' && parsed.reflection.trim()
    ? parsed.reflection.trim()
    : fallback.reflection

  parsed.concept = typeof parsed.concept === 'string' && parsed.concept.trim()
    ? parsed.concept.trim()
    : fallback.concept

  // Explicit Number() cast — fixes NaN
  parsed.confidence = Number(parsed.confidence) || 70
  // Cap at 80
  parsed.confidence = Math.min(Math.max(Math.round(parsed.confidence), 0), 80)

  return parsed
}
