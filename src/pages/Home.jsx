import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, BookOpenCheck, History, Sparkles, Target } from 'lucide-react';
import { BANCAS } from '@/data/bancas';
import { Button } from '@/components/ui/button';
import IArgumentoLogo from '@/components/brand/IArgumentoLogo';
import AccountNav from '@/components/account/AccountNav';
import { Image } from '@/components/ui/image';

const PLACEHOLDER_LOGO = 'https://media.base44.com/images/public/6a6602cb58785bab45511cab/56e253dba_ICON_logo.png';
const FUVEST_LOGO = 'https://media.base44.com/images/public/6a6602cb58785bab45511cab/b17222b33_img-logo-fuvest-1.png';

const benefits = [
{ icon: BookOpenCheck, title: 'Critérios de verdade', text: 'Correções orientadas pelas exigências de cada vestibular.' },
{ icon: Target, title: 'Foco no que importa', text: 'Encontre os próximos passos para escrever com mais repertório e precisão.' },
{ icon: BarChart3, title: 'Evolução visível', text: 'Acompanhe suas notas e transforme prática em resultado.' }];


export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
        <IArgumentoLogo />
        <nav className="flex items-center gap-1" aria-label="Navegação principal">
          <Link to="/historico" className="kinetic-link"><History className="h-4 w-4" />Meu progresso</Link>
          <AccountNav />
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-10 md:grid-cols-[1.15fr_.85fr] md:items-center md:px-10 md:pb-28 md:pt-16">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-accent-foreground">
            <Sparkles className="h-4 w-4" /> Preparação com método
          </div>
          <h1 className="max-w-3xl font-display font-extrabold leading-[1.03] tracking-[-0.055em] text-gray-950 text-left text-7xl md:text-7xl">
            Sua redação com <span className="text-[#E9861A]">argumento</span> para chegar mais longe.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/70 md:text-xl">
            O IArgumento acompanha sua prática, corrige cada texto pelos critérios da banca e mostra como transformar treino em aprovação.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="#bancas" className="bg-[#e9861a]">Começar uma correção</Link></Button>
            <Button asChild variant="outline" size="lg"><Link to="/historico">Ver meu progresso</Link></Button>
          </div>
        </div>
        <div className="relative rounded-[2.25rem] p-6 shadow-2xl md:p-8 text-gray-50 bg-[#433c3f]">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#e9861a]" />
          <div className="relative rounded-3xl bg-card p-6 text-card-foreground">
            <div className="flex items-center justify-between"><span className="font-display text-sm font-extrabold">Diagnóstico de escrita</span><span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">ENEM</span></div>
            <p className="mt-7 font-display text-5xl font-extrabold tracking-tight">860<span className="text-lg text-muted-foreground">/1000</span></p>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full w-[86%] rounded-full bg-[#e9861a]" /></div>
            <p className="mt-3 text-sm text-muted-foreground">+120 pontos desde sua primeira redação</p>
          </div>
          <div className="relative mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/15 p-4"><p className="text-2xl font-extrabold">5</p><p className="mt-1 text-xs text-white/65">bancas disponíveis</p></div>
            <div className="rounded-2xl border border-white/15 p-4"><p className="text-2xl font-extrabold">1:1</p><p className="mt-1 text-xs text-white/65">feedback no texto</p></div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-primary">Feito para quem quer aprovação</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-3xl bg-background p-6"><Icon className="h-8 w-8 text-primary" /><h2 className="mt-5 font-display text-xl font-extrabold">{title}</h2><p className="mt-2 leading-relaxed text-muted-foreground">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="bancas" className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28">
        <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Escolha sua prova</p><h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">Cada banca pede uma estratégia.</h2><p className="mt-4 text-lg text-muted-foreground">Selecione a sua e comece uma correção alinhada ao que o vestibular realmente avalia.</p></div>
        <div className="mt-10 banca-grid">
          <Link to="/correcao?banca=ENEM" className="banca-card group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl">
                <Image src="https://media.base44.com/images/public/6a6602cb58785bab45511cab/7ab13ef60_Enem_logo.png" alt="Logo ENEM" fittingType="fit" className="h-11 w-11" />
              </div>
              <div className="banca-grade"><Sparkles className="h-3 w-3" />Nota máx: {BANCAS[0].max_grade}</div>
            </div>
            <div className="mt-5"><h3 className="font-display text-2xl font-extrabold tracking-tight">{BANCAS[0].name}</h3><p className="mt-2 max-w-sm text-sm leading-snug text-card-foreground/75">{BANCAS[0].description}</p></div>
            <div className="mt-5 flex items-end justify-between gap-4"><span className="text-xs text-card-foreground/70">{BANCAS[0].theme}</span><ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" /></div>
          </Link>
          <Link to="/correcao?banca=FUVEST" className="banca-card group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl">
                <Image src={FUVEST_LOGO} alt="Logo FUVEST" fittingType="fit" className="h-11 w-11" />
              </div>
              <div className="banca-grade"><Sparkles className="h-3 w-3" />Nota máx: {BANCAS[1].max_grade}</div>
            </div>
            <div className="mt-5"><h3 className="font-display text-2xl font-extrabold tracking-tight">{BANCAS[1].name}</h3><p className="mt-2 max-w-sm text-sm leading-snug text-card-foreground/75">{BANCAS[1].description}</p></div>
            <div className="mt-5 flex items-end justify-between gap-4"><span className="text-xs text-card-foreground/70">{BANCAS[1].theme}</span><ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" /></div>
          </Link>
          <Link to="/correcao?banca=UNIFESP" className="banca-card group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl">
                <Image src="https://media.base44.com/images/public/6a6602cb58785bab45511cab/3ecd73927_images.jpeg" alt="Logo UNIFESP" fittingType="fit" className="h-11 w-11" />
              </div>
              <div className="banca-grade"><Sparkles className="h-3 w-3" />Nota máx: {BANCAS[3].max_grade}</div>
            </div>
            <div className="mt-5"><h3 className="font-display text-2xl font-extrabold tracking-tight">{BANCAS[3].name}</h3><p className="mt-2 max-w-sm text-sm leading-snug text-card-foreground/75">{BANCAS[3].description}</p></div>
            <div className="mt-5 flex items-end justify-between gap-4"><span className="text-xs text-card-foreground/70">{BANCAS[3].theme}</span><ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" /></div>
          </Link>
          <Link to="/correcao?banca=UNICAMP" className="banca-card group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl">
                <Image src="https://media.base44.com/images/public/6a6602cb58785bab45511cab/31356a673_png-clipart-university-of-campinas-school-of-mechanical-engineering-unicamp-camp-quatre-saisons-vestibular-exam-kosrae-liberation-day-logo-university.png" alt="Logo UNICAMP" fittingType="fit" className="h-11 w-11" />
              </div>
              <div className="banca-grade"><Sparkles className="h-3 w-3" />Nota máx: {BANCAS[2].max_grade}</div>
            </div>
            <div className="mt-5"><h3 className="font-display text-2xl font-extrabold tracking-tight">{BANCAS[2].name}</h3><p className="mt-2 max-w-sm text-sm leading-snug text-card-foreground/75">{BANCAS[2].description}</p></div>
            <div className="mt-5 flex items-end justify-between gap-4"><span className="text-xs text-card-foreground/70">{BANCAS[2].theme}</span><ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" /></div>
          </Link>
          <Link to="/correcao?banca=UERJ" className="banca-card group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl">
                <Image src="https://media.base44.com/images/public/6a6602cb58785bab45511cab/63b1851f2_Logo-Uerj.png" alt="Logo UERJ" fittingType="fit" className="h-11 w-11" />
              </div>
              <div className="banca-grade"><Sparkles className="h-3 w-3" />Nota máx: {BANCAS[4].max_grade}</div>
            </div>
            <div className="mt-5"><h3 className="font-display text-2xl font-extrabold tracking-tight">{BANCAS[4].name}</h3><p className="mt-2 max-w-sm text-sm leading-snug text-card-foreground/75">{BANCAS[4].description}</p></div>
            <div className="mt-5 flex items-end justify-between gap-4"><span className="text-xs text-card-foreground/70">{BANCAS[4].theme}</span><ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" /></div>
          </Link>
        </div>
      </section>
    </main>);

}