export function LogoCloud() {
  return (
    <section className="py-12 bg-surface border-y border-border-subtle">
      <div className="mx-auto max-w-[1200px] px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[2px] text-text-tertiary mb-8">
          已接入智能体生态
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
          <LogoItem>OpenAI</LogoItem>
          <LogoItem>Anthropic</LogoItem>
          <LogoItem>Google AI</LogoItem>
          <LogoItem>Meta</LogoItem>
          <LogoItem>Qdrant</LogoItem>
          <LogoItem>HuggingFace</LogoItem>
        </div>
      </div>
    </section>
  );
}

function LogoItem({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-sm font-bold text-text-tertiary tracking-wider">
      {children}
    </span>
  );
}