import React, { useEffect, useRef, useState } from 'react';

export interface DalaConstellationProps {
  mode?: 'galaxy-brain' | 'spreadsheet-to-graph';
  className?: string;
  particleCount?: number;
  interactive?: boolean;
  showLabels?: boolean;
}

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: 'triangle' | 'dot' | 'diamond';
  angle: number;
  angularSpeed: number;
  alpha: number;
  layer: number; // 0 = background, 1 = mid, 2 = foreground
}

const DALA_COLORS = [
  '#8052ff', // Electric Iris (violet)
  '#8052ff',
  '#ffb829', // Saffron Spark (amber)
  '#15846e', // Deep Verdant (emerald/teal)
  '#ffffff', // Bone White
  '#c084fc', // Soft Violet
  '#38bdf8', // Electric Cyan
];

export const DalaConstellation: React.FC<DalaConstellationProps> = ({
  mode = 'galaxy-brain',
  className = '',
  particleCount = 260,
  interactive = true,
  showLabels = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [currentStage, setCurrentStage] = useState<'grid' | 'chaos' | 'graph'>('graph');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Generate particles
    const particles: Particle[] = [];
    const count = particleCount;

    for (let i = 0; i < count; i++) {
      const color = DALA_COLORS[Math.floor(Math.random() * DALA_COLORS.length)];
      const layer = Math.random() < 0.3 ? 0 : Math.random() < 0.7 ? 1 : 2;
      const size = layer === 2 ? 3 + Math.random() * 2.5 : layer === 1 ? 2 + Math.random() * 1.5 : 1 + Math.random() * 1;
      const shapeRand = Math.random();
      const shape: 'triangle' | 'dot' | 'diamond' = shapeRand < 0.5 ? 'triangle' : shapeRand < 0.75 ? 'diamond' : 'dot';

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        originX: Math.random() * width,
        originY: Math.random() * height,
        targetX: Math.random() * width,
        targetY: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size,
        color,
        shape,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.02,
        alpha: 0.3 + Math.random() * 0.6,
        layer,
      });
    }

    // State machine for spreadsheet-to-graph mode
    let stage: 'grid' | 'chaos' | 'graph' = mode === 'spreadsheet-to-graph' ? 'grid' : 'graph';
    let stageTimer = 0;
    const stageDuration = 280; // frames per stage (~4.5s)

    const computeTargets = (targetStage: 'grid' | 'chaos' | 'graph') => {
      const centerX = width * 0.5;
      const centerY = height * 0.5;

      if (targetStage === 'grid') {
        // Form a spreadsheet grid (rows and columns like Excel)
        const cols = 14;
        const rows = Math.ceil(count / cols);
        const cellW = (width * 0.75) / cols;
        const cellH = (height * 0.65) / rows;
        const startX = width * 0.125;
        const startY = height * 0.18;

        particles.forEach((p, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          p.targetX = startX + col * cellW + (Math.random() - 0.5) * 6;
          p.targetY = startY + row * cellH + (Math.random() - 0.5) * 6;
        });
      } else if (targetStage === 'chaos') {
        // Swirling chaos / dissolution
        particles.forEach((p) => {
          const angle = Math.random() * Math.PI * 2;
          const dist = 50 + Math.random() * (Math.min(width, height) * 0.42);
          p.targetX = centerX + Math.cos(angle) * dist;
          p.targetY = centerY + Math.sin(angle) * dist;
        });
      } else {
        // Ascending Financial Growth Graph & Organic Constellation Curve
        const graphStartX = width * 0.1;
        const graphEndX = width * 0.9;
        const graphBottomY = height * 0.82;
        const graphTopY = height * 0.22;

        particles.forEach((p, idx) => {
          const progress = idx / count;
          // Exponential / S-curve financial surge
          const curveY = graphBottomY - Math.pow(progress, 1.6) * (graphBottomY - graphTopY);
          const curveX = graphStartX + progress * (graphEndX - graphStartX);

          // 65% of particles cling tightly to the curve, 35% float as constellation halo
          if (idx % 3 === 0) {
            // Halo / constellation galaxy cloud
            const orbitAngle = Math.random() * Math.PI * 2;
            const orbitDist = 20 + Math.random() * 80;
            p.targetX = curveX + Math.cos(orbitAngle) * orbitDist;
            p.targetY = curveY + Math.sin(orbitAngle) * orbitDist;
          } else {
            p.targetX = curveX + (Math.random() - 0.5) * 16;
            p.targetY = curveY + (Math.random() - 0.5) * 16;
          }
        });
      }
    };

    computeTargets(stage);

    // Draw helper: Little triangle
    const drawTriangle = (x: number, y: number, size: number, angle: number, color: string, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      const h = size * 1.6;
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(size, h / 2);
      ctx.lineTo(-size, h / 2);
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = alpha;
      ctx.stroke();
      ctx.restore();
    };

    // Draw helper: Little diamond
    const drawDiamond = (x: number, y: number, size: number, angle: number, color: string, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.restore();
    };

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Cycle stage in spreadsheet-to-graph mode
      if (mode === 'spreadsheet-to-graph') {
        stageTimer++;
        if (stageTimer > stageDuration) {
          stageTimer = 0;
          stage = stage === 'grid' ? 'chaos' : stage === 'chaos' ? 'graph' : 'grid';
          setCurrentStage(stage);
          computeTargets(stage);
        }
      }

      // Draw faint connections between nearby particles (constellation filaments)
      const maxDistance = mode === 'spreadsheet-to-graph' && stage === 'grid' ? 55 : 70;
      ctx.lineWidth = 0.5;

      for (let i = 0; i < particles.length; i += 2) {
        const p1 = particles[i];
        for (let j = i + 1; j < Math.min(i + 8, particles.length); j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxDistance * maxDistance) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / maxDistance) * 0.18;
            ctx.strokeStyle = p1.color;
            ctx.globalAlpha = lineAlpha;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Update & Draw Particles
      const mouse = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Smoothly interpolate towards target
        const lerpSpeed = mode === 'spreadsheet-to-graph' ? 0.045 : 0.025;
        p.x += (p.targetX - p.x) * lerpSpeed + p.vx;
        p.y += (p.targetY - p.y) * lerpSpeed + p.vy;

        // Subtle ambient floating drift
        p.angle += p.angularSpeed;

        if (mode === 'galaxy-brain') {
          // Subtle orbital rotation around center
          const dx = p.x - width * 0.5;
          const dy = p.y - height * 0.5;
          const r = Math.sqrt(dx * dx + dy * dy);
          const theta = Math.atan2(dy, dx) + 0.002 * (1 / (1 + r * 0.005));
          p.targetX = width * 0.5 + Math.cos(theta) * r;
          p.targetY = height * 0.5 + Math.sin(theta) * r;
        }

        // Mouse interaction: gentle repulsion / glow
        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdistSq = mdx * mdx + mdy * mdy;
          const repulseRadius = 120;
          if (mdistSq < repulseRadius * repulseRadius && mdistSq > 0) {
            const mdist = Math.sqrt(mdistSq);
            const force = (1 - mdist / repulseRadius) * 4.5;
            p.x += (mdx / mdist) * force;
            p.y += (mdy / mdist) * force;
            p.alpha = Math.min(1, p.alpha + 0.3);
          }
        }

        // Draw particle based on shape
        if (p.shape === 'triangle') {
          drawTriangle(p.x, p.y, p.size, p.angle, p.color, p.alpha);
        } else if (p.shape === 'diamond') {
          drawDiamond(p.x, p.y, p.size, p.angle, p.color, p.alpha);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
        }
      }

      // Draw Graph Highlights if in graph stage
      if (mode === 'spreadsheet-to-graph' && stage === 'graph') {
        const isEn = typeof window !== 'undefined' && localStorage.getItem('dalas_language') === 'en';
        const milestoneNodes = isEn ? [
          { label: 'Jan · Manual Spreadsheets', value: '$ 12k', pct: 0.15, color: '#9a9a9a' },
          { label: 'Mar · CodeEngine Automation', value: '$ 38k', pct: 0.45, color: '#ffb829' },
          { label: 'Jun · Scale & Real Profit', value: '$ 84k', pct: 0.85, color: '#8052ff' },
        ] : [
          { label: 'Jan · Planilhas manuais', value: '12 mil €', pct: 0.15, color: '#9a9a9a' },
          { label: 'Mar · Automação CodeEngine', value: '38 mil €', pct: 0.45, color: '#ffb829' },
          { label: 'Jun · Escala e lucro real', value: '84 mil €', pct: 0.85, color: '#8052ff' },
        ];

        const graphStartX = width * 0.1;
        const graphEndX = width * 0.9;
        const graphBottomY = height * 0.82;
        const graphTopY = height * 0.22;

        milestoneNodes.forEach((node) => {
          const nx = graphStartX + node.pct * (graphEndX - graphStartX);
          const ny = graphBottomY - Math.pow(node.pct, 1.6) * (graphBottomY - graphTopY);

          // Glowing node ring
          ctx.beginPath();
          ctx.arc(nx, ny, 6, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.globalAlpha = 0.9;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(nx, ny, 12 + Math.sin(time * 3) * 3, 0, Math.PI * 2);
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.4;
          ctx.stroke();

          // Text labels
          if (showLabels && width > 480) {
            ctx.font = '11px Inter, system-ui, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.85;
            ctx.fillText(node.label, nx - 40, ny - 20);

            ctx.font = 'bold 13px Inter, system-ui, sans-serif';
            ctx.fillStyle = node.color;
            ctx.globalAlpha = 1;
            ctx.fillText(node.value, nx - 40, ny - 6);
          }
        });
      }

      animId = requestAnimationFrame(render);
    };

    render();

    // Mouse events
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const onMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const onResize = () => {
      if (!canvas) return;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      computeTargets(stage);
    };

    if (interactive) {
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseleave', onMouseLeave);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      if (interactive) {
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseleave', onMouseLeave);
      }
      window.removeEventListener('resize', onResize);
    };
  }, [mode, particleCount, interactive, showLabels]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-black ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
      {/* Mode indicator for spreadsheet-to-graph */}
      {mode === 'spreadsheet-to-graph' && showLabels && (
        <div className="absolute bottom-4 left-6 z-10 flex items-center gap-2 text-[11px] font-mono">
          <span
            className="w-2 h-2 rounded-full animate-ping"
            style={{
              backgroundColor:
                currentStage === 'grid' ? '#9a9a9a' : currentStage === 'chaos' ? '#ffb829' : '#8052ff',
            }}
          />
          <span className="text-white/70">
            {currentStage === 'grid'
              ? (typeof window !== 'undefined' && localStorage.getItem('dalas_language') === 'en'
                  ? 'Stage 1/3: Rigid Spreadsheets (Excel)'
                  : 'Etapa 1/3: Planilha (Excel)')
              : currentStage === 'chaos'
              ? (typeof window !== 'undefined' && localStorage.getItem('dalas_language') === 'en'
                  ? 'Stage 2/3: Dissolution & Intelligence'
                  : 'Etapa 2/3: Dados organizados')
              : (typeof window !== 'undefined' && localStorage.getItem('dalas_language') === 'en'
                  ? 'Stage 3/3: Financial Growth Constellation'
                  : 'Etapa 3/3: Crescimento financeiro')}
          </span>
        </div>
      )}
    </div>
  );
};
