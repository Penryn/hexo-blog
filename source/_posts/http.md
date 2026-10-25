---
title: HTTP协议介绍和常见面试题总结
date: 2024-08-22 23:14:54
keywords:
  - "http"
  - "面试"
  - "开发"
updated: 2024-08-22 23:14:54
description: "由于最近开始学习java web，于是顺便把一些基础的东西整理一下，刚好看到http协议这块，遂打算整理。"
categories: 开发
tags:
  - http
  - 面试
---

最近学习 Java Web，顺便把 HTTP 的基础知识和常见面试问题整理在一起。内容比较多，我按一次请求会遇到的问题来组织：先看地址与报文，再看连接、缓存和安全，最后回到浏览器加载页面的过程。

## 先看一次 HTTP 请求在做什么

HTTP 是应用层协议，用请求方法、首部、状态码和内容来描述客户端与服务端之间的交互。HTML、图片、JSON 和文件都可以通过它传输，内容类型由 `Content-Type` 等字段说明。

先分清几个经常混在一起的概念：

- **请求与响应**：客户端发起请求，服务端返回相应的响应。
- **连接复用**：HTTP/1.1 默认支持持久连接；一个 TCP 连接可以承载多次请求。
- **应用状态**：HTTP 本身不维护用户会话，登录状态要由应用通过 Cookie、Session 或其他凭据关联。
- **传输安全**：普通 HTTP 不提供传输加密，HTTPS 则使用 TLS 保护通信。

“无状态”说的是请求语义，不代表每次请求都要断开连接。HTTP/1.1、HTTP/2 通常使用 TCP，HTTP/3 则基于 QUIC，不能把所有 HTTP 版本都归结为同一种连接过程。协议的公共语义可以参考 [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html)。

## 地址：URI、URL 和各个组成部分

URI 用来标识资源，URL 还给出定位和访问方式；URN 则使用名字标识资源。日常浏览网页接触到的主要是 URL。

以下面的地址为例：

https://www.example.com/paths/item?id=123&category=books#reviews

| 部分 | 示例 | 用途 |
| --- | --- | --- |
| Scheme | `https` | 访问方案 |
| Host | `www.example.com` | 主机名或 IP 地址 |
| Port | 此处省略 | 使用默认端口；HTTP 通常为 80，HTTPS 通常为 443 |
| Path | `/paths/item` | 资源路径，不一定对应磁盘目录或文件 |
| Query | `id=123&category=books` | 查询信息，具体含义由应用解释 |
| Fragment | `reviews` | 片段标识，浏览器通常不把它发送给服务端 |

URI 还包含其他标识形式，不能只按“协议、主机、路径”概括所有 URI。在 Java 中，`URI` 主要用于解析与表示标识符，`URL` 还提供访问资源的相关能力，具体使用也要区分相应类的规则。

## 请求和响应报文

下面用 HTTP/1.1 的文本报文说明结构。HTTP/2 和 HTTP/3 改变了传输编码，但方法、状态码等应用语义仍然保留。

### 请求报文

请求通常由请求行、首部、空行和可选的请求体组成：

```
<method> <request-URL> <version>
<headers>

<entity-body>
```

请求行里包含方法、请求目标和协议版本：

 ```
  GET /index.html?id=1 HTTP/1.1
```

首部按名称和值组织，用于说明目标主机、可接受格式、凭据和内容类型等信息：

```
Host: www.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8

```

空行分隔首部与请求体。提交表单时，请求体可能是这样的键值对：

```
username=example&password=123456
```

#### 常用请求方法

| 方法 | 主要语义 |
| --- | --- |
| `GET` | 获取资源表示，按语义应当是安全且幂等的 |
| `HEAD` | 与 GET 类似，但不返回响应内容 |
| `POST` | 让目标资源按自身规则处理提交的内容 |
| `PUT` | 用请求内容创建或替换目标资源，按语义是幂等的 |
| `DELETE` | 删除目标资源的关联，按语义是幂等的 |
| `OPTIONS` | 查询通信选项，也用于 CORS 预检 |
| `TRACE` | 回显收到的请求，用于诊断，实际环境可能禁用 |
| `CONNECT` | 建立通往目标的隧道，常见于代理场景 |

