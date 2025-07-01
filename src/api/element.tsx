// [GIN-debug] GET    /api/v1/rgb/getUserRGB    --> ruby/api/v1/elements.GetUserRGB (4 handlers)
// [GIN-debug] POST   /api/v1/rgb/createUserRGB --> ruby/api/v1/elements.CreateUserRGB (4 handlers)
// [GIN-debug] POST   /api/v1/rgb/deleteUserRGB --> ruby/api/v1/elements.DeleteUserRGB (4 handlers)
import { get, post } from "../utils/requets";

const url = {
    elements: "/api/v1/element/getAllElements",
    getElementById: "/api/v1/element/getElementById",
    skills: "/api/v1/skill/getAllSkills",
    getSkillById: "/api/v1/skill/getSkillById",
    getUserRGB: "/api/v1/rgb/getUserRGB",
    createUserRGB: "/api/v1/rgb/createUserRGB",
    deleteUserRGB: "/api/v1/rgb/deleteUserRGB",
}

export const getElements = async (params: any) => {
    try {
        const response = await get(url.elements, params);
        return response;
    } catch (error) {
        console.error("获取元素列表失败:", error);
        throw error;
    }
}

export const getElementById = async (data: any) => {
    try {
        const response = await post(url.getElementById, data);
        return response;
    } catch (error) {
        console.error("获取元素详情失败:", error);
        throw error;
    }
}

export const getSkills = async (params: any) => {
    try {
        const response = await get(url.skills, params);
        return response;
    } catch (error) {
        console.error("获取技能列表失败:", error);
        throw error;
    }
}

export const getSkillById = async (data: any) => {
    try {
        const response = await post(url.getSkillById, data);
        return response;
    } catch (error) {
        console.error("获取技能详情失败:", error);
        throw error;
    }
}

export const getUserRGB = async (data: any) => {
    try {
        const response = await post(url.getUserRGB, data);
        return response;
    } catch (error) {
        console.error("获取用户RGB失败:", error);
        throw error;
    }
}

export const createUserRGB = async (data: any) => {
    try {
        const response = await post(url.createUserRGB, data);
        return response;
    } catch (error) {
        console.error("创建用户RGB失败:", error);
        throw error;
    }
}

export const deleteUserRGB = async (data: any) => {
    try {
        const response = await post(url.deleteUserRGB, data);
        return response;
    } catch (error) {
        console.error("删除用户RGB失败:", error);
        throw error;
    }
}