import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const sections = Object.entries(data)
	.filter(([_, value]) => typeof value === 'string' && value.trim() !== '')
      .map(([key, value]) => `${key.replace(/_/g, ' ')}:\n${value}`)
      .join('\n\n');

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // You can swap with 'gpt-3.5-turbo' if needed
      messages,
      temperature: 0.7,
    });

    let responseText = completion.choices[0].message?.content ?? '';

    // 🔧 Remove Markdown-style code blocks if present
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```json|```/g, '').trim();
    }

    try {
      const json = JSON.parse(responseText);
      return NextResponse.json(json);
    } catch (err) {
      console.error('OpenAI did not return valid JSON. Raw output:', responseText);
      return NextResponse.json({
        headline: '',
        summary: '',
        bulletPoints: ['No bullet points returned.'],
      });
    }
  } catch (error) {
    console.error('Error generating brochure:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
