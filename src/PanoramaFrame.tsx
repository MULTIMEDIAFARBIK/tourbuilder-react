import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePanoramaIframe } from "./hooks/usePanoramaIframe";
import { usePanoramaControls } from "./hooks/usePanoramaControls";
import type { PanoramaProps, PanoPosition } from "./types";

interface PanoramaFrameProps {
  id: 'A' | 'B';
  basepath: string | null;
  active: boolean;
  panoramaProps: PanoramaProps; // original incoming props
  desiredBasepath: string; // target basepath from parent
  debouncedOnPositionChange: (p: PanoPosition) => void;
  onImagesReady: (id: 'A' | 'B', basepath: string) => void;
  children?: React.ReactNode;
  fadeDurationMs?: number;
}

export function PanoramaFrame({
  id,
  basepath,
  active,
  panoramaProps,
  desiredBasepath,
  debouncedOnPositionChange,
  onImagesReady,
  children,
  fadeDurationMs = 200,
}: PanoramaFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  const iframeUrl = usePanoramaIframe(basepath ? { ...panoramaProps, basepath } : null);

  // Apply controls for active frame or preloading frame (so it starts with correct view).
  const applyControls = !!basepath && (active || basepath === desiredBasepath);
  usePanoramaControls(iframeRef, basepath ? { ...panoramaProps, basepath } : null, applyControls);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const handleLoad = () => {
      if (!iframe.contentWindow) return;
      const doc = iframe.contentWindow.document;
      setMountNode(doc.getElementById('children-container'));
      (iframe.contentWindow as any).reportPosition = debouncedOnPositionChange;
      (iframe.contentWindow as any).__imagesReady = () => {
        if (!basepath) return;
        onImagesReady(id, basepath);
      };
      const last = (iframe.contentWindow as any).__lastPanoPosition;
      if (last) {
        debouncedOnPositionChange(last);
        (iframe.contentWindow as any).__lastPanoPosition = undefined;
      }
    };
    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [iframeUrl, debouncedOnPositionChange, id, basepath, onImagesReady]);

  if (!basepath) return null;

  return (
    <iframe
      ref={iframeRef}
      title={`Panorama Frame ${id}`}
      style={{
        border: 'none', width: '100%', height: '100%', position: 'absolute', inset: 0,
        zIndex: active ? 2 : 1,
        opacity: active ? 1 : 0,
        transition: `opacity ${fadeDurationMs}ms ease`,
      }}
      src={iframeUrl || undefined}
    >
      {active && mountNode && children && createPortal(children, mountNode)}
    </iframe>
  );
}
