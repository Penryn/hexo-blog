---
title: HTTP协议介绍和常见面试题总结
date: 2024-08-22 03:14:54
categories: 开发
tags:
  - http
---
由于最近开始学习java web，于是顺便把一些基础的东西整理一下，刚好看到http协议这块，遂打算整理。

# 简介
**超文本传输协议**（英语：**H**yper**T**ext **T**ransfer **P**rotocol，缩写：**HTTP**）是一种用于分布式、协作式和超媒体信息系统的应用层协议。用我们更熟悉的说法，http是一种用于在Web浏览器与Web服务器之间传输超文本信息的应用层协议。

# 基本特点
- **基于请求/响应模型**：
    
    - HTTP是基于TCP/IP协议，通信过程中必须先由客户端发起请求，然后服务器进行响应。每次HTTP通信都是独立的，且请求和响应必须成对出现。
- **默认端口80**：
    
    - HTTP协议默认使用端口80进行通信。当浏览器通过HTTP访问Web服务器时，通常会自动使用端口80，除非另有指定。
- **简单快速**：
    
    - HTTP协议的设计非常简单，客户端向服务器发起请求时，只需传递请求方法（如GET、HEAD、POST）和路径。这种简洁性不仅使得HTTP协议易于实现，也有助于提高通信速度。由于HTTP请求和响应头信息较小，加上没有复杂的握手过程，使得HTTP服务器能够快速响应请求。
- **灵活性**：
    
    - HTTP协议允许传输任何类型的数据，这种灵活性通过`Content-Type`头字段进行标识。例如，可以传输HTML文档、图片、视频、JSON数据等，HTTP不会限制所传输的数据类型。
- **无连接**：
    
    - HTTP协议是无连接的，每次连接只处理一个请求，服务器处理完请求后立即断开连接。这种方式减少了服务器和客户端之间的资源消耗，适合大规模的短暂连接请求，如网页浏览。需要注意的是，在HTTP/1.1中，默认启用了持久连接，允许在同一个TCP连接上处理多个请求和响应，但仍保留了无连接的特性。
- **无状态**：
    
    - HTTP是无状态协议。无状态是指协议对于事务处理没有记忆能力，这意味着每个请求都是独立的，服务器不会保留之前请求的状态信息。这种无状态性虽然可能导致重复传输一些数据，但也使得服务器在处理请求时更加简单高效。当需要维持状态时，可以通过客户端的Cookie、URL参数、或使用其他状态管理机制（如Session）来实现。



# 协议功能
设计HTTP最初的目的是为了提供一种发布和接收HTML页面的方法。通过HTTP或者HTTPS协议请求的资源由统一资源标识符（Uniform Resource Identifiers，URI）来标识。

我们在浏览器的地址栏里输入的网站地址叫做统一资源定位符(Uniform Resource Locator，URL )。就像每家每户都有一个门牌地址一样，每个网页也都有一个Internet地址。当你在浏览器的地址框中输入一个URL或是单击一个超级链接时，URL就确定了要浏览的地址。浏览器通过超文本传输协议(HTTP)，将Web服务器上站点的网页代码提取出来，并翻译成漂亮的网页。
## URI与URL和URN
这几个是不是傻傻分不清呢？这就给你来介绍一下

### URI
是uniform resource identifier，统一资源标识符，用来唯一的标识一个资源。

Web上可用的每种资源如HTML文档、图像、视频片段、程序等都是一个来**URI**来定位的  
**URI**一般由三部组成：  
①访问资源的命名机制  
②存放资源的主机名  
③资源自身的名称，由路径表示，着重强调于资源。

### URL
是uniform resource locator，统一资源定位器，它是一种具体的URI，即URL可以用来标识一个资源，而且还指明了如何locate这个资源。

**URL**是**Internet**上用来描述信息资源的字符串，主要用在各种**WWW**客户程序和服务器程序上，特别是著名的Mosaic。  
采用**URL**可以用一种统一的格式来描述各种信息资源，包括文件、服务器的地址和目录等。URL一般由三部组成：  
①**协议**(或称为服务方式)  
②存有该资源的主机**IP地址**(有时也包括端口号)  
③主机资源的**具体地址**。如目录和文件名等

### URN
uniform resource name，统一资源命名，是通过名字来标识资源，比如mailto:java-net@java.sun.com。

### 小结
**URI**是以一种抽象的，高层次概念定义统一资源标识，而**URL**和**URN**则是具体的资源标识的方式。

**URL**和**URN**都是一种**URI**。
笼统地说，每个 **URL** 都是 **URI**，但不一定每个 **URI** 都是 **URL**。这是因为 **URI** 还包括一个子类，即统一资源名称 (URN)，它命名资源但不指定如何定位资源。上面的 mailto、news 和 isbn URI 都是 URN 的示例。

在Java的URI中，一个URI实例可以代表绝对的，也可以是相对的，只要它符合URI的语法规则。而URL类则不仅符合语义，还包含了定位该资源的信息，因此它不能是相对的。  
在Java类库中，URI类不包含任何访问资源的方法，它唯一的作用就是解析。  
相反的是，URL类可以打开一个到达资源的流。

## URL各部分组成介绍
以下面这个**URL**为例，介绍下普通**URL**的各部分组成：
https://www.example.com/paths/item?id=123&category=books#reviews
从上面的**URL**可以看出，一个完整的**URL**包括以下几部分：  
1.**协议（Scheme）**部分：该URL的协议部分为“http://”，这代表网页使用的是**HTTP**协议。在Internet中可以使用多种协议，如HTTP，FTP等等本例中使用的是HTTP协议。在"HTTP"后面的“**//**”为分隔符

2.**主机（Host）**部分：该**URL**的主机部分为“**www.example.com**”。它指定服务器的地址，通常是域名或IP地址。它标识了存储资源的服务器位置。

3.**端口（Port）**部分：跟在域名后面的是端口，域名和端口之间使用“**:**”作为分隔符。端口不是一个**URL**必须的部分，如果省略端口部分，将采用默认端口(80/443)，如果使用其他端口，必须在URL中指定。

4.**虚拟目录（Virtual Directory）**部分：从域名后的第一个“/”开始到最后一个“/”为止，是虚拟目录部分。虚拟目录也不是一个**URL**必须的部分。本例中的虚拟目录是“/paths/”。

5.**文件名（Filename）**部分：从域名后的最后一个“/”开始到“？”为止，是文件名部分，如果没有“?”,则是从域名后的最后一个“/”开始到“#”为止，是文件部分，如果没有“？”和“#”，那么从域名后的最后一个“/”开始到结束，都是文件名部分。本例中的文件名是“item”。文件名部分也不是一个URL必须的部分。

6.**锚（Anchor）**部分：也称片段（Fragment），从“#”开始到最后，都是锚部分。本例中的锚部分是“reviews”。锚部分也不是一个URL必须的部分。

