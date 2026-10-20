/**
 * AURA — MOTION PRESETS (motion/react v12, já instalado no projeto como "motion")
 * -----------------------------------------------------------------------------
 * Regra de ouro: o movimento EXPLICA (de onde veio, para onde foi, o que mudou).
 * Nunca decorar por decorar. Uma coreografia por ecrã, não 20 efeitos soltos.
 *
 * Uso:
 *   import { motion, AnimatePresence } from 'motion/react';
 *   import { fadeUp, stagger, spring, hoverLift } from '@/../design-system/motion/motion';
 *   <motion.section variants={stagger()} initial="hidden" animate="show">
 *     <motion.div variants={fadeUp}>...</motion.div>
 *   </motion.section>
 */
import type { Transition, Variants } from 'motion/react';

/* ----------------------------- Durações (s) ----------------------------- */
export const duration = {
  instant: 0.09,
  fast: 0.16,
  base: 0.24,
  slow: 0.42,
  slower: 0.64,
} as const;

/* ------------------------------- Curvas -------------------------------- */
export const ease = {
  standard: [0.2, 0.8, 0.2, 1],
  emphasized: [0.16, 1, 0.3, 1], // expo-out — entradas
  exit: [0.4, 0, 1, 1], // saídas rápidas
  spring: [0.34, 1.56, 0.64, 1], // overshoot leve
} as const;

/* ------------------------------- Springs ------------------------------- */
export const spring = {
  /** Botões, toggles, chips — resposta tátil imediata */
  snappy: { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 } as Transition,
  /** Cards, painéis, indicadores que deslizam (layoutId) */
  smooth: { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 } as Transition,
  /** Modais, sheets — entrada com peso */
  gentle: { type: 'spring', stiffness: 180, damping: 26, mass: 1 } as Transition,
  /** Elementos 3D (tilt de cartão) — suave e elástico */
  float: { type: 'spring', stiffness: 120, damping: 14, mass: 0.6 } as Transition,
};

/* ------------------------- Variantes de entrada ------------------------- */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.985, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: duration.slower, ease: ease.emphasized },
  },
  exit: { opacity: 0, y: 8, transition: { duration: duration.fast, ease: ease.exit } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.slow, ease: ease.standard } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: ease.exit } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: spring.smooth },
  exit: { opacity: 0, scale: 0.97, transition: { duration: duration.fast, ease: ease.exit } },
};

/** Contentor que escalona os filhos (dashboards, listas, grelhas de KPI) */
export const stagger = (step = 0.06, delay = 0.08): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: delay } },
});

/** Linha de lista / tabela (entra da esquerda, escalonada) */
export const listItem: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: duration.slow, ease: ease.emphasized } },
  exit: { opacity: 0, x: 8, transition: { duration: duration.fast } },
};

/* ------------------------------- Overlays ------------------------------- */
export const backdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.base } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
};

export const modal: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: spring.gentle },
  exit: { opacity: 0, scale: 0.98, y: 6, transition: { duration: duration.fast, ease: ease.exit } },
};

export const drawer: Variants = {
  hidden: { x: '104%' },
  show: { x: 0, transition: spring.gentle },
  exit: { x: '104%', transition: { duration: duration.base, ease: ease.exit } },
};

export const sheet: Variants = {
  hidden: { y: '100%' },
  show: { y: 0, transition: spring.gentle },
  exit: { y: '100%', transition: { duration: duration.base, ease: ease.exit } },
};

export const popover: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  show: { opacity: 1, scale: 1, y: 0, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.98, transition: { duration: duration.instant } },
};

export const toast: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring.smooth },
  exit: { opacity: 0, x: 40, transition: { duration: duration.base, ease: ease.exit } },
};

/* ----------------------------- Micro-interações ----------------------------- */
/** Card de vidro: levanta 2px no hover, afunda no clique */
export const hoverLift = {
  whileHover: { y: -2, transition: spring.smooth },
  whileTap: { y: 0, scale: 0.995, transition: spring.snappy },
};

/** Botão: compressão tátil */
export const press = {
  whileTap: { scale: 0.97, y: 1, transition: spring.snappy },
};

/** Ícone a rodar em hover (setas ↗ dos cards) */
export const arrowNudge = {
  whileHover: { rotate: 45, transition: spring.snappy },
};

/* ------------------------------ Gráficos ------------------------------ */
/** Barra cresce a partir da base (usar com style={{ originY: 1 }}) */
export const barGrow = (i = 0): Variants => ({
  hidden: { scaleY: 0, opacity: 0.4 },
  show: {
    scaleY: 1,
    opacity: 1,
    transition: { ...spring.smooth, delay: 0.15 + i * 0.05 },
  },
});

/** Linha SVG desenha-se (usar em <motion.path pathLength>) */
export const drawPath: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { duration: 1.1, ease: ease.emphasized }, opacity: { duration: 0.2 } },
  },
};

/* --------------------------- Transição de página --------------------------- */
export const page: Variants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: duration.slower, ease: ease.emphasized, staggerChildren: 0.06 },
  },
  exit: { opacity: 0, y: -6, filter: 'blur(4px)', transition: { duration: duration.fast, ease: ease.exit } },
};

/* ------------------------------ Tilt 3D ------------------------------ */
/**
 * Calcula rotação para cartões 3D a partir da posição do rato.
 * Máx. 10° — acima disso enjoa e perde legibilidade.
 */
export function tiltFromPointer(e: { clientX: number; clientY: number }, el: HTMLElement, max = 10) {
  const r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width; // 0..1
  const py = (e.clientY - r.top) / r.height;
  return {
    rotateY: (px - 0.5) * 2 * max,
    rotateX: (0.5 - py) * 2 * max,
    mx: `${px * 100}%`,
    my: `${py * 100}%`,
  };
}
