import { useState, useEffect, useRef } from "react";
import { useDebounce } from "use-debounce";

interface CollapseContainerProps {
  isCollapsed: boolean;
  children: React.ReactNode;
}

const CollapseContainer: React.FC<CollapseContainerProps> = ({
  isCollapsed,
  children,
}) => {
  const [maxHeight, setMaxHeight] = useState<string | number>("none");
  const contentRef = useRef<HTMLDivElement>(null);
  const [debouncedIsCollapsed] = useDebounce(isCollapsed, 500);

  useEffect(() => {
    if (!contentRef.current) return;
    if (isCollapsed) return setMaxHeight(0);
    setMaxHeight(contentRef.current.scrollHeight);
  }, [isCollapsed]);

  return (
    <div
      style={{
        maxHeight: maxHeight,
        overflow: !isCollapsed && !debouncedIsCollapsed ? "visible" : "hidden",
        transition: "max-height 0.5s ease-in-out",
      }}
      ref={contentRef}
    >
      {children}
    </div>
  );
};

export default CollapseContainer;