7.**查询参数（Query String）**部分：从“？”开始到“#”为止之间的部分为参数部分，又称搜索部分、查询部分。本例中的参数部分为“id=123&category=books”。参数可以允许有多个参数，参数与参数之间用“&”作为分隔符。
## 工作原理
HTTP协议定义Web客户端如何从Web服务器请求Web页面，以及服务器如何把Web页面传送给客户端。HTTP协议采用了请求/响应模型。客户端向服务器发送一个请求报文，请求报文包含请求的方法、URL、协议版本、请求头部和请求数据。服务器以一个状态行作为响应，响应的内容包括协议的版本、成功或者错误代码、服务器信息、响应头部和响应数据。

以下是 HTTP 请求/响应的步骤：

### 1、客户端连接到Web服务器

一个HTTP客户端，通常是浏览器，与Web服务器的HTTP端口（默认为80）建立一个TCP套接字连接。例如，http://blog.phlin.top/，当浏览器访问这个 _URL_ 时，它根据 _URL_ 格式解析出服务器主机部分 `blog.phlin.top` 。这是一个域名，必须先通过 [DNS](https://baike.baidu.com/item/%E5%9F%9F%E5%90%8D%E7%B3%BB%E7%BB%9F?fromModule=lemma_search-box) 解析为 _IP_ 地址后，方能连接。

### 2、发送HTTP请求

通过TCP套接字，客户端向Web服务器发送一个文本的请求报文，一个请求报文由请求行、请求头部、空行和请求数据4部分组成。

### 3、服务器接受请求并返回HTTP响应

Web服务器解析请求，定位请求资源。服务器将资源复本写到TCP套接字，由客户端读取。一个响应由状态行、响应头部、空行和响应数据4部分组成。

### 4、释放连接[TCP连接](http://www.jianshu.com/p/ef892323e68f)

若connection 模式为close，则服务器主动关闭TCP连接，客户端被动关闭连接，释放TCP连接;若connection 模式为keepalive，则该连接会保持一段时间，在该时间内可以继续接收请求;

### 5、客户端浏览器解析HTML内容

客户端浏览器首先解析状态行，查看表明请求是否成功的状态代码。然后解析每一个响应头，响应头告知以下为若干字节的HTML文档和文档的字符集。客户端浏览器读取响应数据HTML，根据HTML的语法对其进行格式化，并在浏览器窗口中显示。

## http报文
### 请求报文
报文格式
```
<method> <request-URL> <version>
<headers>

<entity-body>
```
各部分介绍
1. **请求行（Request Line）**

- **格式**：`<method> <request-URL> <version>`
- **解释**：
    - `<method>`：HTTP方法，如 `GET`、`POST`、`PUT`、`DELETE` 等。
    - `<request-URL>`：请求的资源URL，可能包括一些请求参数，如 `/index.html?id=1`。
    - `<version>`：HTTP协议版本，如 `HTTP/1.1`。
- **示例**：
 ```
  GET /index.html?id=1 HTTP/1.1
```
2. **请求头部（Request Headers）**

- **格式**：`<Header-Name>: <Header-Value>`
- **解释**：包含有关请求的附加信息，每个头部字段以冒号分隔字段名和字段值。
- **示例**：
```
Host: www.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8

```
3. **空行（Empty Line）**

- **格式**：空行（即回车换行符）
- **解释**：用于分隔请求头部和请求体部分。

4. **请求体（Request Body）**（可选）

- **格式**：`<data>`
- **解释**：请求体包含实际的数据，如提交的表单数据或JSON对象。不是所有请求都有请求体。
- **示例**（POST请求中的请求体）：
```
username=example&password=123456
```
#### 请求方法
根据HTTP标准，HTTP请求可以使用多种请求方法。  
HTTP1.0定义了三种请求方法： **GET**, **POST** 和 **HEAD**方法。  
HTTP1.1新增了五种请求方法：**OPTIONS**, **PUT**, **DELETE**, **TRACE** 和 **CONNECT** 方法。

##### GET请求

- **参数传递**：请求参数附加在URL后面，因此相对不安全。
- **长度限制**：GET请求的URL长度有限制，这会限制请求数据的大小。
- **请求体**：GET请求没有请求体。
- **使用场景**：GET请求是常见的HTTP请求方式，通常用于地址栏直接访问、`<a href="">`、`<img src="">`等。

##### POST请求

- **参数传递**：请求参数放在请求体中，相对较安全。
- **大小限制**：POST请求的数据大小没有明确的限制。
- **请求方式**：只有表单设置为`method="post"`时才会发起POST请求，其他情况默认使用GET请求。

##### HEAD请求

- **功能**：HEAD请求与GET请求类似，但服务器只返回响应头而不发送响应内容。
- **使用场景**：适合仅需检查某个页面状态时，使用HEAD请求可以提高效率，因为避免了页面内容的传输。

##### DELETE请求

- **功能**：用于删除指定的资源。

##### OPTIONS请求

- **功能**：获取当前URL支持的方法。如果请求成功，响应头中会包含一个名为“Allow”的字段，其值为支持的方法列表，如“GET, POST”。

##### PUT请求

- **功能**：将资源存放在指定的位置上。
- **区别**：PUT和POST非常相似，都是向服务器发送数据，但主要区别在于PUT通常指定资源的存放位置，而POST则由服务器决定数据存放的位置。

##### TRACE请求

- **功能**：回显服务器收到的请求，主要用于测试和诊断。

##### CONNECT请求

- **功能**：CONNECT方法是HTTP/1.1协议保留的，用于将连接转换为管道方式的代理服务器，通常用于SSL加密服务器与非加密HTTP代理服务器的通信。
#### REST架构
随着服务化架构的普及，HTTP协议的使用频率逐渐增加。然而，很多开发者在定义HTTP接口时，存在以下问题：

- 不一致的命名方式，如 `getUserInfoById`、`deleteById` 等。
- 有状态和无状态请求的混用。
- 未充分利用HTTP协议本身的规则。

为了应对这些问题，REST架构风格被引入，它并没有引入新的协议，而是对HTTP协议的使用提出了一些规范，以确保一致性和有效性。REST通过以下几种方式来解决这些问题：

##### REST的关键原则

1. **资源导向**：
    
    - 每一个URI（统一资源标识符）代表一个资源。资源应该是名词而不是动词，这样可以通过HTTP方法（如GET、POST、PUT、DELETE）来操作这些资源。
2. **无状态性**：
    
    - 服务器端不能存储来自客户端的请求信息。每个请求都应包含处理请求所需的所有信息，确保每个请求都是独立的。
3. **避免动词在URI中**：
    
    - 在URI中不应出现动词。URI应专注于资源的标识，而操作则通过HTTP方法来表达。
4. **合理利用HTTP状态码和请求方法**：
    
    - 正确使用HTTP状态码（如200、404、500等）和请求方法（如GET、POST、PUT、DELETE）来反映请求的处理结果和操作类型。

##### 遵循REST标准的意义

遵循REST架构风格有助于：

