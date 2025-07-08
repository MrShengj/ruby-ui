import "./App.css";
import ContentPage from "./pages/Content";
import HeaderPage from "./pages/Header";
import { Layout } from "antd";
import { useEffect } from 'react';
import moment from 'moment';
import 'moment/locale/zh-cn'; // 引入 moment 中文语言包
moment.locale('zh-cn');

function App() {
  const { Header, Content } = Layout;

  document.addEventListener("keydown", (event) => {
    if (event.key === "F3") {
      event.preventDefault(); // 阻止默认行为
    }
  });
  // 仅在生产环境禁用右键菜单
  useEffect(() => {
    // 检查是否为生产环境
    if (process.env.NODE_ENV === 'production') {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
      };

      document.addEventListener('contextmenu', handleContextMenu);

      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, []);

  return (
    <div>
      <Layout>
        <Header className="headerStyle">
          <HeaderPage />
        </Header>
        <Content className="contentStyle">
          <ContentPage />
        </Content>
      </Layout>
    </div>
  );
}

export default App;
