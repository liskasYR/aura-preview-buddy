import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from './ui/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent = ({ content }: MarkdownContentProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, language: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('הקוד הועתק ללוח!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');
          
          return !inline && match ? (
            <div className="relative my-4 rounded-xl overflow-hidden border border-primary/30 bg-card/20 shadow-glow">
              <div className="flex items-center justify-between px-4 py-2 bg-card/60 border-b border-primary/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-primary font-semibold">{match[1].toUpperCase()}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">code-snippet.{match[1]}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(codeString, match[1])}
                  className="h-7 px-2 hover:bg-primary/20 transition-smooth"
                >
                  {copiedCode === codeString ? (
                    <>
                      <Check className="h-3 w-3 mr-1 text-green-500" />
                      <span className="text-xs">הועתק!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      <span className="text-xs">העתק</span>
                    </>
                  )}
                </Button>
              </div>
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  background: 'transparent',
                }}
                {...props}
              >
                {codeString}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-sm" {...props}>
              {children}
            </code>
          );
        },
        h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mt-3 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mt-2 mb-1">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
        p: ({ children }) => <p className="my-2">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
        a: ({ children, href }) => <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
