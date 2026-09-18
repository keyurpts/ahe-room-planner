
interface ThreeDProps {
  containerRef: React.RefObject<HTMLDivElement>;
  visible: boolean;
}

export default function ThreeD({ containerRef, visible }: ThreeDProps) {
  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{
        visibility: visible ? "visible" : "hidden",
        pointerEvents: visible ? "auto" : "none",
      }}
    />
  );
}
