import { get, post } from "../utils/requets";

const url = {
    elements: "/api/v1/element/getAllElements",
    getElementById: "/api/v1/element/getElementById",
    skills: "/api/v1/skill/getAllSkills",
    getSkillById: "/api/v1/skill/getSkillById",
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