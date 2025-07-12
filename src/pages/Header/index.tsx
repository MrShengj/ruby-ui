import { Avatar, Button, Badge, message, Modal, Radio } from "antd";
import "./Header.css";
import { useEffect, useState } from "react";
import {
  CloseOutlined,
  GithubOutlined,
  MinusOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import logo from "../../assets/app-icon.png";
import { registerUser } from "../../api/system/user";

const HeaderPage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);
  const [closeOption, setCloseOption] = useState(1); // 1: 退出程序, 2: 最小化到托盘
  const appWindow = getCurrentWebviewWindow();
  const [uuid, setUuid] = useState("**************************");
  const getUid = async () => {
    const uid: string = await invoke("get_loacl_mac_md5");
    setUuid(uid);
  };
  useEffect(() => {
    getUid();
  }, [window.sessionStorage.getItem("uid")]);

  const RegisterOrLogin = async () => {
    const uid: string = await invoke("get_loacl_mac_md5");
    await registerUser({ uid })
      .then((res) => {
        if (res.code === 200) {
          window.sessionStorage.setItem("id", res.data.id);
          window.sessionStorage.setItem("uid", res.data.uid);
          window.sessionStorage.setItem("token", res.data.token);
          setUuid(res.data.uid);
        } else {
          messageApi.open({
            type: "error",
            content: "注册失败",
          });
          console.error("注册失败:", res.message);
        }
      })
      .catch((error) => {
        console.error("注册请求失败:", error);
      });
  };

  useEffect(() => {
    // 检查是否存在 uid
    const id = window.sessionStorage.getItem("id");
    if (!id) {
      // 如果不存在，调用注册或登录函数
      RegisterOrLogin();
    }
  }, []);

  const handleMinimize = () => {
    appWindow.minimize();
  };

  const handleClose = () => {
    setIsCloseModalVisible(true);
    setCloseOption(1); // 默认选择退出程序
  };

  const handleCloseModalOk = async () => {
    if (closeOption === 1) {
      // 退出程序
      console.log("退出程序");
      await invoke("close_app");
    } else {
      // 最小化到托盘
      await appWindow.hide();
      messageApi.success("应用已最小化到系统托盘");
    }
    setIsCloseModalVisible(false);
  };

  const handleCloseModalCancel = () => {
    setIsCloseModalVisible(false);
  };

  const handleOpenGithub = () => {
    window.open("https://github.com/MrShengj/ruby-ui", "_blank");
  };

  return (
    <>
      {contextHolder}
      {modalContextHolder}
      <div className="headerContainer" data-tauri-drag-region>
        <Avatar className="avatar" src={logo} />
        <div className="uidContainer">
          <p className="uid">{uuid}</p>
        </div>
        <div className="rightSection">
          <Button onClick={handleOpenGithub} className="windowButton">
            <Badge
              count=""
              style={{
                backgroundColor: "#00ffff",
                fontSize: 6,
                width: 8,
                height: 8,
                minWidth: 8,
                borderRadius: "50%",
                boxShadow: "0 0 10px #00ffff",
              }}
              offset={[8, -8]}
            >
              <GithubOutlined style={{ color: "#00ffff", fontSize: 18 }} />
            </Badge>
          </Button>
          <Button
            onClick={handleMinimize}
            icon={<MinusOutlined style={{ color: "#ffff00", fontSize: 16 }} />}
            className="windowButton"
          />
          <Button
            onClick={handleClose}
            icon={<CloseOutlined style={{ color: "#ff6666", fontSize: 16 }} />}
            className="windowButton"
          />
        </div>
      </div>

      <Modal
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "16px",
              fontWeight: 600,
              background: "linear-gradient(135deg, #1a1a2e, #16213e)",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: "8px 8px 0 0",
              margin: "-20px -24px 0 -24px",
            }}
          >
            <ExclamationCircleOutlined
              style={{ color: "#ff6666", fontSize: "18px" }}
            />
            关闭应用
          </div>
        }
        open={isCloseModalVisible}
        onOk={handleCloseModalOk}
        onCancel={handleCloseModalCancel}
        okText="确认"
        cancelText="取消"
        maskClosable={false}
        width={400}
        centered
        bodyStyle={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          color: "#fff",
          borderRadius: "0 0 8px 8px",
        }}
        okButtonProps={{
          style: {
            background: "linear-gradient(135deg, #ff0066 0%, #ff3366 100%)",
            border: "none",
            borderRadius: "6px",
            height: "36px",
            fontWeight: 500,
            boxShadow: "0 4px 15px rgba(255, 0, 100, 0.3)",
          },
        }}
        cancelButtonProps={{
          style: {
            borderRadius: "6px",
            height: "36px",
            fontWeight: 500,
            background: "rgba(255, 255, 255, 0.1)",
            borderColor: "rgba(255, 255, 255, 0.3)",
            color: "#fff",
          },
        }}
      >
        <div
          style={{
            marginBottom: "16px",
            color: "#666",
            fontSize: "14px",
          }}
        >
          请选择关闭应用的方式：
        </div>
        <Radio.Group
          value={closeOption}
          onChange={(e) => setCloseOption(e.target.value)}
          style={{ width: "100%" }}
        >
          <div
            style={{
              padding: "12px 16px",
              border: "2px solid #e8e8e8",
              borderRadius: "8px",
              marginBottom: "12px",
              background:
                closeOption === 1
                  ? "linear-gradient(135deg, #667eea20, #764ba220)"
                  : "#fff",
              borderColor: closeOption === 1 ? "#667eea" : "#e8e8e8",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
          >
            <Radio
              value={1}
              style={{
                width: "100%",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginLeft: "8px",
                }}
              >
                <span style={{ color: "#333" }}>退出程序</span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    marginTop: "2px",
                  }}
                >
                  完全关闭应用程序
                </span>
              </div>
            </Radio>
          </div>

          <div
            style={{
              padding: "12px 16px",
              border: "2px solid #e8e8e8",
              borderRadius: "8px",
              background:
                closeOption === 2
                  ? "linear-gradient(135deg, #667eea20, #764ba220)"
                  : "#fff",
              borderColor: closeOption === 2 ? "#667eea" : "#e8e8e8",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
          >
            <Radio
              value={2}
              style={{
                width: "100%",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginLeft: "8px",
                }}
              >
                <span style={{ color: "#333" }}>最小化到托盘</span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    marginTop: "2px",
                  }}
                >
                  隐藏窗口但保持程序运行
                </span>
              </div>
            </Radio>
          </div>
        </Radio.Group>
      </Modal>
    </>
  );
};

export default HeaderPage;
