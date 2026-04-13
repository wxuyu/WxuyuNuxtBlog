import appConfig from "~/app.config";

// plugins/http.ts
export default defineNuxtPlugin(() => {
  // ✅ 统一配置（替代 switch）
  const HTTP_CONFIG = {
    baseURL: appConfig.hotGetConfig.Api,
    timeout: 30000
  } as const;

  // 创建实例
  const http = $fetch.create({
    baseURL: appConfig.hotGetConfig.Api,
    timeout: appConfig.hotGetConfig.timeout,

    // ✅ 请求拦截
    onRequest({ options }) {
      const token = localStorage.getItem("token");

      if (token) {
        options.headers = {
          ...options.headers,
        };
      }
    },

    // ✅ 响应成功
    onResponse({ response }) {
      return response._data;
    },

    // ❗响应错误
    onResponseError({ response }) {
      const data = response?._data;

      const messageMap: Record<number, string> = {
        401: "请登录后使用",
        301: "请求路径发生跳转",
        403: "暂无访问权限",
        404: "请求资源不存在",
        500: "内部服务器错误"
      };

      const msg =
        data?.message ||
        messageMap[response.status] ||
        "请求失败，请稍后重试";

      // 这里按你项目实际 UI 库替换
      if (process.client) {
        // @ts-ignore
        window.$message?.error(msg);
      }

      return Promise.reject(response);
    }
  });

  return {
    provide: {
      http
    }
  };
});