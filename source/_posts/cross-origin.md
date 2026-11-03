---
title: 跨域的原因和处理
date: 2024-08-03 02:47:19
keywords:
  - "golang"
  - "vue"
  - "开发"
updated: 2024-08-03 02:47:19
description: "认识跨域 什么是跨域 跨域本质是浏览器基于同源策略的一种安全手段 浏览器的跨域问题主要指的是浏览器发起的请求。浏览器在发送请求时，会根据同源策略来判断该请求是否可以被发送到目标资源，如果不符合同源策略，则会被浏览器拦截，..."
categories: 开发
tags:
  - golang
  - vue
---

前后端分别运行以后，经常会遇到一种情况：Apifox 能请求接口，浏览器里的 JavaScript 却读不到响应。这篇把浏览器的同源限制、CORS 和代理放在一起说明，方便排查请求卡在哪一层。

## 认识跨域

### 什么是同源

协议、主机和端口同时相同，才属于同源。有一项不同，页面与目标地址就是不同源。例如：

| 类型 | 请求 URL | 调用 URL | 跨域情况 |
|------|----------|----------|----------|
| 非跨域 | `http://www.123.com/index.html` | `http://www.123.com/server.php` | 否 |
| 跨域 | `http://www.123.com/index.html` | `http://www.456.com/server.php` | 主域名不同: `123/456` |
| 跨域 | `http://abc.123.com/index.html` | `http://def.123.com/server.php` | 子域名不同: `abc/def` |
| 跨域 | `http://www.123.com:8080/index.html` | `http://www.123.com:8081/server.php` | 端口不同: `8080/8081` |
| 跨域 | `http://www.123.com/index.html` | `https://www.123.com/server.php` | 协议不同: `http/https` |

`localhost` 与 `127.0.0.1` 的主机名不同，即使都指向本机，也不是同一个源。

### 同源策略限制什么

同源策略约束不同来源的页面如何读取或操作彼此的资源。例如，一个网站的脚本不能随意读取另一个网站的页面内容或登录凭据。

但跨源请求并非一律无法发送。图片、脚本加载和表单提交等有各自规则；对于 Fetch 或 XHR，浏览器可能已经把请求发出，只是在响应不满足 CORS 条件时，不向页面脚本开放内容。触发预检时，浏览器也可能在实际请求发送前停下来。

所以，用 Apifox 测通接口，只说明对应请求能在那个客户端中完成，不能据此判断浏览器的 CORS 配置已经正确。同源策略也不能替代 CSRF 防护，因为跨站写入请求仍可能到达服务端。

## 先看跨域请求怎样进行

不触发预检时，浏览器直接发送实际请求，再根据响应中的 CORS 首部判断脚本能否读取结果。

触发预检时，则多一轮检查：

1. 浏览器发送 OPTIONS，说明请求来源，以及准备使用的方法和首部。
2. 服务端声明允许的来源、方法与首部。
3. 浏览器检查结果，通过后才发送实际请求。
4. 实际响应仍然需要带上对应的 CORS 首部。

是否触发预检，需要同时看方法、首部和内容类型。GET、HEAD 或 POST 只是条件的一部分；例如 POST 使用 `application/json`，或者手动添加 `Authorization`，就可能需要预检。预检结果还可以缓存，完整条件见 [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)。

## 三种处理方式分别解决什么

### 后端 CORS：明确允许浏览器读取响应

CORS 通过响应首部声明访问规则。`Access-Control-Allow-Origin` 说明允许的页面来源；方法、请求头和凭据等条件，也需要分别配置。

下面是 Gin 的两种写法。示例假定允许的页面 Origin 是 `http://localhost:5173`，实际使用时应替换成明确允许的来源，包含协议和端口：

```go
//gin框架自定义的中间件
import (

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

)

func Corss(c *gin.Context) {
	c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
	c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization") //针对jwt
	c.Writer.Header().Set("Access-Control-Max-Age", "172800")
	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")  //针对session
	if c.Request.Method == "OPTIONS" {
		c.AbortWithStatus(200)
		return
	}
	c.Next()
}

//引用cors的第三方库的中间件
func Cors()gin.HandlerFunc{
	config:=cors.DefaultConfig()
	config.AllowAllOrigins=false
	config.AllowHeaders=append(config.AllowHeaders,"Authorization") //针对jwt
	config.AllowOrigins=[]string{"http://localhost:5173"}
	config.AllowMethods=append(config.AllowMethods,"GET","POST","PUT","DELETE","OPTIONS")
	config.AllowCredentials=true //针对session
	return cors.New(config)
}

```

这里启用了凭据，因此允许来源不能同时写成 `*`。前端还需要显式允许发送凭据，Cookie 是否发送也会受到自身属性和浏览器策略影响。没有凭据需求的公开资源，才可以按需求选择通配来源。

### 开发代理：让浏览器先访问同源地址

开发服务器可以接收页面发出的同源请求，再代为请求后端。浏览器看到的是前端开发服务的地址，前后端之间的转发由代理完成。

下面是 Vite 的配置片段，需要填写实际后端地址：

``` ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/'),
    }
  },
  server: {
    proxy: {
      '/api': {
        target: '',  // 代理地址
        changeOrigin: true,  // 调整转发请求的 Host
        rewrite:(path) => path.replace(/^\/api/,'') // 去掉接口地址中的api字符串
      }
    },
  }
})

```

Axios 使用相对路径访问开发服务器：

``` js
axios.defaults.baseURL = '/api'
```

这里的 `changeOrigin` 调整转发请求的 Host，不是关闭浏览器的同源策略。示例还移除了 `/api` 前缀，是否需要这一步，要和后端路由保持一致。

开发代理只作用于对应开发服务器。构建上线后，需要另外安排生产环境的入口或 CORS 配置。

### Nginx 反向代理：统一对外入口

我之前尝试 Nginx 方案时没有成功，所以这里保留的是配置思路：让页面和接口通过同一协议、主机和端口访问，再由 Nginx 根据路径把接口请求转发给后端。

``` vim
server {
    listen    80;
    # server_name www.josephxia.com;
    location / {
        root  /var/www/html;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass  http://127.0.0.1:8000;
        proxy_redirect   off;
        proxy_set_header  Host       $host;
        proxy_set_header  X-Real-IP     $remote_addr;
        proxy_set_header  X-Forwarded-For  $proxy_add_x_forwarded_for;
    }
}
```

这时浏览器访问的是同源的 `/api` 地址。检查配置时，要同时核对页面实际访问地址、`location` 匹配和转发后的路径；只有后端通了，或者只绑定了同一个域名，还不足以判断整个入口已经同源。

## 排查时按顺序看

先看控制台与 Network，确认失败的是 OPTIONS 还是实际请求；再核对请求的 Origin、方法和自定义首部，以及响应中允许的值。涉及登录时，还要看凭据开关和 Cookie 的发送条件。

最后确认当前依赖的是开发代理还是线上反向代理，避免本地能用的配置在部署后已经失效。

<!-- auto-internal-links -->
## 延伸阅读
- [文章归档](/archives/)
- [分类导航](/categories/)
- [标签导航](/tags/)
- [同分类更多内容](/categories/%E5%BC%80%E5%8F%91/)
