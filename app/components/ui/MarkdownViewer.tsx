'use client';

import MarkdownPreview from '@uiw/react-markdown-preview';
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
        <MarkdownPreview 
            style={{
                backgroundColor: 'transparent',
                color: 'white',
                fontSize: '16px',
                lineHeight: '1.5',
            }}
            source={content}
                rehypePlugins={[rehypeKatex, rehypeSanitize, [rehypeExternalLinks,
                    { content: { type: 'text', value: '🔗' } }
                ],]}
                remarkPlugins={[remarkGfm, remarkMath]}
                // rehypeRewrite={(node, index, parent) => {
                //     if (node.tagName === "a" && parent && /^h(1|2|3|4|5|6)/.test(parent.tagName)) {
                //       parent.children = parent.children.slice(1)
                //     }
                //   }}
            />
    );
} 