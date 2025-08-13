import { useEffect, useState } from "react";
import { useDebouncedCallback } from "./hooks/useDebouncedCallback";
import type { PanoramaProps } from "./types";
import { PanoramaFrame } from "./PanoramaFrame";

export default function Panorama({ children, ...props }: PanoramaProps) {
  const [basepathA, setBasepathA] = useState<string | null>(props.basepath);
  const [basepathB, setBasepathB] = useState<string | null>(null);
  const [activeFrame, setActiveFrame] = useState<'A' | 'B'>('A');

  const debouncedOnPositionChange = useDebouncedCallback(
    props.onPositionChange,
    150,
  );

  useEffect(() => {
    const activeBasepath = activeFrame === 'A' ? basepathA : basepathB;
    if (props.basepath === activeBasepath) return;
    const inactiveBasepath = activeFrame === 'A' ? basepathB : basepathA;
    if (props.basepath === inactiveBasepath) return;
    if (activeFrame === 'A') setBasepathB(props.basepath); else setBasepathA(props.basepath);
  }, [props.basepath, activeFrame, basepathA, basepathB]);

  const handleImagesReady = (id: 'A' | 'B', frameBasepath: string) => {
    if (frameBasepath !== props.basepath) return; // outdated
    if (activeFrame === id) return;
    setActiveFrame(id);
    setTimeout(() => {
      if (id === 'A') {
        if (basepathB && basepathB !== props.basepath) setBasepathB(null);
      } else {
        if (basepathA && basepathA !== props.basepath) setBasepathA(null);
      }
    }, 250);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <PanoramaFrame
        id="A"
        basepath={basepathA}
        active={activeFrame === 'A'}
        panoramaProps={props}
        desiredBasepath={props.basepath}
        debouncedOnPositionChange={debouncedOnPositionChange as any}
        onImagesReady={handleImagesReady}
      >
        {children}
      </PanoramaFrame>
      <PanoramaFrame
        id="B"
        basepath={basepathB}
        active={activeFrame === 'B'}
        panoramaProps={props}
        desiredBasepath={props.basepath}
        debouncedOnPositionChange={debouncedOnPositionChange as any}
        onImagesReady={handleImagesReady}
      >
        {children}
      </PanoramaFrame>
    </div>
  );
}
