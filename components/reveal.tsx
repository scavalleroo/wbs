'use client';

import React, { useRef } from 'react';
import { useInView, motion } from 'motion/react';

interface RevealProps {
  phrases: string[];
  className?: string;
  as?: React.ElementType;
}

export function Reveal({ phrases, className = '', as = 'div' }: RevealProps) {
  const body = useRef(null);
  const isInView = useInView(body, { once: true, margin: '-10%' });

  const Tag = as;
  return (
    <Tag ref={body} className={className}>
      {phrases.map((phrase, index) => (
        <span
          key={index}
          className="relative mr-1 inline-flex w-fit overflow-hidden"
        >
          <motion.span
            className="inline-block"
            custom={index}
            initial="initial"
            animate={isInView ? 'enter' : ''}
          >
            {phrase}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
