import { Layout, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import './Content.css'
import Panel from './Panel';
import Operate from './Operate';

const { Content, Sider, Header } = Layout;

const ContentPage = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className='content'>
      <Layout hasSider>
        <Sider width={240}>
          <Panel></Panel>
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content>
            <div className='content-header'>
              <h3>
                操作面板
              </h3>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                size="middle"
                className='content-header-button'
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
              >
                刷新
              </Button>
            </div>
            <Operate></Operate>
          </Content>
        </Layout>
      </Layout>
    </div >
  );
}

export default ContentPage;