import type { ReactNode } from "react";
import Footer from "./Footer";
import Logo from "./Logo";

interface StaticPageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function StaticPageLayout({ title, subtitle, children }: StaticPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <header className="border-b border-slate-200 bg-[#F7F8FA]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-[#0B0F1A]">{title}</h1>
        {subtitle && <p className="mt-2 font-mono text-xs text-slate-400">{subtitle}</p>}
        <div className="mt-8 space-y-8">{children}</div>
      </main>

      <Footer />
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-lg font-semibold text-[#0B0F1A]">{heading}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}
