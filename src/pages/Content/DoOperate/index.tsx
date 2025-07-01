import { Drawer, message, Modal, Input, Radio, Space } from "antd";
import React, { forwardRef, useEffect } from "react";
import OperateX6 from "../../../components/OperateX6";
import "./DoOperate.css";
import { getElements, getSkills, getUserRGB } from "../../../api/element";
import { createOperate, updateOperate, deleteOperate } from "../../../api/operate";
import { Operate } from "../../../model/operate";

interface AddOperateProps {
    open?: boolean;
    nodes?: any[];
    edges?: any[];
    operateName?: string;
    operateId?: number;
    isEdit?: boolean;
    onClose?: () => void;
}

const DoOperate = forwardRef(({ open, onClose, nodes: initialNodes, edges: initialEdges, operateName: initialOperateName, operateId, isEdit }: AddOperateProps, ref) => {

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
    const [selectedIcon, setSelectedIcon] = React.useState("/new.svg"); // 默认图标
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

    // 预设图标列表
    const iconOptions = [
        { value: "/new.svg", label: "默认" },
        { value: "/icon/js.jpg", label: "剑士" },
        { value: "/icon/ls.jpg", label: "力士" },
        { value: "/icon/lj.jpg", label: "灵剑" },
        { value: "/icon/qg.jpg", label: "气功" },
        { value: "/icon/qs.jpg", label: "拳师" },
        { value: "/icon/zh.jpg", label: "召唤" },
        { value: "/icon/ck.jpg", label: "刺客" },
        { value: "/icon/zs.jpg", label: "咒术" },
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
            if (res.code === 200) {
                setSkills(res.data);
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
                console.log("获取取色数据成功:", res.data);
                setColors(res.data);
            } else {
                messageApi.error("获取取色数据失败：" + res.msg);
            }
        }).catch((error) => {
            console.error("获取取色数据失败:", error);
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
        }

    }, [isEdit, initialNodes, initialEdges, initialOperateName, open]);


    const handleSave = () => {
        setIsModalOpen(true);
    };

    const handleModalOk = async () => {
        const data = operateX6Ref.current?.getGraphData?.();

        if (data?.nodes.length === 0 || !data?.nodes[0].data?.elements_code) {
            messageApi.error("起始必须是按键组件");
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
            operate_icon: selectedIcon, // 添加图标字段
            user_id: Number(user_id),
        };

        if (isEdit && operateId) {
            operate.id = operateId;
        }

        try {
            let res;
            if (isEdit) {
                console.log("编辑操作数据:", operate);
                res = await updateOperate(operate);
            } else {
                res = await createOperate(operate);
            }

            if (res.code === 200) {
                messageApi.success(isEdit ? "修改成功" : "保存成功");
                setIsModalOpen(false);
                setOperateName("");
                setSelectedIcon("/icon/js.jpg"); // 重置图标选择
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
        // setOperateName("");
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
        setSelectedIcon("/icon/js.jpg"); // 重置图标选择
        setIsModalOpen(false);
        setIsDeleteModalOpen(false);

        // 调用父组件的关闭回调
        console.log("抽屉关闭. 执行回调");
        if (onClose) onClose();
    };

    return (
        <>
            {contextHolder}
            <Drawer
                open={open}
                onClose={handleDrawerClose}
                title={isEdit ? "修改操作" : "新增操作"}
                width={800}
            >
                <OperateX6
                    ref={operateX6Ref}
                    elements={elements}
                    skills={skills}
                    rgbs={colors}
                    nodes={nodes}
                    edges={edges}
                />
                {/* 右下角操作按钮 */}
                <div className="x6-action">
                    <button
                        className="x6-action-success-button"
                        onClick={handleSave}
                    >
                        {isEdit ? "修改" : "保存"}
                    </button>
                    {isEdit && (
                        <button
                            className="x6-action-danger-button"
                            onClick={handleDelete}
                        >
                            删除
                        </button>
                    )}
                </div>
            </Drawer>
            <Modal
                title={isEdit ? "修改操作名称" : "请输入操作名称"}
                open={isModalOpen}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                okText="确定"
                cancelText="取消"
                width={600}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div>
                        <label style={{ marginBottom: 8, display: 'block', fontWeight: 500 }}>
                            操作名称
                        </label>
                        <Input
                            placeholder="请输入操作名称"
                            value={operateName}
                            onChange={e => setOperateName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={{ marginBottom: 12, display: 'block', fontWeight: 500 }}>
                            选择图标
                        </label>
                        <Radio.Group
                            value={selectedIcon}
                            onChange={e => setSelectedIcon(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '12px',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                padding: '8px'
                            }}>
                                {iconOptions.map(icon => (
                                    <Radio.Button
                                        key={icon.value}
                                        value={icon.value}
                                        style={{
                                            height: '80px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '8px',
                                            border: selectedIcon === icon.value ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                            borderRadius: '6px',
                                            background: selectedIcon === icon.value ? '#f0f8ff' : '#fff'
                                        }}
                                    >
                                        <img
                                            src={icon.value}
                                            alt={icon.label}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                objectFit: 'cover',
                                                borderRadius: '4px',
                                                marginBottom: '4px'
                                            }}
                                            onError={(e) => {
                                                // 图片加载失败时显示默认图标
                                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNiA4QzEyIDggOCAxMiA4IDE2UzEyIDI0IDE2IDI0UzI0IDIwIDI0IDE2UzIwIDggMTYgOFoiIGZpbGw9IiNEOUQ5RDkiLz4KPC9zdmc+';
                                            }}
                                        />
                                        <span style={{
                                            fontSize: '11px',
                                            textAlign: 'center',
                                            lineHeight: '1.2',
                                            color: selectedIcon === icon.value ? '#1890ff' : '#666'
                                        }}>
                                            {icon.label}
                                        </span>
                                    </Radio.Button>
                                ))}
                            </div>
                        </Radio.Group>
                    </div>
                </Space>
            </Modal>
            <Modal
                title="确认删除"
                open={isDeleteModalOpen}
                onOk={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                okText="确定删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
            >
                <p>确定要删除操作 "{operateName}" 吗？此操作不可撤销。</p>
            </Modal>
        </>

    );
});

export default DoOperate;