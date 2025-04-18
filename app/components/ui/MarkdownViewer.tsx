'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize'
import rehypeExternalLinks from 'rehype-external-links'
import 'katex/dist/katex.min.css';

type MarkdownViewerProps = {
    content: string;
    className?: string;
};

export default function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
    return (
        <div className={`prose prose-invert max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeSanitize, [rehypeExternalLinks,
                    { content: { type: 'text', value: '🔗' } }
                ],]}
                components={{
                    code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                            <SyntaxHighlighter
                                style={vscDarkPlus as any}
                                language={match[1]}
                                PreTag="div"
                                // {...props}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    },
                    img({ node, ...props }) {
                        return (
                            <img
                                {...props}
                                className="rounded-lg max-w-full h-auto"
                                loading="lazy"
                                alt={props.alt || ''}
                            />
                        );
                    },
                    a({ node, ...props }) {
                        return (
                            <a
                                {...props}
                                className="text-blue-400 hover:text-blue-300 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                            />
                        );
                    },
                    blockquote({ node, ...props }) {
                        return (
                            <blockquote
                                {...props}
                                className="border-l-4 border-gray-600 pl-4 italic text-gray-300"
                            />
                        );
                    },
                    table({ node, ...props }) {
                        return (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700" {...props} />
                            </div>
                        );
                    },
                    th({ node, ...props }) {
                        return <th className="px-4 py-2 bg-gray-800" {...props} />;
                    },
                    td({ node, ...props }) {
                        return <td className="px-4 py-2 border-t border-gray-700" {...props} />;
                    },
                    pre({ node, ...props }) {
                        return <pre className="not-prose" {...props} />;
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
} 