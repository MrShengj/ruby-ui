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
} from "antd";
import { useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import "./Panel.css";
import BlurCircle from "./BlurCircle";
import ActionDrawer from "./ActionDrawer";
import { invoke } from '@tauri-apps/api/core';

const Panel = () => {
    const [actionTypeValue, setActionTypeValue] = useState(1);
    const [stopAction, setStopAction] = useState(false);

    const blurCircleRef = useRef(null);

    listen("stop_action", (event: any) => {
        // console.log("Received stop_action event:", event);
        if (event.target !== stopAction) {
            if (blurCircleRef.current) {
                blurCircleRef.current.setColorName(event.payload);
            }
        }
    });

    const action_type = async (event) => {
        setActionTypeValue(event.target.value);
        await invoke("change_action_type", { t: event.target.value });
    };

    return (
        <div className="panel">2222222
            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <div className="circle-container">
                        <Typography.Title level={4}>版本号: 0.1.0</Typography.Title>
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
                <Col span={24}>
                    <div className="circle-container">
                        <Typography.Text style={{ marginRight: 12, fontSize: 14 }} >
                            按键时长(ms):
                        </Typography.Text>
                        <InputNumber
                            min={0}
                            max={10000}
                            defaultValue={100}
                            style={{ width: "50%" }}
                            placeholder="请输入按键时长"
                            onChange={(value) => {
                                if (value !== undefined) {
                                    // invoke("set_key_press_duration", { duration: value });
                                }
                            }}
                        />
                    </div>
                </Col>
            </Row>
        </div >
    )
}
export default Panel;