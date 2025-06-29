import { get, post } from "../../utils/requets";

const url = {
    register: "/api/v1/user/register/NeYmt", // 用户注册接口
}

/** * 注册用户
 * @param {Object} data - 用户注册信息
 * @return {Promise<any>} - 返回注册结果
 * * @throws {Error} - 如果注册失败，将抛出错误
 **/
export const registerUser = async (data: any) => {
    try {
        const response = await post(url.register, data);
        return response;
    } catch (error) {
        console.error("注册失败:", error);
        throw error;
    }
};