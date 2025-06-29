import "./Panel.css";
import { useState, forwardRef, useImperativeHandle } from "react";

const BlurCircle = forwardRef((props, ref) => {
  const [actionColorName, setActionColorName] = useState("circle");

  useImperativeHandle(ref, () => ({
    setColorName,
  }));

  const setColorName = (sopt_action: boolean) => {
    if (sopt_action) {
      setActionColorName("circle");
    } else {
      setActionColorName("active");
    }
  };

  return (
    <div className="circle-container">
      <div className={actionColorName}></div>
    </div>
  );
});

export default BlurCircle;
