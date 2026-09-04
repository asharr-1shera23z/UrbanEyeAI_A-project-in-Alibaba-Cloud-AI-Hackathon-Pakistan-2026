import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, RefreshCw, ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  image: string | null;
  onChange: (image: string | null) => void;
}

export function ImageUploader({ image, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  if (image) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group"
      >
        <img src={image} alt="Uploaded issue" className="w-full h-full object-cover min-h-[280px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />

        <div className="absolute bottom-3 left-3 right-3 flex gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/95 backdrop-blur text-navy-900 text-xs font-semibold hover:bg-white transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Replace
          </button>
          <button
            onClick={() => onChange(null)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/95 backdrop-blur text-red-600 text-xs font-semibold hover:bg-white transition-colors shadow-sm"
          >
            <X className="w-3.5 h-3.5" />
            Remove
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </motion.div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 min-h-[280px] flex flex-col items-center justify-center p-6 text-center ${
        dragOver
          ? 'border-blue-500 bg-blue-50 scale-[1.01]'
          : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
          <Camera className="w-7 h-7" />
        </div>
        <div>
          <p className="font-semibold text-navy-900 text-sm">Upload a photo</p>
          <p className="text-xs text-slate-500 mt-1">Take a clear photo of the problem</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
          <ImageIcon className="w-3.5 h-3.5" />
          JPG, PNG up to 10MB
        </div>
      </motion.div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
