import { MutableRefObject, useCallback, useEffect } from "react";
import type { PanoramaProps, PanoPosition } from "../types";

/**
 * Handles pushing controlled prop changes (node, fov, pan, tilt, singleImage, transition)
 * into the underlying tour instance living inside the iframe.
 */
export function usePanoramaControls(
  iframeRef: MutableRefObject<HTMLIFrameElement | null>,
  props: PanoramaProps,
) {
  const updatePosition = useCallback(
    (key: keyof PanoPosition, value: number) => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;
      const tourbuilder = (iframe.contentWindow as any).tour;
      if (!tourbuilder || !tourbuilder.pano) return;
      switch (key) {
        case "node":
          tourbuilder.pano.openNext(`{node${value}}`);
          break;
        case "fov":
          tourbuilder.pano.setFov(value);
          break;
        case "pan":
          tourbuilder.pano.setPan(value);
          break;
        case "tilt":
          tourbuilder.pano.setTilt(value);
          break;
      }
    },
    [iframeRef],
  );

  // Individual effects for each controlled value (allow 0 values)
  useEffect(() => {
    if (props.node == null) return;
    updatePosition("node", props.node);
  }, [props.node, updatePosition]);

  useEffect(() => {
    if (props.fov == null) return;
    updatePosition("fov", props.fov);
  }, [props.fov, updatePosition]);

  useEffect(() => {
    if (props.pan == null) return;
    updatePosition("pan", props.pan);
  }, [props.pan, updatePosition]);

  useEffect(() => {
    if (props.tilt == null) return;
    updatePosition("tilt", props.tilt);
  }, [props.tilt, updatePosition]);

  // Single image toggle
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    (iframe.contentWindow as any).tour?.setActiveSingleImage(!!props.singleImage);
  }, [props.singleImage, iframeRef]);

  // Transition updates
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    (iframe.contentWindow as any).tour?.pano?.setTransition(props.transition);
  }, [props.transition, iframeRef]);

  return { updatePosition };
}