幂等描述的是重复相同请求对服务端的预期效果，不要求每次返回相同内容或状态码。GET 也不能因为参数在 URL 里就被当成不安全的方法；机密性依赖 HTTPS 和凭据处理，不能靠把方法换成 POST 获得。

请求体、URL 和首部的大小会受到客户端、代理及服务端配置限制。POST 也可以由 JavaScript 发起，并不局限于 HTML 表单。

#### REST 接口怎样组织

REST 是架构风格，资源命名、统一接口和无状态请求都与它有关。实际设计接口时，可以用资源路径描述对象，用方法表达操作，再用状态码说明处理结果。

例如，把用户资源放在 `/users` 下，通常比把所有动作都塞进方法名更容易统一约定。但“路径里不能出现动词”只是常见设计建议，不能替代对资源和业务操作的建模。

无状态请求要求请求携带处理所需的上下文，并不禁止服务端保存数据库或其他资源状态。

#### 请求首部速查

以下保留常见字段作为查阅表，使用时还要结合具体协议版本和浏览器行为：

|Header|解释|示例|用例|
|---|---|---|---|
|**Accept**|指定客户端能够接收的内容类型。|`Accept: text/plain, text/html`|客户端希望接收纯文本或 HTML 格式的响应内容。|
|**Accept-Charset**|浏览器可以接受的字符编码集。|`Accept-Charset: iso-8859-5`|客户端可以接受 ISO-8859-5 字符集的响应。|
|**Accept-Encoding**|指定浏览器可以支持的 Web 服务器返回内容压缩编码类型。|`Accept-Encoding: compress, gzip`|客户端可以处理压缩格式（如 gzip）以减少响应数据量。|
|**Accept-Language**|浏览器可接受的语言。|`Accept-Language: en, zh`|客户端接受英文和中文的响应内容。|
|**Accept-Ranges**|可以请求网页实体的一个或者多个子范围字段。|`Accept-Ranges: bytes`|服务器支持按字节范围请求资源。|
|**Authorization**|HTTP 授权的授权证书。|`Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==`|客户端发送 Basic 认证凭证进行身份验证。|
|**Cache-Control**|指定请求和响应遵循的缓存机制。|`Cache-Control: no-cache`|复用缓存前需要向服务端验证。|
|**Connection**|表示是否需要持久连接。|`Connection: close`|请求完成后关闭连接。|
|**Cookie**|HTTP 请求发送时，会把保存在该请求域名下的所有 Cookie 值一起发送给 Web 服务器。|`Cookie: $Version=1; Skin=new;`|发送会话 ID 和用户设置的皮肤信息到服务器。|
|**Content-Length**|请求的内容长度。|`Content-Length: 348`|请求体的长度为 348 字节。|
|**Content-Type**|请求的与实体对应的 MIME 信息。|`Content-Type: application/x-www-form-urlencoded`|请求体使用 URL 编码的表单数据。|
|**Date**|请求发送的日期和时间。|`Date: Tue, 15 Nov 2010 08:12:31 GMT`|请求发送的具体时间。|
|**Expect**|请求的特定的服务器行为。|`Expect: 100-continue`|客户端期望服务器在继续发送请求体前先回应 100 状态码。|
|**From**|发出请求的用户的 Email。|`From: user@email.com`|提供请求者的电子邮件地址。|
|**Host**|指定请求的服务器的域名和端口号。|`Host: www.zcmhi.com`|请求目标服务器为 `www.zcmhi.com`。|
|**If-Match**|只有请求内容与实体相匹配才有效。|`If-Match: "737060cd8c284d8af7ad3082f209582d"`|请求只有在 Etag 匹配时才会成功。|
|**If-Modified-Since**|如果请求的部分在指定时间之后被修改则请求成功，未被修改则返回 304 代码。|`If-Modified-Since: Sat, 29 Oct 2010 19:43:31 GMT`|仅在资源自上次请求以来被修改时才返回新内容。|
|**If-None-Match**|如果内容未改变返回 304 代码，参数为服务器先前发送的 Etag，与服务器回应的 Etag 比较判断是否改变。|`If-None-Match: "737060cd8c284d8af7ad3082f209582d"`|内容未改变则返回 304 状态码。|
|**If-Range**|如果实体未改变，服务器发送客户端丢失的部分，否则发送整个实体。参数也为 Etag。|`If-Range: "737060cd8c284d8af7ad3082f209582d"`|请求的部分数据若 Etag 匹配则返回丢失部分，否则返回整个实体。|
|**If-Unmodified-Since**|只在实体在指定时间之后未被修改才请求成功。|`If-Unmodified-Since: Sat, 29 Oct 2010 19:43:31 GMT`|仅在资源自指定时间未修改时返回请求的内容。|
|**Max-Forwards**|限制信息通过代理和网关传送的时间。|`Max-Forwards: 10`|限制请求经过的代理和网关数量。|
|**Pragma**|用来包含实现特定的指令。|`Pragma: no-cache`|请求或响应不使用缓存。|
|**Proxy-Authorization**|连接到代理的授权证书。|`Proxy-Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==`|向代理服务器提供授权凭证。|
|**Range**|只请求实体的一部分，指定范围。|`Range: bytes=500-999`|请求资源的字节范围 500 到 999。|
|**Referer**|先前网页的地址，当前请求网页紧随其后，即来路。|`Referer: http://www.zcmhi.com/archives/71.html`|来源于 `http://www.zcmhi.com/archives/71.html` 的请求。|
|**TE**|客户端愿意接受的传输编码，并通知服务器接受尾加头信息。|`TE: trailers, deflate;q=0.5`|客户端接受分块传输编码和尾加头信息。|
|**Upgrade**|向服务器指定某种传输协议以便服务器进行转换（如果支持）。|`Upgrade: HTTP/2.0, SHTTP/1.3, IRC/6.9, RTA/x11`|客户端希望将协议升级到 HTTP/2.0 等。|
|**User-Agent**|`User-Agent` 的内容包含发出请求的用户信息。|`User-Agent: Mozilla/5.0 (Linux; X11)`|浏览器信息，用于服务器确定响应内容。|
|**Via**|通知中间网关或代理服务器地址，通信协议。|`Via: 1.0 fred, 1.1 nowhere.com (Apache/1.1)`|记录请求经过的代理服务器和协议。|
|**Warning**|关于消息实体的警告信息。|`Warning: 199 Miscellaneous warning`|警告消息可能存在的非特定问题。|

