'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCounter } from '@/components/landing/hooks/useCounter';

/* ── Button ── */
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'outline' | 'glass';
  className?: string;
  onClick?: () => void;
  href?: string;
}

export function Button({ children, variant = 'primary', className = '', onClick, href, ...props }: ButtonProps) {
  const base = `
    inline-flex items-center justify-center gap-2
    font-semibold text-sm tracking-wide
    transition-all duration-300 ease-out
    cursor-pointer select-none
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5F01FB]/60
  `;

  const variants: Record<string, string> = {
    primary: `
      px-7 py-4 rounded-[20px]
      bg-gradient-to-r from-[#5F01FB] to-[#7B2FFC]
      text-white
      shadow-[0_0_24px_rgba(95,1,251,0.35)]
      hover:shadow-[0_0_40px_rgba(95,1,251,0.55),0_8px_32px_rgba(0,0,0,0.4)]
      hover:from-[#6B0FFF] hover:to-[#8A3FFF]
      hover:-translate-y-0.5
      active:scale-[0.98]
    `,
    ghost: `
      px-7 py-4 rounded-[20px]
      bg-transparent text-white
      border border-[rgba(95,1,251,0.35)]
      hover:border-[rgba(95,1,251,0.7)]
      hover:bg-[rgba(95,1,251,0.08)]
      hover:shadow-[0_0_20px_rgba(95,1,251,0.20)]
      hover:-translate-y-0.5
    `,
    outline: `
      px-7 py-4 rounded-[20px]
      bg-transparent text-[#C4BFEC]
      border border-[rgba(196,191,236,0.25)]
      hover:border-[rgba(196,191,236,0.5)]
      hover:text-white
      hover:-translate-y-0.5
    `,
    glass: `
      px-7 py-4 rounded-[20px]
      bg-[rgba(255,255,255,0.06)] text-white
      border border-[rgba(255,255,255,0.12)]
      backdrop-blur-sm
      hover:bg-[rgba(255,255,255,0.10)]
      hover:border-[rgba(255,255,255,0.20)]
      hover:-translate-y-0.5
    `,
  };

  const Tag = href ? 'a' : 'button';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="inline-block"
    >
      <Tag
        href={href}
        onClick={onClick}
        className={`${base} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </Tag>
    </motion.div>
  );
}

/* ── Badge ── */
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'green' | 'red' | 'amber' | 'glass' | 'light';
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ children, variant = 'brand', className = '', style }: BadgeProps) {
  const variants: Record<string, string> = {
    brand:  'bg-[rgba(95,1,251,0.15)] text-[#C4B5FD] border border-[rgba(95,1,251,0.30)]',
    green:  'bg-[rgba(34,197,94,0.10)] text-[#86efac] border border-[rgba(34,197,94,0.25)]',
    red:    'bg-[rgba(239,68,68,0.10)] text-[#fca5a5] border border-[rgba(239,68,68,0.25)]',
    amber:  'bg-[rgba(251,191,36,0.10)] text-[#fde68a] border border-[rgba(251,191,36,0.25)]',
    glass:  'bg-[rgba(255,255,255,0.06)] text-[#9B94C4] border border-[rgba(255,255,255,0.10)]',
    light:  'bg-[rgba(196,181,253,0.12)] text-[#EDE9FE] border border-[rgba(196,181,253,0.25)]',
  };
  return (
    <span style={style} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

/* ── SectionHeading ── */
interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: 'center' | 'left';
  titleClass?: string;
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'center', titleClass = '' }: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start';
  return (
    <motion.div
      className={`flex flex-col gap-4 ${alignClass}`}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {eyebrow && (
        <Badge variant="brand">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7B2FFC] animate-pulse" />
          {eyebrow}
        </Badge>
      )}
      <h2 className={`text-4xl md:text-5xl font-bold leading-tight ${titleClass}`}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-[#9B94C4] text-lg leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

/* ── GlassCard ── */
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className = '', hover = true, onClick }: GlassCardProps) {
  return (
    <motion.div
      onClick={onClick}
      className={`glass glow-ring ${hover ? 'glow-ring-hover gradient-border cursor-pointer' : ''} transition-all duration-400 ${className}`}
      whileHover={hover ? { y: -4, transition: { duration: 0.35, ease: [0.22,1,0.36,1] } } : {}}
    >
      {children}
    </motion.div>
  );
}

/* ── GlowDot ── */
interface GlowDotProps {
  color?: string;
  size?: number;
  className?: string;
}

export function GlowDot({ color = '#5F01FB', size = 10, className = '' }: GlowDotProps) {
  return (
    <span className={`relative inline-flex ${className}`} style={{ width: size, height: size }}>
      <span
        className="absolute inset-0 rounded-full animate-ping opacity-60"
        style={{ background: color }}
      />
      <span
        className="relative rounded-full"
        style={{ width: size, height: size, background: color }}
      />
    </span>
  );
}

/* ── AnimatedCounter ── */
interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
}

export function AnimatedCounter({ value, suffix = '', prefix = '' }: AnimatedCounterProps) {
  const { count, ref } = useCounter(value);
  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}