- **规范化接口设计**：通过一致的命名和方法使用，避免因混乱命名和操作方法造成的维护困难。
- **提高可读性和可维护性**：明确的资源导向和无状态请求使得API更加清晰和易于理解。
- **有效利用HTTP协议**：充分发挥HTTP协议本身的功能，提升接口的效率和一致性。
#### 请求报文头属性
|Header|解释|示例|用例|
|---|---|---|---|
|**Accept**|指定客户端能够接收的内容类型。|`Accept: text/plain, text/html`|客户端希望接收纯文本或 HTML 格式的响应内容。|
|**Accept-Charset**|浏览器可以接受的字符编码集。|`Accept-Charset: iso-8859-5`|客户端可以接受 ISO-8859-5 字符集的响应。|
|**Accept-Encoding**|指定浏览器可以支持的 Web 服务器返回内容压缩编码类型。|`Accept-Encoding: compress, gzip`|客户端可以处理压缩格式（如 gzip）以减少响应数据量。|
|**Accept-Language**|浏览器可接受的语言。|`Accept-Language: en, zh`|客户端接受英文和中文的响应内容。|
|**Accept-Ranges**|可以请求网页实体的一个或者多个子范围字段。|`Accept-Ranges: bytes`|服务器支持按字节范围请求资源。|
|**Authorization**|HTTP 授权的授权证书。|`Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==`|客户端发送 Basic 认证凭证进行身份验证。|
|**Cache-Control**|指定请求和响应遵循的缓存机制。|`Cache-Control: no-cache`|客户端请求不使用缓存的内容。|
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
报文格式
```
<version> <status-code> <reason-phrase>
<headers>

<entity-body>

```

各部分介绍
1. **状态行（Status Line）**

- **格式**：`<version> <status-code> <reason-phrase>`
- **解释**：
    - `<version>`：HTTP协议版本，如`HTTP/1.1`。
    - `<status-code>`：状态码，如`200`、`404`、`500`。
    - `<reason-phrase>`：状态码的简短描述，如`OK`、`Not Found`、`Internal Server Error`。
 - **示例**： 
 ```
  HTTP/1.1 200 OK
```
2. **响应头部（Response Headers）**

- **格式**：`<Header-Name>: <Header-Value>`
- **解释**：包含关于响应的附加信息，每行一个头部字段，字段名和字段值用冒号分隔。
- **示例**
```
Content-Type: text/html; charset=UTF-8
Content-Length: 1234
Date: Tue, 21 Aug 2024 12:00:00 GMT
```
3. **空行（Empty Line）**

- **格式**：空行（即回车换行符）
- **解释**：用于分隔响应头部和响应体部分。

4. **响应体（Response Body）**（可选）

- **格式**：`<data>`
- **解释**：响应体包含实际内容，如HTML文档、JSON数据或图像。不是所有响应都有响应体。
- **示例**（JSON数据响应体）：
```
{
  "username": "example",
  "password": "123456",
  "is_admin": true
}
```
#### 状态码
##### 1xx - 信息性状态码

|状态码|描述|原因|
|---|---|---|
|100|Continue|客户端应继续请求，如果已经完成，则忽略它。|
|101|Switching Protocols|服务器即将切换协议。|
|102|Processing (WebDAV)|服务器已收到请求，但正在处理中，无当前响应。|
|103|Early Hints|与 Link 头部一起使用，允许客户端预加载资源。|

##### 2xx - 成功状态码

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

##### 3xx - 重定向状态码

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

##### 4xx - 客户端错误状态码

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

##### 5xx - 服务器错误状态码

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

#### 响应头属性
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

# 各版本主要变化
目前主要是HTTP/1.1和HTTP/2比较广泛使用

### HTTP/0.9

- **发布年份**：1991年
- **主要特点**：
    - 最初的HTTP协议版本，主要用于传输简单的HTML文本。
    - 只有一个请求方法：`GET`。
    - 不支持HTTP头部，服务器仅返回纯文本内容。
    - 不支持状态码。
    - 无法处理非文本文件，也不支持POST、PUT等方法。
- **省流**：简单的文本传输协议。

### HTTP/1.0

- **发布年份**：1996年
- **主要特点**：
    - 引入了HTTP头部，支持状态码、内容类型（`Content-Type`）、内容长度（`Content-Length`）等。
    - 支持多种请求方法：`GET`、`POST`、`HEAD`。
    - 允许传输多种类型的数据（如图像、视频）。
    - 每个请求需要单独的TCP连接，请求完成后连接即关闭（无连接）。
    - 增加了对缓存的支持，通过`If-Modified-Since`和`Expires`头部字段实现。
    - 开始支持虚拟主机，通过`Host`头部字段实现。
- **省流**：引入了状态码、头部字段，支持更多请求方法。

### HTTP/1.1

- **发布年份**：1997年（正式RFC：1999年）
- **主要特点**：
    - 默认启用持久连接（Persistent Connection），即同一个TCP连接可以复用处理多个请求，减少了连接开销。
    - 支持请求的管道化（Pipelining），允许客户端在收到响应前发送多个请求，从而提高传输效率（但由于实现复杂，管道化功能并未广泛使用）。
    - 增加了更多的请求方法，如`PUT`、`DELETE`、`OPTIONS`、`TRACE`。
    - 引入了`Host`头部字段，允许同一服务器托管多个域名（虚拟主机）。
    - 支持分块传输编码（Chunked Transfer Encoding），允许服务器分块传输动态生成的内容，客户端可以开始处理已经接收的数据。
    - 增加了更多的缓存控制头部字段（如`Cache-Control`）和条件请求头部字段（如`ETag`、`If-None-Match`）。
    - 支持范围请求（Range Requests），允许客户端请求部分资源（如视频的某一部分），提高了大文件传输的灵活性。
- **省流**：持久连接、管道化、虚拟主机、分块传输等，显著提高了效率。

### HTTP/2

- **发布年份**：2015年
- **主要特点**：
    - 基于二进制格式传输，替代了HTTP/1.x中的文本格式，提高了解析效率。
    - 引入多路复用（Multiplexing），同一个TCP连接上可以并行传输多个请求和响应，消除了HTTP/1.x中的队头阻塞（Head-of-Line Blocking）问题。
    - 使用头部压缩（Header Compression），减少了传输的HTTP头部体积。
    - 支持服务器推送（Server Push），允许服务器在客户端请求之前主动推送资源到客户端，减少延迟。
    - 通过流量优先级和依赖关系（Priority and Dependency）管理请求和响应的传输顺序。
    - 与HTTP/1.x的语义保持一致，应用层协议不变，仍然使用熟悉的请求方法、状态码和头部字段。
- **省流**：二进制传输、多路复用、头部压缩、服务器推送，大幅改善性能。

### HTTP/3

- **发布年份**：2022年（正式RFC）
- **主要特点**：
    - 基于QUIC协议而不是TCP协议，QUIC是一种集成了TLS加密的传输层协议，旨在减少连接建立和数据传输的延迟。
    - 同样支持多路复用，但由于QUIC使用UDP而不是TCP，因此避免了TCP中固有的队头阻塞问题。
    - 改进了连接恢复能力，连接在网络中断后可以快速恢复，适用于移动网络等不稳定的环境。
    - 增加了传输的可靠性和效率，尤其是在丢包率高的网络环境下。
    - 与HTTP/2一样，HTTP/3保持了与HTTP/1.x的语义一致性，协议接口对应用层保持透明。
