import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
  }
  try {
    const result = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
    });
    if (!result.data?.[0]?.b64_json) {
      return NextResponse.json({ error: "No image returned" }, { status: 500 });
    }
    return NextResponse.json({ image: result.data[0].b64_json });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 