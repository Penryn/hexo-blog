---
title: 跨域的原因和处理
date: 2024-08-03 02:47:19
categories: 开发
tags:
  - golang
  - vue
---

## 认识跨域
### 什么是跨域
跨域本质是浏览器基于同源策略的一种安全手段

浏览器的跨域问题主要指的是浏览器发起的请求。浏览器在发送请求时，会根据同源策略来判断该请求是否可以被发送到目标资源，如果不符合同源策略，则会被浏览器拦截，从而导致跨域问题
### 什么是同源策略
同源策略（Sameoriginpolicy），是一种约定，它是浏览器最核心也最基本的`安全功能`.不同源的客户端脚本在没有明确授权的情况下，浏览器禁止页面加载或执行与自身不同源的任何脚本。

浏览器在执行脚本前，会判断脚本是否与打开的网页是同源的。若请求跨域会在控制台报一个CORS异常，目的是为了保护本地数据不被JavaScript代码获取回来的数据所污染，因此拦截的是客户端发出请求的响应数据，即请求发送了，服务器响应了，但是响应的数据被浏览器拦截无法接收。


所谓同源（即指在同一个域）具有以下三个相同点（同时满足）

协议相同（protocol）
主机相同（host）
端口相同（port）
反之非同源请求，也就是协议、端口、主机其中一项不相同的时候，这时候就会产生跨域

| 类型 | 请求 URL | 调用 URL | 跨域情况 |
|------|----------|----------|----------|
| 非跨域 | `http://www.123.com/index.html` | `http://www.123.com/server.php` | 否 |
| 跨域 | `http://www.123.com/index.html` | `http://www.456.com/server.php` | 主域名不同: `123/456` |
| 跨域 | `http://abc.123.com/index.html` | `http://def.123.com/server.php` | 子域名不同: `abc/def` |
| 跨域 | `http://www.123.com:8080/index.html` | `http://www.123.com:8081/server.php` | 端口不同: `8080/8081` |
| 跨域 | `http://www.123.com/index.html` | `https://www.123.com/server.php` | 协议不同: `http/https` |
- **注意**
  - `localhost` 和 `127.0.0.1` 虽然都指向本机，但也属于跨域。
  - 跨域是`浏览器`的限制，你用抓包工具抓取接口数据，是可以看到接口已经把数据返回回来了，只是浏览器的限制，你获取不到数据。用apifox请求接口能够请求到数据。
### 为什么要有同源策略
浏览器同源策略的提出本来就是为了避免数据安全的问题，即：限制来自不同源的“document”或脚本，对当前“document”读取或设置某些属性。
如果没有这个限制，将会出现什么问题？不妨看一下几个情形：

在Web浏览器中，如果同时访问了电商网站（域名为b.com）和另一个网站（域名为a.com），按照正常的安全机制，a.com下的JavaScript脚本是不应该能够读取或修改b.com页面内容的，包括其Cookie等敏感信息。这是因为浏览器实施了同源策略，它是浏览器安全的基础，旨在防止恶意网站对其他网站进行跨站请求攻击（如CSRF攻击），保护用户隐私和数据安全。

然而，如果同源策略存在漏洞或被绕过，那么a.com的脚本可能就能非法访问和修改b.com的内容，甚至窃取用户的隐私数据，如Cookie中包含的身份认证信息等。这将导致严重的安全问题，因为很多基于同源策略制定的安全方案都将失效，用户的个人信息和交易安全将面临巨大风险。因此，维护同源策略的完整性和有效性对于保障Web浏览安全至关重要。

注：CSRF攻击，全称Cross-Site Request Forgery（跨站请求伪造），是一种常见的Web安全漏洞。这种攻击方式通过诱使用户在不知情的情况下，执行攻击者预设的恶意请求，从而利用用户在已登录网站的身份验证信息，执行未经用户授权的操作。

## 解决跨域
但是事实上，随着Web应用的发展，许多场景需要跨域访问资源，如调用第三方API、访问CDN资源等，又或者我们前后端开发时，前端调用后端云服务器上接口也会导致跨域问题，因此我们前后端开发时要想办法去解决这个问题。

### 前端跨域请求流程
跨域请求的流程如下(`简单请求(GET、HEAD 或 POST)`没有234)：

1. **浏览器发现页面发起了一个跨域请求**：
    - 当浏览器检测到页面中的请求URL与页面URL的协议、域名或端口号不同，就会认定这是一个跨域请求。

2. **浏览器发送预检请求（OPTIONS）到目标服务器**：
    - 对于`非简单请求`（如使用了自定义头部、非 GET/POST 方法等），浏览器会首先发送一个预检请求（OPTIONS）来检查目标服务器是否允许跨域请求。