### 响应报文

响应包含状态行、首部、空行和可选的响应体：

```
<version> <status-code> <reason-phrase>
<headers>

<entity-body>

```

状态行给出协议版本和处理结果：

 ```
  HTTP/1.1 200 OK
```

响应首部说明内容格式、长度或缓存规则等信息：

```
Content-Type: text/html; charset=UTF-8
Content-Length: 1234
Date: Tue, 21 Aug 2024 12:00:00 GMT
```

空行之后是响应体，例如 JSON 数据：

```
{
  "username": "example",
  "password": "123456",
  "is_admin": true
}
```

#### 状态码速查

状态码的第一位用于分类：1xx 表示中间信息，2xx 表示成功，3xx 表示重定向或缓存相关处理，4xx 表示请求相关错误，5xx 表示服务端处理失败。具体含义仍要看完整状态码。

##### 1xx

|状态码|描述|原因|
|---|---|---|
|100|Continue|客户端应继续请求，如果已经完成，则忽略它。|
|101|Switching Protocols|服务器即将切换协议。|
|102|Processing (WebDAV)|服务器已收到请求，但正在处理中，无当前响应。|
|103|Early Hints|与 Link 头部一起使用，允许客户端预加载资源。|

##### 2xx

|状态码|描述|原因|
|---|---|---|
|200|OK|请求成功，服务器返回所请求的数据,具体含义取决于 HTTP 方法。|
|201|Created|请求成功，服务器创建了新的资源|
|202|Accepted|请求已接受，但尚未处理|
|203|Non-Authoritative Information|服务器成功处理请求，但返回的信息可能来自缓存|
|204|No Content|请求成功，但服务器没有返回任何内容|
|205|Reset Content|请求成功，要求重置内容|
|206|Partial Content|请求成功，返回部分内容,使用 Range 头部）。|
|207|Multi-Status (WebDAV)|传输有关多个资源的信息。|
|208|Already Reported(WebDAV)| 成员已经被报告,避免重复报告多个绑定的内部成员。|
|226|IM Used|请求成功，响应表示对资源应用的实例操作结果。|

##### 3xx

