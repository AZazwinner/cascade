import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  p: ({ children }) => <p className="leading-relaxed my-2 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="underline decoration-[var(--accent)] underline-offset-2">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  hr: () => <hr className="border-none border-t border-[var(--border)] my-4" />,
  h1: ({ children }) => (
    <h4 className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)] mt-4 mb-1">{children}</h4>
  ),
  h2: ({ children }) => (
    <h4 className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)] mt-4 mb-1">{children}</h4>
  ),
  h3: ({ children }) => (
    <h4 className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)] mt-4 mb-1">{children}</h4>
  ),
  h4: ({ children }) => (
    <h4 className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)] mt-4 mb-1">{children}</h4>
  ),
  pre: ({ children }) => (
    <pre className="border border-[var(--border)] bg-[var(--background-raised)] p-3 overflow-x-auto text-xs font-mono my-3 leading-relaxed">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) return <code className="font-mono">{children}</code>;
    return <code className="font-mono text-[13px] bg-[var(--background-raised)] px-1 py-0.5">{children}</code>;
  },
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  th: ({ children }) => (
    <th className="text-left font-mono uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border-strong)] py-1.5 pr-3">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-b border-[var(--border)] py-1.5 pr-3 align-top">{children}</td>,
};

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}
