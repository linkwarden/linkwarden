import React from "react";

type Props = {
  className?: string;
  color: string;
  size: string;
};

const Loader = (props: Props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid"
      width={props.size}
      height={props.size}
      className={props.className}
      style={{
        shapeRendering: "auto",
        display: "block",
        background: "rgba(255, 255, 255, 0)",
      }}
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <g>
        <g transform="rotate(0 50 50)">
          <rect
            fill={props.color}
            height="12"
            width="6"
            ry="1.8"
            rx="1.8"
            y="24"
            x="47"
          >
            <animate
              repeatCount="indefinite"
              begin="-0.9166666666666666s"
              dur="1s"
              keyTimes="0;1"
              values="1;0"
              attributeName="opacity"
            ></animate>
          </rect>
        </g>
        <g transform="rotate(30 50 50)">
          <rect
            fill={props.color}
            height="12"
            width="6"
            ry="1.8"
            rx="1.8"
            y="24"
            x="47"
          >
            <animate
              repeatCount="indefinite"
              begin="-0.8333333333333334s"
              dur="1s"
              keyTimes="0;1"
              values="1;0"
              attributeName="opacity"
            ></animate>
          </rect>
        </g>
        <g transform="rotate(60 50 50)">
          <rect
            fill={props.color}
            height="12"
            width="6"
            ry="1.8"
            rx="1.8"
            y="24"
            x="47"
          >
            <animate
              repeatCount="indefinite"
              begin="-0.75s"
              dur="1s"
              keyTimes="0;1"
              values="1;0"
              attributeName="opacity"
            ></animate>
          </rect>
        </g>
        <g transform="rotate(90 50 50)">
          <rect
            fill={props.color}
            height="12"
            width="6"
            ry="1.8"
            rx="1.8"
            y="24"
            x="47"
          >
            <animate
              repeatCount="indefinite"
              begin="-0.6666666666666666s"
              dur="1s"
              keyTimes="0;1"
              values="1;0"
              attributeName="opacity"
            ></animate>
          </rect>
        </g>
        <g transform="rotate(120 50 50)">
          <rect
            fill={props.color}
            height="12"
            width="6"
            ry="1.8"
            rx="1.8"
            y="24"
            x="47"
          >
            <animate
              repeatCount="indefinite"
              begin="-0.5833333333333334s"
              dur="1s"
              keyTimes="0;1"
              values="1;0"
              attributeName="opacity"
            ></animate>
          </rect>
        </g>
        <g transform="rotate(150 50 50)">
          <rect
            fill={props.color}
            height="12"
            width="6"
            ry="1.8"
            rx="1.8"
            y="24"
            x="47"
          >
            <animate
              repeatCount="indefinite"
              begin="-0.5s"
              dur="1s"
              keyTimes="0;1"
              values="1;0"
              attributeName="opacity"
            ></animate>
          </rect>
        </g>
        <g transform="rotate(180 50 50)">
          <rect
            fill={props.color}
            height="12"
            width="6"
            ry="1.8"
            rx="1.8"
            y="24"
            x="47"
          >
            <animate
              repeatCount="indefinite"
              begin="-0.4166666666666667s"
              dur="1s"
              keyTimes="0;1"
              values="1;0"
              attributeName="opacity"
            ></animate>
          </rect>
        </g>
        <g transform="rotate(210 50 50)">
          <rect
            fill={props.color}
            height="12"
            width="6"
            ry="1.8"
            rx="1.8"
            y="24"
            x="47"
          >
            <animate
              repeatCount="indefinite"
              begin="-0.3333333333333333s"
              dur="1s"
              keyTimes="0;1"
              values="1;0"
              attributeName="opacity"
            ></animate>
          </rect>
        </g>
        <g transform="rotate(240 50 50)">
          <rect
            fill={props.color}
            height="12"
            width="6"
            ry="1.8"
            rx="1.8"
            y="24"
            x="47"
          >
            <animate
              repeatCount="indefinite"
              begin="-0.25s"
              dur="1s"
              keyTimes="0;1"
              values="1;0"
              attributeName="opacity"
            ></animate>
          </rect>
        </g>
        <g transform="rotate(270 50 50)">
          <rect
            fill={props.color}
            height="12"
            width="6"
            ry="1.8"
            rx="1.8"
            y="24"
            x="47"
          >
            <animate
              repeatCount="indefinite"
              begin="-0.16666666666666666s"
              dur="1s"
              keyTimes="0;1"
              values="1;0"
              attributeName="opacity"
            ></animate>
          </rect>
        </g>
        <g transform="rotate(300 50 50)">
          <rect
            fill={props.color}
            height="12"
            width="6"
            ry="1.8"
            rx="1.8"
            y="24"
            x="47"
          >
            <animate
              repeatCount="indefinite"
              begin="-0.08333333333333333s"
              dur="1s"
              keyTimes="0;1"
              values="1;0"
              attributeName="opacity"
            ></animate>
          </rect>
        </g>
        <g transform="rotate(330 50 50)">
          <rect
            fill={props.color}
            height="12"
            width="6"
            ry="1.8"
            rx="1.8"
            y="24"
            x="47"
          >
            <animate
              repeatCount="indefinite"
              begin="0s"
              dur="1s"
              keyTimes="0;1"
              values="1;0"
              attributeName="opacity"
            ></animate>
          </rect>
        </g>
        <g></g>
      </g>
    </svg>
  );
};

export default Loader;