- **省流**：基于QUIC协议，进一步降低延迟，提升传输效率，尤其在不稳定网络中表现出色。
# HTTPS协议
HTTPS（HyperText Transfer Protocol Secure）是HTTP（超文本传输协议）的安全版本。它通过在HTTP协议上添加SSL（Secure Sockets Layer）或TLS（Transport Layer Security）协议来实现安全的数据传输。简而言之，HTTPS可以看作是HTTP与SSL/TLS的组合，用于加密数据传输、验证服务器身份，并确保通信的完整性。
## 主要特点
- **数据加密**：
    
    - 在HTTP中，数据是明文传输的，这意味着任何在传输过程中拦截数据的第三方都可以读取数据内容。而在HTTPS中，数据在传输之前会被加密，即使数据被截获，也无法轻易解读。
- **服务器身份验证**：
    
    - HTTPS使用数字证书来验证服务器的身份，确保客户端连接的确实是其想要访问的服务器。服务器通过证书颁发机构（CA）签发的证书来证明其身份，客户端浏览器会验证该证书的有效性。
- **数据完整性**：
    
    - HTTPS能够防止数据在传输过程中被篡改。如果数据在传输途中被修改，接收方会发现数据不一致，从而拒绝该数据。
- **使用端口**：
    
    - HTTPS默认使用端口443，而HTTP默认使用端口80。
## 工作原理
- **客户端请求**：
    
    - 当用户在浏览器中输入一个HTTPS URL并访问网站时，客户端（如浏览器）首先与服务器建立连接，并请求服务器的数字证书。
- **服务器响应**：
    
    - 服务器响应客户端的请求，并发送其数字证书给客户端。该证书包含了服务器的公钥，以及由受信任的证书颁发机构签署的信息。
- **客户端验证**：
    
    - 客户端验证数字证书的有效性。如果证书可信，客户端将使用证书中的公钥加密一个随机生成的会话密钥，并将该密钥发送给服务器。
- **建立加密连接**：
    
    - 服务器使用其私钥解密会话密钥。此后，客户端和服务器都使用该会话密钥进行加密通信，从而确保数据的机密性和完整性。
## 优势
- **安全性**：HTTPS通过加密通信防止信息泄露和篡改，尤其适合传输敏感数据，如登录凭证、支付信息等。
- **信任性**：通过验证服务器身份，HTTPS可以防止中间人攻击，确保用户访问的是真正的目标网站。
- **SEO友好**：搜索引擎，如Google，优先排名使用HTTPS的网站，并标记未使用HTTPS的网站为“不安全”。
## SSL/TLS证书类型
### **域名验证（DV）证书**

- **特点**：
    - **验证方式**：仅验证域名的所有权，通过控制域名的DNS记录或响应验证邮件来完成。
    - **适用场景**：适用于小型网站、个人博客或非商业性网站。
    - **颁发速度**：通常较快，可以在几分钟到几小时内完成。
    - **信任度**：较低，不验证组织的身份，仅确保域名的所有权。

### 2. **组织验证（OV）证书**

- **特点**：
    - **验证方式**：除了验证域名的所有权外，还需要验证申请组织的合法性，通常需要提供组织的注册信息和营业执照。
    - **适用场景**：适用于中型企业和商业网站，提供比DV证书更高的信任度。
    - **颁发速度**：通常需要几个工作日，因为涉及到更多的验证步骤。
    - **信任度**：较高，证书上会显示组织的名称，增加用户的信任感。

### 3. **扩展验证（EV）证书**

- **特点**：
    - **验证方式**：进行严格的背景检查，包括验证组织的法律地位、注册信息、运营地址等。
    - **适用场景**：适用于需要高信任度的网站，如金融机构、电子商务网站等。
    - **颁发速度**：通常需要较长时间（几天到几周），因为验证过程复杂。
    - **信任度**：非常高，浏览器地址栏会显示组织名称和安全锁标志，提供最大的用户信任。

# 补充知识
## 跨站攻击
### CSRF（跨站请求伪造）

**CSRF（Cross-Site Request Forgery）** 是一种攻击手段，通过伪造请求来冒充用户在网站上执行操作。
例如，一论坛网站的发贴是通过 GET 请求访问，点击发贴之后 JS 把发贴内容拼接成目标 URL 并访问：
```
 http://example.com/bbs/create_post.php?title=标题&content=内容
```
那么，我们只需要在论坛中发一帖，包含一链接：

```
  http://example.com/bbs/create_post.php?title=我是脑残&content=哈哈
```

只要有用户点击了这个链接，那么他们的帐户就会在不知情的情况下发布了这一帖子。可能这只是个恶作剧，但是既然发贴的请求可以伪造，那么删帖、转帐、改密码、发邮件全都可以伪造。

**防范 CSRF 攻击的常见方法：**

1. **仅接受 POST 请求**  
    关键操作应当只接受 POST 请求，因为浏览器会阻止从其他网站发起的 POST 请求。这种方法可以有效防止简单的 CSRF 攻击。
    
2. **验证码**  
    使用验证码可以防止 CSRF 攻击，因为验证码需要用户互动，难以在攻击中自动完成。通常，验证码会在特殊操作或注册时使用，以避免影响用户体验。
    
3. **检测 Referer**  
    通过检查请求的 Referer 头，可以判断请求来源是否合法。然而，Referer 头并不总是可用，因此它通常用于监控攻击而不是完全防御。
    
4. **使用 Token**  
    最主流的方法是使用 Token。通过在每个请求中附带一个随机生成的 Token，可以防止攻击者伪造请求，因为攻击者无法预测 Token 的值。Token 应该满足以下条件：
    
    - **随机性**：Token 必须足够随机以防止预测。
    - **一次性**：每次请求成功后，Token 应更新，以增加攻击难度。
    - **保密性**：Token 不应出现在 URL 中，敏感操作应使用 POST 请求。

### XSS（跨站脚本攻击）

XSS 全称“跨站脚本”，是注入攻击的一种。其特点是不对服务器端造成任何伤害，而是通过一些正常的站内交互途径，例如发布评论，提交含有 JavaScript 的内容文本。这时服务器端如果没有过滤或转义掉这些脚本，作为内容发布到了页面上，其他用户访问这个页面的时候就会运行这些脚本。

运行预期之外的脚本带来的后果有很多中，可能只是简单的恶作剧——一个关不掉的窗口：

```
  while (true) {
      alert("你关不掉我~");
  }
```

也可以是盗号或者其他未授权的操作。

XSS 是实现 CSRF 的诸多途径中的一条，但绝对不是唯一的一条。一般习惯上把通过 XSS 来实现的 CSRF 称为 XSRF。

**防范 XSS 攻击的方法：**

1. **输入过滤**  
    对用户输入的内容进行 HTML 转义（escape），例如，将 `<script>` 标签转义为 `&lt;script&gt;`，使其作为普通文本显示而非执行脚本。
    
2. **处理 HTML 输入**  
    如果允许用户输入 HTML，需对其进行更精细的处理。将用户输入的 HTML 解析后，使用 HTML 解析库重新构建 HTML 元素树，并仅允许白名单中的标签和属性，以防止恶意脚本的注入。
    
