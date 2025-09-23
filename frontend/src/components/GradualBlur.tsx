// Component added by Ansh - github.com/ansh-dhanani
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as math from 'mathjs';

const DEFAULT_CONFIG = {
  position: 'bottom',
  strength: 2,
  height: '6rem',
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false,
  duration: '0.3s',
  easing: 'ease-out',
  opacity: 1,
  curve: 'linear',
  responsive: false,
  target: 'parent',
  className: '',
  style: {} as React.CSSProperties,
} as const;

const PRESETS = {
  top: { position: 'top', height: '6rem' },
  bottom: { position: 'bottom', height: '6rem' },
  left: { position: 'left', height: '6rem' },
  right: { position: 'right', height: '6rem' },
  subtle: { height: '4rem', strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: '10rem', strength: 4, divCount: 8, exponential: true },
  smooth: { height: '8rem', curve: 'bezier', divCount: 10 },
  sharp: { height: '5rem', curve: 'linear', divCount: 4 },
  header: { position: 'top', height: '8rem', curve: 'ease-out' },
  footer: { position: 'bottom', height: '8rem', curve: 'ease-out' },
  sidebar: { position: 'left', height: '6rem', strength: 2.5 },
  'page-header': { position: 'top', height: '10rem', target: 'page', strength: 3 },
  'page-footer': { position: 'bottom', height: '10rem', target: 'page', strength: 3 },
} as const;

const CURVE_FUNCTIONS: Record<string, (p: number) => number> = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  'ease-in': (p) => p * p,
  'ease-out': (p) => 1 - Math.pow(1 - p, 2),
  'ease-in-out': (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

const mergeConfigs = (...configs: any[]) => configs.reduce((acc, c) => ({ ...acc, ...c }), {});

const getGradientDirection = (position: string) => {
  const directions: Record<string, string> = {
    top: 'to top',
    bottom: 'to bottom',
    left: 'to left',
    right: 'to right',
  };
  return directions[position] || 'to bottom';
};

const debounce = (fn: (...a: any[]) => void, wait: number) => {
  let t: any;
  return (...a: any[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), wait);
  };
};

const useResponsiveDimension = (responsive: boolean, config: any, key: string) => {
  const [val, setVal] = useState(config[key]);
  useEffect(() => {
    if (!responsive) return;
    const calc = () => {
      const w = window.innerWidth;
      let v = config[key];
      if (w <= 480 && config['mobile' + key[0].toUpperCase() + key.slice(1)])
        v = config['mobile' + key[0].toUpperCase() + key.slice(1)];
      else if (w <= 768 && config['tablet' + key[0].toUpperCase() + key.slice(1)])
        v = config['tablet' + key[0].toUpperCase() + key.slice(1)];
      else if (w <= 1024 && config['desktop' + key[0].toUpperCase() + key.slice(1)])
        v = config['desktop' + key[0].toUpperCase() + key.slice(1)];
      setVal(v);
    };
    const deb = debounce(calc, 100);
    calc();
    window.addEventListener('resize', deb);
    return () => window.removeEventListener('resize', deb);
  }, [responsive, config, key]);
  return responsive ? val : config[key];
};

const useIntersectionObserver = (ref: React.RefObject<HTMLDivElement>, shouldObserve = false) => {
  const [isVisible, setIsVisible] = useState(!shouldObserve);

  useEffect(() => {
    if (!shouldObserve || !ref.current) return;

    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.1 });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, shouldObserve]);

  return isVisible;
};

type GradualBlurProps = any;

