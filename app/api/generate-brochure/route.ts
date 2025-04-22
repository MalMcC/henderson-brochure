// app/api/generate-brochure/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const config = {
  runtime: 'edge',
};

const openai = new OpenAI();

export default async function handler(req: Request) {
  const body = await req.json();

  // collect only the string fields and trim them
  const fields = [
    'headline',
    'summary',
    'bullets',
    'drawingRoom',
    'additionalReception',
    'showerRoom',
    'guestCloakroom',
    'utilityRoom',
  ] as const;

  const messages = fields
    .map((key) => {
      const val = (body as Record<string, unknown>)[key];
      if (typeof val === 'string' && val.trim() !== '') {
        return {
          role: 'user',
          content: val.trim(),
        };
      }
      return null;
    })
    .filter((m): m is { role: 'user'; content: string } => m !== null);

  if (messages.length === 0) {
    return NextResponse.json(
      { error: 'No valid inputs provided' },
      { status: 400 }
    );
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.7,
  });

  const msg = completion.choices[0].message!;
  if (!msg.content) {
    return NextResponse.json(
      { error: 'AI returned no content' },
      { status: 502 }
    );
  }

  // at this point content is a non-null string
  const output = JSON.parse(msg.content as string);

  return NextResponse.json(output);
}
