import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Mic,
  MicOff,
  Camera,
  ScanLine,
  Brain,
  Image as ImageIcon,
  Lightbulb,
  RotateCcw,
  Send,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { AIResultCard } from '@/components/AIResultCard';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { analyzeImage, submitReport } from '@/services/api';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useLanguage } from '@/i18n/LanguageContext';
import type { AIAnalysis } from '@/types';

type Phase = 'form' | 'analyzing' | 'result' | 'submitting';

const analysisSteps = [
  'Analyzing image...',
  'Detecting infrastructure...',
  'Estimating severity...',
];

export function ReportIssuePage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const { t, lang } = useLanguage();

  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);
  const [error, setError] = useState(false);

  // Real GPS capture (falls back to an approximate location if the citizen
  // denies permission or the device has no GPS, so submission is never
  // blocked outright).
  const geo = useGeolocation();

  const handleVoiceResult = useCallback((transcript: string) => {
    setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
  }, []);
  const voice = useVoiceInput(lang, handleVoiceResult);

  const handleAnalyze = async () => {
    if (!image) return;
    setPhase('analyzing');
    setAnalysisStepIndex(0);

    // Step through analysis messages
    for (let i = 0; i < analysisSteps.length; i++) {
      await new Promise((r) => setTimeout(r, 800));
      setAnalysisStepIndex(i);
    }

    try {
      const result = await analyzeImage(image);
      setAnalysis(result);
      setPhase('result');
    } catch {
      setError(true);
      setPhase('form');
    }
  };

  const handleSubmit = async () => {
    if (!analysis) return;
    setPhase('submitting');
    try {
      const res = await submitReport({
        image: image!,
        latitude: geo.latitude,
        longitude: geo.longitude,
        location: geo.locationName,
        description,
        aiAnalysis: analysis,
      });
      show('Report submitted successfully', 'success');
      navigate(`/submitted/${res.ticketId}`, {
        state: {
          ticketId: res.ticketId,
          category: analysis.detectedClass,
          displayCategory: analysis.displayClass || analysis.detectedClass,
          priority: analysis.priority,
          location: geo.locationName,
          status: 'Detected',
          isDuplicate: res.isDuplicate,
          duplicateOfTicketId: res.duplicateOfTicketId,
          nearbySimilarCount: res.nearbySimilarCount,
        },
      });
    } catch {
      show('Something went wrong while submitting the report', 'error');
      setPhase('result');
    }
  };

  const handleRetake = () => {
    setImage(null);
    setAnalysis(null);
    setPhase('form');
  };

  return (
    <div className="relative min-h-screen py-8 overflow-hidden">
      <ReportBackground />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-navy-900">{t('report_title')}</h1>
          <p className="mt-1.5 text-slate-500">{t('report_subtitle')}</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Form / Analysis */}
          <div className="lg:col-span-3 space-y-5">
            <AnimatePresence>
              {phase === 'form' && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {/* Photo Upload */}
                  <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Camera className="w-5 h-5 text-blue-600" />
                      <h2 className="text-base font-semibold text-navy-900">{t('report_photo')}</h2>
                      <span className="text-xs text-red-500 font-medium">*{t('report_required')}</span>
                    </div>
                    <ImageUploader image={image} onChange={setImage} />
                  </div>

                  {/* Location */}
                  <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <h2 className="text-base font-semibold text-navy-900">{t('report_location')}</h2>
                    </div>
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          geo.status === 'ok' ? 'bg-emerald-50' : geo.status === 'detecting' ? 'bg-blue-50' : 'bg-amber-50'
                        }`}
                      >
                        {geo.status === 'detecting' ? (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        ) : geo.status === 'ok' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-navy-900">
                          {geo.status === 'detecting'
                            ? t('report_location_detecting')
                            : geo.status === 'ok'
                              ? t('report_location_detected')
                              : geo.status === 'denied'
                                ? t('report_location_denied')
                                : t('report_location_unavailable')}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {geo.latitude.toFixed(4)}°N, {geo.longitude.toFixed(4)}°E
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{geo.locationName}</p>
                      </div>
                      {geo.status !== 'ok' && geo.status !== 'detecting' && (
                        <button
                          onClick={geo.retry}
                          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 shrink-0"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          {t('report_location_retry')}
                        </button>
                      )}
                    </div>
                    {/* Mini map preview */}
                    <div className="mt-4 relative h-28 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                      <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: `linear-gradient(rgba(13,29,58,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(13,29,58,0.2) 1px, transparent 1px)`,
                        backgroundSize: '20px 20px',
                      }} />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <motion.div
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-navy-900">{t('report_description')}</h2>
                        <span className="text-xs text-slate-400 font-medium">{t('report_optional')}</span>
                      </div>
                      {voice.supported && (
                        <button
                          onClick={voice.toggle}
                          className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-2.5 py-1.5 rounded-lg ${
                            voice.listening
                              ? 'text-red-600 bg-red-50 animate-pulse'
                              : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          aria-label={t('report_voice')}
                          title={lang === 'ur' ? 'اردو یا انگریزی میں بولیں' : 'Speak in English or Urdu'}
                        >
                          {voice.listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          {voice.listening ? t('report_voice_listening') : t('report_voice')}
                        </button>
                      )}
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t('report_description_placeholder')}
                      dir={lang === 'ur' ? 'rtl' : 'ltr'}
                      rows={4}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-navy-900 placeholder:text-slate-400 btn-focus transition-colors resize-none"
                    />
                    {!voice.supported && (
                      <p className="text-xs text-slate-400 mt-2">{t('report_voice_unsupported')}</p>
                    )}
                  </div>

                  {/* Analyze Button */}
                  <Button
                    size="lg"
                    fullWidth
                    disabled={!image}
                    onClick={handleAnalyze}
                    icon={<ScanLine className="w-5 h-5" />}
                  >
                    {t('report_analyze')}
                  </Button>
                  {!image && (
                    <p className="text-center text-xs text-slate-400">{t('report_analyze_hint')}</p>
                  )}
                </motion.div>
              )}

              {phase === 'analyzing' && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 card-shadow-lg p-8"
                >
                  <AnalyzingState image={image!} stepIndex={analysisStepIndex} />
                </motion.div>
              )}

              {phase === 'result' && analysis && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AIResultCard analysis={analysis} imageUrl={image!} />
                  <div className="mt-5 flex gap-3">
                    <Button
                      size="lg"
                      fullWidth
                      variant="outline"
                      onClick={handleRetake}
                      icon={<RotateCcw className="w-5 h-5" />}
                    >
                      {t('report_retake')}
                    </Button>
                    <Button
                      size="lg"
                      fullWidth
                      variant="success"
                      onClick={handleSubmit}
                      icon={<Send className="w-5 h-5" />}
                    >
                      {t('report_submit')}
                    </Button>
                  </div>
                </motion.div>
              )}

              {phase === 'submitting' && (
                <motion.div
                  key="submitting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl border border-slate-200 card-shadow-lg p-12 flex flex-col items-center"
                >
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                  <p className="text-sm font-medium text-navy-900">{t('report_submitting')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Help / Preview */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-5">
              {/* Guidance */}
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-navy-900">{t('report_tips_title')}</h3>
                </div>
                <p className="text-xs text-navy-700 mb-3 leading-relaxed" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
                  {t('report_tips_body')}
                </p>
                <ul className="space-y-2">
                  {[t('report_tip_1'), t('report_tip_2'), t('report_tip_3')].map((tip) => (
                    <li
                      key={tip}
                      className="flex items-start gap-2 text-xs text-navy-700"
                      dir={lang === 'ur' ? 'rtl' : 'ltr'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Summary preview */}
              <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-5">
                <h3 className="text-sm font-bold text-navy-900 mb-4">{t('report_summary_title')}</h3>
                <div className="space-y-3">
                  <SummaryRow
                    icon={<ImageIcon className="w-4 h-4" />}
                    label={t('report_summary_photo')}
                    value={image ? t('report_summary_uploaded') : t('report_summary_not_uploaded')}
                    status={image ? 'ok' : 'pending'}
                  />
                  <SummaryRow
                    icon={<MapPin className="w-4 h-4" />}
                    label={t('report_summary_location')}
                    value={geo.locationName}
                    status={geo.status === 'ok' ? 'ok' : 'pending'}
                  />
                  <SummaryRow
                    icon={<Brain className="w-4 h-4" />}
                    label={t('report_summary_ai')}
                    value={analysis ? t('report_summary_complete') : t('report_summary_pending')}
                    status={analysis ? 'ok' : 'pending'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Soft gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/60" />

      {/* Animated neural network — unique to the report page */}
      <ReportNeuralNetwork />

      {/* Animated ambient orbs */}
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-200/30 to-cyan-200/25 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-200/25 to-blue-200/20 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[450px] h-[450px] rounded-full bg-cyan-200/25 blur-3xl"
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(13,29,58,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(13,29,58,0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Dot field */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(13,29,58,0.35) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Light vignette so the network never fights the form */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, transparent 0%, rgba(255,255,255,0.30) 75%, rgba(255,255,255,0.50) 100%)',
        }}
      />
    </div>
  );
}

function ReportNeuralNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    let time = 0;

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const NODE_COUNT = 44;
    const CONNECTION_DISTANCE = 160;

    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.8 + 2.2,
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.004;

      // Update positions
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      }

      // Draw connections + traveling data pulses
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const baseAlpha = 0.28 * (1 - dist / CONNECTION_DISTANCE);
            const pulse = 0.08 * Math.sin(time * 2 + a.phase + b.phase);
            const alpha = Math.max(0.08, baseAlpha + pulse);

            const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            gradient.addColorStop(0, `rgba(13, 29, 58, ${alpha})`);
            gradient.addColorStop(1, `rgba(37, 99, 235, ${alpha})`);

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.3;
            ctx.stroke();

            // Traveling pulse
            const pulseT = (time * 0.7 + (i + j) * 0.17) % 1;
            const px = a.x + (b.x - a.x) * pulseT;
            const py = a.y + (b.y - a.y) * pulseT;

            ctx.beginPath();
            ctx.arc(px, py, 2.4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(59, 130, 246, 0.95)';
            ctx.shadowColor = 'rgba(59, 130, 246, 0.65)';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 1.5 + node.phase);
        const radius = node.radius + pulse * 0.7;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        const nodeGradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          radius * 2.5
        );
        nodeGradient.addColorStop(0, 'rgba(37, 99, 235, 0.9)');
        nodeGradient.addColorStop(1, 'rgba(13, 29, 58, 0.35)');
        ctx.fillStyle = nodeGradient;
        ctx.shadowColor = `rgba(37, 99, 235, ${0.45 + pulse * 0.3})`;
        ctx.shadowBlur = 12 + pulse * 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-75"
      style={{
        maskImage: 'radial-gradient(ellipse at 50% 40%, black 0%, transparent 92%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 0%, transparent 92%)',
      }}
    />
  );
}

function SummaryRow({ icon, label, value, status }: { icon: React.ReactNode; label: string; value: string; status: 'ok' | 'pending' }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status === 'ok' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`text-sm font-medium ${status === 'ok' ? 'text-navy-900' : 'text-slate-400'}`}>{value}</p>
      </div>
      {status === 'ok' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
    </div>
  );
}

function AnalyzingState({ image, stepIndex }: { image: string; stepIndex: number }) {
  return (
    <div className="flex flex-col items-center">
      {/* Image with scanning effect */}
      <div className="relative w-full max-w-sm rounded-xl overflow-hidden bg-slate-900 mb-6">
        <img src={image} alt="Analyzing" className="w-full h-56 object-cover opacity-70" />
        <motion.div
          initial={{ top: '0%' }}
          animate={{ top: '100%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="absolute left-0 right-0 h-1 bg-blue-400 shadow-[0_0_20px_4px_rgba(59,130,246,0.5)]"
        />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.1) 50%, transparent 100%)',
        }} />
      </div>

      {/* Steps */}
      <div className="w-full max-w-xs space-y-3">
        {analysisSteps.map((step, i) => {
          const isDone = i < stepIndex;
          const isActive = i === stepIndex;
          return (
            <motion.div
              key={step}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: isDone || isActive ? 1 : 0.3 }}
              className="flex items-center gap-3"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                isDone ? 'bg-emerald-500' : isActive ? 'bg-blue-500' : 'bg-slate-200'
              }`}>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                )}
              </div>
              <span className={`text-sm font-medium ${isDone || isActive ? 'text-navy-900' : 'text-slate-400'}`}>
                {step}
              </span>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-slate-400">AI is analyzing your image. This takes a few seconds...</p>
    </div>
  );
}
