import React from "react";

export const CustomSquareIcon = ({
  id,
  width = 24,
  height = 24,
  strokeWidth = 2,
  strokeColor = "currentColor",
  fill = "none",
}) => {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <rect id={id} x="0" y="0" width={width} height={height} rx="0" ry="0" />
        <clipPath id={`${id}Clip)`}>
          <use href={`#${id}`} />
        </clipPath>
      </defs>

      {/* Fill */}
      <use href={`#${id}`} fill={fill} />

      {/* Inward stroke */}
      <use
        href={`#${id}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth * 2}
        clipPath={`url(#${id}Clip)`}
      />
    </svg>
  );
};

export const CustomCircleIcon = ({
  id,
  width = 24,
  height = 24,
  strokeWidth = 2,
  strokeColor = "currentColor",
  fill = "none",
}) => {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <circle id={id} cx={cx} cy={cy} r={radius} />
        <clipPath id={`${id}Clip`}>
          <use href={`#${id}`} />
        </clipPath>
      </defs>
      <use href={`#${id}`} fill={fill} />
      <use
        href={`#${id}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth * 2}
        clipPath={`url(#${id}Clip)`}
      />
    </svg>
  );
};

export const CustomTriangleIcon = ({
  id,
  width = 24,
  height = 24,
  strokeWidth = 2,
  strokeColor = "currentColor",
  fill = "none",
}) => {
  const pointA = `${width / 2},0`;
  const pointB = `${width},${height}`;
  const pointC = `0,${height}`;
  const points = `${pointA} ${pointB} ${pointC}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <polygon id={id} points={points} />
        <clipPath id={`${id}Clip`}>
          <use href={`#${id}`} />
        </clipPath>
      </defs>
      <use href={`#${id}`} fill={fill} />
      <use
        href={`#${id}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth * 2}
        clipPath={`url(#${id}Clip)`}
      />
    </svg>
  );
};

export const CustomStarIcon = ({
  id,
  width = 24,
  height = 24,
  strokeWidth = 2,
  strokeColor = "currentColor",
  fill = "none",
}) => {
  const points = 5;
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = Math.min(width, height) / 2;
  const innerRadius = outerRadius * 0.5;

  const starPoints = Array.from({ length: points * 2 }, (_, i) => {
    const isEven = i % 2 === 0;
    const radius = isEven ? outerRadius : innerRadius;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <polygon id={id} points={starPoints} />
        <clipPath id={`${id}Clip`}>
          <use href={`#${id}`} />
        </clipPath>
      </defs>
      <use href={`#${id}`} fill={fill} />
      <use
        href={`#${id}`}
        fill={fill}
        stroke={strokeColor}
        strokeWidth={strokeWidth * 2}
        clipPath={`url(#${id}Clip)`}
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const CustomHeartIcon = ({
  id,
  width = 100,
  height = 100,
  strokeWidth = 10,
  strokeColor = "black",
  fill = "red",
}) => {
  const pathData =
    "M50 80C20 50 10 35 10 25C10 15 18 8 28 8S46 15 50 25C54 15 62 8 72 8S90 15 90 25C90 35 80 50 50 80Z";

  return (
    <svg width={width} height={height} viewBox="0 0 100 100">
      <defs>
        <path id={id} d={pathData} />
        <clipPath id={`${id}Clip`}>
          <use href={`#${id}`} />
        </clipPath>
      </defs>
      <use href={`#${id}`} fill={fill} />
      <use
        href={`#${id}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth * 2}
        clipPath={`url(#${id}Clip)`}
      />
    </svg>
  );
};

export const CustomHexagonIcon = ({
  id,
  width = 24,
  height = 24,
  strokeWidth = 2,
  strokeColor = "currentColor",
  fill = "none",
}) => {
  const sides = 6;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2;

  const points = Array.from({ length: sides })
    .map((_, i) => {
      const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <polygon id={id} points={points} />
        <clipPath id={`${id}Clip`}>
          <use href={`#${id}`} />
        </clipPath>
      </defs>
      <use href={`#${id}`} fill={fill} />
      <use
        href={`#${id}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth * 2}
        clipPath={`url(#${id}Clip)`}
      />
    </svg>
  );
};

export const CustomHorizontalLineIcon = ({
  width = 48,
  strokeWidth = 2,
  fill = "currentColor",
}) => {
  return (
    <div style={{
      width: `${width}px`,
      height: `${strokeWidth}px`,
      backgroundColor: fill
    }} />
  );
};
