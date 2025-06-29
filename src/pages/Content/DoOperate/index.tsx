import { Drawer, message, Modal, Input } from "antd";
import React, { forwardRef, useEffect } from "react";
import OperateX6 from "../../../components/OperateX6";
import "./DoOperate.css";
import { getElements, getSkills } from "../../../api/element";
import { createOperate, updateOperate, deleteOperate } from "../../../api/operate"; // 添加deleteOperate导入
import { Operate } from "../../../model/operate";

interface AddOperateProps {
    open?: boolean;
    nodes?: any[];
    edges?: any[];
    operateName?: string; // 修正拼写错误
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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

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

    const getX6Elements = async () => {
        await getAllElements();
        await getAllSkills();
    }

    useEffect(() => {

        getX6Elements();

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

        // 判断nodes第一个data值是否有个elements_code属性
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
            user_id: user_id
        };

        // 如果是编辑模式，添加操作ID
        if (isEdit && operateId) {
            operate.id = operateId;
        }

        try {
            let res;
            if (isEdit) {
                // 调用更新API
                console.log("编辑操作数据:", operate);
                res = await updateOperate(operate);
            } else {
                // 调用创建API
                res = await createOperate(operate);
            }

            if (res.code === 200) {
                messageApi.success(isEdit ? "修改成功" : "保存成功");
                setIsModalOpen(false);
                // 无论是编辑还是新增，都调用抽屉关闭方法来清理状态并刷新数据
                handleDrawerClose();
                // 刷新页面
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
        setOperateName("");
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
            >
                <Input
                    placeholder="操作名称"
                    value={operateName}
                    onChange={e => setOperateName(e.target.value)}
                />
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