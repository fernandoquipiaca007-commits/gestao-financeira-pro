import React, { useEffect, useState } from 'react';

/** Navegação por secções das Definições (modelo D). Realça a secção visível; escondida abaixo de 1024px. */
export function SettingsNav({ canEdit, isOwner, lang }: { canEdit: boolean; isOwner: boolean; lang: string }) {
  const en = lang === 'en';
  const sections = [
    { id: 'idioma', label: en ? 'Language' : 'Idioma' },
    { id: 'perfil', label: en ? 'Profile' : 'Perfil' },
    { id: 'aparencia', label: en ? 'Appearance' : 'Aparência' },
    { id: 'seguranca', label: en ? 'Security' : 'Segurança' },
    ...(canEdit ? [
      { id: 'empresa', label: en ? 'Company & currencies' : 'Empresa e moedas' },
      { id: 'email', label: 'Email' },
    ] : []),
    ...(isOwner ? [{ id: 'dados', label: en ? 'Data & backup' : 'Dados e cópias' }] : []),
  ];
  const [active, setActive] = useState(sections[0].id);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const v = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (v) setActive(v.target.id);
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, isOwner]);

  return (
    <nav className="hidden lg:grid aura-sectionnav !top-4 h-max" aria-label={en ? 'Settings sections' : 'Secções das definições'}>
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-current={active === s.id ? 'location' : undefined}
          className="aura-sectionnav__item"
          onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}