|状态码|描述|原因|
|---|---|---|
|300|Multiple Choices|请求有多个可能的响应。|
|301|Moved Permanently|请求的资源 URL 永久更改。|
|302|Found|请求的资源临时改变位置。|
|303|See Other|请求资源需通过 GET 请求从另一个 URI 获取。|
|304|Not Modified|资源未修改，客户端可以使用缓存版本。|
|305|Use Proxy|需要通过代理访问请求的资源（已弃用）。|
|306|(Unused)|不再使用的状态码。|
|307|Temporary Redirect|请求的资源临时改变位置，且方法不变。|
|308|Permanent Redirect|请求的资源永久改变位置，且方法不变。|

##### 4xx

|状态码|描述|原因|
|---|---|---|
|400|Bad Request|请求语法无效，服务器无法处理。|
|401|Unauthorized|客户端需要身份验证才能访问资源。|
|402|Payment Required|保留给将来使用的状态码（实验性）。|
|403|Forbidden|客户端无权访问资源，服务器拒绝提供。|
|404|Not Found|服务器找不到请求的资源。|
|405|Method Not Allowed|请求方法不被目标资源支持。|
|406|Not Acceptable|服务器无法提供符合客户端标准的内容。|
|407|Proxy Authentication Required|需要代理认证。|
|408|Request Timeout|请求超时，服务器关闭连接。|
|409|Conflict|请求与服务器当前状态冲突。|
|410|Gone|请求的资源已永久删除。|
|411|Length Required|请求缺少 Content-Length 头部字段。|
|412|Precondition Failed|请求中的先决条件未被满足。|
|413|Payload Too Large|请求体过大，超出服务器限制。|
|414|URI Too Long|请求的 URI 过长。|
|415|Unsupported Media Type|请求的数据格式不被服务器支持。|
|416|Range Not Satisfiable|请求的范围无效。|
|417|Expectation Failed|服务器无法满足 Expect 请求头字段的期望。|
|418|I'm a teapot|服务器拒绝用茶壶煮咖啡（笑话）。|
|421|Misdirected Request|请求被定向到无法处理的服务器。|
|422|Unprocessable Entity (WebDAV)|请求格式正确但语义错误。|
|423|Locked|资源被锁定。|
|424|Failed Dependency|依赖失败。|
|425|Too Early|请求过早，服务器不愿意处理。|
|426|Upgrade Required|需要升级协议。|
|428|Precondition Required|请求需满足先决条件。|
|429|Too Many Requests|请求次数过多，限制请求速率。|
|431|Request Header Fields Too Large|请求头字段过大。|
|451|Unavailable For Legal Reasons|因法律原因不可用。|

##### 5xx

|状态码|描述|原因|
|---|---|---|
|500|Internal Server Error|服务器遇到错误，无法处理请求。|
|501|Not Implemented|服务器不支持请求的方法。|
|502|Bad Gateway|服务器作为网关接收到错误响应。|
|503|Service Unavailable|服务器不可用（维护或重载）。|
|504|Gateway Timeout|网关超时，未能及时获取响应。|
|505|HTTP Version Not Supported|不支持请求中使用的 HTTP 版本。|
|506|Variant Also Negotiates|服务器配置错误，变体参与了内容协商。|
|507|Insufficient Storage (WebDAV)|服务器存储不足，无法完成请求。|
|508|Loop Detected (WebDAV)|服务器检测到无限循环。|
|510|Not Extended|请求需要进一步扩展才能完成。|
|511|Network Authentication Required|需要进行网络访问认证。|

#### 响应首部速查

