import { useCallback, useMemo, useRef, useState } from 'react';

type Validator<V> = (values: V) => Partial<Record<keyof V, string>>;

export interface UseFormOptions<V extends object> {
  initialValues: V;
  validate?: Validator<V>;
}

/**
 * Small, predictable form engine: controlled values, per-field validation,
 * touched-tracking so errors never shout before the user is done typing.
 */
export function useForm<V extends object>({ initialValues, validate }: UseFormOptions<V>) {
  const [values, setValues] = useState<V>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof V, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const initialRef = useRef(initialValues);

  const errors = useMemo<Partial<Record<keyof V, string>>>(
    () => (validate ? validate(values) : {}),
    [validate, values],
  );

  const isValid = Object.keys(errors).length === 0;

  const setValue = useCallback(<K extends keyof V>(key: K, value: V[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setValuesSafe = useCallback((next: Partial<V>) => {
    setValues((prev) => ({ ...prev, ...next }));
  }, []);

  const blur = useCallback((key: keyof V) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  /** Errors worth showing right now (touched or after a submit attempt). */
  const visibleError = useCallback(
    (key: keyof V) => (submitted || touched[key] ? errors[key] : undefined),
    [errors, submitted, touched],
  );

  const submit = useCallback(
    (onValid: (values: V) => void | Promise<void>) =>
      async (event?: { preventDefault?: () => void }) => {
        event?.preventDefault?.();
        setSubmitted(true);
        if (Object.keys(errors).length === 0) {
          await onValid(values);
        }
      },
    [errors, values],
  );

  const reset = useCallback(() => {
    setValues(initialRef.current);
    setTouched({});
    setSubmitted(false);
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialRef.current),
    [values],
  );

  return {
    values,
    errors,
    isValid,
    isDirty,
    submitted,
    setValue,
    setValues: setValuesSafe,
    blur,
    visibleError,
    submit,
    reset,
  };
}
