// components/sections/HeroSection.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

const TERMINAL_LINES = [
  { prompt: '~', cmd: 'npx create-benocode-app --stack fullstack' },
  { prompt: '~', cmd: 'Installing dependencies...' },
  { prompt: '~', cmd: 'Setting up PostgreSQL, Redis, Next.js...' },
  { prompt: '~', cmd: 'Deploying to production...' },
  { prompt: '~', cmd: '✓ Your app is live at https://your-domain.com', isResult: true },
];

const TYPE_SPEED = 35;
const LINE_PAUSE = 600;
const RESULT_PAUSE = 2500;

interface TerminalLine {
  prompt: string;
  cmd: string;
  isResult?: boolean;
}

function useTerminalTyping(lines: TerminalLine[]) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    setDisplayedLines([]);
    setCurrentLine(0);
    setCurrentChar(0);
    setShowCursor(true);
  }, []);

  useEffect(() => {
    if (currentLine >= lines.length) {
      timeoutRef.current = setTimeout(reset, RESULT_PAUSE);
      return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }

    const line = lines[currentLine];
    const text = line.cmd;

    if (currentChar < text.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayedLines((prev) => {
          const updated = [...prev];
          updated[currentLine] = text.slice(0, currentChar + 1);
          return updated;
        });
        setCurrentChar((c) => c + 1);
      }, line.isResult ? TYPE_SPEED / 2 : TYPE_SPEED);
    } else {
      timeoutRef.current = setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
        setDisplayedLines((prev) => [...prev, '']);
      }, LINE_PAUSE);
    }

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [currentLine, currentChar, lines, reset]);

  // Blink cursor
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  return { displayedLines, currentLine, showCursor };
}

const TAGLINE_KEYS = [
  'tagline.webApps',
  'tagline.apis',
  'tagline.ai',
  'tagline.consulting',
  'tagline.printing3d',
] as const;

function RotatingTagline() {
  const t = useTranslations('home.hero');
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % TAGLINE_KEYS.length);
        setVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`inline-block transition-all duration-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      {t(TAGLINE_KEYS[index])}
    </span>
  );
}

export const HeroSection: React.FC = () => {
  const t = useTranslations('home.hero');
  const { displayedLines, currentLine, showCursor } = useTerminalTyping(TERMINAL_LINES);

  return (
    <section className="relative bg-gradient-to-br from-primary via-primary-light to-primary overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative container mx-auto px-4 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto">
          {/* Top text */}
          <div className="text-center mb-10" style={{ animation: 'fade-in 0.8s ease-out' }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {t('title')}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 h-8">
              <RotatingTagline />
            </p>
          </div>

          {/* Terminal window */}
          <div
            className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-gray-950/80 backdrop-blur-sm shadow-2xl overflow-hidden"
            style={{ animation: 'fade-in-up 0.8s ease-out 0.3s both, terminal-glow 4s ease-in-out infinite' }}
          >
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/80 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-2 text-xs text-gray-500 font-mono">benocode — zsh</span>
            </div>

            {/* Terminal body */}
            <div className="p-5 font-mono text-sm md:text-base min-h-[200px]">
              {displayedLines.map((text, i) => {
                const line = TERMINAL_LINES[i];
                if (!line) return null;
                const isActive = i === currentLine;
                const isResult = line.isResult;

                return (
                  <div key={i} className="flex items-start gap-2 mb-1 leading-relaxed">
                    {!isResult && (
                      <span className="text-green-400 select-none shrink-0">
                        {line.prompt} $
                      </span>
                    )}
                    <span className={isResult ? 'text-green-300 font-semibold' : 'text-gray-300'}>
                      {text}
                      {isActive && (
                        <span
                          className={`inline-block w-2 h-4 ml-0.5 align-middle bg-green-400 ${showCursor ? 'opacity-100' : 'opacity-0'}`}
                          style={{ transition: 'opacity 0.1s' }}
                        />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA buttons */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
            style={{ animation: 'fade-in-up 0.8s ease-out 0.6s both' }}
          >
            <a href="#book-meeting">
              <Button variant="secondary" size="lg">
                {t('getStarted')}
              </Button>
            </a>
            <a href="#services">
              <Button variant="outline-light" size="lg">
                {t('learnMore')}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