|响应头|解释|示例|
|---|---|---|
|**Accept-Ranges**|表明服务器是否支持指定范围请求及哪种类型的分段请求。|`Accept-Ranges: bytes`|
|**Age**|从原始服务器到代理缓存形成的估算时间（以秒计，非负）。|`Age: 12`|
|**Allow**|对某网络资源的有效请求行为，不允许则返回 405。|`Allow: GET, HEAD`|
|**Cache-Control**|告诉所有的缓存机制是否可以缓存及哪种类型。|`Cache-Control: no-cache`|
|**Content-Encoding**|Web 服务器支持的返回内容压缩编码类型。|`Content-Encoding: gzip`|
|**Content-Language**|响应体的语言。|`Content-Language: en, zh`|
|**Content-Length**|响应体的长度。|`Content-Length: 348`|
|**Content-Location**|请求资源可替代的备用的另一地址。|`Content-Location: /index.htm`|
|**Content-MD5**|返回资源的 MD5 校验值。|`Content-MD5: Q2hlY2sgSW50ZWdyaXR5IQ==`|
|**Content-Range**|在整个返回体中本部分的字节位置。|`Content-Range: bytes 21010-47021/47022`|
|**Content-Type**|返回内容的 MIME 类型。|`Content-Type: text/html; charset=utf-8`|
|**Date**|原始服务器消息发出的时间。|`Date: Tue, 15 Nov 2010 08:12:31 GMT`|
|**ETag**|请求变量的实体标签的当前值。|`ETag: "737060cd8c284d8af7ad3082f209582d"`|
|**Expires**|响应过期的日期和时间。|`Expires: Thu, 01 Dec 2010 16:00:00 GMT`|
|**Last-Modified**|请求资源的最后修改时间。|`Last-Modified: Tue, 15 Nov 2010 12:45:26 GMT`|
|**Location**|用来重定向接收方到非请求 URL 的位置来完成请求或标识新的资源。|`Location: http://www.zcmhi.com/archives/94.html`|
|**Pragma**|包括实现特定的指令，它可应用到响应链上的任何接收方。|`Pragma: no-cache`|
|**Proxy-Authenticate**|指出认证方案和可应用到代理的该 URL 上的参数。|`Proxy-Authenticate: Basic`|
|**Refresh**|应用于重定向或一个新的资源被创造，在指定秒数之后重定向。|`Refresh: 5; url=http://www.zcmhi.com/archives/94.html`|
|**Retry-After**|如果实体暂时不可取，通知客户端在指定时间之后再次尝试。|`Retry-After: 120`|
|**Server**|Web 服务器软件名称。|`Server: Apache/1.3.27 (Unix) (Red-Hat/Linux)`|
|**Set-Cookie**|设置 HTTP Cookie。|`Set-Cookie: UserID=JohnDoe; Max-Age=3600; Version=1`|
|**Trailer**|指出头域在分块传输编码的尾部存在。|`Trailer: Max-Forwards`|
|**Transfer-Encoding**|文件传输编码。|`Transfer-Encoding: chunked`|
|**Vary**|告诉下游代理是使用缓存响应还是从原始服务器请求。|`Vary: *`|
|**Via**|告知代理客户端响应是通过哪里发送的。|`Via: 1.0 fred, 1.1 nowhere.com (Apache/1.1)`|
|**Warning**|警告实体可能存在的问题。|`Warning: 199 Miscellaneous warning`|
|**WWW-Authenticate**|表明客户端请求实体应该使用的授权方案。|`WWW-Authenticate: Basic`|

## HTTP 各版本改了什么

| 版本 | 时间 | 主要变化 |
| --- | --- | --- |
| HTTP/0.9 | 1991 年 | 以 GET 获取简单内容，没有后来完整的状态行与首部 |
| HTTP/1.0 | 1996 年 | 增加状态码、首部和更多内容类型；通常每次请求建立连接，也出现持久连接扩展 |
| HTTP/1.1 | 1997 年，1999 年修订 | 默认持久连接，完善缓存、分块传输和虚拟主机等机制 |
| HTTP/2 | 2015 年 | 二进制分帧、多路复用与头部压缩，也定义了服务器推送等能力 |
| HTTP/3 | 2022 年 | 把 HTTP 语义映射到 QUIC，支持独立的流和相应流量控制 |

HTTP/1.1 的持久连接减少了重复建连，但普通顺序请求仍可能互相等待；管线化虽然允许提前发送多个请求，响应顺序仍有限制，因此没有解决所有队头阻塞问题。

