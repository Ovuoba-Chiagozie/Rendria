import {
  CustomSquareIcon,
  CustomCircleIcon,
  CustomTriangleIcon,
  CustomStarIcon,
  CustomHeartIcon,
  CustomHexagonIcon,
  CustomHorizontalLineIcon,
} from "@/components/sidebar/panels/shapes/Shapes";

import { v4 as uuid } from "uuid";

const shapes = [
  {
    id: "solid-square",
    label: "solid-square",
    Icon: CustomSquareIcon,
    fill: "black",
    strokeColor: "",
    strokeWidth: 0,
    width: 48,
    height: 48,
  },
  {
    id: "solid-circle",
    label: "solid-circle",
    Icon: CustomCircleIcon,
    fill: "black",
    strokeColor: "",
    strokeWidth: 0,
    width: 48,
    height: 48,
  },
  {
    id: "solid-triangle",
    label: "solid-triangle",
    Icon: CustomTriangleIcon,
    fill: "black",
    strokeColor: "",
    strokeWidth: 0,
    width: 48,
    height: 48,
  },
  {
    id: "outline-square",
    label: "outline-square",
    Icon: CustomSquareIcon,
    fill: "transparent",
    strokeColor: "black",
    strokeWidth: 5,
    width: 48,
    height: 48,
  },
  {
    id: "outline-circle",
    label: "outline-circle",
    Icon: CustomCircleIcon,
    fill: "transparent",
    strokeColor: "black",
    strokeWidth: 5,
    width: 48,
    height: 48,
  },
  {
    id: "outline-triangle",
    label: "outline-triangle",
    Icon: CustomTriangleIcon,
    fill: "transparent",
    strokeColor: "black",
    strokeWidth: 5,
    width: 48,
    height: 48,
  },
  {
    id: "solid-star",
    label: "solid-star",
    Icon: CustomStarIcon,
    fill: "black",
    strokeColor: "",
    strokeWidth: 0,
    width: 48,
    height: 48,
  },
  {
    id: "solid-heart",
    label: "solid-heart",
    Icon: CustomHeartIcon,
    fill: "black",
    strokeColor: "",
    strokeWidth: 0,
    width: 48,
    height: 48,
  },
  {
    id: "solid-hexagon",
    label: "solid-hexagon",
    Icon: CustomHexagonIcon,
    fill: "black",
    strokeColor: "",
    strokeWidth: 0,
    width: 48,
    height: 48,
  },
  {
    id: "outline-star",
    label: "outline-star",
    Icon: CustomStarIcon,
    fill: "transparent",
    strokeColor: "black",
    strokeWidth: 5,
    width: 48,
    height: 48,
  },
  {
    id: "outline-heart",
    label: "outline-heart",
    Icon: CustomHeartIcon,
    fill: "transparent",
    strokeColor: "black",
    strokeWidth: 5,
    width: 48,
    height: 48,
  },
  {
    id: "outline-hexagon",
    label: "outline-hexagon",
    Icon: CustomHexagonIcon,
    fill: "transparent",
    strokeColor: "black",
    strokeWidth: 5,
    width: 48,
    height: 48,
  },
  {
    id: "horizontal-line",
    label: "horizontal-line",
    Icon: CustomHorizontalLineIcon,
    fill: "black",
    strokeColor: "",
    strokeWidth: 5,
    width: 48,
    height: 5,
  },
];

const ShapesPanel = ({ setElements, setSelectedId, counters, setCounters }) => {
  const addShape = (shape) => {
    const nextCount = counters.shape + 1;
  
    const newShape = {
      id: uuid(),
      name: `shape-${nextCount}`,
      type: "shape",
      label: shape.label,
      shapeIcon: shape.Icon, // store which shape it is
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      fill: shape.fill,
      strokeColor: shape.strokeColor,
      strokeWidth: shape.strokeWidth,
      rotation: 0,
    };
    setElements((prev) => [...prev, newShape]);
    setSelectedId(newShape.id);

    setCounters((prev) => ({ ...prev, shape: nextCount }));
  };

  return (
    <div className="p-4 grid grid-cols-3 gap-2">
      {shapes.map((shape) => (
        <button
          key={shape.id}
          onClick={() => addShape(shape)}
          className="
          aspect-square w-full
          flex items-center justify-center
          rounded-lg
          hover:border hover:border-blue-400 active:bg-gray-200
          transition
        "
        >
          <shape.Icon
            className="w-3/4 h-3/4"
            width={shape.width}
            height={shape.height}
            fill={shape.fill}
            strokeColor={shape.strokeColor}
            strokeWidth={shape.strokeWidth}
            id={shape.id}
          />
        </button>
      ))}
    </div>
  );
};

export default ShapesPanel;
