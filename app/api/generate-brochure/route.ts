import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

export async function POST(req: Request) {
  const data = await req.json()

  const userPrompt = `
You are Henderson Connellan’s brochure‑writer.  Given the property data below, produce a JSON object with three keys:
1) headline – a short (2–6 word), bold, catchy title that captures the essence of the property  
2) summary – 200–300 words, formal but enthusiastic, describing the main features, surroundings and lifestyle  
3) bulletPoints – an array of concise bullet points, one for each non‑empty field in the data

Here is the raw input JSON (do not invent extra fields):

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`
`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',   // or 'gpt-3.5-turbo'
    temperature: 0.7,
    messages: [
      { role: 'system', content: 'You are a helpful real‑estate brochure writer.' },
      { role: 'user',   content: userPrompt }
    ],
  })

  const msg = completion.choices[0].message!
  return NextResponse.json(JSON.parse(msg.content))
}