3. **使用内容安全策略（CSP）**  
    配置 CSP 可以限制网页加载和执行的资源，从而减少 XSS 攻击的风险。通过 CSP 可以阻止不可信的脚本执行，并控制资源的加载来源。
# 常见面试题
## HTTP 有哪些缺点？
### 无状态
    - 所谓的优点和缺点还是要分场景来看的，对于 HTTP 而言，最具争议的地方在于它的无状态
    - 在需要长连接的场景中，需要保存大量的上下文信息，以免传输大量重复的信息，那么这时候无状态就是 http 的缺点了
    - 但与此同时，另外一些应用仅仅只是为了获取一些数据，不需要保存连接上下文信息，无状态反而减少了网络开销，成为了 http 的优点
### 明文传输
    - 即协议里的报文(主要指的是头部)不使用二进制数据，而是文本形式
    - 这当然对于调试提供了便利，但同时也让 HTTP 的报文信息暴露给了外界，给攻击者也提供了便利。WIFI陷阱就是利用 HTTP 明文传输的缺点，诱导你连上热点，然后疯狂抓你所有的流量，从而拿到你的敏感信息
### 队头阻塞问题
    - 当 http 开启长连接时，共用一个 TCP 连接，同一时刻只能处理一个请求，那么当前请求耗时过长的情况下，其它的请求只能处于阻塞状态，也就是著名的队头阻塞问题。
## HTTP 和 HTTPS 的区别?
1. 传输信息安全性不同;
    - http 协议是超文本传输协议，信息是明文传输，不安全
    - https 协议是具有安全性的 ssl 加密传输协议，是安全的协议
2. 连接方式不同
    - http 的连接很简单，是无状态的
    - https 协议是由 SSL＋HTTP 协议构建的可进行加密传输、身份认证的网络协议
3. 端口不同
    - http 协议使用的端口是 80
    - https 协议使用的端口是 443
4. 证书申请方式不同
    - http 协议免费申请
    - https 协议需要到 ca 申请证书，一般免费证书较少，因而需要一定费用

## HTTP Get 和 Post 的区别？
1. 从 REST 服务角度上说，Get 是幂等的，即读取同一个资源，总是得到相同的数据，而 Post 不是幂等的，因为每次请求对资源的改变并不是相同的；进一步地，Get 不会改变服务器上的资源，而 Post 会对服务器资源进行改变
2. Get 请求能缓存，Post 不能
3. Post 相对 Get 安全一点，因为Get 请求都包含在 URL 里（当然你想写到 body 里也是可以的），且会被浏览器保存历史纪录。Post 不会，但是在抓包的情况下都是一样的
4. URL 有长度限制，会影响 Get 请求，但是这个长度限制是浏览器规定的, Post 默认不受限制
5. Post 支持更多的编码类型且不对数据类型限制
6. Get 请求在浏览器反复的 回退/前进 操作是无害的，而 post 操作会再次提交表单请求。
7. Get 请求在发送过程中会产生一个 TCP 数据包；post 在发送过程中会产生两个 TCP 数据包。对于 get 方式的请求，浏览器会把 http header 和 data 一并发送出去，服务器响应 200（返回数据）；而对于 post，浏览器先发送 header，服务器响应 100 continue，浏览器再发送 data，服务器响应 200 ok（返回数据）。
## 如何理解 HTTP 代理？
我们知道在 HTTP 是基于请求-响应模型的协议，一般由客户端发请求，服务器来进行响应。

当然，也有特殊情况，就是代理服务器的情况。引入代理之后，作为代理的服务器相当于一个中间人的角色，对于客户端而言，表现为服务器进行响应；而对于源服务器，表现为客户端发起请求，具有双重身份。

**那代理服务器到底是用来做什么的呢？**

1. 负载均衡。客户端的请求只会先到达代理服务器，后面到底有多少源服务器，IP 都是多少，客户端是不知道的。因此，这个代理服务器可以拿到这个请求之后，可以通过特定的算法分发给不同的源服务器，让各台源服务器的负载尽量平均。当然，这样的算法有很多，包括随机算法、轮询、一致性hash、LRU(最近最少使用)等等，不过这些算法并不是本文的重点，大家有兴趣自己可以研究一下。
    
2. 保障安全。利用心跳机制监控后台的服务器，一旦发现故障机就将其踢出集群。并且对于上下行的数据进行过滤，对非法 IP 限流，这些都是代理服务器的工作。
    
3. 缓存代理。将内容缓存到代理服务器，使得客户端可以直接从代理服务器获得而不用到源服务器那里。
## 如何理解 HTTP 缓存及缓存代理？
**HTTP 缓存**

首先通过 Cache-Control 验证强缓存是否可用

- 如果强缓存可用，直接使用(在浏览器加载资源时，先看看 cache-control 里的 max-age（或 expired 属性），判断数据有没有过期，如果没有直接使用该缓存，**不再发送网络请求**。当 max-age 和 expired 同时存在时，max-age 优先级更高。)
    
- 否则进入协商缓存，即发送 HTTP 请求，服务器通过请求头中的 `If-Modified-Since` 或者 `If-None-Match` 这些条件请求字段检查资源是否更新
    
    - 若资源更新，返回资源和200状态码
    - 否则，返回304，告诉浏览器直接从缓存获取资源

**代理缓存**

对于源服务器来说，它也是有缓存的，比如Redis, Memcache，但对于 HTTP 缓存来说，如果每次客户端缓存失效都要到源服务器获取，那给源服务器的压力是很大的。

由此引入了缓存代理的机制。让代理服务器接管一部分的服务端 HTTP 缓存，客户端缓存过期后就近到代理缓存中获取，代理缓存过期了才请求源服务器，这样流量巨大的时候能明显降低源服务器的压力。

缓存代理的控制分为两部分，一部分是源服务器端的控制，一部分是客户端的控制

**源服务器的缓存控制**

private 和 public

在源服务器的响应头中，会加上 `Cache-Control` 这个字段进行缓存控制字段，那么它的值当中可以加入 private 或者 public 表示是否允许代理服务器缓存，前者禁止，后者为允许。

比如对于一些非常私密的数据，如果缓存到代理服务器，别人直接访问代理就可以拿到这些数据，是非常危险的，因此对于这些数据一般是不会允许代理服务器进行缓存的，将响应头部的 `Cache-Control` 设为private，而不是public。

proxy-revalidate

`must-revalidate` 的意思是客户端缓存过期就去源服务器获取，而 `proxy-revalidate` 则表示代理服务器的缓存过期后到源服务器获取。

s-maxage

s 是 share 的意思，限定了缓存在代理服务器中可以存放多久，和限制客户端缓存时间的max-age并不冲突。

讲了这几个字段，我们不妨来举个小例子，源服务器在响应头中加入这样一个字段:

```
Cache-Control: public, max-age=1000, s-maxage=2000
```

1  

复制代码相当于源服务器说: 我这个响应是允许代理服务器缓存的，客户端缓存过期了到代理中拿，并且在客户端的缓存时间为 1000 秒，在代理服务器中的缓存时间为 2000 s。

**客户端的缓存控制**

max-stale 和 min-fresh

在客户端的请求头中，可以加入这两个字段，来对代理服务器上的缓存进行宽容和限制操作。比如：