const GradualBlur = (props: GradualBlurProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const config = useMemo(() => {
    const presetConfig = (props as any).preset && (PRESETS as any)[(props as any).preset] ? (PRESETS as any)[(props as any).preset] : {};
    return mergeConfigs(DEFAULT_CONFIG, presetConfig, props);
  }, [props]);

  const responsiveHeight = useResponsiveDimension((config as any).responsive, config, 'height');
  const responsiveWidth = useResponsiveDimension((config as any).responsive, config, 'width');
  const isVisible = useIntersectionObserver(containerRef, (config as any).animated === 'scroll');

  const blurDivs = useMemo(() => {
    const divs = [] as React.ReactNode[];
    const increment = 100 / (config as any).divCount;
    const currentStrength =
      isHovered && (config as any).hoverIntensity ? (config as any).strength * (config as any).hoverIntensity : (config as any).strength;

    const curveFunc = CURVE_FUNCTIONS[(config as any).curve] || CURVE_FUNCTIONS.linear;

    for (let i = 1; i <= (config as any).divCount; i++) {
      let progress = i / (config as any).divCount;
      progress = curveFunc(progress);

      let blurValue: number;
      if ((config as any).exponential) {
        blurValue = Number(math.pow(2, progress * 4)) * 0.0625 * (currentStrength as number);
      } else {
        blurValue = 0.0625 * (progress * (config as any).divCount + 1) * (currentStrength as number);
      }
      const p1 = Number(math.round((increment * i - increment) * 10)) / 10;
      const p2 = Number(math.round(increment * i * 10)) / 10;
      const p3 = Number(math.round((increment * i + increment) * 10)) / 10;
      const p4 = Number(math.round((increment * i + increment * 2) * 10)) / 10;
      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const direction = getGradientDirection((config as any).position);

      const divStyle: React.CSSProperties = {
        position: 'absolute',
        inset: '0',
        maskImage: `linear-gradient(${direction}, ${gradient})`,
        WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
        backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        opacity: (config as any).opacity,
        transition:
          (config as any).animated && (config as any).animated !== 'scroll'
            ? `backdrop-filter ${(config as any).duration} ${(config as any).easing}`
            : undefined,
      };

      divs.push(<div key={i} style={divStyle} />);
    }

    return divs;
  }, [config, isHovered]);

  const containerStyle = useMemo(() => {
    const isVertical = ['top', 'bottom'].includes((config as any).position);
    const isHorizontal = ['left', 'right'].includes((config as any).position);
    const isPageTarget = (config as any).target === 'page';

    const baseStyle: any = {
      position: isPageTarget ? 'fixed' : 'absolute',
      pointerEvents: (config as any).hoverIntensity ? 'auto' : 'none',
      opacity: isVisible ? 1 : 0,
      transition: (config as any).animated ? `opacity ${(config as any).duration} ${(config as any).easing}` : undefined,
      zIndex: isPageTarget ? (config as any).zIndex + 100 : (config as any).zIndex,
      ...(config as any).style,
    };

    if (isVertical) {
      baseStyle.height = responsiveHeight;
      baseStyle.width = responsiveWidth || '100%';
      baseStyle[(config as any).position] = 0;
      baseStyle.left = 0;
      baseStyle.right = 0;
    } else if (isHorizontal) {
      baseStyle.width = responsiveWidth || responsiveHeight;
      baseStyle.height = '100%';
      baseStyle[(config as any).position] = 0;
      baseStyle.top = 0;
      baseStyle.bottom = 0;
    }

    return baseStyle;
  }, [config, responsiveHeight, responsiveWidth, isVisible]);

  const { hoverIntensity, animated, onAnimationComplete, duration } = config as any;
  useEffect(() => {
    if (isVisible && animated === 'scroll' && onAnimationComplete) {
      const t = setTimeout(() => onAnimationComplete(), parseFloat(duration) * 1000);
      return () => clearTimeout(t);
    }
  }, [isVisible, animated, onAnimationComplete, duration]);

  return (
    <div
      ref={containerRef}
      className={`gradual-blur ${(config as any).target === 'page' ? 'gradual-blur-page' : 'gradual-blur-parent'} ${(config as any).className}`}
      style={containerStyle}
      onMouseEnter={hoverIntensity ? () => setIsHovered(true) : undefined}
      onMouseLeave={hoverIntensity ? () => setIsHovered(false) : undefined}
    >
      <div className="gradual-blur-inner relative w-full h-full">{blurDivs}</div>
    </div>
  );
};
const GradualBlurMemo = React.memo(GradualBlur) as any;
GradualBlurMemo.displayName = 'GradualBlur';
GradualBlurMemo.PRESETS = PRESETS;
GradualBlurMemo.CURVE_FUNCTIONS = CURVE_FUNCTIONS;
export default GradualBlurMemo;


