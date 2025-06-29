import "./App.css";
import ContentPage from "./pages/Content";
import HeaderPage from "./pages/Header";
import { Layout } from "antd";
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
