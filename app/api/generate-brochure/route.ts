// app/api/generate-brochure/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    // 1) Parse JSON body
    const data: Record<string, unknown> = await req.json();

    // 2) Build sections (only trim when it's truly a string)
    const sections = Object.entries(data)
      .filter(([_, value]) => typeof value === 'string' && value.trim() !== '')
      .map(
        ([key, value]) =>
          `${key.replace(/_/g, ' ')}:\n${(value as string).trim()}`
      )
      .join('\n\n');

    // 3) Create messages array
    const messages = [
      {
        role: 'system',
        content: `You are a senior brochure writer for an estate agency. Given detailed room/property input, return content in this JSON structure:
{
  "headline": "[A short, 2–6 word headline]",
  "summary": "[200–300 word summary in professional, emotive, descriptive tone]",
  "bulletPoints": ["Feature: Description", "Feature: Description", ...]
}

Use proper formatting, never return plain text. Always include bulletPoints.`,
      },
      {
        role: 'user',
        content: `Property Details:\n\n${sections}\n\nRespond ONLY in JSON with keys: headline, summary, bulletPoints.`,
      },
    ];

    // 4) Call OpenAI—cast to any to bypass overload/type errors
    const completion = await (openai.chat.completions.create as any)({
      model: 'gpt-3.5-turbo', // swap to your GPT-4 model when supported
      messages,
      temperature: 0.7,
    });

    // 5) Strip any ```json … ``` wrappers
    let responseText = completion.choices[0]?.message?.content ?? '';
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```json|```/g, '').trim();
    }

    // 6) Parse JSON or fallback with an empty result
    try {
      const result = JSON.parse(responseText);
      return NextResponse.json(result);
    } catch {
      console.error('Invalid JSON from OpenAI:', responseText);
      return NextResponse.json({
        headline: '',
        summary: '',
        bulletPoints: ['No bullet points returned.'],
      });
    }
  } catch (err) {
    console.error('Error in /api/generate-brochure:', err);
    return NextResponse.json(
      { error: 'Server error while generating brochure.' },
      { status: 500 }
    );
  }
}
