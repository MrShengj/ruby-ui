import { Avatar, Button, Badge, message } from "antd";
import "./Header.css";
import { useEffect, useState } from "react";
import {
  CloseOutlined,
  GithubOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import logo from "../../assets/logo.svg";

import { registerUser } from "../../api/system/user";

const HeaderPage = () => {

  const [messageApi, contextHolder] = message.useMessage();
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
    await registerUser({ uid }).then((res) => {
      if (res.code === 200) {
        window.sessionStorage.setItem("id", res.data.id);
        window.sessionStorage.setItem("uid", res.data.uid);
        window.sessionStorage.setItem("token", res.data.token);
        setUuid(res.data.uid)
      } else {
        messageApi.open({
          type: 'error',
          content: '注册失败'
        })
        console.error("注册失败:", res.message)
      };
    }).catch((error) => {
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
    appWindow.close();
  };

  //   const handleMaximize = () => {
  //     appWindow.toggleMaximize();
  //   };
  const handleOpenGithub = () => {
    window.open("https://gitee.com/mrshengjing/ks-rev", "_blank");
  };

  return (
    <>
      {contextHolder}
      <div className="headerContainer" data-tauri-drag-region>
        <Avatar className="avatar" src={logo} /> {/* 使用 PNG 图像 */}
        <div className="uidContainer">
          <p className="uid">{uuid}</p>
        </div>
        <div className="rightSection">
          <Button onClick={handleOpenGithub} className="windowButton">
            <Badge
              count=""
              style={{ backgroundColor: "red", fontSize: 8 }}
              offset={[5, 0]}
            >
              <GithubOutlined style={{ color: "white", fontSize: 20 }} />
            </Badge>
          </Button>
          <Button
            onClick={handleMinimize}
            icon={<MinusOutlined style={{ color: "white" }} />}
            className="windowButton"
          />
          <Button
            onClick={handleClose}
            icon={<CloseOutlined style={{ color: "white" }} />}
            className="windowButton"
          />
        </div>
      </div>
    </>

  );
}

export default HeaderPage;