```
max-stale: 5
```

1  

复制代码表示客户端到代理服务器上拿缓存的时候，即使代理缓存过期了也不要紧，只要过期时间在5秒之内，还是可以从代理中获取的。

又比如:

```
min-fresh: 5
```

1  

复制代码表示代理缓存需要一定的新鲜度，不要等到缓存刚好到期再拿，一定要在到期前 5 秒之前的时间拿，否则拿不到。

only-if-cached

这个字段加上后表示客户端只会接受代理缓存，而不会接受源服务器的响应。如果代理缓存无效，则直接返回504（Gateway Timeout）。
## https证书被串改怎么办
为了解决证书潜在的问题，谷歌提出了一个解决方案，这就是证书透明度（CT）。CT 是一组技术解决方案，它能够审计、监控证书的签发、使用，从而让更透明，它不是证书的替代解决方案，而是证书的有效补充。通过 CT，能够达成以下的几个目标：

- CA 机构能够知晓其签发了那些证书，并快速检测到是否签发恶意证书了。
    
- 网站拥有者能够知晓域名对应证书签发的全过程，一旦发现有攻击者伪造了域名对应的证书，可以快速联系 CA 机构，吊销该证书。
    
- 浏览器厂商能够审计证书的使用情况，如果发现有恶意证书，可以快速关闭HTTPS连接，保障用户的安全。
    

**Expect-CT **

为了确保浏览器能在访问到缺少 CT 监督的证书（例如 CA 意外发出的证书）时采取措施，Google 提案增加了一个新的 Expect-CT HTTP Header，该 HTTP Header 用来告诉浏览器期望证使用书透明度服务。Expect-CT CT 头部允许站点选择报告或强制执行证书透明度要求，这可以防止站点证书错误被忽视的情况。当站点启用 Expect-CT CT Header 时，浏览器会检查该站点使用的证书是否出现在公共 C T日志中，这能有效的避免中间人攻击等 HTTPS 威胁，让站点更加安全。


## HTTP 中如何处理表单数据的提交？
在 http 中，有两种主要的表单提交的方式，体现在两种不同的Content-Type取值:

- application/x-www-form-urlencoded
    
    - 其中的数据会被编码成以&分隔的键值对
    - 字符以URL编码方式编码
- multipart/form-data
    
    - 请求头中的 `Content-Type` 字段会包含 boundary，且 boundary 的值有浏览器默认指定。例: `Content-Type: multipart/form-data;boundary=----WebkitFormBoundaryRRJKeWfHPGrS4LKe`
    - 数据会分为多个部分，每两个部分之间通过分隔符来分隔，每部分表述均有 HTTP 头部描述子包体，如Content-Type，在最后的分隔符会加上--表示结束。
    - 每一个表单元素都是独立的资源表述，在实际的场景中，对于图片等文件的上传基本采用 `multipart/form-data` 而不用 `application/x-www-form-urlencoded`，因为没有必要做 URL 编码，带来巨大耗时的同时也占用了更多的空间


## HTTP1.1 如何解决 HTTP 的队头阻塞问题？
**什么是 HTTP 队头阻塞？**

HTTP 传输是基于 **请求-应答** 的模式进行的，报文必须是一发一收，但值得注意的是，里面的任务被放在一个任务队列中串行执行，一旦队首的请求处理太慢，就会阻塞后面请求的处理。这就是著名的 **HTTP队头阻塞** 问题。

**并发连接**

对于一个域名允许分配多个长连接，那么相当于增加了任务队列，不至于一个队伍的任务阻塞其它所有任务。在RFC2616规定过客户端最多并发 2 个连接，不过事实上在现在的浏览器标准中，这个上限要多很多，Chrome 中是 6 个。

但其实，即使是提高了并发连接，还是不能满足人们对性能的需求。

**域名分片**

一个域名不是可以并发 6 个长连接吗？那我就多分几个域名。

比如 content1.phlin.top 、content2.phlin.top。

这样一个 phlin.top 域名下可以分出非常多的二级域名，而它们都指向同样的一台服务器，能够并发的长连接数更多了，事实上也更好地解决了队头阻塞的问题。

## TCP/IP 与 HTTP 有什么关系吗？
TCP/IP（Transmission Control Protocol/Internet Protocol，传输控制协议/网际协议）是指能够在多个不同网络间实现信息传输的协议簇。TCP/IP 协议不仅仅指的是 TCP 和 IP 两个协议，而是指一个由 FTP、SMTP、TCP、UDP、IP 等协议构成的协议簇， 只是因为在 TCP/IP 协议中 TCP 协议和 IP 协议最具代表性，所以被称为 TCP/IP 协议。

而HTTP是应用层协议，主要解决如何包装数据。

“IP” 代表网际协议，TCP 和 UDP 使用该协议从一个网络传送数据包到另一个网络。把 IP 想像成一种高速公路，它允许其它协议在上面行驶并找到到其它电脑的出口。TCP 和 UDP 是高速公路上的“卡车”，它们携带的货物就是像 HTTP，文件传输协议 FTP 这样的协议等。

## 如果 http传输的文件过大怎么办
### 压缩传输 
对文件进行压缩，减少文件大小。那压缩和解压缩的流程怎么实现呢？ 首先服务端需要能支持文件的压缩功能，其次浏览器能够针对被压缩的文件进行解压缩。浏 览器可以指定 Accept-Encoding 来高速服务器我当前支持的编码类型 Accept-Encoding:gzip,deflate 那服务端会根据支持的编码类型，选择合适的类型进行压缩。常见的编码方式有：gzip/deflate
### 分割传输
在传输大容量数据时，通过把数据分割成多块，能够让浏览器逐步显示页面。这种把实体主 体分块的功能称为分块传输编码（Chunked Transfer Coding）。
### 范围请求 
允许客户端仅仅请求一个资源的一部分，要支持这个功能，就必须加上这样一个响应头:
```
Accept-Ranges: none
```
用来告知客户端这边是支持范围请求的。

**Range 字段拆解**

而对于客户端而言，它需要指定请求哪一部分，通过 Range 这个请求头字段确定，格式为 `bytes=x-y`。接下来就来讨论一下这个 Range 的书写格式:

- 0-499表示从开始到第 499 个字节。
- 500- 表示从第 500 字节到文件终点。
- -100表示文件的最后100个字节。

服务器收到请求之后，首先验证范围是否合法，如果越界了那么返回416错误码，否则读取相应片段，返回 206 状态码。

同时，服务器需要添加 `Content-Range` 字段，这个字段的格式根据请求头中Range字段的不同而有所差异。

具体来说，请求单段数据和请求多段数据，响应头是不一样的。
**单段数据**

对于单段数据的请求，返回的响应如下:
```
HTTP/1.1 206 Partial Content
Content-Length: 10
Accept-Ranges: bytes
Content-Range: bytes 0-9/100

i am xxxxx
```

值得注意的是 `Content-Range` 字段，0-9表示请求的返回，100表示资源的总大小，很好理解。

**多段数据**

接下来我们看看多段请求的情况。得到的响应会是下面这个形式:

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

