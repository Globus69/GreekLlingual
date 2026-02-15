"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DialogPortalWrapperProps {
  children: React.ReactNode;
  isOpen: boolean;
}

/**
 * Dialog Portal Wrapper
 *
 * Rendert children in einem React Portal außerhalb der DOM-Hierarchie.
 * Dies verhindert CSS-Konflikte mit Parent-Elementen, die transform,
 * perspective oder overflow verwenden.
 */
export function DialogPortalWrapper({ children, isOpen }: DialogPortalWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Don't render anything until mounted (client-side only)
  if (!mounted) {
    return null;
  }

  // Always render portal when mounted, let child handle visibility
  return createPortal(children, document.body);
}
