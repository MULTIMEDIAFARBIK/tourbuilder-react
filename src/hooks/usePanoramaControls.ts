import { MutableRefObject, useCallback, useEffect } from "react";
import type { PanoramaProps, PanoPosition } from "../types";

/**
 * Handles pushing controlled prop changes (node, fov, pan, tilt, singleImage, transition)
 * into the underlying tour instance living inside the iframe.
 */
export function usePanoramaControls(
  iframeRef: MutableRefObject<HTMLIFrameElement | null>,
  props: PanoramaProps | null,
  enabled: boolean = true,
) {
  const updatePosition = useCallback(
    (key: keyof PanoPosition, value: number) => {
      if (!enabled || !props) return;
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
    if (!enabled || !props || props.node == null) return;
    updatePosition("node", props.node);
  }, [props?.node, enabled, updatePosition]);

  useEffect(() => {
    if (!enabled || !props || props.fov == null) return;
    updatePosition("fov", props.fov);
  }, [props?.fov, enabled, updatePosition]);

  useEffect(() => {
    if (!enabled || !props || props.pan == null) return;
    updatePosition("pan", props.pan);
  }, [props?.pan, enabled, updatePosition]);

  useEffect(() => {
    if (!enabled || !props || props.tilt == null) return;
    updatePosition("tilt", props.tilt);
  }, [props?.tilt, enabled, updatePosition]);

  // Single image toggle
  useEffect(() => {
    if (!enabled || !props) return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    (iframe.contentWindow as any).tour?.setActiveSingleImage(!!props.singleImage);
  }, [props?.singleImage, iframeRef, enabled]);

  // Transition updates
  useEffect(() => {
    if (!enabled || !props) return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    (iframe.contentWindow as any).tour?.pano?.setTransition(props.transition);
  }, [props?.transition, iframeRef, enabled]);

  return { updatePosition: enabled ? updatePosition : () => {} };
}
