"use client";
import React, { useState, useRef, useEffect } from "react";

type TabType = 'generate' | 'edit' | 'mask';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [maskPrompt, setMaskPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);

  // Reset states when switching tabs
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setError(null);
    setImage(null);
    if (tab === 'generate') {
      setEditPrompt("");
      setMaskPrompt("");
      setSelectedFile(null);
      setOriginalImage(null);
      setMaskImage(null);
    } else if (tab === 'edit') {
      setGeneratePrompt("");
      setMaskPrompt("");
      setOriginalImage(null);
      setMaskImage(null);
    } else {
      setGeneratePrompt("");
      setEditPrompt("");
    }
  };

  // Canvas drawing functions
  useEffect(() => {
    if (originalImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Load original image
      const img = new Image();
      img.onload = () => {
        // Set canvas to actual image dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
      };
      img.src = originalImage;
    }
  }, [originalImage]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineWidth = brushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setMaskImage(canvasRef.current.toDataURL('image/png'));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setOriginalImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleMaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !maskImage) {
      setError("Please select an image and draw a mask");
      return;
    }
    setLoading(true);
    setError(null);
    setImage(null);

    // Convert base64 mask to file
    const maskFile = await fetch(maskImage)
      .then(res => res.blob())
      .then(blob => new File([blob], "mask.png", { type: "image/png" }));

    const formData = new FormData();
    formData.append('prompt', maskPrompt);
    formData.append('image', selectedFile);
    formData.append('mask', maskFile);

    try {
      const res = await fetch("/api/edit-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.image) setImage(data.image);
      else setError(data.error || "Unknown error");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setImage(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: generatePrompt }),
      });
      const data = await res.json();
      if (data.image) setImage(data.image);
      else setError(data.error || "Unknown error");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select an image");
      return;
    }
    setLoading(true);
    setError(null);
    setImage(null);

    const formData = new FormData();
    formData.append('prompt', editPrompt);
    formData.append('image', selectedFile);
    if (maskImage) {
      formData.append('mask', maskImage);
    }

    try {
      const res = await fetch("/api/edit-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.image) setImage(data.image);
      else setError(data.error || "Unknown error");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="w-full max-w-3xl mt-16 bg-white rounded-2xl shadow-xl p-8">
        <div className="flex mb-8 rounded-lg overflow-hidden border border-gray-200">
          <button
            type="button"
            onClick={() => handleTabChange('generate')}
            className={`flex-1 py-3 px-2 text-lg font-semibold transition-colors duration-150 ${activeTab === 'generate' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
          >
            Generate Image
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('edit')}
            className={`flex-1 py-3 px-2 text-lg font-semibold transition-colors duration-150 ${activeTab === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
          >
            Edit Image
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('mask')}
            className={`flex-1 py-3 px-2 text-lg font-semibold transition-colors duration-150 ${activeTab === 'mask' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
          >
            Mask & Edit
          </button>
        </div>

        {activeTab === 'generate' ? (
          <form onSubmit={handleGenerateSubmit} className="space-y-6" key="generate-form">
            <input
              type="text"
              value={generatePrompt}
              onChange={e => setGeneratePrompt(e.target.value)}
              placeholder="Enter your image prompt..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg shadow hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Image"}
            </button>
          </form>
        ) : activeTab === 'edit' ? (
          <form onSubmit={handleEditSubmit} className="space-y-6" key="edit-form">
            <input
              type="file"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              accept="image/*"
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
              required
            />
            <input
              type="text"
              value={editPrompt}
              onChange={e => setEditPrompt(e.target.value)}
              placeholder="Enter edit prompt..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg shadow hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Editing..." : "Edit Image"}
            </button>
          </form>
        ) : (
          <div className="space-y-6" key="mask-form">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Upload Image</label>
              <input
                type="file"
                onChange={handleImageUpload}
                accept="image/*"
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            {originalImage && (
              <>
                <div className="space-y-2">
                  <label className="block text-base font-medium text-gray-700">Draw Mask (transparent = edited area)</label>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="text-sm">Brush Size:</label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-32 accent-blue-600"
                    />
                    <span className="text-gray-600">{brushSize}px</span>
                  </div>
                  <div className="border-2 border-dashed border-blue-200 rounded-lg p-2 bg-gray-50 flex justify-center">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="max-w-full cursor-crosshair rounded-lg shadow"
                      style={{ maxHeight: '400px', background: '#fff' }}
                    />
                  </div>
                </div>
                <form onSubmit={handleMaskSubmit} className="space-y-4 mt-4">
                  <input
                    type="text"
                    value={maskPrompt}
                    onChange={e => setMaskPrompt(e.target.value)}
                    placeholder="Enter prompt for masked area..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg shadow hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50"
                    disabled={loading || !maskImage}
                  >
                    {loading ? "Processing..." : "Apply Edit to Masked Area"}
                  </button>
                </form>
                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="text-base font-semibold mb-2 text-gray-700">Original Image</h3>
                    <img src={originalImage} alt="Original" className="rounded-lg border shadow" />
                  </div>
                  {maskImage && (
                    <div>
                      <h3 className="text-base font-semibold mb-2 text-gray-700">Mask Preview</h3>
                      <img src={maskImage} alt="Mask" className="rounded-lg border shadow" />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        {error && <div className="mt-6 text-red-600 text-center font-semibold bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
        {image && (
          <div className="mt-10 flex flex-col items-center">
            <h3 className="text-base font-semibold mb-2 text-gray-700">Result</h3>
            <img
              src={`data:image/png;base64,${image}`}
              alt="Result"
              className="max-w-md rounded-lg shadow-xl border"
            />
          </div>
        )}
      </div>
    </main>
  );
}
