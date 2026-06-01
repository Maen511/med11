import { motion } from 'framer-motion';
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';

type AnimationSnapshot = {
  filter?: string;
  opacity?: number;
  y?: number;
};

interface BlurTextProps {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: AnimationSnapshot;
  animationTo?: AnimationSnapshot[];
  easing?: (t: number) => number;
  onAnimationComplete?: () => void;
  stepDuration?: number;
  active?: boolean;
  as?: 'p' | 'span' | 'h1';
  style?: CSSProperties;
  /** Force reading order for Latin brand names inside RTL pages */
  dir?: 'ltr' | 'rtl' | 'auto';
}

const buildKeyframes = (from: AnimationSnapshot, steps: AnimationSnapshot[]) => {
  const keys = new Set([...Object.keys(from), ...steps.flatMap((step) => Object.keys(step))]);
  const keyframes: Record<string, Array<string | number | undefined>> = {};

  keys.forEach((key) => {
    keyframes[key] = [from[key as keyof AnimationSnapshot], ...steps.map((step) => step[key as keyof AnimationSnapshot])];
  });

  return keyframes;
};

const BlurText = ({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = (t) => t,
  onAnimationComplete,
  stepDuration = 0.35,
  active,
  as = 'p',
  style,
  dir = 'auto',
}: BlurTextProps) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const shouldAnimate = active ?? inView;
  const Tag = motion[as];

  useEffect(() => {
    if (active !== undefined || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [active, threshold, rootMargin]);

  const defaultFrom = useMemo(
    () =>
      direction === 'top'
        ? { filter: 'blur(10px)', opacity: 0, y: -50 }
        : { filter: 'blur(10px)', opacity: 0, y: 50 },
    [direction]
  );

  const defaultTo = useMemo(
    () => [
      {
        filter: 'blur(5px)',
        opacity: 0.5,
        y: direction === 'top' ? 5 : -5,
      },
      { filter: 'blur(0px)', opacity: 1, y: 0 },
    ],
    [direction]
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;
  const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);
  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, index) => (stepCount === 1 ? 0 : index / (stepCount - 1)));

  return (
    <Tag ref={ref as any} dir={dir} className={className} style={{ display: 'flex', flexWrap: 'wrap', ...style }}>
      {elements.map((segment, index) => (
        <motion.span
          className="inline-block will-change-[transform,filter,opacity]"
          key={`${segment}-${index}`}
          initial={fromSnapshot}
          animate={shouldAnimate ? animateKeyframes : fromSnapshot}
          transition={{
            duration: totalDuration,
            times,
            delay: shouldAnimate ? (index * delay) / 1000 : 0,
            ease: easing,
          }}
          onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
        >
          {segment === ' ' ? '\u00A0' : segment}
          {animateBy === 'words' && index < elements.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </Tag>
  );
};

export default BlurText;
