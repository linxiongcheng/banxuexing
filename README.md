# 伴学星网页项目

本项目采用原版完整功能链路运行，已统一品牌文案为“伴学星”，并新增可切换页面主题功能。
当前版本已改为通过 Supabase 存储业务数据（不再使用浏览器本地 `localStorage` 持久化）。

## 当前运行入口与依赖

- `index.html`
- `style.css`
- `script1.js`
- `theme-switcher.css`
- `theme-switcher.js`
- `supabase-config.js`
- `supabase-storage.js`
- `chart.min.js`
- `chartjs-plugin-datalabels.min.js`
- `success.wav`

## 本地运行

在项目根目录执行：

```powershell
python -m http.server 5500
```

访问：`http://localhost:5500`

## Supabase 配置（必做）

1. 在 Supabase SQL Editor 执行项目脚本 [`sql/supabase_init.sql`](sql/supabase_init.sql)。
如果你想直接粘贴，也可使用下方 SQL：

```sql
create table if not exists public.app_storage (
  namespace text not null,
  key text not null,
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (namespace, key)
);

alter table public.app_storage enable row level security;

drop policy if exists "anon read app_storage" on public.app_storage;
create policy "anon read app_storage"
on public.app_storage
for select
to anon
using (true);

drop policy if exists "anon insert app_storage" on public.app_storage;
create policy "anon insert app_storage"
on public.app_storage
for insert
to anon
with check (true);

drop policy if exists "anon update app_storage" on public.app_storage;
create policy "anon update app_storage"
on public.app_storage
for update
to anon
using (true)
with check (true);

drop policy if exists "anon delete app_storage" on public.app_storage;
create policy "anon delete app_storage"
on public.app_storage
for delete
to anon
using (true);
```

2. 编辑 `supabase-config.js`：

```js
window.__SUPABASE_CONFIG__ = {
  url: 'https://<your-project>.supabase.co',
  anonKey: '<your-anon-key>',
  table: 'app_storage',
  namespace: 'banxuexing'
};
```

## 主题切换

- 主题切换在“账户下拉菜单”中
- 可选主题：`经典蓝`、`海洋青`、`森林绿`、`日落橙`
- 主题选择会同步到 Supabase 存储

## 线上部署（静态站）

建议使用 Nginx 托管静态文件，站点根目录指向本项目目录即可。

示例核心配置：

```nginx
server {
    listen 80;
    server_name banxuexing123.cn www.banxuexing123.cn;

    root /var/www/banxuexing;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 文件说明

- `source_index.html`：历史抓取快照（保留）
- `README.md`：项目说明文档

## 说明

- 项目保留了原有业务逻辑与数据结构访问方式，底层存储由 `supabase-storage.js` 接管到 Supabase。
- `supabase-config.js` 中如未配置 `url/anonKey`，页面会提示并阻止正常数据加载。