3. **服务器返回CORS相关响应头**：
    - 目标服务器收到预检请求后，检查请求头中的来源和方法，并在响应头中添加相关的 CORS 头信息来表示是否允许跨域请求。

4. **浏览器根据响应头判断是否允许跨域请求**：
    - 浏览器检查预检响应中的 CORS 头部信息，如果允许跨域请求，则继续执行实际请求；否则，浏览器会阻止实际请求。

5. **如果允许，浏览器继续发送实际请求**：
    - 浏览器发送实际请求到目标服务器。

6. **服务器处理实际请求，并返回响应数据**：
    - 服务器处理实际请求，并在响应头中添加 CORS 相关头信息，以允许跨域访问。

7. **浏览器接收响应数据，完成跨域请求**：
    - 浏览器接收服务器返回的响应数据，并根据 CORS 头信息决定是否允许前端 JavaScript 访问该数据。如果允许，前端可以正常处理响应数据；否则，访问被阻止。

### 解决方案
根据跨域请求的过程，可以发现，解决跨域的方法有很多，下面列举了三种：

- **后端**CORS
- **前端**Proxy
- **nginx**反向代理(试过一次，但没有成功，可能是哪里搞错了)


#### CORS
CORS （Cross-Origin Resource Sharing，跨域资源共享）是一个系统，它由一系列传输的HTTP头组成，这些HTTP头决定浏览器是否阻止前端 JavaScript 代码获取跨域请求的响应

CORS 实现起来非常方便，只需要增加一些 HTTP 头，让服务器能声明允许的访问来源

这种方式最主要的特点就是会在响应的 HTTP 首部增加 Access-Control-Allow-Origin 等信息，从而判定那些资源站可以进行跨域请求，还有几个其他相关的 HTTP 首部进行更加精细化的控制，最主要的还是 Access-Control-Allow-Origin 。


只要后端实现了 CORS，就实现了跨域
![](https://camo.githubusercontent.com/e89fa35a501f730653c5682f3989dac9139d90bf0483db92ad08217309c86968/68747470733a2f2f7374617469632e7675652d6a732e636f6d2f31343064656238302d346533322d313165622d616239302d6439616538313462323430642e706e67)
以 gin框架举例

添加中间件，直接设置Access-Control-Allow-Origin请求头
```go
//gin框架自定义的中间件
import (

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

)

func Corss(c *gin.Context) {
	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
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
	config.AllowAllOrigins=true
	config.AllowHeaders=append(config.AllowHeaders,"Authorization") //针对jwt
	config.AllowOrigins=append(config.AllowOrigins,"*")
	config.AllowMethods=append(config.AllowMethods,"GET","POST","PUT","DELETE","OPTIONS")
	config.AllowCredentials=true //针对session
	return cors.New(config)
}

```
ps: Access-Control-Allow-Origin 设置为*其实意义不大，可以说是形同虚设，实际应用中，上线前我们会将Access-Control-Allow-Origin 值设为我们目标host

#### Proxy
代理（Proxy）也称网络代理，是一种特殊的网络服务，允许一个（一般为客户端）通过这个服务与另一个网络终端（一般为服务器）进行非直接的连接。一些网关、路由器等网络设备具备网络代理功能。一般认为代理服务有利于保障网络终端的隐私或安全，防止攻击

如果是通过vue-cli脚手架工具搭建项目，我们可以通过webpack为我们起一个本地服务器作为请求的代理对象

通过该服务器转发请求至目标服务器，得到结果再转发给前端，但是最终发布上线时如果web应用和接口服务器不在一起仍会跨域

在vite.config.js文件，新增以下代码
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
        changeOrigin: true,  // 是否跨域
        rewrite:(path) => path.replace(/^\/api/,'') // 去掉接口地址中的api字符串
      }
    },
  }
})

```
通过axios发送请求中，配置请求的根路径
``` js
axios.defaults.baseURL = '/api'
```

#### 反向代理
~~我搜到都说可以，但是我之前尝试时没有成功~~
既然不能跨域请求，那么我们不跨域就可以了，通过在请求到达服务器前部署一个服务，将接口请求进行转发，这就是反向代理。通过一定的转发规则可以将前端的请求转发到其他的服务。
　通过反向代理我们将前后端项目统一通过反向代理来提供对外的服务，这样在前端看上去就跟不存在跨域一样。
　　 反向代理麻烦之处就在原对 Nginx 等反向代理服务的配置，在目前前后端分离的项目中很多都是采用这种方式。

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