这个时候出现了一个非常关键的字段 `Content-Type: multipart/byteranges;boundary=00000010101`，它代表了信息量是这样的:

- 请求一定是多段数据请求
- 响应体中的分隔符是 00000010101

因此，在响应体中各段数据之间会由这里指定的分隔符分开，而且在最后的分隔末尾添上 `--` 表示结束。


## 在浏览器地址栏键入URL，按下回车之后会经历哪些流程
### 输入地址
当我们开始在浏览器中输入网址的时候，浏览器其实就已经在智能的匹配可能得 url 了，他会从历史记录，书签等地方，找到已经输入的字符串可能对应的 url，然后给出智能提示，让你可以补全url地址。对于 chrome 浏览器，他甚至会直接从缓存中把网页展示出来。

### 浏览器查找域名的 IP 地址（DNS 查询：具体过程包括浏览器搜索自身的 DNS 缓存、搜索操作系统的 DNS 缓存、读取本地的 Host 文件和向本地 DNS 服务器进行查询等）
请求一旦发起，浏览器首先要做的事情就是解析这个域名，一般来说，整体查找步骤如下：

1. 浏览器缓存：当用户通过浏览器访问某域名时，浏览器首先会在自己的缓存中查找是否有该域名对应的IP地址（若曾经访问过该域名且没有清空缓存便存在)；
2. 系统缓存(host): 当浏览器缓存中无域名对应IP则会自动检查用户计算机系统Hosts文件DNS缓存是否有该域名对应IP；
3. 路由器缓存(局域网): 当浏览器及系统缓存中均无域名对应IP则进入路由器缓存中检查，以上三步均为客户端的DNS缓存；
4. ISP（互联网服务提供商）DNS缓存（电信、移动）: 当在用户客服端查找不到域名对应IP地址，则将进入ISP DNS缓存中进行查询。比如你用的是电信的网络，则会进入电信的DNS缓存服务器中进行查找；(或者向网络设置中指定的local DNS进行查询，如果在PC指定了DNS的话，如果没有设置比如DNS动态获取，则向ISP DNS发起查询请求)
5. 根域名服务器: 当以上均未完成，则进入根服务器进行查询。全球仅有13台根域名服务器，1个主根域名服务器，其余12为辅根域名服务器。根域名收到请求后会查看区域文件记录，若无则将其管辖范围内顶级域名（如.com）服务器IP告诉本地DNS服务器；
6. 顶级域名服务器: 顶级域名服务器收到请求后查看区域文件记录，若无则将其管辖范围内主域名服务器的IP地址告诉本地DNS服务器；
7. 主域名服务器: 主域名服务器接受到请求后查询自己的缓存，如果没有则进入下一级域名服务器进行查找，并重复该步骤直至找到正确记录；
8. 保存结果至缓存: 本地域名服务器把返回的结果保存到缓存，以备下一次使用，同时将该结果反馈给客户端，客户端通过这个IP地址与web服务器建立链接。

### 浏览器获得域名对应的 IP 地址以后，浏览器向服务器请求建立链接，发起三次握手
拿到域名对应的 IP 地址之后，浏览器会以一个随机端口（1024<端口<65535）向服务器的 WEB 程序（常用的有 httpd,nginx 等）80 端口发起 TCP 的连接请求。这个连接请求到达服务器端后（这中间通过各种路由设备，局域网内除外），进入到网卡，然后是进入到内核的 TCP/IP 协议栈（用于识别该连接请求，解封包，一层一层的剥开），还有可能要经过 Netfilter 防火墙（属于内核的模块）的过滤，最终到达 WEB 程序，最终建立了 TCP/IP 的连接。（如果是 HTTPS 还需要建立 TLS 连接）
### TCP/IP 链接建立起来后，浏览器向服务器发送 HTTP 请求
建立了 TCP 连接之后，发起一个 HTTP 请求。一个典型的 http request header 一般需要包括请求的方法，例如 GET 或者 POST 等，不常用的还有 PUT 和 DELETE 、HEAD、OPTION 以及 TRACE 方法。

发送请求时会发送请求报文，其由请求行(含请求方法、请求URI、协议版本)、报文首部和报文实体构成的，且报文首部和报文实体以一空行(CR+LF)分隔。
### 服务器的永久重定向响应
服务器给浏览器响应一个 301 永久重定向响应，这样浏览器就会访问 “http://www.google.com/” 而非 “http://google.com/”。

为什么服务器一定要重定向而不是直接发送用户想看的网页内容呢？其中一个原因跟搜索引擎排名有关。如果一个页面有两个地址，就像 http://www.yy.com /和 http://yy.com/，搜索引擎会认为它们是两个网站，结果造成每个搜索链接都减少从而降低排名。而搜索引擎知道 301 永久重定向是什么意思，这样就会把访问带 www 的和不带 www 的地址归到同一个网站排名下。还有就是用不同的地址会造成缓存友好性变差，当一个页面有好几个名字时，它可能会在缓存里出现好几次。

### 浏览器跟踪重定向地址
现在浏览器知道了 "http://www.google.com/" 才是要访问的正确地址，所以它会发送另一个 http 请求。
### 服务器处理请求
经过前面的重重步骤，我们终于将我们的 http 请求发送到了服务器这里，其实前面的重定向已经是到达服务器了，那么，服务器是如何处理我们的请求的呢？

后端从在固定的端口接收到 TCP 报文开始，它会对 TCP 连接进行处理，对 HTTP 协议进行解析，并按照报文格式进一步封装成 HTTP Request 对象，供上层使用。

一些大一点的网站会将你的请求到反向代理服务器中，因为当网站访问量非常大，网站越来越慢，一台服务器已经不够用了。于是将同一个应用部署在多台服务器上，将大量用户的请求分配给多台机器处理。此时，客户端不是直接通过 HTTP 协议访问某网站应用服务器，而是先请求到 Nginx 代理服务器，Nginx 再请求应用服务器，然后将结果返回给客户端，这里 Nginx 的作用是提供反向代理功能。同时也带来了一个好处，其中一台服务器万一挂了，只要还有其他服务器正常运行，就不会影响用户使用。
### 服务器返回一个 HTTP 响应
经过前面的7个步骤，服务器收到了我们的请求，也处理我们的请求，到这一步，它会把它的处理结果返回，也就是返回一个 HTTP 响应。

HTTP 请求需要的内容就放在响应正文，即响应体中
### 浏览器获取 HTML 并解析，同时发送请求获取嵌入在 HTML 中的资源（如图片、音频、视频、CSS、JS等等）
#### 解析 HTML
浏览器在解析html文件时，会”自上而下“加载，并在加载过程中进行解析渲染。在解析过程中，如果遇到请求外部资源时，如图片、外链的CSS、iconfont等，请求过程是异步的，并不会影响html文档进行加载。

解析过程中，浏览器首先会解析HTML文件构建DOM树，然后解析CSS文件构建渲染树，等到渲染树构建完成后，浏览器开始布局渲染树并将其绘制到屏幕上。这个过程比较复杂，涉及到两个概念: reflow(回流)和repain(重绘)。

绘制渲染过程：

1. 建立图层树
2. 生成绘制列表
3. 生产图块并栅格化
4. 显示器显示内容

