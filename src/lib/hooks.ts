import React from "react";

export function usePrevious<T>(value: T): T | undefined {
  const [current, setCurrent] = React.useState<T>(value);
  const [previous, setPrevious] = React.useState<T>();

  if (value !== current) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
}
