import { fetch } from "@tauri-apps/plugin-http";
const baseURL = import.meta.env.VITE_APP_BASE_API;

/**
 * 通用 HTTP 请求封装，自动携带 token
 * @param {string} url - 请求路径（相对 baseURL）
 * @param {object} options - 其他 fetch 配置
 */
export async function httpRequest(url: string, options: any = {}) {
    const {
        method = "GET",
        params = {},
        data = undefined,
        headers = {},
        responseType = "Json",
    } = options;

    let fullUrl = baseURL + url;
    // console.log("请求地址:", fullUrl);
    // 拼接 GET 参数
    if (method.toUpperCase() === "GET" && Object.keys(params).length > 0) {
        const query = new URLSearchParams(params).toString();
        fullUrl += (fullUrl.includes("?") ? "&" : "?") + query;
    }

    // 获取 token 并加入请求头
    const token = window.sessionStorage.getItem("token");
    const finalHeaders = {
        ...headers,
        Authorization: token ? `${token}` : "",
    };
    let bodyData: any = undefined;
    if (method.toUpperCase() !== "GET" && data !== undefined) {
        if (responseType === "FormData") {
            // 不设置 Content-Type，浏览器会自动处理 multipart/form-data 边界
            bodyData = data;
        } else {
            finalHeaders["Content-Type"] = "application/json";
            bodyData = JSON.stringify(data);
        }
    }

    try {
        const response = await fetch(fullUrl, {
            method,
            headers: finalHeaders,
            query: method.toUpperCase() === "GET" ? undefined : params,
            body: bodyData,
            responseType,
        });
        if (response.status >= 200 && response.status < 400) {
            const data = await response.json();
            return data;
        }
        return Promise.reject({ status: response.status });

    } catch (error) {
        throw error;
    }
}

// 快捷方法
export const get = (url: string, params?: any, options?: any) =>
    httpRequest(url, { ...options, method: "GET", params });

export const post = (url: string, data?: any, options?: any) =>
    httpRequest(url, { ...options, method: "POST", data });

export const put = (url: string, data?: any, options?: any) =>
    httpRequest(url, { ...options, method: "PUT", data });

export const del = (url: string, params?: any, options?: any) =>
    httpRequest(url, { ...options, method: "DELETE", params });