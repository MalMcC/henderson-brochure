// app/api/generate-brochure/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { ChatCompletionCreateParams } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    // 1. Parse the incoming JSON
    const data: Record<string, unknown> = await req.json();

    // 2. Build the sections string, only trimming real strings
    const sections = Object.entries(data)
      .filter(([_, value]) => typeof value === 'string' && value.trim() !== '')
      .map(
        ([key, value]) =>
          `${key.replace(/_/g, ' ')}:\n${(value as string).trim()}`
      )
      .join('\n\n');

    // 3. Construct the messages for the LLM
    const messages = [
      {
        role: 'system',
        content: `You are a senior brochure writer for an estate agency. Given detailed room/property input, return content in this JSON structure:
{
  "headline": "[A short, 2–6 word headline]",
  "summary": "[200–300 word summary in professional, emotive, descriptive tone]",
  "bulletPoints": ["Feature: Description", "Feature: Description", ...]
}

Use proper formatting, never return plain text. Always include bulletPoints. If bullet point data is limited, summarise key highlights like 'Tennis Court: Private court set within 5-acre grounds'.`,
      },
      {
        role: 'user',
        content: `Property Details:\n\n${sections}\n\nRespond ONLY in JSON with keys: headline, summary, bulletPoints.`,
      },
    ];

    // 4. Prepare and type‑safe the API call params
    const params: ChatCompletionCreateParams = {
      model: 'gpt-3.5-turbo',  // or 'gpt-4-1106-preview' / 'gpt-4o' once available
      messages,
      temperature: 0.7,
    };

    const completion = await openai.chat.completions.create(params);

    // 5. Strip markdown code fences if present
    let responseText = completion.choices[0]?.message?.content ?? '';
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```json|```/g, '').trim();
    }

    // 6. Parse JSON or fallback
    try {
      const result = JSON.parse(responseText);
      return NextResponse.json(result);
    } catch (parseErr) {
      console.error('Invalid JSON from OpenAI:', responseText);
      return NextResponse.json(
        {
          headline: '',
          summary: '',
          bulletPoints: ['No bullet points returned.'],
        },
        { status: 200 }
      );
    }
  } catch (err) {
    console.error('Error in /api/generate-brochure:', err);
    return NextResponse.json(
      { error: 'Server error while generating brochure.' },
      { status: 500 }
    );
  }
}
