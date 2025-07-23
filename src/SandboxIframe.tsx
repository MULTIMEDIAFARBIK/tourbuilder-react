// In packages/tourbuilder-react/src/SandboxIframe.tsx
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface SandboxIframeProps {
  children: React.ReactNode;
  title?: string;
}

export function SandboxIframe({ children, title }: SandboxIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Wait for the iframe to load before trying to access its document
    const handleLoad = () => {
      if (iframe.contentWindow) {
        const doc = iframe.contentWindow.document;
        // Basic styles to make the tour fill the iframe
        doc.body.style.margin = '0';
        doc.documentElement.style.height = '100%';
        doc.body.style.height = '100%';
        
        // This is where our React component will be rendered
        setMountNode(doc.body);
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      title={title || 'Sandboxed Content'}
      style={{ border: 'none', width: '100%', height: '100%' }}
      // Use srcDoc to ensure a clean, empty document on initial load
      srcDoc="<!DOCTYPE html><html><head></head><body></body></html>"
    >
      {/* Once the iframe body is ready (mountNode is set),
        we use a portal to render our children into it.
      */}
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
}