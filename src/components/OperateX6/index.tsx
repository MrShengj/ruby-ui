import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Graph, Shape } from "@antv/x6";
import { Snapline } from "@antv/x6-plugin-snapline";
import { Stencil } from "@antv/x6-plugin-stencil";
import { message, Modal, Input, InputNumber } from "antd";
import { invoke } from "@tauri-apps/api/core";
import { createUserRGB, deleteUserRGB } from "../../api/element";
import { TimeOrNamaLabel } from "../../utils/common";
import "./OperateX6.css";
import "@antv/x6/dist/index.css";
import "@antv/x6-plugin-stencil/dist/index.css";

interface NodeData {
  id?: string;
  shape?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label?: string;
  attrs?: any;
  data?: any;
}

interface EdgeData {
  id?: string;
  source: string;
  target: string;
  sourcePort?: string;
  targetPort?: string;
  label?: string;
  attrs?: any;
}

interface OperateX6Props {
  nodes?: NodeData[];
  edges?: EdgeData[];
  rgbs?: any[];
  elements?: any[];
  skills?: any[];
  onChange?: (nodes: NodeData[], edges: EdgeData[]) => void;
}

interface ColorSaveData {
  coordinate: string;
  rgb: string;
  hex: string;
}

const OperateX6 = forwardRef<any, OperateX6Props>(
  (
    { nodes = [], edges = [], rgbs = [], elements = [], skills = [], onChange },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stencilRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<Graph | null>(null);
    const [messageApi, contextHolder] = message.useMessage();
    const [modal, modalContextHolder] = Modal.useModal();

    // 状态管理
    const [modalVisible, setModalVisible] = useState(false);
    const [modalLabel, setModalLabel] = useState("");
    const [modalValue, setModalValue] = useState<number | null>(0);
    const [editingNode, setEditingNode] = useState<any>(null);
    const [saveColorModalVisible, setSaveColorModalVisible] = useState(false);
    const [colorName, setColorName] = useState("");
    const [savingColorData, setSavingColorData] =
      useState<ColorSaveData | null>(null);

    // 端口配置
    const portsConfig = useMemo(() => {
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
    }, []);

    // API 调用
    const saveUserRGB = useCallback(
      async (coordinate: string, rgb: string, name: string) => {
        const user_id = window.sessionStorage.getItem("id");
        if (!user_id) {
          messageApi.error("用户未登录，请先登录");
          return;
        }

        const data = { user_id: parseInt(user_id), coordinate, rgb, name };
        const res = await createUserRGB(data);
        // 保存下res.data.id的数据

        if (res.code === 200) {
          rgbs.push({
            id: res.data.id,
            coordinate,
            rgb,
            name: name.trim(),
          });
          messageApi.success("取色数据已保存");
        } else {
          messageApi.error("保存取色数据失败");
        }
      },
      [messageApi]
    );

    const deleteUserRGBApi = useCallback(
      async (id: number) => {
        const res = await deleteUserRGB({ id });
        if (res.code === 200) {
          messageApi.success("取色数据已永久删除");
        } else {
          messageApi.error("删除取色数据失败");
        }
      },
      [messageApi]
    );

    const mouseRgb = useCallback(async (): Promise<string[]> => {
      const now_mouse_rgb: string = await invoke("get_mouse_rgb");
      return now_mouse_rgb.split("|");
    }, []);

    // 变化触发器
    const triggerChange = useCallback(() => {
      if (!onChange || !graphRef.current) return;

      const graph = graphRef.current;
      const nodes = graph.getNodes().map((node) => ({
        id: node.id,
        shape: node.shape,
        x: node.position().x,
        y: node.position().y,
        width: node.size().width,
        height: node.size().height,
        label: node.attr("label/text"),
        attrs: node.attrs,
        data: node.getData(),
      }));

      const edges = graph.getEdges().map((edge) => ({
        id: edge.id,
        source: edge.getSourceCellId(),
        sourcePort: edge.getSourcePortId(),
        target: edge.getTargetCellId(),
        targetPort: edge.getTargetPortId(),
        label: edge.attr("label/text"),
        attrs: edge.attrs,
      }));

      onChange(nodes, edges);
    }, [onChange]);

    // 创建组件的工厂函数
    const createElementComponents = useCallback(
      (elements: any[]) => {
        return elements.map((element) => {
          const isSpecialType =
            element.elements_code === 4 || element.elements_code === 5;
          const labelColor = isSpecialType ? "#003a8c" : "#1890ff";
          const ports = isSpecialType ? portsConfig.singleY : portsConfig.delay;

          return new Shape.Rect({
            width: 80,
            height: 36,
            attrs: {
              body: { fill: "#fffbe6", stroke: labelColor, rx: 8, ry: 8 },
              label: {
                text: element.elements_key || "按键",
                fill: labelColor,
                fontSize: 14,
              },
            },
            ports,
            data: {
              elements_code: element.elements_code,
              elements_key: element.elements_key,
              key_up_delay: 0, // 默认按键弹起延迟为0
            },
          });
        });
      },
      [portsConfig]
    );

    const createSkillComponents = useCallback(
      (skills: any[]) => {
        return skills.map(
          (skill) =>
            new Shape.Rect({
              width: 80,
              height: 36,
              attrs: {
                body: { fill: "#e6fffb", stroke: "#13c2c2", rx: 8, ry: 8 },
                label: {
                  text: skill.skill_name || "技能",
                  fill: "#13c2c2",
                  fontSize: 14,
                },
              },
              ports: portsConfig.normal,
              data: {
                skill_name: skill.skill_name,
                skill_code: skill.skill_code,
              },
            })
        );
      },
      [portsConfig.normal]
    );

    const createColorComponents = useCallback(
      (rgbs: any[]) => {
        const components = [
          new Shape.Rect({
            width: 80,
            height: 36,
            attrs: {
              body: { fill: "#f0f5ff", stroke: "#2f54eb", rx: 8, ry: 8 },
              label: { text: "取色", fill: "#2f54eb", fontSize: 14 },
            },
            ports: portsConfig.normal,
          }),
        ];

        rgbs.forEach((color) => {
          const rgb = color.rgb.split(",").map(Number);
          const hex = `#${rgb
            .map((x) => x.toString(16).padStart(2, "0"))
            .join("")}`;

          components.push(
            new Shape.Rect({
              width: 80,
              height: 36,
              attrs: {
                body: { fill: hex, stroke: "#2f54eb", rx: 8, ry: 8 },
                label: { text: color.name, fill: "#2f54eb", fontSize: 14 },
              },
              ports: portsConfig.normal,
              data: {
                id: color.id,
                coordinate: color.coordinate,
                rgb: color.rgb,
              },
            })
          );
        });

        return components;
      },
      [portsConfig.normal]
    );

    const createTimeWaitComponents = useCallback(() => {
      return [
        new Shape.Rect({
          width: 80,
          height: 36,
          attrs: {
            body: { fill: "#fff1f0", stroke: "#ff4d4f", rx: 8, ry: 8 },
            label: { text: "延迟", fill: "#ff4d4f", fontSize: 14 },
          },
          ports: portsConfig.delay,
        }),
        new Shape.Rect({
          width: 80,
          height: 36,
          attrs: {
            body: { fill: "#fff1f0", stroke: "#ff4d4f", rx: 8, ry: 8 },
            label: { text: "等待", fill: "#ff4d4f", fontSize: 14 },
          },
          ports: portsConfig.normal,
        }),
        new Shape.Rect({
          width: 80,
          height: 36,
          attrs: {
            body: { fill: "#fff1f0", stroke: "#00a2c2", rx: 8, ry: 8 },
            label: { text: "内力", fill: "#00a2c2", fontSize: 14 },
          },
          ports: portsConfig.normal,
        }),
      ];
    }, [portsConfig]);

    // 刷新颜色组件
    const refreshColorComponents = useCallback(() => {
      if (!graphRef.current?.stencil) return;

      const stencil = graphRef.current.stencil;

      // 检查 stencil 是否已经完全初始化
      if (!stencil.graphs || !stencil.graphs.colors) return;

      const colorComponents = createColorComponents(rgbs);

      try {
        stencil.unload("colors");
        stencil.load(colorComponents, "colors");
      } catch (error) {
        // console.warn("刷新颜色组件时出错:", error);
        // 如果 unload 失败，直接重新加载
        stencil.load(colorComponents, "colors");
      }
    }, [rgbs, createColorComponents]);

    // 刷新按键组件
    const refreshElementComponents = useCallback(() => {
      if (!graphRef.current?.stencil) return;

      const stencil = graphRef.current.stencil;

      // 检查 stencil 是否已经完全初始化
      if (!stencil.graphs || !stencil.graphs.elements) return;

      const elementComponents = createElementComponents(elements);

      try {
        stencil.unload("elements");
        stencil.load(elementComponents, "elements");
      } catch (error) {
        // 如果 unload 失败，直接重新加载
        stencil.load(elementComponents, "elements");
      }
    }, [elements, createElementComponents]);

    // 刷新技能组件
    const refreshSkillComponents = useCallback(() => {
      if (!graphRef.current?.stencil) return;

      const stencil = graphRef.current.stencil;

      // 检查 stencil 是否已经完全初始化
      if (!stencil.graphs || !stencil.graphs.skills) return;

      const skillComponents = createSkillComponents(skills);

      try {
        stencil.unload("skills");
        stencil.load(skillComponents, "skills");
      } catch (error) {
        // 如果 unload 失败，直接重新加载
        stencil.load(skillComponents, "skills");
      }
    }, [skills, createSkillComponents]);

    // 右键菜单处理
    const createContextMenuItems = useCallback(
      (node: any, menu: HTMLElement) => {
        const label = node.attr("label/text");
        const nodeData = node.getData();

        // 按键组件的菜单 - 添加这个新的部分
        if (nodeData?.elements_code || nodeData?.elements_key) {
          const delayBtn = document.createElement("div");
          delayBtn.className = "x6-context-menu-item";
          delayBtn.innerText = "弹起延迟";
          delayBtn.onclick = () => {
            setModalLabel("弹起延迟");
            const existingDelay = nodeData?.key_up_delay || 0;
            setModalValue(existingDelay);
            setEditingNode(node);
            setModalVisible(true);
            menu.remove();
          };
          menu.appendChild(delayBtn);
        }

        // 取色相关菜单
        if (label === "取色" || nodeData?.rgb) {
          const colorBtn = document.createElement("div");
          colorBtn.className = "x6-context-menu-item";
          colorBtn.innerText = "取色";
          colorBtn.onclick = async () => {
            try {
              const [coordinate, rgb] = await mouseRgb();
              const rgbArray = rgb.split(",").map(Number);
              const hex = `#${rgbArray
                .map((x) => x.toString(16).padStart(2, "0"))
                .join("")}`;

              node.attr("body/fill", hex);
              node.setData({ coordinate, rgb });
              messageApi.success("取色成功");
            } catch (err) {
              messageApi.error("取色失败");
            }
            menu.remove();
          };
          menu.appendChild(colorBtn);

          // 保存按钮
          const saveBtn = document.createElement("div");
          saveBtn.className = "x6-context-menu-item";
          saveBtn.innerText = "保存";
          saveBtn.onclick = () => {
            const nodeData = node.getData();
            if (nodeData?.coordinate && nodeData?.rgb) {
              setSavingColorData({
                coordinate: nodeData.coordinate,
                rgb: nodeData.rgb,
                hex: node.attr("body/fill"),
              });
              setSaveColorModalVisible(true);
            } else {
              messageApi.warning("请先取色后再保存");
            }
            menu.remove();
          };
          menu.appendChild(saveBtn);

          // 永久删除按钮
          if (nodeData?.id) {
            const deleteBtn = document.createElement("div");
            deleteBtn.className = "x6-context-menu-item";
            deleteBtn.innerText = "永久删除";
            deleteBtn.style.color = "#ff4d4f";
            deleteBtn.onclick = () => {
              modal.confirm({
                title: "确认删除",
                content: "确定要永久删除这个取色组件吗？此操作不可撤销。",
                okText: "确定",
                cancelText: "取消",
                okType: "danger",
                onOk: async () => {
                  try {
                    await deleteUserRGBApi(nodeData.id);
                    node.remove();
                    // 删除rgbs中的对应数据
                    const index = rgbs.findIndex(
                      (color) => color.id === nodeData.id
                    );
                    if (index !== -1) {
                      rgbs.splice(index, 1);
                    }
                    triggerChange();

                    // 刷新组件库
                    setTimeout(() => {
                      refreshColorComponents();
                    }, 100);
                  } catch (error) {
                    messageApi.error("删除失败");
                  }
                },
              });
              menu.remove();
            };
            menu.appendChild(deleteBtn);
          }
        }

        // 时间设置菜单
        if (
          label &&
          (label.startsWith("等待") ||
            label.startsWith("延迟") ||
            label.startsWith("内力"))
        ) {
          const setBtn = document.createElement("div");
          setBtn.className = "x6-context-menu-item";

          let type = "延迟";
          if (label.startsWith("内力")) {
            type = "内力";
            setBtn.innerText = "设置内力";
          } else if (label.startsWith("等待")) {
            type = "等待";
            setBtn.innerText = "设置等待";
          } else {
            setBtn.innerText = "设置延迟";
          }

          setBtn.onclick = () => {
            setModalLabel(type);
            const nodeData = node.getData();
            const existingValue =
              nodeData?.n ||
              (label.match(/\d+/)?.[0]
                ? parseInt(label.match(/\d+/)[0])
                : null) ||
              0;
            setModalValue(existingValue);
            setEditingNode(node);
            setModalVisible(true);
            menu.remove();
          };
          menu.appendChild(setBtn);
        }

        // 删除按钮
        const delBtn = document.createElement("div");
        delBtn.className = "x6-context-menu-item";
        delBtn.innerText = "删除";
        delBtn.onclick = () => {
          node.remove();
          menu.remove();
          triggerChange();
        };
        menu.appendChild(delBtn);

        // 取消按钮
        const cancelBtn = document.createElement("div");
        cancelBtn.className = "x6-context-menu-item";
        cancelBtn.innerText = "取消";
        cancelBtn.onclick = () => menu.remove();
        menu.appendChild(cancelBtn);
      },
      [
        messageApi,
        modal,
        deleteUserRGBApi,
        triggerChange,
        mouseRgb,
        refreshColorComponents,
      ]
    );

    const handleNodeContextMenu = useCallback(
      ({ e, node }) => {
        e.preventDefault();
        const oldMenu = document.getElementById("x6-context-menu");
        if (oldMenu) oldMenu.remove();

        const menu = document.createElement("div");
        menu.id = "x6-context-menu";
        menu.className = "x6-context-menu";
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${e.clientX}px`;

        createContextMenuItems(node, menu);
        document.body.appendChild(menu);

        const handleClick = () => {
          menu.remove();
          document.removeEventListener("click", handleClick);
        };
        setTimeout(() => document.addEventListener("click", handleClick), 0);
      },
      [createContextMenuItems]
    );

    const handleEdgeContextMenu = useCallback(
      ({ e, edge }) => {
        e.preventDefault();
        const oldMenu = document.getElementById("x6-context-menu");
        if (oldMenu) oldMenu.remove();

        const menu = document.createElement("div");
        menu.id = "x6-context-menu";
        menu.className = "x6-context-menu";
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${e.clientX}px`;

        const delBtn = document.createElement("div");
        delBtn.className = "x6-context-menu-item";
        delBtn.innerText = "删除连线";
        delBtn.onclick = () => {
          edge.remove();
          menu.remove();
          triggerChange();
        };
        menu.appendChild(delBtn);

        const cancelBtn = document.createElement("div");
        cancelBtn.className = "x6-context-menu-item";
        cancelBtn.innerText = "取消";
        cancelBtn.onclick = () => menu.remove();
        menu.appendChild(cancelBtn);

        document.body.appendChild(menu);

        const handleClick = () => {
          menu.remove();
          document.removeEventListener("click", handleClick);
        };
        setTimeout(() => document.addEventListener("click", handleClick), 0);
      },
      [triggerChange]
    );

    // Modal 处理函数
    const handleTimeEdit = useCallback(() => {
      if (editingNode && modalValue !== null) {
        if (modalLabel === "弹起延迟") {
          // 处理弹起延迟设置
          const currentData = editingNode.getData();
          editingNode.setData({
            ...currentData,
            key_up_delay: modalValue,
          });

          // 更新节点显示，可以在按键文本后添加延迟标识
          const currentLabel = editingNode.attr("label/text");
          const baseLabel = currentLabel.replace(/ \(\d+ms\)$/, ""); // 移除之前的延迟标识
          const newLabel =
            modalValue > 0 ? `${baseLabel} (${modalValue}ms)` : baseLabel;
          editingNode.attr("label/text", newLabel);

          messageApi.success(`按键弹起延迟设置为 ${modalValue}ms`);
        } else {
          // 处理其他时间设置
          const labelText =
            modalLabel === "内力"
              ? `${modalLabel} <= ${modalValue}`
              : `${modalLabel} ${modalValue}ms`;

          editingNode.attr("label/text", labelText);
          editingNode.setData({
            n: modalValue,
            t: TimeOrNamaLabel(modalLabel),
          });
        }
        triggerChange();
      }
      setModalVisible(false);
    }, [editingNode, modalValue, modalLabel, triggerChange, messageApi]);

    const handleSaveColor = useCallback(async () => {
      if (savingColorData && colorName.trim()) {
        try {
          await saveUserRGB(
            savingColorData.coordinate,
            savingColorData.rgb,
            colorName.trim()
          );
          setSaveColorModalVisible(false);
          setColorName("");
          setSavingColorData(null);
          triggerChange();
          // 刷新组件库
          setTimeout(() => {
            refreshColorComponents();
          }, 100);
        } catch (error) {
          messageApi.error("保存取色数据失败");
        }
      } else {
        messageApi.warning("请输入保存名称");
      }
    }, [
      savingColorData,
      colorName,
      saveUserRGB,
      triggerChange,
      messageApi,
      refreshColorComponents,
    ]);

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        getGraphData: () => {
          if (!graphRef.current) return { nodes: [], edges: [] };

          const graph = graphRef.current;
          const nodes = graph.getNodes().map((node) => ({
            id: node.id,
            shape: node.shape,
            x: node.position().x,
            y: node.position().y,
            width: node.size().width,
            height: node.size().height,
            label: node.attr("label/text"),
            attrs: node.attrs,
            data: node.getData(),
          }));

          const edges = graph.getEdges().map((edge) => ({
            id: edge.id,
            source: edge.getSourceCellId(),
            sourcePort: edge.getSourcePortId(),
            target: edge.getTargetCellId(),
            targetPort: edge.getTargetPortId(),
            label: edge.attr("label/text"),
            attrs: edge.attrs,
          }));

          return { nodes, edges };
        },
      }),
      []
    );

    // 初始化图形
    useEffect(() => {
      if (!containerRef.current || !stencilRef.current) return;

      const graph = new Graph({
        container: containerRef.current,
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
          // 使用曼哈顿路由，自动避开节点
          router: {
            name: "manhattan",
            args: {
              padding: 1,
            },
          },
          // 使用圆角连接器，让连线更美观
          connector: {
            name: "rounded",
            args: {
              radius: 10,
            },
          },
          // 连接点配置
          anchor: "center",
          connectionPoint: "anchor",
          allowBlank: false,
          allowLoop: false,
          allowNode: false,
          allowEdge: false,
          allowPort: true,
          highlight: true,
          // 磁吸配置
          snap: {
            radius: 20,
          },
          // 自定义连线创建
          createEdge() {
            return new Shape.Edge({
              attrs: {
                line: {
                  stroke: "#5F95FF",
                  strokeWidth: 2,
                  targetMarker: null,
                  sourceMarker: null,
                  // targetMarker: {
                  //     name: 'ellipse',
                  //     width: 8,
                  //     height: 8,
                  //     fill: '#5F95FF',
                  //     stroke: '#5F95FF',
                  //     strokeWidth: 1,
                  //     rx: 4,
                  //     ry: 4,
                  // },
                  // 或者使用自定义的圆润箭头
                  // targetMarker: {
                  //     tagName: 'path',
                  //     fill: '#5F95FF',
                  //     stroke: '#5F95FF',
                  //     strokeWidth: 1,
                  //     d: 'M 0 0 Q 5 1.5 10 3 Q 5 4.5 0 6 Q 3 3 0 0 Z',
                  // },
                  // 添加连线动画效果
                  strokeDasharray: 0,
                  style: {
                    animation: "ant-line 30s infinite linear",
                  },
                },
              },
              zIndex: 0,
              // 添加连线标签样式
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
          // 验证连接
          validateConnection({
            sourceView,
            targetView,
            sourceMagnet,
            targetMagnet,
          }) {
            // 不允许连接到自己
            if (sourceView === targetView) {
              return false;
            }
            // 必须连接到端口
            if (!sourceMagnet || !targetMagnet) {
              return false;
            }
            // 不允许重复连接
            const sourcePortId = sourceMagnet.getAttribute("port");
            const targetPortId = targetMagnet.getAttribute("port");
            const sourceNode = sourceView.cell;
            const targetNode = targetView.cell;

            // 检查是否已存在相同的连接
            const edges = graphRef.current?.getEdges() || [];
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
        // 高亮效果配置
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

      graphRef.current = graph;
      graph.use(new Snapline({ enabled: true }));

      const stencil = new Stencil({
        title: "组件库",
        target: graph,
        stencilGraphWidth: 180,
        stencilGraphHeight: 0,
        search: false,
        collapsable: true,
        groups: [
          { name: "elements", title: "按键组件" },
          { name: "colors", title: "取色组件" },
          { name: "timewait", title: "时间组件" },
          { name: "skills", title: "技能组件" },
        ],
      });

      stencilRef.current.appendChild(stencil.container);
      graph.stencil = stencil;

      // 延迟加载组件，确保 stencil 完全初始化
      setTimeout(() => {
        try {
          const elementComponents = createElementComponents(elements);
          const skillComponents = createSkillComponents(skills);
          const colorComponents = createColorComponents(rgbs);
          const timeWaitComponents = createTimeWaitComponents();

          // 安全加载各个组件
          if (elementComponents.length > 0) {
            stencil.load(elementComponents, "elements");
          }
          if (skillComponents.length > 0) {
            stencil.load(skillComponents, "skills");
          }
          if (colorComponents.length > 0) {
            stencil.load(colorComponents, "colors");
          }
          if (timeWaitComponents.length > 0) {
            stencil.load(timeWaitComponents, "timewait");
          }
        } catch (error) {
          console.error("加载 stencil 组件时出错:", error);
        }
      }, 1000); // 增加延迟时间

      // 事件监听
      graph.on("node:contextmenu", handleNodeContextMenu);
      graph.on("edge:contextmenu", handleEdgeContextMenu);

      const events = [
        "node:change:*",
        "edge:change:*",
        "node:removed",
        "edge:removed",
        "node:added",
        "edge:added",
      ];
      events.forEach((event) => graph.on(event, triggerChange));

      return () => {
        document.getElementById("x6-context-menu")?.remove();
        graph.dispose();
      };
    }, [
      createElementComponents,
      createSkillComponents,
      createColorComponents,
      createTimeWaitComponents,
      handleNodeContextMenu,
      handleEdgeContextMenu,
      triggerChange,
      // 移除 elements, skills, rgbs 依赖，避免重复初始化
    ]);

    // 更新图形数据
    useEffect(() => {
      if (!graphRef.current || (!nodes.length && !edges.length)) return;

      const processedNodes = nodes.map((node) => {
        let ports = portsConfig.delay;

        if (node.data?.elements_code === 4 || node.data?.elements_code === 5) {
          ports = portsConfig.singleY; // 单个端口
        } else if (
          node.data?.skill_name ||
          node.label === "取色" ||
          node.data?.rgb || // 添加这个条件，检查是否有RGB数据
          node.data?.coordinate || // 添加这个条件，检查是否有坐标数据
          ["等待", "内力"].some((type) => node.label?.startsWith(type))
        ) {
          ports = portsConfig.normal; // 三个端口
        }

        return { ...node, ports };
      });

      const processedEdges = edges.map((edge) => ({
        ...edge,
        source: { cell: edge.source, port: edge.sourcePort || undefined },
        target: { cell: edge.target, port: edge.targetPort || undefined },
      }));

      graphRef.current.fromJSON({
        nodes: processedNodes,
        edges: processedEdges,
      });
    }, [nodes, edges, portsConfig]);

    // 监听 elements 变化刷新组件
    useEffect(() => {
      const timer = setTimeout(() => {
        refreshElementComponents();
      }, 400);

      return () => clearTimeout(timer);
    }, [elements]);

    // 监听 skills 变化刷新组件
    useEffect(() => {
      const timer = setTimeout(() => {
        refreshSkillComponents();
      }, 100);

      return () => clearTimeout(timer);
    }, [skills]);

    // 监听 rgbs 变化刷新组件 - 保持现有代码不变
    useEffect(() => {
      const timer = setTimeout(() => {
        refreshColorComponents();
      }, 100);

      return () => clearTimeout(timer);
    }, [rgbs]);

    return (
      <>
        {contextHolder}
        {modalContextHolder}
        <div className="stencil-app">
          <div ref={stencilRef} className="app-stencil" />
          <div ref={containerRef} className="app-content" />
        </div>

        <Modal
          title={
            modalLabel === "内力"
              ? "设置内力小于等于"
              : modalLabel === "弹起延迟"
              ? "设置按键弹起延迟"
              : `设置${modalLabel}时间`
          }
          open={modalVisible}
          onOk={handleTimeEdit}
          onCancel={() => {
            setModalVisible(false);
            setModalLabel("");
            setModalValue(0);
            setEditingNode(null);
          }}
          okText="确定"
          cancelText="取消"
        >
          <InputNumber
            value={modalValue}
            onChange={setModalValue}
            placeholder={
              modalLabel === "内力"
                ? "请输入内力点数"
                : modalLabel === "弹起延迟"
                ? "请输入延迟毫秒数"
                : "请输入毫秒"
            }
            min={0}
            max={modalLabel === "弹起延迟" ? 10000 : undefined}
            style={{ width: "100%" }}
          />
        </Modal>

        <Modal
          title="保存取色数据"
          open={saveColorModalVisible}
          onOk={handleSaveColor}
          onCancel={() => {
            setSaveColorModalVisible(false);
            setColorName("");
            setSavingColorData(null);
          }}
          okText="保存"
          cancelText="取消"
        >
          <div style={{ marginBottom: 16 }}>
            <p style={{ marginBottom: 8 }}>取色信息：</p>
            {savingColorData && (
              <div
                style={{
                  padding: 8,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: savingColorData.hex,
                    border: "1px solid #d9d9d9",
                    borderRadius: 2,
                  }}
                />
                <span>坐标: {savingColorData.coordinate}</span>
                <span>RGB: {savingColorData.rgb}</span>
              </div>
            )}
          </div>
          <Input
            placeholder="请输入保存名称"
            value={colorName}
            onChange={(e) => setColorName(e.target.value)}
            onPressEnter={handleSaveColor}
            autoFocus
          />
        </Modal>
      </>
    );
  }
);

export default OperateX6;
