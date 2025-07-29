import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Graph } from "@antv/x6";
import { Snapline } from "@antv/x6-plugin-snapline";
import { Stencil } from "@antv/x6-plugin-stencil";
import { message, Modal, Input, InputNumber, Select, Checkbox } from "antd";
import { createUserRGB, deleteUserRGB } from "../../api/element";
import { generateRandomId, TimeOrNamaLabel } from "../../utils/common";
import "./OperateX6.css";
import "@antv/x6/dist/index.css";
import "@antv/x6-plugin-stencil/dist/index.css";

// 导入拆分的模块
import { NodeData, EdgeData, OperateX6Props, ColorSaveData, TimerData } from "./types";
import { createPortsConfig } from "./config";
import {
  createElementComponents,
  createSkillComponents,
  createColorComponents,
  createTimeWaitComponents,
} from "./componentFactory";
import { createContextMenuItems } from "./contextMenu";
import { createGraphConfig } from "./graphConfig";

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
    const [savingColorData, setSavingColorData] = useState<ColorSaveData | null>(null);
    const [timerModalVisible, setTimerModalVisible] = useState(false);
    const [timerName, setTimerName] = useState("");
    const [timerTime, setTimerTime] = useState<number>(0);
    const [resetTimerModalVisible, setResetTimerModalVisible] = useState(false);
    const [selectedTimerName, setSelectedTimerName] = useState("");
    const [timers, setTimers] = useState<TimerData[]>([]);
    const [timerInit, setTimerInit] = useState(false);

    // 端口配置
    const portsConfig = useMemo(() => createPortsConfig(), []);

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

    // 获取所有定时器名称
    const getTimerNames = useCallback(() => {
      if (!graphRef.current) return [];

      const nodes = graphRef.current.getNodes();
      const timerNodes = nodes.filter(node => {
        const nodeData = node.getData();
        return nodeData?.id && nodeData?.n;
      });

      return timerNodes.map(node => {
        const nodeData = node.getData();
        return {
          id: nodeData.id,
          name: nodeData.name,
          n: nodeData.n
        };
      });
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
      setTimers(getTimerNames());
    }, [onChange, getTimerNames]);

    // 刷新组件函数
    const refreshColorComponents = useCallback(() => {
      if (!graphRef.current?.stencil) return;

      const stencil = graphRef.current.stencil;
      if (!stencil.graphs || !stencil.graphs.colors) return;

      const colorComponents = createColorComponents(rgbs, portsConfig);

      try {
        stencil.unload("colors");
        stencil.load(colorComponents, "colors");
      } catch (error) {
        stencil.load(colorComponents, "colors");
      }
    }, [rgbs, portsConfig]);

    const refreshElementComponents = useCallback(() => {
      if (!graphRef.current?.stencil) return;

      const stencil = graphRef.current.stencil;
      if (!stencil.graphs || !stencil.graphs.elements) return;

      const elementComponents = createElementComponents(elements, portsConfig);

      try {
        stencil.unload("elements");
        stencil.load(elementComponents, "elements");
      } catch (error) {
        stencil.load(elementComponents, "elements");
      }
    }, [elements, portsConfig]);

    const refreshSkillComponents = useCallback(() => {
      if (!graphRef.current?.stencil) return;

      const stencil = graphRef.current.stencil;
      if (!stencil.graphs || !stencil.graphs.skills) return;

      const skillComponents = createSkillComponents(skills, portsConfig);

      try {
        stencil.unload("skills");
        stencil.load(skillComponents, "skills");
      } catch (error) {
        stencil.load(skillComponents, "skills");
      }
    }, [skills, portsConfig]);

    // 右键菜单处理
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

        const handlers = {
          setModalVisible,
          setModalLabel,
          setModalValue,
          setEditingNode,
          setTimerModalVisible,
          setTimerName,
          setTimerTime,
          setResetTimerModalVisible,
          setSelectedTimerName,
          setTimers,
          setSaveColorModalVisible,
          setSavingColorData,
          messageApi,
          modal,
          deleteUserRGBApi,
          triggerChange,
          refreshColorComponents,
          getTimerNames,
        };

        createContextMenuItems(node, menu, handlers);
        document.body.appendChild(menu);

        const handleClick = () => {
          menu.remove();
          document.removeEventListener("click", handleClick);
        };
        setTimeout(() => document.addEventListener("click", handleClick), 0);
      },
      [
        setModalVisible,
        setModalLabel,
        setModalValue,
        setEditingNode,
        setTimerModalVisible,
        setTimerName,
        setTimerTime,
        setResetTimerModalVisible,
        setSelectedTimerName,
        setTimers,
        setSaveColorModalVisible,
        setSavingColorData,
        messageApi,
        modal,
        deleteUserRGBApi,
        triggerChange,
        refreshColorComponents,
        getTimerNames,
      ]
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
          const currentData = editingNode.getData();
          editingNode.setData({
            ...currentData,
            key_up_delay: modalValue,
          });

          const currentLabel = editingNode.attr("label/text");
          const baseLabel = currentLabel.replace(/ \(\d+ms\)$/, "");
          const newLabel =
            modalValue > 0 ? `${baseLabel} (${modalValue}ms)` : baseLabel;
          editingNode.attr("label/text", newLabel);

          messageApi.success(`按键弹起延迟设置为 ${modalValue}ms`);
        } else {
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

    const handleTimerSetting = useCallback(() => {
      if (editingNode && timerName.trim() && timerTime > 0) {
        const labelText = `${timerName.trim()}(${timerTime}ms)`;
        editingNode.attr("label/text", labelText);
        editingNode.setData({
          t: TimeOrNamaLabel("定时"),
          n: timerTime,
          name: timerName.trim(),
          id: generateRandomId(),
          init: timerInit, // 新增
        });

        messageApi.success(`定时器 "${timerName.trim()}" 设置成功，时间: ${timerTime}ms`);
        triggerChange();
      } else {
        messageApi.warning("请填写定时名称和时间");
      }
      setTimerModalVisible(false);
      setTimerName("");
      setTimerTime(0);
      setTimerInit(false); // 重置
      setEditingNode(null);
    }, [editingNode, timerName, timerTime, timerInit, triggerChange, messageApi]);

    const handleResetTimerSetting = useCallback(() => {
      if (editingNode && selectedTimerName) {
        const selectedTimer = timers.find(timer => timer.name === selectedTimerName);

        const labelText = `重置定时: ${selectedTimerName}`;
        editingNode.attr("label/text", labelText);
        editingNode.setData({
          t: TimeOrNamaLabel("重置定时"),
          id: selectedTimer?.id || selectedTimerName,
          name: selectedTimerName,
        });

        messageApi.success(`重置定时器设置成功，目标: ${selectedTimerName}`);
        triggerChange();
      } else {
        messageApi.warning("请选择要重置的定时器");
      }
      setResetTimerModalVisible(false);
      setSelectedTimerName("");
      setEditingNode(null);
    }, [editingNode, selectedTimerName, timers, triggerChange, messageApi]);

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

      const graph = new Graph(createGraphConfig(containerRef.current));
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

      setTimeout(() => {
        try {
          const elementComponents = createElementComponents(elements, portsConfig);
          const skillComponents = createSkillComponents(skills, portsConfig);
          const colorComponents = createColorComponents(rgbs, portsConfig);
          const timeWaitComponents = createTimeWaitComponents(portsConfig);

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
      }, 1000);

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
      elements,
      skills,
      rgbs,
      portsConfig,
      handleNodeContextMenu,
      handleEdgeContextMenu,
      triggerChange,
    ]);

    // 更新图形数据
    useEffect(() => {
      if (!graphRef.current || (!nodes.length && !edges.length)) return;

      const processedNodes = nodes.map((node) => {
        let ports = portsConfig.delay;

        if (node.data?.elements_code === 4 || node.data?.elements_code === 5) {
          ports = portsConfig.singleY;
        } else if (
          node.data?.skill_name ||
          node.label === "取色" ||
          node.data?.rgb ||
          node.data?.coordinate ||
          node.data?.t === 2 ||
          ["内力"].some((type) => node.label?.startsWith(type)) ||
          (node.label && node.label.includes("定时:") && !node.label.includes("重置"))
        ) {
          ports = portsConfig.normal;
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

    // 监听数据变化刷新组件
    useEffect(() => {
      const timer = setTimeout(() => {
        refreshElementComponents();
      }, 400);
      return () => clearTimeout(timer);
    }, [elements]);

    useEffect(() => {
      const timer = setTimeout(() => {
        refreshSkillComponents();
      }, 100);
      return () => clearTimeout(timer);
    }, [skills]);

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

        {/* 时间设置Modal */}
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

        {/* 定时器设置Modal */}
        <Modal
          title="设置定时器"
          open={timerModalVisible}
          onOk={handleTimerSetting}
          onCancel={() => {
            setTimerModalVisible(false);
            setTimerName("");
            setTimerTime(0);
            setTimerInit(false);
            setEditingNode(null);
          }}
          okText="确定"
          cancelText="取消"
        >
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8 }}>定时名称:</label>
            <Input
              value={timerName}
              onChange={(e) => setTimerName(e.target.value)}
              placeholder="请输入定时器名称"
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8 }}>定时时间(ms):</label>
            <InputNumber
              value={timerTime}
              onChange={setTimerTime}
              placeholder="请输入定时毫秒数"
              min={0}
              max={999999}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <Checkbox checked={timerInit} onChange={e => setTimerInit(e.target.checked)}>
              是否初始化
            </Checkbox>
          </div>
        </Modal>

        {/* 重置定时器设置Modal */}
        <Modal
          title="设置重置定时器"
          open={resetTimerModalVisible}
          onOk={handleResetTimerSetting}
          onCancel={() => {
            setResetTimerModalVisible(false);
            setSelectedTimerName("");
            setEditingNode(null);
          }}
          okText="确定"
          cancelText="取消"
        >
          <div>
            <label style={{ display: "block", marginBottom: 8 }}>选择要重置的定时器:</label>
            <Select
              value={selectedTimerName}
              onChange={setSelectedTimerName}
              placeholder="请选择定时器"
              style={{ width: "100%" }}
              options={timers.map(timer => ({
                value: timer.name,
                label: timer.name || timer.id,
              }))}
            />
          </div>
          {timers.length === 0 && (
            <div style={{ color: "#999", marginTop: 8, fontSize: 12 }}>
              当前没有可用的定时器，请先创建定时器组件并设置
            </div>
          )}
        </Modal>

        {/* 保存取色数据Modal */}
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
