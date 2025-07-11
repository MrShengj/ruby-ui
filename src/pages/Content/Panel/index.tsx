import {
    Col,
    Row,
    Divider,
    Radio,
    Space,
    message,
    InputNumber,
    Switch,
    Card,
    Typography,
    Button,
    Modal,
} from "antd";
import { useRef, useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { getVersion } from '@tauri-apps/api/app';
import "./Panel.css";
import BlurCircle from "./BlurCircle";
import ActionDrawer from "./ActionDrawer";
import { invoke } from '@tauri-apps/api/core';

const Panel = () => {
    const [actionTypeValue, setActionTypeValue] = useState(1);
    const [stopAction, setStopAction] = useState(false);
    const [appVersion, setAppVersion] = useState("加载中...");
    const [hodOn, setHoldOn] = useState(100);
    const [messageApi, contextHolder] = message.useMessage();

    const blurCircleRef = useRef(null);

    // 获取应用版本号
    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const version = await getVersion();
                setAppVersion(version);
            } catch (error) {
                console.error('获取版本号失败:', error);
                setAppVersion("未知版本");
            }
        };

        const fetchHoldOn = async () => {
            const hdo = await invoke("read_user_hold_on");
            console.log("获取用户配置中的长按时间:", hdo);
            setHoldOn(hdo);
        };

        fetchVersion();
        fetchHoldOn();
    }, []);

    listen("stop_action", (event: any) => {
        // console.log("Received stop_action event:", event);
        if (event.target !== stopAction) {
            if (blurCircleRef.current) {
                blurCircleRef.current.setStatus(!event.payload);
            }
        }
    });

    // const action_type = async (event) => {
    //     setActionTypeValue(event.target.value);
    //     await invoke("change_action_type", { t: event.target.value });
    // };

    const action_type = async (event) => {
        const newValue = event.target.value;
        setActionTypeValue(newValue);
        await invoke("change_action_type", { t: newValue });

        // 模式切换时，触发自定义事件通知OperateCard重新启动
        const actionTypeChangeEvent = new CustomEvent('actionTypeChange', {
            detail: { actionType: newValue }
        });
        window.dispatchEvent(actionTypeChangeEvent);
    };

    return (
        <>
            {contextHolder}
            <div className="panel">
                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <div className="circle-container">
                            <Typography.Title level={4}>版本号: {appVersion}</Typography.Title>
                        </div>
                    </Col>
                    <Col span={24}>
                        <Divider className="gradient-divider"></Divider>
                    </Col>
                    <Col span={24}>
                        <div className="remark">
                            <span>LCtrl: 取色</span>
                            <span>F2: 暂停</span>
                            <span>F3: 恢复</span>
                        </div>
                    </Col>
                    <Col span={24}>
                        <BlurCircle ref={blurCircleRef} />
                    </Col>
                    <Col span={24}>
                        <div className="circle-container">
                            <Radio.Group onChange={action_type} value={actionTypeValue}>
                                <Space direction="vertical">
                                    <Radio value={1}>长按模式</Radio>
                                    <Radio value={2}>单击模式</Radio>
                                </Space>
                            </Radio.Group>
                        </div>
                    </Col>
                    <Col span={24}>
                        <div className="circle-container">
                            <ActionDrawer showType={actionTypeValue} />
                        </div>

                    </Col>
                    {/* <Col span={24}>
                        <div className="circle-container">
                            <Space align="center" style={{ width: '80%', justifyContent: 'space-between' }}>
                                <Typography.Text
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 500,
                                        color: '#4a5568'
                                    }}
                                >
                                    HDO:
                                </Typography.Text>
                                <InputNumber
                                    min={0}
                                    max={10000}
                                    value={hodOn}
                                    style={{
                                        width: 120,
                                        borderRadius: '6px'
                                    }}
                                    placeholder="请输入时长"
                                    size="middle"
                                    controls={{
                                        upIcon: '▲',
                                        downIcon: '▼'
                                    }}
                                    onChange={(value) => {
                                        if (value !== undefined) {
                                            setHoldOn(value);
                                            invoke("update_user_hold_on", { duration: value });
                                        }
                                    }}
                                />
                            </Space>
                        </div>
                    </Col> */}
                    <Col span={24}>
                        <div className="circle-container">
                            <Button
                                type="primary"
                                size="middle"
                                className="clean-memory-btn"
                                style={{
                                    width: '80%',
                                    borderRadius: '8px',
                                    height: '40px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    marginBottom: '20px'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
                                    e.target.style.background = 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                                    e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                                }}
                                onClick={() => {
                                    Modal.confirm({
                                        title: '确认清理内存',
                                        content: '确定要清理内存吗？此操作可能会让游戏退出。',
                                        okText: '确认清理',
                                        cancelText: '取消',
                                        okType: 'primary',
                                        onOk: async () => {
                                            try {
                                                await invoke("clean_memory");
                                                messageApi.success("内存清理成功！");
                                            } catch (error) {
                                                console.error("清理内存失败:", error);
                                            }
                                        }
                                    });
                                }}
                            >
                                <span style={{ position: 'relative', zIndex: 1 }}>
                                    🧹 清理内存
                                </span>
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div >
        </>
    )
}
export default Panel;