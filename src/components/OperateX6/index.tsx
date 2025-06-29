import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Graph, Shape } from "@antv/x6";
import { Snapline } from "@antv/x6-plugin-snapline";
import { Stencil } from "@antv/x6-plugin-stencil";
import "./OperateX6.css";
import "@antv/x6/dist/index.css";
import "@antv/x6-plugin-stencil/dist/index.css";
import { invoke } from "@tauri-apps/api/core";

import { message, Modal, Input } from "antd";

interface NodeData {
    id?: string;
    shape?: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    label?: string;
    attrs?: any;
    data?: any; // 用于存储额外数据
}

interface EdgeData {
    id?: string;
    source: string;
    target: string;
    label?: string;
    attrs?: any;
}

interface OperateX6Props {
    nodes?: NodeData[];
    edges?: EdgeData[];
    elements?: any[];
    skills?: any[];
    onChange?: (nodes: NodeData[], edges: EdgeData[]) => void;
}

const OperateX6 = forwardRef(({ nodes, edges, elements, skills, onChange }: OperateX6Props, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stencilRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<Graph | null>(null);
    const [messageApi, contextHolder] = message.useMessage();

    const [modalVisible, setModalVisible] = React.useState(false);
    const [modalLabel, setModalLabel] = React.useState(""); // "等待" 或 "延迟"
    const [modalValue, setModalValue] = React.useState(""); // 输入值
    const [editingNode, setEditingNode] = React.useState<any>(null);

    const portsGroup = {
        groups: {
            top: {
                position: 'top',
                attrs: {
                    circle: {
                        r: 6,
                        magnet: true,
                        stroke: '#1890ff',
                        strokeWidth: 2,
                        fill: '#1890ff',
                    },
                },
            },
            bottom: {
                position: 'bottom',
                attrs: {
                    circle: {
                        r: 6,
                        magnet: true,
                        stroke: '#52c41a',
                        strokeWidth: 2,
                        fill: '#52c41a',
                    },
                },
            },
            bottomGreen: {
                position: { name: 'bottom', args: { dx: 15 } },
                attrs: {
                    circle: {
                        r: 6,
                        magnet: true,
                        stroke: '#52c41a',
                        strokeWidth: 2,
                        fill: '#52c41a',
                    },
                },
            },
            bottomRed: {
                position: { name: 'bottom', args: { dx: -15 } },
                attrs: {
                    circle: {
                        r: 6,
                        magnet: true,
                        stroke: '#ff4d4f',
                        strokeWidth: 2,
                        fill: '#ff4d4f',
                    },
                },
            },
        },
        // items: [
        //     { id: 'i', group: 'top' },
        //     { id: 'y', group: 'bottomGreen' },
        //     { id: 'n', group: 'bottomRed' },
        // ],
    }

    // 不同类型节点的连接点配置
    const normalPorts = {
        groups: portsGroup.groups,
        items: [
            { id: 'i', group: 'top' },
            { id: 'y', group: 'bottomGreen' },
            { id: 'n', group: 'bottomRed' },
        ],
    };

    const singleYPorts = {
        groups: portsGroup.groups,
        items: [
            { id: 'y', group: 'bottom' },
        ],
    };

    const delayPorts = {
        groups: portsGroup.groups,
        items: [
            { id: 'i', group: 'top' },
            { id: 'y', group: 'bottom' },
        ],
    };
    // 监听节点和边变化
    const triggerChange = () => {
        if (onChange) {
            const nodes = graph.getNodes().map(node => ({
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
            const edges = graph.getEdges().map(edge => ({
                id: edge.id,
                source: edge.getSourceCellId(),
                sourcePort: edge.getSourcePortId(), // 新增：起点连接点id
                target: edge.getTargetCellId(),
                targetPort: edge.getTargetPortId(), // 新增：终点连接点id
                label: edge.attr("label/text"),
                attrs: edge.attrs,
            }));
            onChange(nodes, edges);
        }
    };

    const mouseRgb = async () => {
        const now_mouse_rgb: string = await invoke("get_mouse_rgb");
        return now_mouse_rgb.split("|");
    };

    useImperativeHandle(ref, () => ({
        getGraphData: () => {
            if (!graphRef.current) return { nodes: [], edges: [] };
            const graph = graphRef.current;
            const nodes = graph.getNodes().map(node => ({
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
            const edges = graph.getEdges().map(edge => ({
                id: edge.id,
                source: edge.getSourceCellId(),
                sourcePort: edge.getSourcePortId(), // 新增：起点连接点id
                target: edge.getTargetCellId(),
                targetPort: edge.getTargetPortId(), // 新增：终点连接点id
                label: edge.attr("label/text"),
                attrs: edge.attrs,
            }));
            return { nodes, edges };
        }
    }));

    // 初始化画布和插件
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
            mousewheel: true,
            connecting: {
                // 只允许连接桩对连接桩
                sourceAnchor: 'center',
                targetAnchor: 'center',
                allowBlank: false,
                allowLoop: false,
                highlight: true,
                snap: true,
                allowNode: false, // 不允许连接到节点本身
                allowEdge: false, // 不允许连接到边
                allowPort: true,  // 只允许连接到端口（桩）
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

        // 防止 stencil 容器重复 append
        // if (!stencilRef.current.querySelector('.x6-widget-stencil')) {
        // stencilRef.current.appendChild(stencil.container);
        // }
        stencilRef.current.appendChild(stencil.container);

        const e: any[] = [];  // 基础按键元素
        const s: any[] = []; // 技能元素
        const c: any[] = []; // 取色元素
        const t: any[] = []; // 时间等待元素

        const elementsData = async () => {
            for (const element of elements || []) {
                let labelColor = "#1890ff"; // 默认浅蓝色
                let ports = delayPorts; // 默认使用标准连接点

                if (element.elements_code === 4 || element.elements_code === 5) {
                    labelColor = "#003a8c"; // 深蓝色
                    ports = singleYPorts; // 侧上和侧下只设置1个y连接点
                }
                const rect = new Shape.Rect({
                    width: 60,
                    height: 36,
                    attrs: {
                        body: { fill: "#fffbe6", stroke: labelColor, rx: 8, ry: 8 },
                        label: { text: element.elements_key || "按键", fill: labelColor, fontSize: 14 },
                    },
                    ports: ports,
                    data: {
                        elements_code: element.elements_code,
                        elements_key: element.elements_key,
                    },

                });
                e.push(rect);
            }
        }

        const skillsData = async () => {
            for (const skill of skills || []) {
                const rect = new Shape.Rect({
                    width: 80,
                    height: 36,
                    attrs: {
                        body: { fill: "#e6fffb", stroke: "#13c2c2", rx: 8, ry: 8 },
                        label: { text: skill.skill_name || "技能", fill: "#13c2c2", fontSize: 14 },
                    },
                    ports: normalPorts,
                    data: {
                        skill_name: skill.skill_name,
                        skill_code: skill.skill_code,
                    },

                });
                s.push(rect);
            }
        }

        const colorsData = async () => {
            const rect = new Shape.Rect({
                width: 80,
                height: 36,
                attrs: {
                    body: { fill: "#f0f5ff", stroke: "#2f54eb", rx: 8, ry: 8 },
                    label: { text: "取色", fill: "#2f54eb", fontSize: 14 },
                },
                ports: normalPorts,
            });
            c.push(rect);
        }

        const timeWaitsData = async () => {
            const rect = new Shape.Rect({
                width: 80,
                height: 36,
                attrs: {
                    body: { fill: "#fff1f0", stroke: "#ff4d4f", rx: 8, ry: 8 },
                    label: { text: "延迟", fill: "#ff4d4f", fontSize: 14 },
                },
                ports: delayPorts,

            });
            t.push(rect);
            const rect1 = new Shape.Rect({
                width: 80,
                height: 36,
                attrs: {
                    body: { fill: "#fff1f0", stroke: "#ff4d4f", rx: 8, ry: 8 },
                    label: { text: "等待", fill: "#ff4d4f", fontSize: 14 },
                },
                ports: normalPorts,

            });
            t.push(rect1);
            const rect2 = new Shape.Rect({
                width: 80,
                height: 36,
                attrs: {
                    body: { fill: "#fff1f0", stroke: "#00a2c2", rx: 8, ry: 8 },
                    label: { text: "内力", fill: "#00a2c2", fontSize: 14 },
                },
                ports: normalPorts,

            });
            t.push(rect2);
        }

        const loadData = () => {
            elementsData();
            skillsData();
            colorsData();
            timeWaitsData();
        }
        // // 如果有传入数据则加载
        loadData();

        // 加载到不同分组
        stencil.load(e, "elements");
        stencil.load(s, "skills");
        stencil.load(c, "colors");
        stencil.load(t, "timewait");

        // 右键菜单
        graph.on("node:contextmenu", ({ e, node }) => {
            e.preventDefault();
            const oldMenu = document.getElementById("x6-context-menu");
            if (oldMenu) oldMenu.remove();

            const menu = document.createElement("div");
            menu.id = "x6-context-menu";
            menu.className = "x6-context-menu";
            menu.style.top = `${e.clientY}px`;
            menu.style.left = `${e.clientX}px`;

            // 删除
            const delBtn = document.createElement("div");
            delBtn.className = "x6-context-menu-item";
            delBtn.innerText = "删除";
            delBtn.onclick = () => {
                node.remove();
                menu.remove();
                triggerChange();
            };
            menu.appendChild(delBtn);

            const label = node.attr("label/text");
            if (label === "取色") {
                const colorBtn = document.createElement("div");
                colorBtn.className = "x6-context-menu-item";
                colorBtn.innerText = "取色";
                colorBtn.onclick = () => {
                    // 这里可以调用取色逻辑
                    mouseRgb().then((res) => {
                        // 设置label字体颜色
                        // rgb需要转换成#000000格式
                        const rgb = res[1].split(",").map(Number);
                        const hex = `#${rgb.map(x => x.toString(16).padStart(2, '0')).join('')}`;
                        node.attr("label/fill", hex);
                        node.setData({ coordinate: res[0], rgb: res[1] }); // 存储颜色到节点数据
                        messageApi.success("取色成功");
                    }).catch((err) => {
                        console.log("取色失败:", err);
                        messageApi.error("取色失败", err);
                    });
                    menu.remove();
                };
                menu.appendChild(colorBtn);
            }

            // 等待/延迟设置（仅 timewait 分组）
            if (label && (label.startsWith("等待") || label.startsWith("延迟") || label.startsWith("内力"))) {
                const setBtn = document.createElement("div");
                setBtn.className = "x6-context-menu-item";
                // 动态取类型
                let type = "延迟";
                if (label.startsWith("内力")) {
                    type = "内力";
                    setBtn.innerText = "设置内力";
                } else if (label.startsWith("等待")) {
                    type = "等待";
                    setBtn.innerText = "设置等待";
                } else {
                    type = "延迟";
                    setBtn.innerText = "设置延迟";
                }
                // const type = label.startsWith("等待") ? "等待" : "延迟";
                // setBtn.innerText = `设置${type}`;
                setBtn.onclick = () => {
                    setModalLabel(type);
                    const nodeData = node.getData();
                    let existingValue = "";
                    if (nodeData && nodeData.waitValue) {
                        existingValue = nodeData.waitValue;
                    } else if (label) {
                        const match = label.match(/\d+/);
                        existingValue = match ? match[0] : "";
                    }
                    // 提取已设置的值用于回显
                    setModalValue(existingValue);
                    setEditingNode(node);
                    setModalVisible(true);
                    menu.remove();
                };
                menu.appendChild(setBtn);
            }


            // 取消
            const cancelBtn = document.createElement("div");
            cancelBtn.className = "x6-context-menu-item";
            cancelBtn.innerText = "取消";
            cancelBtn.onclick = () => {
                menu.remove();
            };
            menu.appendChild(cancelBtn);

            document.body.appendChild(menu);

            // 点击其他地方关闭菜单
            const handleClick = () => {
                menu.remove();
                document.removeEventListener("click", handleClick);
            };
            setTimeout(() => {
                document.addEventListener("click", handleClick);
            }, 0);
        });

        // 新增：右键菜单-连线
        graph.on("edge:contextmenu", ({ e, edge }) => {
            e.preventDefault();
            const oldMenu = document.getElementById("x6-context-menu");
            if (oldMenu) oldMenu.remove();

            const menu = document.createElement("div");
            menu.id = "x6-context-menu";
            menu.className = "x6-context-menu";
            menu.style.top = `${e.clientY}px`;
            menu.style.left = `${e.clientX}px`;

            // 删除
            const delBtn = document.createElement("div");
            delBtn.className = "x6-context-menu-item";
            delBtn.innerText = "删除连线";
            delBtn.onclick = () => {
                edge.remove();
                menu.remove();
                triggerChange();
            };
            menu.appendChild(delBtn);

            // 取消
            const cancelBtn = document.createElement("div");
            cancelBtn.className = "x6-context-menu-item";
            cancelBtn.innerText = "取消";
            cancelBtn.onclick = () => {
                menu.remove();
            };
            menu.appendChild(cancelBtn);

            document.body.appendChild(menu);

            // 点击其他地方关闭菜单
            const handleClick = () => {
                menu.remove();
                document.removeEventListener("click", handleClick);
            };
            setTimeout(() => {
                document.addEventListener("click", handleClick);
            }, 0);
        });

        // 渲染初始数据
        if (nodes.length || edges.length) {
            graph.fromJSON({ nodes, edges });
        }

        graph.on("node:change:*", triggerChange);
        graph.on("edge:change:*", triggerChange);
        graph.on("node:removed", triggerChange);
        graph.on("edge:removed", triggerChange);
        graph.on("node:added", triggerChange);
        graph.on("edge:added", triggerChange);

        // 清理
        return () => {
            document.getElementById("x6-context-menu")?.remove();
            graph.dispose();
        };
        // eslint-disable-next-line
    }, []);

    // 在 useEffect 中也需要更新节点数据处理逻辑
    useEffect(() => {
        if (graphRef.current && (nodes?.length || edges?.length)) {
            // 处理节点数据，根据节点类型设置对应的ports配置
            const processedNodes = nodes?.map(node => {
                let ports = delayPorts; // 默认使用delayPorts

                // 根据节点数据判断连接点类型
                if (node.data?.elements_code === 4 || node.data?.elements_code === 5) {
                    ports = singleYPorts; // 侧上和侧下只有y连接点
                } else if (node.data?.skill_name || node.label === "取色" || node.label === "等待" || node.label === "内力" ||
                    (node.label && (node.label.startsWith("等待") || node.label.startsWith("内力")))) {
                    ports = normalPorts; // 技能、取色、等待、内力使用标准连接点
                } else {
                    ports = delayPorts; // 其他类型使用delayPorts
                }

                return {
                    ...node,
                    ports: ports
                };
            }) || [];

            // 处理边数据，确保包含连接点信息
            const processedEdges = edges?.map(edge => ({
                ...edge,
                source: {
                    cell: edge.source,
                    port: edge.sourcePort || undefined
                },
                target: {
                    cell: edge.target,
                    port: edge.targetPort || undefined
                }
            })) || [];

            graphRef.current.fromJSON({
                nodes: processedNodes,
                edges: processedEdges
            });
        }
    }, [JSON.stringify(nodes), JSON.stringify(edges), elements, skills]);

    return (
        <>
            {contextHolder}
            <div className="stencil-app">
                <div ref={stencilRef} className="app-stencil" />
                <div ref={containerRef} className="app-content" />
            </div>
            <Modal
                title={
                    modalLabel === "内力"
                        ? "设置内力小于等于"
                        : `设置${modalLabel}时间`
                }
                open={modalVisible}
                onOk={() => {
                    if (editingNode) {
                        if (modalLabel === "内力") {
                            editingNode.attr("label/text", `${modalLabel} <= ${modalValue}`);
                        } else {
                            editingNode.attr("label/text", `${modalLabel} ${modalValue}ms`);
                        }
                        editingNode.setData({ waitValue: modalValue, waitType: modalLabel });
                        triggerChange();
                    }
                    setModalVisible(false);
                }}
                onCancel={() => {
                    setModalVisible(false);
                    setModalValue(""); // 可选：关闭时清空输入
                }}
                // onCancel={() => setModalVisible(false)}
                okText="确定"
                cancelText="取消"
            >
                <Input
                    value={modalValue}
                    onChange={e => setModalValue(e.target.value)}
                    placeholder={
                        modalLabel === "内力"
                            ? "请输入内力点数"
                            : `请输入毫秒`
                    }
                    type="number"
                />
            </Modal>
        </>
    );
});

export default OperateX6;