DOM 节点中的各个元素都是以盒模型的形式存在，这些都需要浏览器去计算其位置和大小等，这个过程称为 relow;当盒模型的位置,大小以及其他属性，如颜色,字体,等确定下来之后，浏览器便开始绘制内容，这个过程称为 repain。

页面在首次加载时必然会经历 reflow 和 repain。reflow 和 repain过程是非常消耗性能的，尤其是在移动设备上，它会破坏用户体验，有时会造成页面卡顿。所以我们应该尽可能少的减少 reflow 和 repain。

当文档加载过程中遇到 js 文件，html 文档会挂起渲染（加载解析渲染同步）的线程，不仅要等待文档中 js 文件加载完毕，还要等待解析执行完毕，才可以恢复 html 文档的渲染线程。因为 JS 有可能会修改 DOM，最为经典的document.write，这意味着，在 JS 执行完成前，后续所有资源的下载可能是没有必要的，这是 js 阻塞后续资源下载的根本原因。所以我明平时的代码中，js 是放在 html 文档末尾的。

JS的解析是由浏览器中的 JS 解析引擎完成的，比如谷歌的是 V8。JS 是单线程运行，也就是说，在同一个时间内只能做一件事，所有的任务都需要排队，前一个任务结束，后一个任务才能开始。但是又存在某些任务比较耗时，如 IO 读写等，所以需要一种机制可以先执行排在后面的任务，这就是：同步任务(synchronous)和异步任务(asynchronous)。

JS的执行机制就可以看做是一个主线程加上一个任务队列(task queue)。同步任务就是放在主线程上执行的任务，异步任务是放在任务队列中的任务。所有的同步任务在主线程上执行，形成一个执行栈;异步任务有了运行结果就会在任务队列中放置一个事件；脚本运行时先依次运行执行栈，然后会从任务队列里提取事件，运行任务队列中的任务，这个过程是不断重复的，所以又叫做事件循环(Event loop)。

#### 获取其它资源并解析

在浏览器显示 HTML 时，它会注意到需要获取其他地址内容的标签。这时，浏览器会发送一个获取请求来重新获得这些文件。比如我要获取外图片，CSS，JS文件等。

这些地址都要经历一个和 HTML 读取类似的过程。所以浏览器会在 DNS 中查找这些域名，发送请求，重定向等等...

不像动态页面，静态文件会允许浏览器对其进行缓存。有的文件可能会不需要与服务器通讯，而从缓存中直接读取，或者可以放到 CDN 中。
在浏览器没有完整接受全部 HTML 文档时，它就已经开始显示这个页面了，浏览器是如何把页面呈现在屏幕上的呢？

解析 html 以构建 dom 树（同时解析 CSS 构建 style Rules） -> 构建render 树(2016删除) -> 布局 render 树 -> 构建图层树 -> 绘制渲染

## 什么是简单请求和复杂请求，为什么会有 options 类型的请求？
某些请求不会触发 CORS 预检请求，这样的请求一般称为 “简单请求” ，而会触发预检的请求则是 “复杂请求” 。

### 简单请求

- 请求方式为 GET、HEAD、POST 时的请求；
    
- 认为设置规范集合之内的首部字段，如 Accept/Accept-Language/Content-Language/Content-Type/DPR/Downlink/Save-Data/Viewport-Width/Width;
    
- Content-Type 的值仅限于下列三者之一,即 application/x-www-form-urlencoded、multipart/form-data、text/plain；
    
- 请求中的任意 XMLHttpRequestUpload 对象均没有注册任何事件监听器；
    
- 请求中没有使用 ReadableStream 对象。
    

### 复杂请求

- PUT/DELETE/CONNECT/OPTIONS/TRACE/PATCH;
    
- 人为设置了以下集合之外首部字段，即简单请求外的字段;
    
- Content-Type 的值不属于下列之一，即 application/x-www-form-urlencoded、multipart/form-data、text/plain。
    

### options 请求

options 请求就是预检请求，可用于检测服务器允许的 http 方法。当发起跨域请求时，由于安全原因，触发一定条件时浏览器会在正式请求之前自动先发起 OPTIONS 请求，即 CORS 预检请求，服务器若接受该跨域请求，浏览器才继续发起正式请求；不支持的话，会在控制台显示错误

所以，当触发预检时，跨域请求便会发送 2 次请求。

## 浏览器缓存了解吗？强缓存一般存放在哪里？计算整个文件得到 etag 会耗费性能，怎么解决？如果我不想要使用缓存了，每次都请求最新的，怎么做？no-store 和 no-cache 的区别是什么？
**浏览器缓存主要分为四个阶段**：

1. 强制缓存阶段：先在本地查找该资源，如果有发现该资源，而且该资源还没有过期，就使用这一个资源，完全不会发送 http 请求到服务器。
    
2. 协商缓存阶段：如果在本地缓存找到对应的资源，但是不知道该资源是否过期或者已经过期，则发一个 http 请求到服务器,然后服务器判断这个请求，如果请求的资源在服务器上没有改动过，则返回 304，让浏览器使用本地找到的那个资源。
    
3. 启发式缓存阶段：当缓存过期时间的字段一个都没有的时候，浏览器下次并不会直接进入协商阶段，而是先进入启发式缓存阶段，它根据响应头中 2 个时间字段 Date 和 Last-Modified 之间的时间差值，取其值的 10%作为缓存时间周期。也就是说，当存有 Last-Modified 字段的时候，即使是断网，且强缓存都失效后，也有一定时间是直接读取缓存文件的。etag 是没有这个阶段的。
    
4. 缓存失败阶段：当服务器发现请求的资源已经修改过，或者这是一个新的请求(再本来没有找到资源)，服务器则返回该资源的数据，并且返回 200， 当然这个是指找到资源的情况下，如果服务器上没有这个资源，则返回 404。
    

**强缓存一般放在哪里**：

强缓存一般存放于 Memory Cache 或者 Disk Cache。

**计算整个文件得到 etag 会耗费性能，怎么解决**

etag 可以通过文件的 Last-Modified 和 content-length 计算。

Nginx官方默认的 ETag 计算方式是为"文件最后修改时间16进制-文件长度16进制"。例：ETag： “59e72c84-2404”

不管怎么样的算法，在服务器端都要进行计算，计算就有开销，会带来性能损失。因此为了榨干这一点点性能，不少网站完全把 Etag 禁用了(比如Yahoo!)，这其实不符合 HTTP/1.1 的规定，因为 HTTP/1.1 总是鼓励服务器尽可能的开启 Etag。

**不使用缓存的方式，让每次请求都是最新的**

不使用缓存常见的方法是通过 url 拼接 random 的方式或者设置 Cache-Control 设置 no-cache。

**no-stroe & no-cache 区别**

- no-store 禁止浏览器和中间服务器缓存。每次都从服务器获取。
    
    - 注意，no-store 才是真正的完完全全的禁止本地缓存。
- no-cache 每次请求都会验证该缓存是否过期。可以在本地缓存，可以在代理服务器缓存，但是这个缓存要服务器验证才可以使用
    
    - 注意，no-cache 不是不缓存的意思。






# 参考资料

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