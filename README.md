# OpenAI Image API Demo

A modern Next.js app to demo OpenAI's latest image generation and editing APIs, including:
- Text-to-image generation
- Image editing with prompt
- Inpainting (mask & edit) with a visual mask drawing tool

## Features

- Generate images from text prompts (`gpt-image-1`)
- Edit images with a prompt and optional mask
- Draw masks directly in the browser (canvas)
- Preview original, mask, and result images
- Modern UI with Tailwind CSS

## Getting Started

### 1. Clone the repo

git clone
```sh
cd openai-image-demo/imagedemo
```

### 2. Install dependencies

```sh
npm install
```

### 3. Set up your OpenAI API key

Create a `.env.local` file in the `imagedemo` directory:

```
OPENAI_API_KEY=sk-...
```

- Get your key from https://platform.openai.com/api-keys
- You need a verified OpenAI org to use `gpt-image-1`

### 4. Run the app

```sh
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Usage

- **Generate Image:** Enter a prompt and click "Generate Image."
- **Edit Image:** Upload an image, enter a prompt, and click "Edit Image."
- **Mask & Edit:** Upload an image, draw a mask (transparent = area to edit), enter a prompt, and click "Apply Edit to Masked Area."

## Tech Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- OpenAI Node SDK

## Notes

- Mask images must be PNG with transparency (alpha channel).
- All image processing is done server-side via OpenAI's API.
- If you get a 403, your org probably isn't verified for `gpt-image-1`.

## License

MIT
