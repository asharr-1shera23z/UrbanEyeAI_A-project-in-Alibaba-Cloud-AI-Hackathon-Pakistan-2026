import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ScanLine, Brain, AlertTriangle, Gauge, Target } from 'lucide-react';
import type { AIAnalysis } from '@/types';
import { SeverityBadge, PriorityBadge } from '@/components/ui/Badges';

interface AIResultCardProps {
  analysis: AIAnalysis;
  imageUrl: string;
}

export function AIResultCard({ analysis, imageUrl }: AIResultCardProps) {
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setConfidence(analysis.confidence);
      return;
    }
    let raf: number;
    let start: number | null = null;
    const duration = 1000;
    const animate = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setConfidence(Math.round(analysis.confidence * eased));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [analysis.confidence]);

  const { boundingBox } = analysis;
  const issueLabel = analysis.displayClass || analysis.detectedClass;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl border border-slate-200 card-shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-navy-950">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">AI Detection Result</h3>
          <p className="text-slate-400 text-xs">UrbanEye AI Analysis</p>
        </div>
      </div>

      {/* Image with detection box */}
      <div className="relative bg-slate-900">
        <img src={imageUrl} alt="Analyzed issue" className="w-full h-64 object-cover" />
        {boundingBox && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="absolute border-2 border-blue-400 rounded-md"
            style={{
              left: `${boundingBox.x}%`,
              top: `${boundingBox.y}%`,
              width: `${boundingBox.width}%`,
              height: `${boundingBox.height}%`,
              boxShadow: '0 0 0 9999px rgba(13, 29, 58, 0.25)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -top-7 left-0 bg-blue-500 text-white text-xs font-semibold px-2 py-0.5 rounded-md whitespace-nowrap"
            >
              {issueLabel} · {confidence}%
            </motion.div>
          </motion.div>
        )}

        {/* Scanning line effect */}
        <motion.div
          initial={{ top: '0%' }}
          animate={{ top: '100%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="absolute left-0 right-0 h-0.5 bg-blue-400/60"
        />
      </div>

      {/* Results */}
      <div className="p-5 space-y-4">
        {/* Detected class */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Detected Issue</p>
              <p className="text-sm font-bold text-navy-900">{issueLabel}</p>
            </div>
          </div>
        </div>

        {/* Confidence */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-navy-700">Confidence</span>
            </div>
            <span className="text-lg font-bold text-navy-900 tabular-nums">{confidence}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
            />
          </div>
        </div>

        {/* Severity & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-slate-500">Severity</span>
            </div>
            <SeverityBadge severity={analysis.severity} />
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <ScanLine className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-slate-500">Priority</span>
            </div>
            <PriorityBadge priority={analysis.priority} />
          </div>
        </div>

        {/* Description */}
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-sm text-navy-700">{analysis.description}</p>
        </div>
      </div>
    </motion.div>
  );
}
