'use client';

import {useEffect, useRef, useState} from 'react';
import {Menu, X, ArrowUpRight} from 'lucide-react';
import s from '@/app/landing.module.css';

export default function LandingMobileMenu({locale}: {locale: 'ro' | 'en'}) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const ro = locale === 'ro';
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  const links = [
    ['#registry', ro ? 'Document ONRC' : 'ONRC record'],
    ['#approach', ro ? 'Abordarea noastră' : 'Our approach'],
    ['#representative', ro ? 'Reprezentant' : 'Representative'],
    ['#credentials', ro ? 'Studii și documente' : 'Credentials'],
    ['#contact', ro ? 'Contact' : 'Contact'],
    ['/dashboard', ro ? 'Platforma de cercetare' : 'Research platform'],
  ];
  return <div className={s.mobileMenu}>
    <button ref={toggle} type="button" aria-label={open ? (ro ? 'Închide meniul' : 'Close menu') : (ro ? 'Deschide meniul' : 'Open menu')} aria-expanded={open} aria-controls="landing-mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X size={21}/> : <Menu size={21}/>}</button>
    {open && <nav id="landing-mobile-navigation" aria-label={ro ? 'Navigare mobilă' : 'Mobile navigation'}>{links.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={17}/></a>)}</nav>}
  </div>;
}
