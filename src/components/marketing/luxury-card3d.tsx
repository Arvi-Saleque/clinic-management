"use client";

import * as React from "react";

interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
}

export function Card3D({
  children,
  className = "",
  maxTilt = 12,
  glare = true,
  ...props
}: Card3DProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({
    transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
    transition: "all 400ms cubic-bezier(0.03, 0.98, 0.52, 0.99)",
  });
  const [glareStyle, setGlareStyle] = React.useState<React.CSSProperties>({
    opacity: 0,
    transform: "translate(-50%, -50%)",
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: "transform 100ms ease-out",
    });

    if (glare) {
      setGlareStyle({
        opacity: 0.25,
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
        transition: "opacity 200ms ease-out",
      });
    }
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "all 500ms cubic-bezier(0.03, 0.98, 0.52, 0.99)",
    });
    if (glare) {
      setGlareStyle({
        opacity: 0,
        transform: "translate(-50%, -50%)",
        transition: "opacity 400ms ease-out",
      });
    }
  };

  return (
    <div
      ref={cardRef}
      className={`card-3d-wrapper ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        transformStyle: "preserve-3d",
        ...style,
      }}
      {...props}
    >
      {children}
      {glare && (
        <div
          className="card-3d-glare"
          style={{
            position: "absolute",
            width: "150%",
            height: "150%",
            background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)",
            pointerEvents: "none",
            borderRadius: "inherit",
            ...glareStyle,
          }}
        />
      )}
    </div>
  );
}
