'use client';

import React from 'react';
import { motion } from 'framer-motion';

const logos = [
  { name: 'Stripe'      },
  { name: 'Vercel'      },
  { name: 'Linear'      },
  { name: 'Notion'      },
  { name: 'Figma'       },
  { name: 'Loom'        },
  { name: 'Retool'      },
  { name: 'Prisma'      },
  { name: 'Planetscale' },
  { name: 'Railway'     },
  { name: 'Supabase'    },
  { name: 'Resend'      },
];

interface LogoItemProps {
  name: string;
}

function LogoItem({ name }: LogoItemProps) {
  return (
    <div className="flex items-center justify-center px-10 py-3 shrink-0 group">
      <span
        className="font-bold text-[17px] tracking-tight select-none transition-all duration-400 group-hover:text-[rgba(196,181,253,0.70)]"
        style={{
          color: 'rgba(155,148,196,0.38)',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          letterSpacing: '-0.02em',
        }}
      >
        {name}
      </span>
    </div>
  );
}

export default function TrustedBy() {
  const doubled = [...logos, ...logos];

  return (
    <section className="relative z-content overflow-hidden" style={{ padding: '72px 0 80px' }}>

      {/* Label */}
      <div className="section-container" style={{ marginBottom: '40px' }}>
        <motion.p
          className="text-center text-[11px] font-bold text-[#635D8C] uppercase tracking-[0.25em]"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          Trusted by security teams at world-class companies
        </motion.p>
      </div>

      {/* Marquee */}
      <motion.div
        className="relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        {/* Fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-[#0B0D1B] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-[#0B0D1B] to-transparent z-10 pointer-events-none" />

        <div className="overflow-hidden">
          <div className="marquee-track">
            {doubled.map((logo, i) => (
              <LogoItem key={`${logo.name}-${i}`} name={logo.name} />
            ))}
          </div>
        </div>
      </motion.div>

    </section>
  );
}
