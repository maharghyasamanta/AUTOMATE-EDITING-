import { useCallback, useEffect, useRef } from "react";

interface UseDebouncedAutoSaveOptions<T> {
  value: T;
  resetKey: string;
  serialize: (val: T) => string;
  onSave: (val: T) => void;
  delayMs: number;
  enabled?: boolean;
}

export function useDebouncedAutoSave<T>({
  value,
  resetKey,
  serialize,
  onSave,
  delayMs,
  enabled = true,
}: UseDebouncedAutoSaveOptions<T>) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committedSignatureRef = useRef<string>(serialize(value));
  const latestValueRef = useRef<T>(value);
  const latestSerializeRef = useRef(serialize);
  const latestOnSaveRef = useRef(onSave);
  const prevResetKeyRef = useRef<string>(resetKey);

  latestValueRef.current = value;
  latestSerializeRef.current = serialize;
  latestOnSaveRef.current = onSave;

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const markCommitted = useCallback((committedValue: T) => {
    committedSignatureRef.current = latestSerializeRef.current(committedValue);
  }, []);

  const isCommitted = useCallback((candidateValue: T) => {
    return (
      latestSerializeRef.current(candidateValue) === committedSignatureRef.current
    );
  }, []);

  const saveNow = useCallback((): boolean => {
    cancel();
    const current = latestValueRef.current;
    const currentSig = latestSerializeRef.current(current);
    if (currentSig === committedSignatureRef.current) {
      return false;
    }
    committedSignatureRef.current = currentSig;
    latestOnSaveRef.current(current);
    return true;
  }, [cancel]);

  useEffect(() => {
    if (prevResetKeyRef.current !== resetKey) {
      cancel();
      prevResetKeyRef.current = resetKey;
      committedSignatureRef.current = latestSerializeRef.current(value);
      return;
    }

    if (!enabled) {
      return;
    }

    const currentSig = serialize(value);
    if (currentSig === committedSignatureRef.current) {
      return;
    }

    cancel();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const latest = latestValueRef.current;
      const latestSig = latestSerializeRef.current(latest);
      if (latestSig !== committedSignatureRef.current) {
        committedSignatureRef.current = latestSig;
        latestOnSaveRef.current(latest);
      }
    }, delayMs);

    return () => {
      cancel();
    };
  }, [value, resetKey, serialize, delayMs, enabled, cancel]);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    saveNow,
    cancel,
    markCommitted,
    isCommitted,
  };
}
