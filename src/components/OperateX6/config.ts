export const createPortsConfig = () => {
  const baseGroups = {
    top: {
      position: "top",
      attrs: {
        circle: {
          r: 6,
          magnet: true,
          stroke: "#1890ff",
          strokeWidth: 2,
          fill: "#1890ff",
        },
      },
    },
    bottom: {
      position: "bottom",
      attrs: {
        circle: {
          r: 6,
          magnet: true,
          stroke: "#52c41a",
          strokeWidth: 2,
          fill: "#52c41a",
        },
      },
    },
    bottomGreen: {
      position: { name: "bottom", args: { dx: 15 } },
      attrs: {
        circle: {
          r: 6,
          magnet: true,
          stroke: "#52c41a",
          strokeWidth: 2,
          fill: "#52c41a",
        },
      },
    },
    bottomRed: {
      position: { name: "bottom", args: { dx: -15 } },
      attrs: {
        circle: {
          r: 6,
          magnet: true,
          stroke: "#ff4d4f",
          strokeWidth: 2,
          fill: "#ff4d4f",
        },
      },
    },
  };

  return {
    normal: {
      groups: baseGroups,
      items: [
        { id: "i", group: "top" },
        { id: "y", group: "bottomGreen" },
        { id: "n", group: "bottomRed" },
      ],
    },
    singleY: {
      groups: baseGroups,
      items: [{ id: "y", group: "bottom" }],
    },
    delay: {
      groups: baseGroups,
      items: [
        { id: "i", group: "top" },
        { id: "y", group: "bottom" },
      ],
    },
  };
};
