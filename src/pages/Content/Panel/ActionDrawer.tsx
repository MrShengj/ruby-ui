import React, { useEffect, useState, forwardRef } from "react";
import { Button, ConfigProvider, Space } from "antd";
import { getRandomWarmColorGroup } from "../../../utils/common";
import DoOperate from "../DoOperate";
import Copy from "../Copy";


const ActionDrawer = forwardRef((props, ref) => {
    const [open, setOpen] = useState(false);
    const [openX, setOpenX] = useState(false);

    // 新增按钮配色
    const addButtonTheme = {
        components: {
            Button: {
                colorPrimary: "linear-gradient(90deg, #ff4069 0%, #ffb86c 100%)",
                colorPrimaryHover: "linear-gradient(90deg, #ff6a00 0%, #ffd700 100%)",
                colorPrimaryActive: "linear-gradient(90deg, #ff6a00 0%, #ffd700 100%)",
                borderRadius: 8,
                fontSize: 16,
                controlHeight: 38,
                lineWidth: 0,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            },
        },
    };

    // 同步按钮配色
    const syncButtonTheme = {
        components: {
            Button: {
                colorPrimary: "linear-gradient(90deg, #38cfff 0%, #6253e1 100%)",
                colorPrimaryHover: "linear-gradient(90deg, #04befe 0%, #4481eb 100%)",
                colorPrimaryActive: "linear-gradient(90deg, #04befe 0%, #4481eb 100%)",
                borderRadius: 8,
                fontSize: 16,
                controlHeight: 38,
                lineWidth: 0,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            },
        },
    };

    const showDrawer = () => {
        setOpen(true);
    };

    const showDrawerX = () => {
        setOpenX(true);
    };

    const closeDrawer = () => {
        setOpen(false);
    }

    const closeDrawerX = () => {
        setOpenX(false);
    }

    return (
        <>
            <div>
                <Space>
                    <ConfigProvider theme={addButtonTheme}>
                        <Button type="primary" size="large" onClick={showDrawer} block>
                            新增
                        </Button>
                    </ConfigProvider>
                    <ConfigProvider theme={syncButtonTheme}>
                        <Button type="primary" size="large" onClick={showDrawerX} block>
                            同步
                        </Button>
                    </ConfigProvider>
                </Space>
            </div>
            <div>
                <DoOperate open={open} onClose={closeDrawer}></DoOperate>
                <Copy open={openX} onClose={closeDrawerX}></Copy>
            </div>
        </>

    );
});

export default ActionDrawer;