HTTP/2 可以在一个 TCP 连接里交错传输多个流，缓解 HTTP 层的等待，但 TCP 丢包仍可能阻塞同一连接中的多个流。HTTP/3 使用 QUIC，减少这类跨流影响，具体传输机制见 [RFC 9114](https://www.rfc-editor.org/rfc/rfc9114.html)。它也不能消除网络拥塞和所有应用层依赖。

## HTTPS 与证书

HTTPS 在 HTTP 通信中使用 TLS，提供传输加密、完整性保护与身份验证。`https` 的默认端口是 443；旧资料中的 SSL 是 TLS 的前身，不应把已经淘汰的 SSL 协议当成当前部署方案。

### 建立安全连接时发生什么

客户端和服务端先协商协议参数、验证身份并建立共享的密钥材料，再保护后续应用数据。证书用于绑定身份与公钥，浏览器需要核对信任链、域名和有效期等信息。

不同 TLS 版本和套件的握手方式不同。例如，TLS 1.3 使用密钥交换等机制导出流量密钥，不能统一描述成“浏览器用证书公钥加密会话密钥，服务端再用私钥解密”。细节可参考 [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html)。

HTTPS 保护的是通信过程；它不保证应用没有漏洞，也不代表获得证书的网站就值得信任。

### DV、OV 和 EV 证书

这几类证书主要区别在于申请者身份的验证程度：DV 验证域名控制权，OV 进一步核验组织身份，EV 对组织身份执行更严格的验证。它们不能简单按名称理解为不同强度的传输加密。

### 证书透明度

Certificate Transparency（CT）通过公开日志帮助域名所有者和浏览器等参与方发现异常签发，为证书体系提供审计依据。它补充证书验证，并不代替它。

旧资料常提到 `Expect-CT` 响应头；它已经被 [MDN 标记为弃用](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Expect-CT)，不应继续作为新的配置建议。

## 缓存：先看能否复用，再看是否需要验证

浏览器和代理都可能保存响应。缓存命中并且仍然新鲜时，可以直接使用；需要重新验证时，则通过条件请求询问服务端。如果资源没有变化，服务端可以返回 `304`，客户端继续使用已有内容。

`Cache-Control: max-age` 指定新鲜期，存在时通常优先于 `Expires`。`ETag` 配合 `If-None-Match`、`Last-Modified` 配合 `If-Modified-Since`，用于条件请求。

### 浏览器缓存与共享缓存

浏览器缓存面向当前客户端；代理或 CDN 上的共享缓存可能服务多个用户。个性化响应需要特别注意共享规则。

- `private`：响应不能由共享缓存保存，但可以由私有缓存保存。
- `public`：显式允许共享缓存按规则存储。
- `s-maxage`：指定共享缓存的新鲜期。
- `must-revalidate`：响应过期后，未经成功验证不能继续复用。
- `proxy-revalidate`：把相应验证要求限定到共享缓存。

例如：

```
Cache-Control: public, max-age=1000, s-maxage=2000
```

这表示允许共享缓存，私有缓存的新鲜期是 1000 秒，共享缓存的新鲜期是 2000 秒。

客户端也可以表达对缓存新鲜度的要求。例如，接受已过期不超过 5 秒的响应：

```
Cache-Control: max-stale=5
```

或者要求响应至少还能保持 5 秒的新鲜度：

```
Cache-Control: min-fresh=5
```

这些请求指令仍会受到响应缓存策略的约束。`only-if-cached` 则要求使用缓存中的响应，无法满足时可以返回 `504`。

### no-cache 与 no-store

`no-cache` 允许保存响应，但复用前必须验证；`no-store` 要求不存储该请求或响应。想每次确认是否更新，通常考虑前者；不希望保存敏感响应时，再考虑后者。详见 [MDN HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)。

缓存可能放在内存或磁盘里，这与“强缓存、协商缓存”的判断规则是不同维度。没有显式新鲜期时，还可能使用启发式缓存，它不是每次请求都必须按顺序经历的一道阶段。

ETag 也不要求每次重新计算整个文件的哈希。服务端可以利用内容版本、文件元数据或预先保存的摘要生成验证标识，但必须确保标识能正确反映相应表示的变化。

## 表单与大文件怎样传输

### 表单编码

`application/x-www-form-urlencoded` 把字段编码为键值对，常用 `&` 分隔；`multipart/form-data` 则用 boundary 划分多个部分，每一部分可以包含自己的首部，适合同时传输普通字段与文件。

### 压缩、分块和范围请求

压缩减少实际传输的数据量，客户端通过 `Accept-Encoding` 声明支持的编码，服务端选择合适方式。

HTTP/1.1 的分块传输编码允许逐块发送内容，不要求先知道完整长度。它与把文件切成业务分片、以及 HTTP/2 或 HTTP/3 的分帧，是不同概念。

范围请求允许客户端只获取资源的一部分。服务端可以用下面的首部声明支持字节范围：

```
Accept-Ranges: bytes
```

客户端再用 `Range` 指定范围，例如 `bytes=0-499`、`bytes=500-` 或 `bytes=-100`。可满足的范围请求通常返回 `206`，不能满足时可能返回 `416`；服务端也可能忽略 Range 而返回完整表示。

单段响应示例：

```
HTTP/1.1 206 Partial Content
Content-Length: 10
Accept-Ranges: bytes
Content-Range: bytes 0-9/100

i am xxxxx
```

其中 `Content-Range` 说明返回的字节位置与资源总长度。请求多个范围时，响应可以使用 `multipart/byteranges`：

```
HTTP/1.1 206 Partial Content
Content-Type: multipart/byteranges; boundary=00000010101
Content-Length: 189
Connection: keep-alive
Accept-Ranges: bytes


--00000010101
Content-Type: text/plain
Content-Range: bytes 0-9/96

i am xxxxx
--00000010101
Content-Type: text/plain
Content-Range: bytes 20-29/96

eex jspy e
--00000010101--
```

每段由 boundary 分隔，末尾分隔符再加上 `--` 表示结束。

## 浏览器限制与常见攻击

### CORS 预检在检查什么

跨域请求不一定触发预检。通常所说的简单请求，需要同时满足方法、首部和内容类型等条件；仅凭 GET 或 POST 无法判断。`application/json` 或自定义 `Authorization` 头就可能触发预检。

触发时，浏览器先通过 OPTIONS 询问目标服务是否允许对应来源、方法和首部，通过后才发送实际请求。预检结果可以缓存，所以并非每次都固定多发一次请求。OPTIONS 也有其他用途，不能把所有 OPTIONS 都等同于预检。具体条件见 [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)。

### CSRF：浏览器可能替攻击者带上凭据

假设发帖接口通过 GET 修改状态：

```
 http://example.com/bbs/create_post.php?title=标题&content=内容
```

攻击者可以构造另一个地址，诱导已经登录的用户访问：

```
  http://example.com/bbs/create_post.php?title=我是脑残&content=哈哈
```

如果浏览器携带了用户凭据，而服务端没有验证请求意图，就可能发生未授权操作。表单也能发送跨站 POST，所以只把 GET 改成 POST 不足以防护。

修改状态的请求应结合框架的 CSRF 防护、服务端验证的随机 Token、来源检查与合适的 SameSite 策略。验证码或二次确认可以用于敏感操作，但不能代替通用防护。Token 可以按会话或请求管理，不必一概要求每次使用后更换，见 [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)。

### XSS：把不可信内容当成脚本执行

如果评论等输入未经合适处理就插进页面，攻击者可能让其他用户的浏览器执行脚本。下面用弹窗说明这种效果：

```
  while (true) {
      alert("你关不掉我~");
  }
```

实际影响还可能包括窃取数据或借用户身份发起操作。防护要根据 HTML、属性、URL、JavaScript 等输出上下文编码；确实允许富文本时，需要可靠的清洗机制，CSP 可作为补充。不能只靠替换几个可疑字符串，具体见 [MDN XSS](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS)。

## 把这些知识串成一次页面访问

在地址栏输入 URL 后，并不一定每次都从头走完整套流程。浏览器可能复用 DNS、连接、缓存或已有页面状态。按需要建立新连接的情况，可以这样理解：

1. **解析地址并查找缓存**：确认 scheme、主机和路径，判断是否有可用的本地结果。
2. **解析域名**：通过本机与递归解析器查找地址，必要时向根、顶级域和权威 DNS 逐步查询；实际查询链取决于缓存和网络配置。
3. **建立连接**：HTTP/1.1、HTTP/2 通常需要 TCP；HTTPS 还涉及 TLS。HTTP/3 使用 QUIC。
4. **发送请求**：方法、首部和可选内容经过浏览器、代理或负载均衡到达目标服务。
5. **处理响应**：服务端可能返回内容、错误或重定向。重定向是分支，不是每次访问的固定步骤。
6. **解析和获取资源**：浏览器解析 HTML、构建 DOM 与样式信息，并按需请求 CSS、JavaScript、图片等资源。
7. **布局与绘制**：计算元素的位置和大小，组织图层并绘制。后续脚本修改也可能触发布局或重绘。

脚本对解析的影响与加载方式有关。普通阻塞脚本、`defer`、`async` 和模块脚本不能混为一谈；JavaScript 任务的调度还涉及事件循环、任务和微任务。复习时先分清网络、解析与执行这几条线，比把所有步骤背成一个固定顺序更有用。

## 面试时容易答错的几个点

### GET 和 POST 的区别

先说方法语义，再说实际用法。GET 用于获取表示，POST 让资源处理提交内容；查询参数与请求体是常见组织方式，但不能据此推导谁天然更安全。

缓存也不能概括成“GET 能缓存、POST 一定不能”。POST 在满足相应条件时也可以缓存，只是常见实现支持有限。HTTP 方法不决定 TCP 分成几个包，`100 Continue` 也不是每次 POST 必经的步骤。

### 如何理解 HTTP 代理

代理对客户端表现为服务端，对上游又表现为客户端。它可以转发请求、做负载均衡、缓存内容或过滤流量；能否主动健康检查、如何排除故障节点，则取决于具体产品和配置，不能当成所有代理的默认能力。

### 怎样理解队头阻塞

先问发生在哪一层。HTTP/1.1 的响应顺序会造成等待，HTTP/2 用多路复用改善这部分问题，TCP 丢包仍可能影响多个流；HTTP/3 又把流管理移到 QUIC。增加并发连接或域名分片只能缓解部分场景，还会增加连接与调度成本。

### TCP/IP 与 HTTP 的关系

TCP/IP 是协议族，HTTP 是其中应用层协议的一员。IP 负责寻址与转发，TCP 和 UDP 提供不同的传输能力；具体 HTTP 版本再选择相应传输方式。分层之后，就不容易把用户会话、网络连接和单次请求当成一回事。

## 参考资料

- [RFC 9110：HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [RFC 9114：HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html)
- [RFC 8446：TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html)
- [MDN：HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
- [OWASP：CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)


[超文本传输协议](https://zh.wikipedia.org/wiki/%E8%B6%85%E6%96%87%E6%9C%AC%E4%BC%A0%E8%BE%93%E5%8D%8F%E8%AE%AE)
[HTTP 响应状态码](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status#%E4%BF%A1%E6%81%AF%E5%93%8D%E5%BA%94)
[http协议终极详解---看这一篇就够了](https://developer.aliyun.com/article/618177)
[Http协议详解(深入理解)](https://blog.csdn.net/weixin_38087538/article/details/82838762)
[HTTP响应头和请求头信息对照表](https://tools.jb51.net/table/http_header)
[HTTP协议简介](https://fasionchan.com/network/http/intro/)
[HTTP协议知识](https://hit-alibaba.github.io/interview/basic/network/HTTP.html)
[HTTP精选面试题](https://cchroot.github.io/interview/pages/interview%20questions/HTTP%E7%B2%BE%E9%80%89%E9%9D%A2%E8%AF%95%E9%A2%98.html)
[2023 年最新最全的 http 网络面试题](https://www.xiabingbao.com/post/http/http-interview-rrgt3b.html)
[从输入url到页面展示到底发生了什么](https://cchroot.github.io/interview/pages/interview%20notes/%E4%BB%8E%E8%BE%93%E5%85%A5url%E5%88%B0%E9%A1%B5%E9%9D%A2%E5%B1%95%E7%A4%BA%E5%88%B0%E5%BA%95%E5%8F%91%E7%94%9F%E4%BA%86%E4%BB%80%E4%B9%88.html#%E4%B8%BB%E8%A6%81%E8%BF%87%E7%A8%8B%E6%95%B4%E7%90%86)

- [DNS](https://baike.baidu.com/item/%E5%9F%9F%E5%90%8D%E7%B3%BB%E7%BB%9F?fromModule=lemma_search-box)
- [TCP连接](http://www.jianshu.com/p/ef892323e68f)

<!-- auto-internal-links -->
## 延伸阅读
- [文章归档](/archives/)
- [分类导航](/categories/)
- [标签导航](/tags/)
- [同分类更多内容](/categories/%E5%BC%80%E5%8F%91/)
