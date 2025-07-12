import { Layout, Button, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import "./Content.css";
import Panel from "./Panel";
import Operate from "./Operate";

const { Content, Sider, Header } = Layout;

const ContentPage = () => {
  const [refresh, setRefresh] = useState(false);
  const handleRefresh = () => {
    window.location.reload();
  };

  // 页面首次渲染后延时2秒刷新一次页面
  // useEffect(() => {
  //   // 检查是否已经执行过首次刷新
  //   const hasRefreshed = sessionStorage.getItem("hasAutoRefreshed");

  //   if (!hasRefreshed) {
  //     const timer = setTimeout(() => {
  //       // 标记已经执行过刷新
  //       sessionStorage.setItem("hasAutoRefreshed", "true");
  //       window.location.reload();
  //     }, 1000);

  //     // 清理定时器
  //     return () => clearTimeout(timer);
  //   }
  // }, []);

  return (
    <div className="content">
      <Layout hasSider>
        <Sider width={240}>
          <Panel></Panel>
        </Sider>
        <Layout style={{ padding: "0 24px 24px" }}>
          <Content>
            <div className="content-header">
              <h3>操作面板</h3>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                size="middle"
                className="content-header-button"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(102, 126, 234, 0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(102, 126, 234, 0.4)";
                }}
              >
                刷新
              </Button>
            </div>
            <Operate></Operate>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default ContentPage;
