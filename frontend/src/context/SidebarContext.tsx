import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';

export interface SidebarContextType {
  // Individual core state concepts
  isPinned: boolean;
  isHoverExpanded: boolean;
  isMobileOpen: boolean;
  isDesktop: boolean;

  // Authoritative calculated effective states
  isExpandedDesktop: boolean;
  isExpanded: boolean;

  // Intent-driven action handlers
  togglePin: () => void;
  toggleMenu: () => void;
  openMobile: () => void;
  closeMobile: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  closeHoverNow: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const PINNED_STORAGE_KEY = 'estate_sidebar_pinned';

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();

  // 1. Pinned State: User-requested persistent dock state
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(PINNED_STORAGE_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  // 2. Hover-Expanded State: Temporary transient preview on desktop
  const [isHoverExpanded, setIsHoverExpanded] = useState<boolean>(false);

  // 3. Mobile Open State: Off-canvas drawer on small viewports (<1024px)
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // 4. Responsive & Device Capability State
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });

  // Refs for zero-rerender timer management and race prevention
  const hoverOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPointerInsideRef = useRef<boolean>(false);

  // Track responsive viewport changes efficiently with matchMedia
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(e.matches);
      if (e.matches) {
        // Desktop breakpoint reached: ensure mobile drawer is dismissed
        setIsMobileOpen(false);
      } else {
        // Mobile breakpoint: reset desktop hover
        setIsHoverExpanded(false);
      }
    };

    mql.addEventListener('change', handleMediaChange);
    return () => mql.removeEventListener('change', handleMediaChange);
  }, []);

  // Close mobile drawer and dismiss temporary hover on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setIsHoverExpanded(false);
    isPointerInsideRef.current = false;
  }, [location.pathname]);

  // Global Escape key dismisses mobile drawer or temporary hover preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobileOpen) {
          setIsMobileOpen(false);
        }
        if (isHoverExpanded && !isPinned) {
          setIsHoverExpanded(false);
          isPointerInsideRef.current = false;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, isHoverExpanded, isPinned]);

  // Clean up all pending timers on unmount
  useEffect(() => {
    return () => {
      if (hoverOpenTimerRef.current) clearTimeout(hoverOpenTimerRef.current);
      if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);
    };
  }, []);

  // Helper to clear pending timers
  const clearTimers = useCallback(() => {
    if (hoverOpenTimerRef.current) {
      clearTimeout(hoverOpenTimerRef.current);
      hoverOpenTimerRef.current = null;
    }
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  }, []);

  // Pin / Unpin Action
  const togglePin = useCallback(() => {
    clearTimers();
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PINNED_STORAGE_KEY, String(next));
      } catch {
        // storage fallback
      }
      // If user unpins while pointer is still inside, keep hover preview active
      if (!next && isPointerInsideRef.current) {
        setIsHoverExpanded(true);
      } else if (next) {
        setIsHoverExpanded(false);
      }
      return next;
    });
  }, [clearTimers]);

  // Navbar Menu Toggle Button Action: Immediate, predictable toggle without animation conflicts
  const toggleMenu = useCallback(() => {
    if (!isDesktop) {
      setIsMobileOpen((prev) => !prev);
    } else {
      clearTimers();
      setIsHoverExpanded(false);
      isPointerInsideRef.current = false;
      setIsPinned((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(PINNED_STORAGE_KEY, String(next));
        } catch {
          // storage fallback
        }
        return next;
      });
    }
  }, [isDesktop, clearTimers]);

  const openMobile = useCallback(() => setIsMobileOpen(true), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  const closeHoverNow = useCallback(() => {
    clearTimers();
    setIsHoverExpanded(false);
    isPointerInsideRef.current = false;
  }, [clearTimers]);

  // Stable Pointer Enter Handler (edge zone or sidebar body)
  const onPointerEnter = useCallback(() => {
    // Only desktop with fine pointer (mouse/trackpad) qualifies for hover; ignore touch devices
    if (typeof window !== 'undefined') {
      const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (!hasFinePointer) return;
    }

    if (!isDesktop || isPinned) return;

    isPointerInsideRef.current = true;

    // Cancel any pending close operation immediately on return
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }

    // If already expanded, do not restart open timer
    if (isHoverExpanded) return;

    // Controlled 120ms activation delay prevents accidental swipes
    if (!hoverOpenTimerRef.current) {
      hoverOpenTimerRef.current = setTimeout(() => {
        if (isPointerInsideRef.current) {
          setIsHoverExpanded(true);
        }
        hoverOpenTimerRef.current = null;
      }, 120);
    }
  }, [isDesktop, isPinned, isHoverExpanded]);

  // Stable Pointer Leave Handler
  const onPointerLeave = useCallback(() => {
    if (!isDesktop || isPinned) return;

    isPointerInsideRef.current = false;

    // Cancel pending open timer if user exited before activation delay
    if (hoverOpenTimerRef.current) {
      clearTimeout(hoverOpenTimerRef.current);
      hoverOpenTimerRef.current = null;
    }

    // Controlled 180ms closing delay gives user time to re-enter without flicker
    if (!hoverCloseTimerRef.current) {
      hoverCloseTimerRef.current = setTimeout(() => {
        if (!isPointerInsideRef.current) {
          setIsHoverExpanded(false);
        }
        hoverCloseTimerRef.current = null;
      }, 180);
    }
  }, [isDesktop, isPinned]);

  // Calculate authoritative effective states
  const isExpandedDesktop = isPinned || isHoverExpanded;
  const isExpanded = isDesktop ? isExpandedDesktop : isMobileOpen;

  const value: SidebarContextType = {
    isPinned,
    isHoverExpanded,
    isMobileOpen,
    isDesktop,
    isExpandedDesktop,
    isExpanded,
    togglePin,
    toggleMenu,
    openMobile,
    closeMobile,
    onPointerEnter,
    onPointerLeave,
    closeHoverNow,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
