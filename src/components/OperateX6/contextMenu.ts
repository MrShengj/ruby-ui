import { invoke } from "@tauri-apps/api/core";
import { TimerData } from "./types";

interface ContextMenuHandlers {
  setModalVisible: (visible: boolean) => void;
  setModalLabel: (label: string) => void;
  setModalValue: (value: number) => void;
  setEditingNode: (node: any) => void;
  setTimerModalVisible: (visible: boolean) => void;
  setTimerName: (name: string) => void;
  setTimerTime: (time: number) => void;
  setResetTimerModalVisible: (visible: boolean) => void;
  setSelectedTimerName: (name: string) => void;
  setTimers: (timers: TimerData[]) => void;
  setSaveColorModalVisible: (visible: boolean) => void;
  setSavingColorData: (data: any) => void;
  messageApi: any;
  modal: any;
  deleteUserRGBApi: (id: number) => Promise<void>;
  triggerChange: () => void;
  refreshColorComponents: () => void;
  getTimerNames: () => TimerData[];
}

export const createContextMenuItems = (
  node: any,
  menu: HTMLElement,
  handlers: ContextMenuHandlers
) => {
  const {
    setModalVisible,
    setModalLabel,
    setModalValue,
    setEditingNode,
    setTimerModalVisible,
    setTimerName,
    setTimerTime,
    setResetTimerModalVisible,
    setSelectedTimerName,
    setTimers,
    setSaveColorModalVisible,
    setSavingColorData,
    messageApi,
    modal,
    deleteUserRGBApi,
    triggerChange,
    refreshColorComponents,
    getTimerNames,
  } = handlers;

  const label = node.attr("label/text");
  const nodeData = node.getData();

  // 按键组件的菜单
  if (nodeData?.elements_code || nodeData?.elements_key) {
    const delayBtn = document.createElement("div");
    delayBtn.className = "x6-context-menu-item";
    delayBtn.innerText = "弹起延迟";
    delayBtn.onclick = () => {
      setModalLabel("弹起延迟");
      const existingDelay = nodeData?.key_up_delay || 0;
      setModalValue(existingDelay);
      setEditingNode(node);
      setModalVisible(true);
      menu.remove();
    };
    menu.appendChild(delayBtn);
  }

  // 取色相关菜单
  if (label === "取色" || nodeData?.rgb) {
    const colorBtn = document.createElement("div");
    colorBtn.className = "x6-context-menu-item";
    colorBtn.innerText = "取色";
    colorBtn.onclick = async () => {
      try {
        const now_mouse_rgb: string = await invoke("get_mouse_rgb");
        const [coordinate, rgb] = now_mouse_rgb.split("|");
        const rgbArray = rgb.split(",").map(Number);
        const hex = `#${rgbArray
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("")}`;

        node.attr("body/fill", hex);
        node.setData({ coordinate, rgb });
        messageApi.success("取色成功");
      } catch (err) {
        messageApi.error("取色失败");
      }
      menu.remove();
    };
    menu.appendChild(colorBtn);

    const saveBtn = document.createElement("div");
    saveBtn.className = "x6-context-menu-item";
    saveBtn.innerText = "保存";
    saveBtn.onclick = () => {
      const nodeData = node.getData();
      if (nodeData?.coordinate && nodeData?.rgb) {
        setSavingColorData({
          coordinate: nodeData.coordinate,
          rgb: nodeData.rgb,
          hex: node.attr("body/fill"),
        });
        setSaveColorModalVisible(true);
      } else {
        messageApi.warning("请先取色后再保存");
      }
      menu.remove();
    };
    menu.appendChild(saveBtn);

    if (nodeData?.id) {
      const deleteBtn = document.createElement("div");
      deleteBtn.className = "x6-context-menu-item";
      deleteBtn.innerText = "永久删除";
      deleteBtn.style.color = "#ff4d4f";
      deleteBtn.onclick = () => {
        modal.confirm({
          title: "确认删除",
          content: "确定要永久删除这个取色组件吗？此操作不可撤销。",
          okText: "确定",
          cancelText: "取消",
          okType: "danger",
          onOk: async () => {
            try {
              await deleteUserRGBApi(nodeData.id);
              node.remove();
              triggerChange();
              setTimeout(() => {
                refreshColorComponents();
              }, 100);
            } catch (error) {
              messageApi.error("删除失败");
            }
          },
        });
        menu.remove();
      };
      menu.appendChild(deleteBtn);
    }
  }

  // 定时组件菜单
  if (
    nodeData?.type === "timer" ||
    label === "定时" ||
    (label && label.includes("定时:") && !label.includes("重置")) ||
    nodeData?.t == 2
  ) {
    const setBtn = document.createElement("div");
    setBtn.className = "x6-context-menu-item";
    setBtn.innerText = "设置";
    setBtn.onclick = () => {
      if (nodeData?.id && nodeData?.n) {
        setTimerName(nodeData.name || nodeData.id);
        setTimerTime(nodeData.n);
      } else {
        setTimerName("");
        setTimerTime(0);
      }
      setEditingNode(node);
      setTimerModalVisible(true);
      menu.remove();
    };
    menu.appendChild(setBtn);
  }

  // 重置定时组件菜单
  if (
    nodeData?.type === "resetTimer" ||
    label === "重置定时" ||
    (label && label.includes("重置定时:")) ||
    (nodeData?.t == 3 && !label.includes("内力"))
  ) {
    const setBtn = document.createElement("div");
    setBtn.className = "x6-context-menu-item";
    setBtn.innerText = "设置重置节点";
    setBtn.onclick = () => {
      const currentTimers = getTimerNames();
      setTimers(currentTimers);

      if (nodeData?.name) {
        setSelectedTimerName(nodeData.name || nodeData.id);
      } else {
        setSelectedTimerName("");
      }
      setEditingNode(node);
      setResetTimerModalVisible(true);
      menu.remove();
    };
    menu.appendChild(setBtn);
  }

  // 延迟和内力的时间设置菜单
  if (label && (label.startsWith("延迟") || label.startsWith("内力"))) {
    const setBtn = document.createElement("div");
    setBtn.className = "x6-context-menu-item";

    let type = "延迟";
    if (label.startsWith("内力")) {
      type = "内力";
      setBtn.innerText = "设置内力";
    } else {
      setBtn.innerText = "设置延迟";
    }

    setBtn.onclick = () => {
      setModalLabel(type);
      const nodeData = node.getData();
      const existingValue =
        nodeData?.n ||
        (label.match(/\d+/)?.[0] ? parseInt(label.match(/\d+/)[0]) : null) ||
        0;
      setModalValue(existingValue);
      setEditingNode(node);
      setModalVisible(true);
      menu.remove();
    };
    menu.appendChild(setBtn);
  }

  // 删除按钮
  const delBtn = document.createElement("div");
  delBtn.className = "x6-context-menu-item";
  delBtn.innerText = "删除";
  delBtn.onclick = () => {
    node.remove();
    menu.remove();
    triggerChange();
  };
  menu.appendChild(delBtn);

  // 取消按钮
  const cancelBtn = document.createElement("div");
  cancelBtn.className = "x6-context-menu-item";
  cancelBtn.innerText = "取消";
  cancelBtn.onclick = () => menu.remove();
  menu.appendChild(cancelBtn);
};
