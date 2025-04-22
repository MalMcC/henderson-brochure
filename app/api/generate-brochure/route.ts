// app/api/generate-brochure/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Collect only non‑empty strings
    const messages: { role: 'user'; content: string }[] = []
    for (const [, v] of Object.entries(body)) {
      if (typeof v === 'string') {
        const trimmed = v.trim()
        if (trimmed !== '') {
          messages.push({ role: 'user', content: trimmed })
        }
      }
    }

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No valid input provided' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',     // or 'gpt-3.5-turbo'
      messages,
      temperature: 0.7,
    })

    const choice = completion.choices?.[0]
    const msg = choice?.message
    const content = msg?.content

    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Invalid response from OpenAI' },
        { status: 500 }
      )
    }

    // Try to parse JSON; if it fails, return the raw text
    let output: unknown
    try {
      output = JSON.parse(content)
    } catch {
      output = { text: content }
    }

    return NextResponse.json(output)
  } catch (err: any) {
    console.error('🛑 generate-brochure error:', err)
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
