import { Card, Avatar, Switch, Flex, Button, Tag, Tooltip, message } from 'antd';
import './OperateCard.css';
import React, { useState, forwardRef, useRef, useEffect } from 'react';
import { EditOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';

interface Props {
    operate: any;
    onEdit?: (operate: any) => void;
}

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

interface Element {
    elements_key: string;
    elements_code: number;
    key_up_delay?: number; // 可选属性，默认为0
}

interface Skill {
    skill_code: number;
}

interface TimeOrNama {
    id: string;
    name: string; // 可选属性，默认为空字符串
    t: number;
    n: number;
}

interface Color {
    coordinate: string;
    rgb: string;
}

// 修改 ElementEnum 类型定义
type ElementEnum = Element | Skill | TimeOrNama | Color;

interface Children {
    element: ElementEnum;
    iyn: string;
    children: Children[] | null;
}

interface Elements {
    header: Element;
    children: Children[] | null;
}

const OperateCard = forwardRef(({ operate, onEdit }: Props, ref) => {
    // 从sessionStorage获取初始状态，如果没有则默认为false
    const getInitialState = () => {
        const savedState = sessionStorage.getItem(`operate_switch_${operate.id}`);
        return savedState ? JSON.parse(savedState) : false;
    };

    const [open, setOpen] = useState(getInitialState);
    const [isHovered, setIsHovered] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    // 当open状态改变时，保存到sessionStorage
    useEffect(() => {
        sessionStorage.setItem(`operate_switch_${operate.id}`, JSON.stringify(open));
    }, [open, operate.id]);

    // 监听模式切换事件
    useEffect(() => {
        const handleActionTypeChange = async (event: CustomEvent) => {
            console.log('检测到模式切换:', event.detail.actionType);

            // 如果当前操作是开启状态，需要重新启动
            if (open) {
                console.log(`操作 ${operate.operate_name} 正在重新启动...`);

                // 先停止当前操作
                const elementsData = handleConvertOperateData();
                if (elementsData) {
                    try {
                        await invoke('down', { elements: [elementsData], t: false });
                        console.log('停止操作成功');

                        // 短暂延迟后重新启动
                        setTimeout(async () => {
                            try {
                                await invoke('run', { elements: [elementsData], t: true });
                                console.log('重新启动操作成功');
                                messageApi.success(`${operate.operate_name} 已在新模式下重新启动`);
                            } catch (error) {
                                console.error('重新启动操作失败:', error);
                                messageApi.error('重新启动操作失败');
                            }
                        }, 100);

                    } catch (error) {
                        console.error('停止操作失败:', error);
                        messageApi.error('停止操作失败');
                    }
                }
            }
        };

        // 添加事件监听器
        window.addEventListener('actionTypeChange', handleActionTypeChange as EventListener);

        // 清理函数
        return () => {
            window.removeEventListener('actionTypeChange', handleActionTypeChange as EventListener);
        };
    }, [open, operate.operate_name, messageApi]);

    // 转换函数：将 nodes 和 edges 转换为 Elements 结构
    const convertToElements = (nodes: NodeData[], edges: EdgeData[]): Elements | null => {
        if (nodes.length === 0) return null;

        // 构建节点映射，方便查找
        const nodeMap = new Map(nodes.map(node => [node.id, node]));

        // 构建边的映射，按source分组
        const edgeMap = new Map<string, EdgeData[]>();
        edges.forEach(edge => {
            const sourceId = edge.source;
            if (!edgeMap.has(sourceId)) {
                edgeMap.set(sourceId, []);
            }
            edgeMap.get(sourceId)!.push(edge);
        });

        // 找到起始节点（没有入边的节点）
        const hasIncomingEdge = new Set(edges.map(edge => edge.target));
        const startNodes = nodes.filter(node => !hasIncomingEdge.has(node.id!));

        if (startNodes.length === 0) {
            console.warn("未找到起始节点");
            return null;
        }

        // 修改转换函数
        const convertNodeToElement = (node: NodeData): ElementEnum => {
            const label = node.label || "";
            const data = node.data || {};

            // 根据节点类型转换，直接返回数据结构（不使用对象包装）
            if (data.elements_code !== undefined) {
                return {
                    elements_key: data.elements_key || label,
                    elements_code: data.elements_code,
                    key_up_delay: data.key_up_delay || 0 // 使用默认值0
                } as Element;
            } else if (data.skill_code !== undefined) {
                return {
                    skill_code: data.skill_code
                } as Skill;
            } else if (data.timeOrNama || data.t) {
                let t = 1;
                let n = 0;
                let id = data.id || "";

                if (data.timeOrNama) {
                    t = data.timeOrNama.t;
                    n = data.timeOrNama.n;
                } else {
                    console.log(data)
                    t = data.t || 1; // 默认值为1
                    n = data.n || 0; // 默认值为0
                    // // 解析逻辑保持不变
                    // if (label.includes("延迟")) {
                    //     t = 1;
                    //     const match = label.match(/(\d+)/);
                    //     n = match ? parseInt(match[1]) : 0;
                    // } else if (label.includes("重置定时")) {
                    //     t = 4;
                    //     const match = label.match(/(\d+)/);
                    //     n = match ? parseInt(match[1]) : 0;
                    // } else if (label.includes("内力")) {
                    //     t = 3;
                    //     const match = label.match(/(\d+)/);
                    //     n = match ? parseInt(match[1]) : 0;
                    // } else if (label.includes("定时")) {
                    //     t = 2;
                    //     const match = label.match(/(\d+)/);
                    //     n = match ? parseInt(match[1]) : 0;
                    // }
                }

                return {
                    id: id,
                    name: node.name || "", // 使用节点的label作为名称
                    t,
                    n
                } as TimeOrNama;
            } else if (label === "取色" || data.coordinate) {
                return {
                    coordinate: data.coordinate || "",
                    rgb: data.rgb || ""
                } as Color;
            }

            // 默认返回Element类型
            return {
                elements_key: label,
                elements_code: 0,
                key_up_delay: 0
            } as Element;
        };

        // 递归构建children结构
        const buildChildren = (nodeId: string, visitedNodes: Set<string> = new Set()): Children[] => {
            if (visitedNodes.has(nodeId)) {
                console.warn(`检测到循环引用: ${nodeId}`);
                return [];
            }

            const currentVisited = new Set(visitedNodes);
            currentVisited.add(nodeId);

            const outgoingEdges = edgeMap.get(nodeId) || [];
            const children: Children[] = [];

            outgoingEdges.forEach(edge => {
                const targetNode = nodeMap.get(edge.target);
                if (!targetNode) return;

                let iyn = "y";
                if (edge.sourcePort === "n") {
                    iyn = "n";
                } else if (edge.sourcePort === "y") {
                    iyn = "y";
                }

                const childElement = convertNodeToElement(targetNode);
                const grandChildren = buildChildren(edge.target, currentVisited);

                children.push({
                    element: childElement,
                    iyn,
                    children: grandChildren.length > 0 ? grandChildren : null
                });
            });

            return children;
        };

        // 使用第一个起始节点作为header
        const headerNode = startNodes[0];
        const headerElement = convertNodeToElement(headerNode);

        // 确保header是Element类型
        let header: Element;
        if ('elements_key' in headerElement && 'elements_code' in headerElement) {
            header = headerElement as Element;
        } else {
            // 如果header不是Element类型，创建一个默认的Element
            header = {
                elements_key: headerNode.label || "",
                elements_code: 0,
                key_up_delay: 0
            };
        }

        // 构建header的children
        const headerChildren = buildChildren(headerNode.id!);

        const result: Elements = {
            header,
            children: headerChildren.length > 0 ? headerChildren : null
        };

        // console.log("转换结果:", JSON.stringify(result, null, 2));

        return result;
    };

    // 处理操作数据转换
    const handleConvertOperateData = () => {
        let nodes = operate.operate_nodes;
        let edges = operate.operate_edges;

        if (nodes && edges) {

            const elementsData = convertToElements(nodes, edges);
            // console.log("转换后的Elements数据:", elementsData);

            // 这里可以将转换后的数据发送到后端保存
            // 或者触发其他相关操作
            return elementsData;
        }
        return null;
    };

    const click = (e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).classList.contains("ant-switch-handle") ||
            (e.target as HTMLElement).classList.contains("ant-switch-inner")
        ) {
            return;
        }

        // 双击时进行数据转换（可选）
        // const elementsData = handleConvertOperateData();
        // if (elementsData) {
        //     console.log("操作流程转换完成:", elementsData);
        // }
    };

    const handleRightClick = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    const handleSwitchClick = async (event: boolean) => {
        const status = window.sessionStorage.getItem("operate_status");
        if (status === "running" && event) {
            // 如果当前状态是运行中，且再次点击开启，则不进行任何操作
            messageApi.warning("操作已在运行中，请先停止当前操作");
            return;
        }
        setOpen(event);
        // 开关切换时可以触发数据转换和保存
        const elementsData = handleConvertOperateData();
        if (event) {
            if (elementsData) {
                console.log("启用操作 - 转换数据:", elementsData);
                // 这里可以调用API保存转换后的数据
                await invoke('run', { elements: [elementsData], t: event })
                // elementsData转换成
                window.sessionStorage.setItem("operate_status", "running");
            }
        } else {
            await invoke('down', { elements: [elementsData], t: event });
            window.sessionStorage.setItem("operate_status", "stopped");
        }
    };

    const operateLogo = () => {
        return "/new.svg"; // 默认操作图标
    }

    // 暴露转换方法给父组件使用
    React.useImperativeHandle(ref, () => ({
        convertToElements: () => handleConvertOperateData(),
        getOperateData: () => operate,
    }));

    return (
        <>
            {contextHolder}
            <div
                className="operate-card-wrapper"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <Card
                    style={{
                        width: 280,
                        marginTop: 12,
                        padding: 0,
                        position: "relative",
                        borderRadius: 12,
                        boxShadow: isHovered
                            ? '0 8px 32px rgba(0, 0, 0, 0.12)'
                            : '0 2px 8px rgba(0, 0, 0, 0.06)',
                        transition: 'all 0.3s ease',
                        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                        border: open ? '2px solid #1890ff' : '1px solid #f0f0f0',
                        background: '#ffffff',
                    }}
                    onDoubleClick={click}
                    onContextMenu={handleRightClick}
                    styles={{ body: { padding: '16px' } }}
                >
                    {/* 状态指示器 */}
                    <div className="status-indicator">
                        <div className={`status-dot ${open ? 'active' : 'inactive'}`} />
                    </div>

                    {/* 右上角开关 */}
                    <div className="switch-container">
                        <Tooltip title={open ? "点击关闭" : "点击开启"}>
                            <Switch
                                size="small"
                                checked={open}
                                className="operate-switch"
                                onChange={handleSwitchClick}
                            />
                        </Tooltip>
                    </div>

                    {/* 主要内容区域 */}
                    <div className="card-main-content">
                        <div className="card-header">
                            <div className="avatar-section">
                                <Avatar
                                    size={48}
                                    src={operate.operate_icon || operateLogo()}
                                    shape="square"
                                    style={{
                                        borderRadius: 8,
                                        border: '2px solid #f0f0f0'
                                    }}
                                />
                            </div>
                            <div className="content-section">
                                <div className="title-row">
                                    <div className="operate-title">
                                        {operate.operate_name || "未命名操作"}
                                    </div>
                                    {/* 编辑按钮 */}
                                    <div className={`edit-button ${isHovered ? 'visible' : ''}`}>
                                        <Tooltip title="编辑操作">
                                            <Button
                                                type="text"
                                                shape="circle"
                                                size="small"
                                                icon={<EditOutlined />}
                                                onClick={() => onEdit && onEdit(operate)}
                                                className="action-btn edit-btn"
                                            />
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </>

    )
});

export default OperateCard;