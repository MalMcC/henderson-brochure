// app/api/generate-brochure/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    // 1) Parse incoming JSON body
    const data: Record<string, unknown> = await req.json();

    // 2) Build "sections" only from real strings
    const sections = Object.entries(data)
      .filter(([_, value]) => typeof value === 'string' && value.trim() !== '')
      .map(
        ([key, value]) =>
          `${key.replace(/_/g, ' ')}:\n${(value as string).trim()}`
      )
      .join('\n\n');

    // 3) Prepare messages
    const messages = [
      {
        role: 'system',
        content: `You are a senior brochure writer for an estate agency. Given detailed room/property input, return content in this JSON structure:
{
  "headline": "[A short, 2–6 word headline]",
  "summary": "[200–300 word summary in a professional, emotive, descriptive tone]",
  "bulletPoints": ["Feature: Description", "Feature: Description", ...]
}

Use proper formatting, never return plain text. Always include bulletPoints.`,
      },
      {
        role: 'user',
        content: `Property Details:\n\n${sections}\n\nRespond ONLY in JSON with keys: headline, summary, bulletPoints.`,
      },
    ];

    // 4) Call OpenAI (cast to any to avoid TS overload errors)
    const completion = await (openai.chat.completions.create as any)({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
    });

    // 5) Strip any ```json … ``` wrappers
    let responseText: string = completion.choices[0]?.message?.content ?? '';
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```json|```/g, '').trim();
    }

    // 6) Parse JSON or fallback
    try {
      const result =
