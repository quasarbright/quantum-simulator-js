import { useEffect, useState } from 'react';
import '../styles/AboutModal.css';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load markdown content
    fetch(new URL('../data/about.md', import.meta.url).href)
      .then(res => res.text())
      .then(text => {
        setContent(text);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load about content:', err);
        setContent('Failed to load content.');
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!isOpen || isLoading) return;

    // Trigger MathJax rendering after content is loaded and modal is open
    const timer = setTimeout(() => {
      if ((window as any).MathJax) {
        (window as any).MathJax.typesetPromise?.()
          .catch((err: any) => console.error('MathJax rendering error:', err));
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, content, isLoading]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Simple markdown renderer
  const renderMarkdown = (md: string): string => {
    const lines = md.split('\n');
    const result: string[] = [];
    let inList = false;
    let currentParagraph: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        let text = currentParagraph.join(' ');
        // Apply inline formatting
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        result.push(`<p>${text}</p>`);
        currentParagraph = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty line
      if (trimmed === '') {
        flushParagraph();
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        continue;
      }

      // Headers
      if (trimmed.startsWith('### ')) {
        flushParagraph();
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        result.push(`<h3>${trimmed.substring(4)}</h3>`);
        continue;
      }
      if (trimmed.startsWith('## ')) {
        flushParagraph();
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        result.push(`<h2>${trimmed.substring(3)}</h2>`);
        continue;
      }
      if (trimmed.startsWith('# ')) {
        flushParagraph();
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        result.push(`<h1>${trimmed.substring(2)}</h1>`);
        continue;
      }

      // List items
      if (trimmed.startsWith('- ')) {
        flushParagraph();
        if (!inList) {
          result.push('<ul>');
          inList = true;
        }
        let text = trimmed.substring(2);
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        result.push(`<li>${text}</li>`);
        continue;
      }

      // Regular paragraph text
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      currentParagraph.push(trimmed);
    }

    // Flush any remaining content
    flushParagraph();
    if (inList) {
      result.push('</ul>');
    }

    return result.join('\n');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid #404040',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#e5e5e5', fontSize: '24px' }}>About</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#e5e5e5',
              fontSize: '32px',
              cursor: 'pointer',
              padding: '0',
              lineHeight: '1',
            }}
          >
            ×
          </button>
        </div>
        <div>
          {isLoading ? (
            <p style={{ color: '#a3a3a3' }}>Loading...</p>
          ) : (
            <div 
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
