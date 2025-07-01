import React, { useState, useEffect } from 'react';
import {
    Drawer,
    Input,
    Button,
    List,
    Card,
    Avatar,
    Space,
    Typography,
    Empty,
    Spin,
    message,
    Tag,
    Tooltip
} from 'antd';
import {
    SearchOutlined,
    SyncOutlined,
    UserOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import './Copy.css';
import { copyOperateById, findOperateByUid } from '../../../api/operate'; // 假设这个API用于获取用户操作数据

const { Search } = Input;
const { Text, Title } = Typography;

interface OperateData {
    id: string;
    operate_name: string;
    operate_nodes: string;
    operate_edges: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}

interface CopyProps {
    open: boolean;
    onClose: () => void;
}

const Copy: React.FC<CopyProps> = ({ open, onClose }) => {
    const [searchValue, setSearchValue] = useState('03d99ed9e85efc8e3e28021006728d77');
    const [operateList, setOperateList] = useState<OperateData[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
    const [messageApi, contextHolder] = message.useMessage();

    // 搜索用户操作数据
    const handleSearch = async (uid: string) => {
        if (!uid.trim()) {
            messageApi.warning('请输入用户UID');
            return;
        }

        setLoading(true);
        try {
            // 这里调用API获取用户操作数据
            // const response = await getUserOperates(uid);
            // 模拟数据
            const res = await findOperateByUid({ uid });
            if (res.code !== 200) {
                messageApi.error(`查询失败: ${res.msg}`);
                setLoading(false);
                return;
            }
            console.log('查询结果:', res);
            setOperateList(res.data || []);
        } catch (error) {
            console.error('搜索失败:', error);
            messageApi.error('搜索失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    // 同步操作数据
    const handleSync = async (operate: OperateData) => {
        setSyncingIds(prev => new Set([...prev, operate.id]));

        try {
            // 这里调用同步API
            // await syncOperate(operate);
            const user_id = window.sessionStorage.getItem('id');

            // 模拟同步过程
            const res = await copyOperateById({ id: operate.id, user_id: Number(user_id) });
            if (res.code !== 200) {
                messageApi.error(`同步失败: ${res.msg}`);
                return;
            }
            messageApi.success(`操作 "${operate.operate_name}" 同步成功`);
            // 同步成功后关闭抽屉并刷新页面
            setTimeout(() => {
                handleClose();
                window.location.reload();
            }, 1000); // 延迟1秒让用户看到成功提示
        } catch (error) {
            console.error('同步失败:', error);
            messageApi.error(`操作 "${operate.operate_name}" 同步失败`);
        } finally {
            setSyncingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(operate.id);
                return newSet;
            });
        }
    };

    // 重置数据
    const handleClose = () => {
        setSearchValue('');
        setOperateList([]);
        setSyncingIds(new Set());
        onClose();
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/\//g, '-');
    };


    return (
        <>
            {contextHolder}
            <Drawer
                title={
                    <div className="copy-drawer-title">
                        <SyncOutlined className="title-icon" />
                        <span>操作同步</span>
                    </div>
                }
                width={600}
                open={open}
                onClose={handleClose}
                className="copy-drawer"
                styles={{
                    body: { padding: '24px' }
                }}
            >
                <div className="copy-content">
                    {/* 搜索区域 */}
                    <div className="search-section">
                        <Title level={5} className="section-title">
                            <UserOutlined className="section-icon" />
                            用户搜索: 参考(03d99ed9e85efc8e3e28021006728d77)
                        </Title>
                        <Search
                            placeholder="请输入用户UID"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onSearch={handleSearch}
                            size="large"
                            className="search-input"
                            enterButton={
                                <Button type="primary" icon={<SearchOutlined />}>
                                    搜索
                                </Button>
                            }
                        />
                    </div>

                    {/* 操作列表区域 */}
                    <div className="list-section">
                        <Title level={5} className="section-title">
                            操作列表
                            {operateList.length > 0 && (
                                <Tag color="blue" className="count-tag">
                                    {operateList.length} 条
                                </Tag>
                            )}
                        </Title>

                        <Spin spinning={loading}>
                            <div className="operate-list">
                                {operateList.length === 0 ? (
                                    <Empty
                                        description="暂无数据"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        className="empty-state"
                                    />
                                ) : (
                                    <List
                                        dataSource={operateList}
                                        renderItem={(item) => (
                                            <List.Item key={item.id} className="list-item">
                                                <Card className="operate-card" hoverable>
                                                    <div className="card-content">
                                                        <div className="card-header">
                                                            <Avatar
                                                                size={40}
                                                                src={item.operate_icon || '/new.svg'} // 使用默认图标或传入的图标
                                                                className="operate-avatar"
                                                            />
                                                            <div className="operate-info">
                                                                <div className="operate-name">
                                                                    {item.operate_name}
                                                                </div>
                                                                <div className="operate-meta">
                                                                    <Space size={16}>
                                                                        <Text type="secondary" className="meta-item">
                                                                            <ClockCircleOutlined />
                                                                            {formatDateTime(item.updatedAt)}
                                                                        </Text>
                                                                    </Space>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="card-actions">
                                                            <Tooltip title="同步到本地">
                                                                <Button
                                                                    type="primary"
                                                                    size="small"
                                                                    icon={syncingIds.has(item.id) ?
                                                                        <SyncOutlined spin /> :
                                                                        <CheckCircleOutlined />
                                                                    }
                                                                    loading={syncingIds.has(item.id)}
                                                                    onClick={() => handleSync(item)}
                                                                    className="sync-button"
                                                                >
                                                                    {syncingIds.has(item.id) ? '同步中' : '同步'}
                                                                </Button>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </List.Item>
                                        )}
                                    />
                                )}
                            </div>
                        </Spin>
                    </div>
                </div>
            </Drawer>
        </>
    );
};

export default Copy;