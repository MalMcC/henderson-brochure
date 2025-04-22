// app/api/generate-brochure/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    // 1) Read all the inputs and only keep non‑empty strings
    const data: Record<string, unknown> = await req.json();
    const sections = Object.entries(data)
      .filter(([_, v]) => typeof v === 'string' && v.trim() !== '')
      .map(
        ([k, v]) =>
          `${k.replace(/_/g, ' ')}:\n${(v as string).trim()}`
      )
      .join('\n\n');

    // 2) Build the system + user messages
    const messages = [
      {
        role: 'system',
        content: `You are a senior brochure writer for Henderson Connellan. 
Given detailed room/property input, return EXACTLY valid JSON with keys:
  "headline"   – a short, 2–6 word, bold, catchy title  
  "summary"    – 200–300 word professional, emotive summary  
  "bulletPoints" – array of "Feature: Description" strings

Always output JSON only.`,
      },
      {
        role: 'user',
        content: `Property Details:\n\n${sections}\n\nRespond ONLY in JSON with keys headline, summary, bulletPoints.`,
      },
    ];

    // 3) Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // use a model you have access to
      messages,
      temperature: 0.7,
    });

    // 4) Extract into a JS string (never string|null)
    let responseText = completion.choices[0].message?.content ?? '';
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```json|```/g, '').trim();
    }

    // 5) Parse it safely
    const result = JSON.parse(responseText);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('🛑 generate-brochure error:', err);
    return NextResponse.json(
      { error: err.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
