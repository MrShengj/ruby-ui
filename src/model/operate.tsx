export interface Operate {
    id?: number; // 操作ID
    operate_name: string; // 操作名称
    operate_nodes: string; // 操作节点
    operate_edges: string; // 操作连线
    user_id: number; // 用户ID
}

export interface UserRgb {
    id?: number; // RGB ID
    user_id: number; // 用户ID
    coordinate: string; // 坐标
    rgb: string; // RGB颜色值
}