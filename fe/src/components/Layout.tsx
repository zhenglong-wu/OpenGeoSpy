import { useCallback, useRef, useState, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Layout -- split-view app shell with draggable divider
//
// Desktop : left panel + right panel (map), side-by-side, resizable
// Mobile  : stacks vertically, left panel on top, map below
// ---------------------------------------------------------------------------

interface LayoutProps {
  /** Left panel content (sidebar / chat / upload) */
  left: ReactNode;
  /** Right panel content (map) */
  right: ReactNode;
}

export default function Layout({ left, right }: LayoutProps) {
  const [leftPercent, setLeftPercent] = useState(25);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback(() => {
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPercent(Math.min(Math.max(pct, 20), 80));
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-gray-100"
    >
      {/* Left panel */}
      <div
        className="w-full h-[50vh] md:h-full overflow-y-auto border-b md:border-b-0 border-gray-200 bg-white"
        style={{ flex: `0 0 ${leftPercent}%` }}
      >
        {left}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="hidden md:flex items-center justify-center w-1.5 cursor-col-resize bg-gray-200 hover:bg-blue-400 active:bg-blue-500 transition-colors flex-shrink-0"
      />

      {/* Right panel (map) */}
      <div className="w-full h-[50vh] md:h-full relative flex-1">
        {right}
      </div>
    </div>
  );
}
