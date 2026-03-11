# 伴学星 Web 项目

伴学星是一个纯前端静态项目，包含学习数据展示、图表统计、主题切换等功能。

当前版本已切换为 Supabase 持久化存储，不再使用浏览器 `localStorage` 作为主存储。

## 技术栈

- HTML + CSS + JavaScript（无前端框架）
- Chart.js（本地文件引入）
- chartjs-plugin-datalabels（本地文件引入）
- Supabase（通过 REST + RLS 存储业务数据）

## 项目结构

```text
.
├─ index.html                     # 主页面入口
├─ style.css                      # 主样式
├─ script1.js                     # 主业务逻辑
├─ theme-switcher.css             # 主题切换样式
├─ theme-switcher.js              # 主题切换逻辑
├─ supabase-config.js             # Supabase 前端配置
├─ supabase-storage.js            # Supabase 存储封装
├─ chart.min.js                   # 图表库
├─ chartjs-plugin-datalabels.min.js
├─ success.wav                    # 音效资源
├─ source_index.html              # 历史抓取快照（保留）
└─ sql/
   └─ supabase_init.sql           # Supabase 初始化脚本
```

## 快速开始

### 1. 启动本地静态服务

在项目根目录运行：

```powershell
python -m http.server 5500
```

打开：`http://localhost:5500`

### 2. 配置 Supabase（必做）

在 Supabase SQL Editor 执行 `sql/supabase_init.sql`，创建 `app_storage` 表及匿名访问策略。

然后修改 `supabase-config.js`：

```js
window.__SUPABASE_CONFIG__ = {
  url: 'https://<your-project>.supabase.co',
  anonKey: '<your-anon-key>',
  table: 'app_storage',
  namespace: 'banxuexing'
};
```

提示：

- `url` 和 `anonKey` 不能为空
- `table` 与 SQL 脚本中的表名保持一致
- 多环境部署建议用不同 `namespace` 隔离数据

## 功能说明

- 主业务功能由 `script1.js` 提供
- 图表渲染依赖 `chart.min.js` 与 `chartjs-plugin-datalabels.min.js`
- 主题切换由 `theme-switcher.js` + `theme-switcher.css` 实现
- 主题偏好会写入 Supabase 存储

可选主题：经典蓝、海洋青、森林绿、日落橙。

## 部署说明

项目为纯静态站点，可部署到 Nginx、Cloudflare Pages、Vercel 静态托管等平台。

Nginx 示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/banxuexing;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 常见问题

### 页面提示 Supabase 未配置

- 检查 `supabase-config.js` 是否填写真实 `url` 和 `anonKey`
- 检查浏览器控制台是否有跨域或鉴权报错

### 数据无法写入

- 确认已执行 `sql/supabase_init.sql`
- 确认 RLS policy 已创建并允许 `anon` 的增删改查
- 确认前端 `table` 配置与数据库实际表名一致

## 维护建议

- 不建议在客户端暴露 `service_role` 密钥
- 上线前建议限制匿名策略权限范围
- 如需新增业务字段，优先在 `supabase-storage.js` 中统一扩展读写逻辑
