import { useState } from "react";
import { useDebounce } from "react-use";

export default function useDebounceText({
  ms = 500,
}: {
  ms?: number;
}) {
  const [text, setText] = useState('');
  const [debouncedText, setDebouncedText] = useState('');

  const [, cancel] = useDebounce(
    () => setDebouncedText(text),
    ms,
    [text]
  );

  return {
    text,
    setText,
    cancel,
    debouncedText,
  }
}
