import { useCallback, useState } from 'react';

// ----------------------------------------------------------------------

export interface UseBooleanReturnType<T> {
  value: boolean;
  attribute: T | undefined;
  onTrue: (a?: T) => void;
  onFalse: () => void;
  onToggle: (a?: T) => void;
  setValue: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useBoolean<T>({
  defaultValue,
  trackedAttribute,
}: {
  defaultValue?: boolean,
  trackedAttribute?: T,
} = {}): UseBooleanReturnType<T> {
  const [value, setValue] = useState(!!defaultValue);
  const [attribute, setAttribute] = useState<T | undefined>(trackedAttribute);

  const onTrue = useCallback((a?: T) => {
    setAttribute(a);
    setValue(true);
  }, []);

  const onFalse = useCallback(() => {
    setValue(false);
    setTimeout(() => setAttribute(undefined), 250);
  }, []);

  const onToggle = useCallback((a?: T) => {
    setValue((prev) => {
      const final = !prev;
      setAttribute(final ? a : undefined);
      return final;
    });
  }, []);

  return {
    value,
    attribute,
    onTrue,
    onFalse,
    onToggle,
    setValue,
  };
}
