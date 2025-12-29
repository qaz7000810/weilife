import React, { useState, useEffect, useRef } from "react";

const RingChart = ({ score, size = 100 }) => {
  const innerSize = size * 0.7;
  const [animatedScore, setAnimatedScore] = useState(0);
  const requestRef = useRef();

  const getColor = (val) => {
    if (val < 40) return "#EF4444";
    if (val < 70) return "#F59E0B";
    return "#10B981";
  };

  const color = getColor(score);

  useEffect(() => {
    let start;
    const duration = 800;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const eased = Math.min(progress / duration, 1);
      const current = score * eased;
      setAnimatedScore(current);
      if (progress < duration) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };
    cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [score]);

  const radius = (size / 2) * 0.9;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animatedScore / 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute top-0 left-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={size * 0.1}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={size * 0.1}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div
        className="absolute"
        style={{
          width: innerSize,
          height: innerSize,
          background: "white",
          borderRadius: "50%",
        }}
      ></div>

      <div className="absolute text-center">
        <span className="text-xl font-semibold text-gray-800">
          {Math.round(animatedScore)}
        </span>
      </div>
    </div>
  );
};

export default RingChart;
