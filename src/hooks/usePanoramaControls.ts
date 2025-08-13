import { MutableRefObject, useCallback, useEffect, useRef } from "react";
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
  // Keep a retry queue for position updates issued before pano is ready.
  const retryQueueRef = useRef<Array<{ key: keyof PanoPosition; value: number }>>([]);
  const retryTimerRef = useRef<number | null>(null);
  const nodeChangeInFlightRef = useRef(false);
  const pendingOrientationRef = useRef<Partial<Record<'fov' | 'pan' | 'tilt', number>>>({});
  const nodeChangeTimeoutRef = useRef<number | null>(null);

  const flushQueue = useCallback(() => {
    if (!enabled || !props) return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    const tourbuilder = (iframe.contentWindow as any).tour;
    const pano = tourbuilder?.pano;
    if (!pano) return;
    const queue = retryQueueRef.current;
    if (!queue.length) return;
    const latest: Record<string, number> = {};
    queue.forEach(item => { latest[item.key] = item.value; });
    retryQueueRef.current = [];
    (Object.keys(latest) as Array<keyof PanoPosition>).forEach(k => {
      switch (k) {
        case 'node':
          pano.openNext(`{node${latest[k]}}`);
          break;
        case 'fov':
          if (Math.abs(pano.getFov() - latest[k]) > 0.0001) pano.setFov(latest[k]);
          break;
        case 'pan':
          if (Math.abs(pano.getPan() - latest[k]) > 0.0001) pano.setPan(latest[k]);
          break;
        case 'tilt':
          if (Math.abs(pano.getTilt() - latest[k]) > 0.0001) pano.setTilt(latest[k]);
          break;
      }
    });
  }, [enabled, iframeRef, props]);

  const scheduleRetry = useCallback(() => {
    if (retryTimerRef.current != null) return; // already scheduled
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null;
      flushQueue();
      if (retryQueueRef.current.length) scheduleRetry();
    }, 60);
  }, [flushQueue]);

  const lastAppliedRef = useRef<Partial<Record<keyof PanoPosition, number>>>({});
  const updatePosition = useCallback((key: keyof PanoPosition, value: number) => {
    if (!enabled || !props) return;
    // Skip if same value already applied (prevents loops)
    if (lastAppliedRef.current[key] === value) return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    const tourbuilder = (iframe.contentWindow as any).tour;
    const pano = tourbuilder?.pano;
    if (!tourbuilder || !pano) {
      const existingIndex = retryQueueRef.current.findIndex(q => q.key === key);
      if (existingIndex >= 0) retryQueueRef.current.splice(existingIndex, 1);
      retryQueueRef.current.push({ key, value });
      scheduleRetry();
      return;
    }
    switch (key) {
      case 'node': {
        const currentRaw = pano.getCurrentNode?.();
        const currentNodeNum = currentRaw ? parseInt(String(currentRaw).replace('node', '')) : undefined;
        if (currentNodeNum === value) break;
        nodeChangeInFlightRef.current = true;
        const handleNodeChanged = () => {
          nodeChangeInFlightRef.current = false;
          pano.removeListener?.('changenode', handleNodeChanged as any);
          if (nodeChangeTimeoutRef.current) { clearTimeout(nodeChangeTimeoutRef.current); nodeChangeTimeoutRef.current = null; }
          // Flush any pending orientation values after node change
          if (pendingOrientationRef.current.fov != null) pano.setFov(pendingOrientationRef.current.fov);
          if (pendingOrientationRef.current.pan != null) pano.setPan(pendingOrientationRef.current.pan);
          if (pendingOrientationRef.current.tilt != null) pano.setTilt(pendingOrientationRef.current.tilt);
          pendingOrientationRef.current = {};
        };
        pano.addListener?.('changenode', handleNodeChanged as any);
        nodeChangeTimeoutRef.current = window.setTimeout(handleNodeChanged, 1500);
        pano.openNext(`{node${value}}`);
        break; }
      case 'fov':
        if (nodeChangeInFlightRef.current) pendingOrientationRef.current.fov = value; else if (Math.abs(pano.getFov() - value) > 0.0001) pano.setFov(value);
        break;
      case 'pan':
        if (nodeChangeInFlightRef.current) pendingOrientationRef.current.pan = value; else if (Math.abs(pano.getPan() - value) > 0.0001) pano.setPan(value);
        break;
      case 'tilt':
        if (nodeChangeInFlightRef.current) pendingOrientationRef.current.tilt = value; else if (Math.abs(pano.getTilt() - value) > 0.0001) pano.setTilt(value);
        break;
    }
    lastAppliedRef.current[key] = value;
  }, [enabled, iframeRef, scheduleRetry, props]);

  // Individual effects for each controlled value (allow 0 values)
  useEffect(() => {
    if (!enabled || !props || props.node == null) return;
    updatePosition("node", props.node);
  }, [props?.node, enabled]);

  useEffect(() => {
    if (!enabled || !props || props.fov == null) return;
    updatePosition("fov", props.fov);
  }, [props?.fov, enabled]);

  useEffect(() => {
    if (!enabled || !props || props.pan == null) return;
    updatePosition("pan", props.pan);
  }, [props?.pan, enabled]);

  useEffect(() => {
    if (!enabled || !props || props.tilt == null) return;
    updatePosition("tilt", props.tilt);
  }, [props?.tilt, enabled]);

  // Single image toggle
  useEffect(() => {
    if (!enabled || !props) return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    if((iframe.contentWindow as any).tour?.pano) {
      (iframe.contentWindow as any).tour?.setActiveSingleImage(!!props.singleImage);
    }
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
