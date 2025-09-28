"use client";

import { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { StyleRegistry, createStyleRegistry } from "styled-jsx";

interface StyledJsxRegistryProps {
  children: React.ReactNode;
}

export function StyledJsxRegistry({ children }: StyledJsxRegistryProps) {
  const [registry] = useState(() => createStyleRegistry());

  useServerInsertedHTML(() => {
    const styles = registry.styles();
    registry.flush();
    return <>{styles}</>;
  });

  return <StyleRegistry registry={registry}>{children}</StyleRegistry>;
}

