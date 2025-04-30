import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import { promises as fs } from 'fs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const imageFile = formData.get('image') as File;
    const maskFile = formData.get('mask') as File | null;

    if (!prompt || !imageFile) {
      return NextResponse.json({ error: 'Prompt and image required' }, { status: 400 });
    }

    // Convert image File to buffer
    const imageBytes = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(imageBytes);

    // Save image temporarily and create file handle for OpenAI
    const imageTempPath = `/tmp/${imageFile.name}`;
    await fs.writeFile(imageTempPath, imageBuffer);
    const imageFileHandle = await toFile(
      await fs.readFile(imageTempPath),
      imageFile.name,
      { type: imageFile.type || 'image/png' }
    );

    // Handle mask if provided
    let maskFileHandle = undefined;
    let maskTempPath = '';
    if (maskFile) {
      const maskBytes = await maskFile.arrayBuffer();
      const maskBuffer = Buffer.from(maskBytes);
      maskTempPath = `/tmp/mask_${maskFile.name}`;
      await fs.writeFile(maskTempPath, maskBuffer);
      maskFileHandle = await toFile(
        await fs.readFile(maskTempPath),
        maskFile.name,
        { type: maskFile.type || 'image/png' }
      );
    }

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFileHandle,
      mask: maskFileHandle,
      prompt: prompt,
    });

    if (!result.data?.[0]?.b64_json) {
      return NextResponse.json({ error: "No image returned" }, { status: 500 });
    }

    // Cleanup temp files
    await fs.unlink(imageTempPath).catch(console.error);
    if (maskTempPath) {
      await fs.unlink(maskTempPath).catch(console.error);
    }

    return NextResponse.json({ image: result.data[0].b64_json });
  } catch (err: any) {
    console.error('Image edit error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 