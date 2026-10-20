import { useCallback, useRef } from 'react';

/**
 * Esconde a barra superior ao descer e mostra-a ao subir.
 * Liga-se ao onScroll do contentor que faz scroll (o <main> da app) e mexe
 * diretamente no estilo do invólucro da barra — sem re-renderizar o App.
 *
 * Anti-oscilação: recolher/mostrar a barra muda a altura do <main>, e o browser
 * pode reajustar o scrollTop (sobretudo perto do fim ou em páginas pouco mais
 * altas que o ecrã, como o Kanban de Tarefas). Esses eventos não são do
 * utilizador, por isso: (1) só recolhe quando a posição atual continua válida
 * com a barra escondida; (2) ignora o scroll durante a transição.
 */
export function useHideOnScroll({ threshold = 10, revealTop = 72, settleMs = 400 } = {}) {
  const slotRef = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);
  const hidden = useRef(false);
  const lockUntil = useRef(0);

  const apply = useCallback((hide: boolean) => {
    const el = slotRef.current;
    if (!el || hidden.current === hide) return;
    hidden.current = hide;
    lockUntil.current = performance.now() + settleMs;
    el.style.gridTemplateRows = hide ? '0fr' : '1fr';
    el.style.opacity = hide ? '0' : '1';
    el.style.pointerEvents = hide ? 'none' : '';
    const inner = el.firstElementChild as HTMLElement | null;
    if (inner) inner.style.overflow = hide ? 'hidden' : '';
  }, [settleMs]);

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const target = e.currentTarget;
      const y = target.scrollTop;
      // Durante a transição, só acompanha a posição (sem decidir nada)
      if (performance.now() < lockUntil.current) {
        lastY.current = y;
        return;
      }
      const delta = y - lastY.current;
      if (Math.abs(delta) < threshold) return;
      lastY.current = y;
      const room = target.scrollHeight - target.clientHeight;
      // "Subida" que acaba exatamente no fundo = o browser a encaixar o scroll no novo máximo
      // (a barra acabou de recolher), não o utilizador. Subir de verdade afasta-se do fundo.
      if (delta < 0 && y >= room - 1) return;

      if (delta > 0) {
        const barHeight = slotRef.current?.offsetHeight ?? 0;
        // Recolher dá +barHeight de altura ao <main> e encolhe o scroll máximo na mesma medida.
        // Se a posição atual ficar acima desse novo máximo, o browser puxa o scroll para trás
        // (parece "subir") e a barra voltaria — o ciclo que fazia o Kanban tremer.
        if (y > revealTop && y + barHeight + threshold < room) apply(true);
      } else {
        apply(false);
      }
    },
    [threshold, revealTop, apply],
  );

  const reveal = useCallback(() => {
    lastY.current = 0;
    apply(false);
  }, [apply]);

  return { slotRef, onScroll, reveal };
}
