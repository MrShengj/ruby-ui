// [GIN-debug] POST   /api/v1/operate/findOperateById --> ruby/api/v1/operate.FindOperate (3 handlers)
// [GIN-debug] POST   /api/v1/operate/createOperate --> ruby/api/v1/operate.CreateOperate (3 handlers)
// [GIN-debug] POST   /api/v1/operate/updateOperate --> ruby/api/v1/operate.UpdateOperate (3 handlers)
// [GIN-debug] POST   /api/v1/operate/deleteOperate --> ruby/api/v1/operate.DeleteOperate (3 handlers)
// [GIN-debug] POST   /api/v1/operate/findOperateByUserId --> ruby/api/v1/operate.FindOperateByUserId (3 handlers)
// [GIN-debug] POST   /api/v1/operate/findOperateByUid --> ruby/api/v1/operate.FindOperateByUid (4 handlers)
// [GIN-debug] POST   /api/v1/operate/copyOperate --> ruby/api/v1/operate.CopyOperateById (4 handlers)

import { get, post } from "../utils/requets";

const url = {
    findOperateById: "/api/v1/operate/findOperateById", // 根据ID查询操作
    createOperate: "/api/v1/operate/createOperate", // 创建操作
    updateOperate: "/api/v1/operate/updateOperate", // 更新操作
    deleteOperate: "/api/v1/operate/deleteOperate", // 删除操作
    findOperateByUserId: "/api/v1/operate/findOperateByUserId", // 根据用户ID查询操作
    findOperateByUid: "/api/v1/operate/findOperateByUid", // 根据用户UID查询操作
    copyOperateById: "/api/v1/operate/copyOperate", // 根据ID复制操作
};

export const findOperateById = async (data: any) => {
    try {
        const response = await post(url.findOperateById, data);
        return response;
    } catch (error) {
        console.error("查询操作失败:", error);
        throw error;
    }
};

export const createOperate = async (data: any) => {
    try {
        const response = await post(url.createOperate, data);
        return response;
    } catch (error) {
        console.error("创建操作失败:", error);
        throw error;
    }
};

export const updateOperate = async (data: any) => {
    try {
        const response = await post(url.updateOperate, data);
        return response;
    } catch (error) {
        console.error("更新操作失败:", error);
        throw error;
    }
};

export const deleteOperate = async (data: any) => {
    try {
        const response = await post(url.deleteOperate, data);
        return response;
    } catch (error) {
        console.error("删除操作失败:", error);
        throw error;
    }
};

export const findOperateByUserId = async (data: any) => {
    try {
        const response = await post(url.findOperateByUserId, data);
        return response;
    } catch (error) {
        console.error("根据用户ID查询操作失败:", error);
        throw error;
    }
};

export const findOperateByUid = async (data: any) => {
    try {
        const response = await post(url.findOperateByUid, data);
        return response;
    } catch (error) {
        console.error("根据用户UID查询操作失败:", error);
        throw error;
    }
};

export const copyOperateById = async (data: any) => {
    try {
        const response = await post(url.copyOperateById, data);
        return response;
    } catch (error) {
        console.error("复制操作失败:", error);
        throw error;
    }
}