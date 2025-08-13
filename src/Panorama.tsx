import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDebouncedCallback } from "./hooks/useDebouncedCallback";
import { usePanoramaIframe } from "./hooks/usePanoramaIframe";
import type { PanoramaProps } from "./types";
import { usePanoramaControls } from "./hooks/usePanoramaControls";

export default function Panorama({ children, ...props }: PanoramaProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  const debouncedOnPositionChange = useDebouncedCallback(
    props.onPositionChange,
    150,
  );

  const iframeUrl = usePanoramaIframe(props);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      if (iframe.contentWindow) {
        // Find the placeholder div inside the iframe to mount the children
        const doc = iframe.contentWindow.document;
        setMountNode(doc.getElementById('children-container'));
        // Pass the debounced callback to the iframe
        (iframe.contentWindow as any).reportPosition = debouncedOnPositionChange;
      }
    };

    iframe.addEventListener('load', handleLoad);
  return () => iframe.removeEventListener('load', handleLoad);
  }, [iframeUrl, debouncedOnPositionChange]);

  // Keep the callback in sync even if onPositionChange changes after the iframe finished loading
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    (iframe.contentWindow as any).reportPosition = debouncedOnPositionChange;
    // Flush any cached last position if it exists (set before reportPosition became available)
    const last = (iframe.contentWindow as any).__lastPanoPosition;
    if (last) {
      debouncedOnPositionChange(last);
      (iframe.contentWindow as any).__lastPanoPosition = undefined;
    }
  }, [debouncedOnPositionChange]);

  // Controlled props -> iframe pano instance
  usePanoramaControls(iframeRef, props);

  return (
    <iframe
      ref={iframeRef}
      key={props.basepath}
      title="Panorama Viewer"
      style={{ border: "none", width: "100%", height: "100%" }}
      src={iframeUrl}
    >
      {mountNode && children && createPortal(children, mountNode)}
    </iframe>
  );
}
