import { Graph, Shape } from "@antv/x6";

export const createGraphConfig = (container: HTMLDivElement) => ({
  container,
  width: 800,
  height: 800,
  grid: true,
  background: { color: "#f7f9fb" },
  selecting: false,
  interacting: { nodeMovable: true, edgeMovable: false },
  panning: true,
  mousewheel: {
    enabled: true,
    zoomAtMousePosition: true,
    modifiers: "ctrl",
    minScale: 0.5,
    maxScale: 3,
  },
  connecting: {
    router: {
      name: "manhattan",
      args: {
        padding: 1,
      },
    },
    connector: {
      name: "rounded",
      args: {
        radius: 10,
      },
    },
    anchor: "center",
    connectionPoint: "anchor",
    allowBlank: false,
    allowLoop: false,
    allowNode: false,
    allowEdge: false,
    allowPort: true,
    highlight: true,
    snap: {
      radius: 20,
    },
    createEdge() {
      return new Shape.Edge({
        attrs: {
          line: {
            stroke: "#5F95FF",
            strokeWidth: 2,
            targetMarker: null,
            sourceMarker: null,
            strokeDasharray: 0,
            style: {
              animation: "ant-line 30s infinite linear",
            },
          },
        },
        zIndex: 0,
        defaultLabel: {
          markup: [
            {
              tagName: "rect",
              selector: "body",
            },
            {
              tagName: "text",
              selector: "label",
            },
          ],
          attrs: {
            label: {
              fill: "#5F95FF",
              fontSize: 12,
              textAnchor: "middle",
              textVerticalAnchor: "middle",
              pointerEvents: "none",
            },
            body: {
              ref: "label",
              fill: "#fff",
              stroke: "#5F95FF",
              strokeWidth: 1,
              rx: 4,
              ry: 4,
              refWidth: "140%",
              refHeight: "140%",
              refX: "-20%",
              refY: "-20%",
            },
          },
          position: {
            distance: 0.5,
            options: {
              absoluteDistance: true,
              reverseDistance: true,
            },
          },
        },
      });
    },
    validateConnection({ sourceView, targetView, sourceMagnet, targetMagnet }) {
      if (sourceView === targetView) {
        return false;
      }
      if (!sourceMagnet || !targetMagnet) {
        return false;
      }
      const sourcePortId = sourceMagnet.getAttribute("port");
      const targetPortId = targetMagnet.getAttribute("port");
      const sourceNode = sourceView.cell;
      const targetNode = targetView.cell;

      const graph = sourceView.graph as Graph;
      const edges = graph.getEdges() || [];
      const duplicateEdge = edges.find(
        (edge) =>
          edge.getSourceCellId() === sourceNode.id &&
          edge.getTargetCellId() === targetNode.id &&
          edge.getSourcePortId() === sourcePortId &&
          edge.getTargetPortId() === targetPortId
      );

      return !duplicateEdge;
    },
  },
  highlighting: {
    magnetAdsorbed: {
      name: "stroke",
      args: {
        attrs: {
          fill: "#5F95FF",
          stroke: "#5F95FF",
          strokeWidth: 3,
        },
      },
    },
    magnetAvailable: {
      name: "stroke",
      args: {
        attrs: {
          fill: "#fff",
          stroke: "#5F95FF",
          strokeWidth: 2,
        },
      },
    },
  },
});
