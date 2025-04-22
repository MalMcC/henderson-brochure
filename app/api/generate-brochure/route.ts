// app/api/generate-brochure/route.ts

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// 1) Force Edge runtime for small, fast functions
export const config = {
  runtime: 'edge',
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(req: NextRequest) {
  try {
    // 2) Parse the incoming JSON
    const data = (await req.json()) as Record<string, unknown>

    // 3) Build a single array of user messages from non-empty strings
    const userMessages = Object.entries(data)
      .filter(([, v]) => typeof v === 'string' && v.trim().length > 0)
      .map(([key, val]) => ({
        role: 'user' as const,
        content: `${key.replace(/_/g, ' ')}:\n${(val as string).trim()}`,
      }))

    if (userMessages.length === 0) {
      return NextResponse.json(
        { error: 'No valid inputs provided' },
        { status: 400 }
      )
    }

    // 4) Prepare the full chat messages (system + user)
    const messages = [
      {
        role: 'system' as const,
        content: `
You are Henderson Connellan’s expert brochure writer.
Given the property details below, respond with EXACTLY valid JSON:
{
  "headline": string,      // 2–6 words, bold and catchy
  "summary": string,       // 200–300 words, formal yet emotive
  "bulletPoints": string[] // one bullet per non-empty field
}
Do NOT output anything else.
        `.trim(),
      },
      ...userMessages,
    ] as unknown as Parameters<
      typeof openai.chat.completions.create
    >[0]['messages'] // cast to satisfy TS

    // 5) Call GPT-4o
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
    })

    // 6) Extract the text, strip any ``` fences
    const raw = completion.choices[0].message?.content ?? ''
    const text = raw.startsWith('```')
      ? raw.replace(/```json|```/g, '').trim()
      : raw.trim()

    // 7) Parse JSON, or return as text fallback
    let output: unknown
    try {
      output = JSON.parse(text)
    } catch {
      output = { text }
    }

    return NextResponse.json(output)
  } catch (err: any) {
    console.error('🛑 generate-brochure error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    )
  }
}
