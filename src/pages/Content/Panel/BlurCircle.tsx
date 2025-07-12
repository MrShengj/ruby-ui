import "./Panel.css";
import { useState, forwardRef, useImperativeHandle } from "react";

interface BlurCircleProps {
  size?: "small" | "medium" | "large";
  variant?: "default" | "pulse" | "glow";
  children?: React.ReactNode;
}

interface BlurCircleRef {
  setStatus: (isActive: boolean) => void;
  getStatus: () => boolean;
}

const BlurCircle = forwardRef<BlurCircleRef, BlurCircleProps>((props, ref) => {
  const { size = "medium", variant = "default", children } = props;
  const [isActive, setIsActive] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useImperativeHandle(ref, () => ({
    setStatus: (activeState: boolean) => {
      if (activeState !== isActive) {
        setIsAnimating(true);
        setIsActive(activeState);
        // 动画完成后重置动画状态
        setTimeout(() => setIsAnimating(false), 300);
      }
    },
    getStatus: () => isActive,
  }));

  const getCircleClasses = () => {
    const baseClass = "blur-circle";
    const sizeClass = `blur-circle--${size}`;
    const variantClass = `blur-circle--${variant}`;
    const statusClass = isActive
      ? "blur-circle--active"
      : "blur-circle--inactive";
    const animatingClass = isAnimating ? "blur-circle--animating" : "";

    return [baseClass, sizeClass, variantClass, statusClass, animatingClass]
      .filter(Boolean)
      .join(" ");
  };

  return (
    <div className="blur-circle-container">
      <div
        className={getCircleClasses()}
        role="status"
        aria-label={`状态: ${isActive ? "活跃" : "非活跃"}`}
      >
        <div className="blur-circle__inner">
          <div className="blur-circle__core"></div>
          {variant === "pulse" && <div className="blur-circle__pulse"></div>}
          {variant === "glow" && <div className="blur-circle__glow"></div>}
        </div>
        {children && (
          <div className="blur-circle__content">{children}</div>
        )}
      </div>
      {/* <div className="blur-circle__status-text">
        {isActive ? "活跃状态" : "待机状态"}
      </div> */}
    </div>
  );
});

BlurCircle.displayName = "BlurCircle";

export default BlurCircle;
