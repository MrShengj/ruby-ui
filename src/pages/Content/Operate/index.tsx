import "./Operate.css"
import { Card, Row, Col, message } from 'antd';
import OperateCard from "./OperateCard";
import { findOperateByUserId } from "../../../api/operate";
import React, { useEffect, useState, useRef } from "react";
import DoOperate from "../DoOperate"; // 假设你的OperateX6弹窗在DoOperate里

const Operate = () => {
    const [operates, setOperates] = useState<any[]>([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [editOpen, setEditOpen] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const hasInitialized = useRef(false);

    // 获取用户操作列表
    const getUserOperates = async () => {
        try {
            const user_id = window.sessionStorage.getItem("id");
            if (!user_id) {
                messageApi.error("用户ID未找到，请先登录");
                return;
            }
            const id = Number(user_id);
            const response = await findOperateByUserId({ id });
            // console.log(response);
            if (response.code == 200) {
                setOperates(response.data || []);
            } else {
                messageApi.error("获取操作列表失败: " + response.msg);
            }
        } catch (error) {
            messageApi.error("获取操作列表异常: " + error);
        }
    }

    // 等待 id 出现并刷新数据的方法
    const waitForIdAndRefresh = async () => {
        const checkId = () => {
            return new Promise<void>((resolve) => {
                const check = () => {
                    const id = window.sessionStorage.getItem("id");
                    const token = window.sessionStorage.getItem("token");
                    if (id && token) {
                        getUserOperates();
                        resolve();
                    } else {
                        // 每100ms检查一次
                        setTimeout(check, 500);
                    }
                };
                check();
            });
        };

        await checkId();
    };

    // 刷新数据的方法
    const refreshData = () => {
        const id = window.sessionStorage.getItem("id");
        if (id) {
            getUserOperates();
        }
    };

    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            waitForIdAndRefresh();
        }
    }, []);

    const handleEdit = (operate: any) => {
        console.log("编辑操作:", operate);
        setEditData({
            nodes: operate.operate_nodes,
            edges: operate.operate_edges,
            operate_name: operate.operate_name,
            operate_icon: operate.operate_icon, // 传入操作图标
            user_id: operate.user_id,
            id: operate.id
        });
        setEditOpen(true);
    };

    // 处理弹窗关闭并刷新数据
    const handleCloseEdit = () => {
        setEditOpen(false);
        setEditData(null);
        console.log("编辑弹窗已关闭，刷新数据");
        // 延迟刷新以确保操作完成
        setTimeout(() => {
            refreshData();
        }, 100);
    };

    return (
        <>
            {contextHolder}
            <div className="operate">
                <div className="operate-content">
                    <Row gutter={[20, 20]} justify="start">
                        {operates.map((item, idx) => (
                            <Col xs={24} sm={12} md={12} key={item.id || idx}>
                                <div>
                                    <OperateCard operate={item} onEdit={handleEdit} />
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>
            </div>
            {/* 编辑弹窗 */}
            <DoOperate
                open={editOpen}
                onClose={handleCloseEdit}
                nodes={editData?.nodes}
                edges={editData?.edges}
                operateName={editData?.operate_name}
                operateId={editData?.id}
                operateIcon={editData?.operate_icon} // 传入操作图标
                isEdit={true}
            />
        </>
    );
}

export default Operate;