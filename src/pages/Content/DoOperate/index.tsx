import { Drawer, message, Modal, Input, Radio, Space, Button, Divider, Typography, Card, Avatar } from "antd";
import { SaveOutlined, DeleteOutlined, EditOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons';
import React, { forwardRef, useEffect } from "react";
import OperateX6 from "../../../components/OperateX6";
import "./DoOperate.css";
import { getElements, getSkills, getUserRGB } from "../../../api/element";
import { createOperate, updateOperate, deleteOperate } from "../../../api/operate";
import { Operate } from "../../../model/operate";

const { Title, Text } = Typography;

interface AddOperateProps {
    open?: boolean;
    nodes?: any[];
    edges?: any[];
    operateName?: string;
    operateId?: number;
    isEdit?: boolean;
    operateIcon?: string; // 添加操作图标属性
    onClose?: () => void;
}

const DoOperate = forwardRef(({ open, onClose, nodes: initialNodes, edges: initialEdges, operateName: initialOperateName, operateId, isEdit, operateIcon }: AddOperateProps, ref) => {

    const [elements, setElements] = React.useState<any[]>([]);
    const [skills, setSkills] = React.useState<any[]>([]);
    const [colors, setColors] = React.useState<any[]>([]);
    const [timeWaits, setTimeWaits] = React.useState<any[]>([]);
    const [nodes, setNodes] = React.useState<any[]>([]);
    const [edges, setEdges] = React.useState<any[]>([]);
    const [messageApi, contextHolder] = message.useMessage();
    const operateX6Ref = React.useRef<any>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [operateName, setOperateName] = React.useState("");
    const [selectedIcon, setSelectedIcon] = React.useState("/new.svg");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

    // 预设图标列表
    const iconOptions = [
        { value: "/new.svg", label: "默认", color: "#1890ff" },
        { value: "/icon/js.jpg", label: "剑士", color: "#722ed1" },
        { value: "/icon/ls.jpg", label: "力士", color: "#fa541c" },
        { value: "/icon/lj.jpg", label: "灵剑", color: "#13c2c2" },
        { value: "/icon/qg.jpg", label: "气功", color: "#52c41a" },
        { value: "/icon/qs.jpg", label: "拳师", color: "#faad14" },
        { value: "/icon/zh.jpg", label: "召唤", color: "#eb2f96" },
        { value: "/icon/ck.jpg", label: "刺客", color: "#2f54eb" },
        { value: "/icon/zs.jpg", label: "咒术", color: "#f5222d" },
    ];

    const getAllElements = async () => {
        await getElements().then((res) => {
            if (res.code === 200) {
                setElements(res.data);
            }
        }).catch((error) => {
            console.error("获取元素列表失败:", error);
        })
    }
    const getAllSkills = async () => {
        await getSkills().then((res) => {
            // console.log("获取技能列表:", res);
            if (res.code === 200) {
                let skills_get = [];
                res.data.forEach(element => {
                    // 处理每个技能元素
                    let skill_str = element.skill_code;
                    // skill_code 是数字数组
                    if (typeof skill_str === 'string') {
                        skill_str = skill_str.split(",").map((code: string) => code.trim());
                        // ['22106'] 转换成 [22106]
                        skill_str = skill_str.map((code: string) => parseInt(code, 10));
                    }
                    let skill = { skill_name: element.skill_name, skill_code: skill_str, skill_type: element.skill_type || 0, skill_offset: element.skill_offset || 0 };
                    skills_get.push(skill);
                });
                setSkills(skills_get);
                console.log("技能列表:", skills_get);
            }
        }).catch((error) => {
            console.error("获取技能列表失败:", error);
        })
    }

    const getAllColors = async () => {
        // 获取用户的取色数据
        const userId = window.sessionStorage.getItem("id");
        if (!userId) {
            messageApi.error("用户未登录，请先登录");
            return;
        }
        await getUserRGB({ user_id: Number(userId) }).then((res) => {
            if (res.code === 200) {
                // console.log("获取取色数据成功:", res.data);
                setColors(res.data);
            } else {
                messageApi.error("获取取色数据失败：" + res.msg);
            }
        }).catch((error) => {
            // console.error("获取取色数据失败:", error);
            messageApi.error("获取取色数据失败");
        });
    }

    const getX6Elements = async () => {
        await getAllElements();
        await getAllSkills();
        await getAllColors();
    }

    useEffect(() => {
        getX6Elements();
    }, []);

    useEffect(() => {
        // 如果是编辑模式，初始化数据
        if (isEdit && initialNodes && initialEdges && initialOperateName) {
            // 处理边数据，确保解析连接点信息
            const processedEdges = initialEdges.map(edge => {
                // 如果边数据是字符串，需要解析
                if (typeof edge === 'string') {
                    return JSON.parse(edge);
                }
                return edge;
            });

            const processedNodes = initialNodes.map(node => {
                // 如果节点数据是字符串，需要解析
                if (typeof node === 'string') {
                    return JSON.parse(node);
                }
                return node;
            });

            setNodes(processedNodes);
            setEdges(processedEdges);
            setOperateName(initialOperateName);

            // 设置图标，如果有传入的图标则使用，否则使用默认图标
            if (operateIcon) {
                console.log("使用传入的图标:", operateIcon);
                setSelectedIcon(operateIcon);
            }
        } else {
            // 新建模式，重置所有状态
            setNodes([]);
            setEdges([]);
            setOperateName("");
            setSelectedIcon("/new.svg"); // 新建时使用默认图标
        }
    }, [isEdit, initialNodes, initialEdges, initialOperateName, operateIcon, open]);


    const handleSave = () => {
        setIsModalOpen(true);
    };

    const handleModalOk = async () => {
        const data = operateX6Ref.current?.getGraphData?.();
        if (!data?.nodes || data.nodes.length === 0) {
            messageApi.error("请添加至少一个节点");
            return;
        }

        // 找到起始节点（没有输入边的节点）
        const findStartNode = () => {
            if (!data.edges || data.edges.length === 0) {
                // 如果没有边，返回第一个节点
                return data.nodes[0];
            }

            // 获取所有有输入边的节点ID
            const nodesWithInput = new Set(data.edges.map(edge => edge.target?.cell || edge.target));

            // 找到没有输入边的节点（起始节点）
            const startNodes = data.nodes.filter(node => !nodesWithInput.has(node.id));

            if (startNodes.length === 0) {
                // 如果所有节点都有输入边（形成环），返回第一个节点
                return data.nodes[0];
            }

            if (startNodes.length > 1) {
                // 如果有多个起始节点，返回第一个
                console.warn("检测到多个起始节点，使用第一个:", startNodes);
            }

            return startNodes[0];
        };

        const startNode = findStartNode();

        if (!startNode) {
            messageApi.error("未找到起始节点");
            return;
        }
        // 检查起始节点是否是按键组件
        if (!startNode.data?.elements_code && !startNode.data?.elements_key) {
            // console.log("起始节点数据:", startNode);
            messageApi.error("起始节点必须是按键组件");
            return;
        }
        if (operateName.trim() === "") {
            messageApi.error("操作名称不能为空");
            return;
        }
        let user_id = window.sessionStorage.getItem("id");
        if (!user_id) {
            messageApi.error("用户未登录，请先登录");
            return;
        }

        let operate: Operate = {
            operate_name: operateName,
            operate_nodes: JSON.stringify(data?.nodes),
            operate_edges: JSON.stringify(data?.edges),
            operate_icon: selectedIcon, // 使用当前选择的图标
            user_id: Number(user_id),
        };
        if (isEdit && operateId) {
            operate.id = operateId;
        }

        try {
            let res;
            console.log("操作数据:", operate);
            if (isEdit) {
                res = await updateOperate(operate);
            } else {
                res = await createOperate(operate);
            }

            if (res.code === 200) {
                messageApi.success(isEdit ? "修改成功" : "保存成功");
                setIsModalOpen(false);
                // 只在新建模式下重置操作名称，编辑模式保持不变
                if (!isEdit) {
                    setOperateName("");
                    setSelectedIcon("/new.svg");
                }
                handleDrawerClose();
                window.location.reload();
            } else {
                messageApi.error((isEdit ? "修改失败：" : "保存失败：") + res.message);
            }
        } catch (error) {
            console.error(isEdit ? "修改操作失败:" : "保存操作失败:", error);
            messageApi.error(isEdit ? "修改失败" : "保存失败");
        }
    };

    const handleModalCancel = () => {
        setIsModalOpen(false);
        // 不重置操作名称和图标选择，保持用户当前的选择
    };

    const handleDelete = () => {
        if (!isEdit || !operateId) {
            messageApi.warning("只有编辑模式下才能删除操作");
            return;
        }
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!operateId) {
            messageApi.error("操作ID不存在");
            return;
        }

        try {
            let id = operateId;
            const res = await deleteOperate({ id });
            if (res.code === 200) {
                messageApi.success("删除成功");
                setIsDeleteModalOpen(false);
                // 调用抽屉关闭方法来清理状态并刷新数据
                handleDrawerClose();
            } else {
                messageApi.error("删除失败：" + res.message);
            }
        } catch (error) {
            console.error("删除操作失败:", error);
            messageApi.error("删除失败");
        }
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalOpen(false);
    };

    // 处理抽屉关闭
    const handleDrawerClose = () => {
        // 清理状态
        setNodes([]);
        setEdges([]);
        setOperateName("");
        setSelectedIcon("/new.svg"); // 关闭时重置为默认图标
        setIsModalOpen(false);
        setIsDeleteModalOpen(false);

        // 调用父组件的关闭回调
        // console.log("抽屉关闭. 执行回调");
        if (onClose) onClose();
    };

    // 自定义抽屉标题
    const DrawerTitle = () => (
        <div className="drawer-header">
            <div className="drawer-title-content">
                <div className="drawer-title-icon">
                    {isEdit ? <EditOutlined /> : <PlusOutlined />}
                </div>
                <div className="drawer-title-text">
                    <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
                        {isEdit ? "修改操作" : "新增操作"}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {isEdit ? "编辑现有的自动化操作流程" : "创建新的自动化操作流程"}
                    </Text>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {contextHolder}
            <Drawer
                open={open}
                onClose={handleDrawerClose}
                title={<DrawerTitle />}
                width={900}
                className="modern-drawer"
                styles={{
                    header: {
                        borderBottom: '1px solid #f0f0f0',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: '16px 24px',
                    },
                    body: {
                        padding: 0,
                        background: '#fafafa',
                    }
                }}
                closeIcon={<CloseOutlined style={{ color: '#fff', fontSize: '16px' }} />}
            >
                <div className="drawer-content">
                    {/* 工具栏 */}
                    <div className="drawer-toolbar">
                        <div className="toolbar-info">
                            <Text strong style={{ color: '#1f2937' }}>操作设计器</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                拖拽组件到画布中设计您的自动化流程
                            </Text>
                        </div>
                    </div>

                    {/* X6 编辑器容器 */}
                    <div className="x6-container">
                        <OperateX6
                            ref={operateX6Ref}
                            elements={elements}
                            skills={skills}
                            rgbs={colors}
                            nodes={nodes}
                            edges={edges}
                        />
                    </div>

                    {/* 底部操作栏 */}
                    <div className="drawer-footer">
                        <div className="footer-content">
                            <div className="footer-info">
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    💡 提示：起始节点必须是按键组件
                                </Text>
                            </div>
                            <div className="footer-actions">
                                <Button
                                    size="large"
                                    onClick={handleDrawerClose}
                                    style={{ marginRight: 12 }}
                                >
                                    取消
                                </Button>
                                {isEdit && (
                                    <Button
                                        size="large"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={handleDelete}
                                        style={{ marginRight: 12 }}
                                    >
                                        删除
                                    </Button>
                                )}
                                <Button
                                    size="large"
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    onClick={handleSave}
                                    className="save-button"
                                >
                                    {isEdit ? "修改" : "保存"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Drawer>

            {/* 美化后的保存模态框 */}
            <Modal
                title={
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
                            {isEdit ? "修改操作配置" : "保存操作配置"}
                        </Title>
                        <Text type="secondary">
                            {isEdit ? "修改操作名称和图标" : "为您的操作设置名称和图标"}
                        </Text>
                    </div>
                }
                open={isModalOpen}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                okText="确定"
                cancelText="取消"
                width={700}
                className="modern-modal"
                okButtonProps={{
                    size: 'large',
                    icon: <SaveOutlined />
                }}
                cancelButtonProps={{
                    size: 'large'
                }}
            >
                <div style={{ padding: '20px 0' }}>
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        {/* 操作名称输入 */}
                        <Card
                            size="small"
                            title="操作名称"
                            className="config-card"
                        >
                            <Input
                                placeholder="请输入操作名称（例如：自动攻击、技能循环等）"
                                value={operateName}
                                onChange={e => setOperateName(e.target.value)}
                                size="large"
                                style={{ fontSize: '14px' }}
                                maxLength={20}
                                showCount
                            />
                        </Card>

                        {/* 图标选择 */}
                        <Card
                            size="small"
                            title="选择图标"
                            className="config-card"
                        >
                            <Radio.Group
                                value={selectedIcon}
                                onChange={e => setSelectedIcon(e.target.value)}
                                style={{ width: '100%' }}
                            >
                                <div className="icon-grid">
                                    {iconOptions.map(icon => (
                                        <div key={icon.value} className="icon-item">
                                            <Radio.Button
                                                value={icon.value}
                                                className={`icon-radio ${selectedIcon === icon.value ? 'selected' : ''}`}
                                            >
                                                <div className="icon-content">
                                                    <Avatar
                                                        src={icon.value}
                                                        size={40}
                                                        style={{
                                                            border: selectedIcon === icon.value ? `2px solid ${icon.color}` : '2px solid #f0f0f0',
                                                            marginBottom: '8px'
                                                        }}
                                                    />
                                                    <Text
                                                        style={{
                                                            fontSize: '12px',
                                                            color: selectedIcon === icon.value ? icon.color : '#666',
                                                            fontWeight: selectedIcon === icon.value ? 'bold' : 'normal'
                                                        }}
                                                    >
                                                        {icon.label}
                                                    </Text>
                                                </div>
                                            </Radio.Button>
                                        </div>
                                    ))}
                                </div>
                            </Radio.Group>
                        </Card>
                    </Space>
                </div>
            </Modal>

            {/* 美化后的删除确认模态框 */}
            <Modal
                title={
                    <div style={{ textAlign: 'center', color: '#ff4d4f' }}>
                        <DeleteOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                        <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>
                            确认删除操作
                        </Title>
                    </div>
                }
                open={isDeleteModalOpen}
                onOk={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                okText="确定删除"
                cancelText="取消"
                okButtonProps={{
                    danger: true,
                    size: 'large',
                    icon: <DeleteOutlined />
                }}
                cancelButtonProps={{ size: 'large' }}
                className="delete-modal"
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Text style={{ fontSize: '16px' }}>
                        确定要删除操作 <Text strong style={{ color: '#1890ff' }}>"{operateName}"</Text> 吗？
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                        此操作不可撤销，删除后将无法恢复。
                    </Text>
                </div>
            </Modal>
        </>
    );
});

export default DoOperate;