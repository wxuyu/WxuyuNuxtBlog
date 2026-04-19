export default defineNitroPlugin(() => {
  // 生成 20 位随机数字
  const numbers = Array.from({ length: 20 }, () => Math.floor(Math.random() * 10)).join('');
  
  // 生成 100 位随机字母 (包含大小写)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let letters = '';
  for (let i = 0; i < 100; i++) {
    letters += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // 注入到 runtimeConfig 中
  useRuntimeConfig().public.appVesion = numbers + letters;
});