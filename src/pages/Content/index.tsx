import { Layout } from 'antd';
import './Content.css'
import Panel from './Panel';
import Operate from './Operate';
const { Content, Sider } = Layout;

const ContentPage = () => {
  return (
    <div className='content'>
      <Layout hasSider>
        <Sider width={240}>
          <Panel></Panel>
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content>
            <Operate></Operate>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}

export default ContentPage;