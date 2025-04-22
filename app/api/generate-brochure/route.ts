// app/api/generate-brochure/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,  // make sure this env var exists
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1) Gather only non‑empty string inputs
    const messages = Object.entries(body)
      .filter(([_, v]) => typeof v === 'string' && v.trim() !== '')
      .map(([_, v]) => ({
        role: 'user' as const,
        content: v.trim(),
      }));

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No valid input provided' }, { status: 400 });
    }

    // 2) Call the LLM
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',   // swap to gpt-4o when you have access
      messages,
      temperature: 0.7,
    });

    // 3) Extract and narrow the content
    const choice = completion.choices[0];
    const msg = choice.message!;
    const content = msg.content;
    if (!content) {
      return NextResponse.json({ error: 'AI returned no content' }, { status: 502 });
    }

    // 4) Parse JSON (or fallback to raw text)
    let output: unknown;
    try {
      output = JSON.parse(content);
    } catch {
      output = { text: content };
    }

    return NextResponse.json(output);
  } catch (err: any) {
    console.error('🛑 generate-brochure error:', err);
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
