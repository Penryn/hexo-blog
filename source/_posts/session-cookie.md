---
title: Session-Cookie介绍和相关面试题总结
date: 2024-08-28 04:05:48
keywords:
  - "鉴权"
  - "session"
  - "cookie"
  - "面试"
  - "开发"
updated: 2024-08-28 04:05:48
description: "出现缘由 在前一篇写的HTTP专题，我们可以了解到HTTP协议有一个特点：它是无状态的。"
categories: 开发
tags:
  - 鉴权
  - session
  - cookie
  - 面试
---

## 出现缘由
在前一篇写的HTTP专题，我们可以了解到HTTP协议有一个特点：它是无状态的。 

**HTTP的无状态性** 意味着：每次HTTP请求都是独立的，服务器不会记住客户端的任何状态信息。当我们向服务器发送请求时，服务器会解析并处理该请求，然后返回相应的响应。整个过程是完全独立的，服务器不会记录前后状态的变化。换句话说，如果后续的处理需要之前的状态信息，就必须重新发送这些信息，这会导致重复的请求和资源浪费。

为了解决这个问题，于是出现了两种用于保持HTTP连接状态的技术：`Session`和`Cookies`。

**Session存储在服务器端，用于保存用户的会话信息**；**Cookies则存储在客户端（通常是浏览器端），当浏览器下次访问同一网站时，会自动附带之前的Cookies发送给服务器，服务器通过识别Cookies来确认用户身份，并判断是否为登录状态，从而返回对应的响应**。简单来说，Cookies保存了登录凭证，这样在后续请求中，只需要携带Cookies就可以免去重新输入用户名和密码等信息。

因此，在爬虫中，通常会将登录成功后获取的Cookies放在请求头中，直接发起请求，而不必重新模拟登录。

## Cookie

## 定义 

根据维基百科的定义：_HTTP Cookie，也称为web cookie、互联网cookie、浏览器cookie，是指某些网站为了辨别用户身份而储存在用户本地终端上的数据（通常经过加密）。_

简单来说，Cookie本质上是一段标识用户身份的数据，用于记录用户在浏览网站时的状态信息（例如电商网站中的购物车商品）和动作信息（例如登录、点击特定按钮、访问特定网页等）。

“Cookie”一词意为“甜饼”，由W3C组织提出，最早由Netscape社区开发的一种机制。如今，Cookie已经成为标准，所有主流浏览器，如IE、Netscape、Firefox、Opera等，均支持Cookie。由于HTTP协议是无状态的，服务器无法仅通过网络连接识别用户身份。为了应对这个问题，服务器会向客户端颁发一个“通行证”，即每个用户的Cookie。当用户访问网站时，必须携带自己的Cookie，这样服务器就能根据Cookie确认用户身份。这就是Cookie的工作原理。Cookie实际上是一小段文本信息。当客户端向服务器发送请求时，如果服务器需要记录该用户的状态，就会通过响应向客户端浏览器颁发一个Cookie。浏览器会将Cookie保存起来，当用户再次访问该网站时，浏览器会将请求的网址和Cookie一同提交给服务器。服务器通过检查该Cookie来辨别用户的状态，并且根据需要还可以修改Cookie的内容。
## 特点
- **存储位置**：
    
    - 存储在用户的浏览器中。
- **存储容量**：
    
    - 通常每个 cookie 大小限制为 4KB 左右（具体取决于浏览器）。
- **有效期**：
    
    - 可以设置有效期（`Expires`）或失效时间（`Max-Age`）。如果没有设置，cookie 会在浏览器会话结束时失效。
- **传输**：
    
    - 每次浏览器向服务器发送请求时，会`自动`附带对应的 cookies。可能会增加网络带宽使用。
- **安全性**：
    
    - 默认情况下，cookie 是明文传输的，容易被窃取。需要通过 `Secure` 和 `HttpOnly` 标志增强安全性。
- **用途**：
    
    - 主要用于在客户端存储小量的数据，如用户偏好设置、跟踪用户活动等。
## 常见属性

| 属性                        | 描述                                                             | 相关信息                                                             |
| ------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Name**                  | `Cookie` 的名称，作为键值对的键。                                          | 这个名称在同一域名下必须唯一。                                                  |
| **Value**                 | `Cookie` 的值，作为键值对的值。                                           | 可以存储少量数据，通常为字符串格式。                                               |
| **Domain**                | 指定 `Cookie` 所属的域名。浏览器在访问该域名时会发送 `Cookie`。                      | 默认情况下，`Domain` 为创建 `Cookie` 的域名。子域名通常也会包含在作用范围内。                 |
| **Path**                  | 指定 `Cookie` 的使用路径。浏览器在访问该路径及其子路径时会发送 `Cookie`。                 | 默认情况下，`Path` 为设置 `Cookie` 的路径。                                   |
| **Expires** / **Max-Age** | `Expires` 指定 `Cookie` 的过期时间；`Max-Age` 指定 `Cookie` 的有效期（以秒为单位）。 | `Expires` 是一个具体的时间点，`Max-Age` 是相对时间（秒数）。`Max-Age` 优先于 `Expires`。 |
| **Secure**                | 指定 `Cookie` 只能在 HTTPS 连接下发送，以确保传输过程的加密。                        | 在 HTTP 连接中不会发送带有 `Secure` 属性的 `Cookie`。                          |
| **HttpOnly**              | 设置后，`Cookie` 不能通过 JavaScript 访问，从而防止 XSS 攻击。                   | 只能通过 HTTP 请求获取和使用此 `Cookie`。                                     |
| **SameSite**              | 防止跨站请求伪造（CSRF）攻击的属性。值可以是 `Strict`、`Lax` 或 `None`。              | `Strict` 最为安全但限制最大；`Lax` 是推荐的折衷方案；`None` 必须与 `Secure` 属性一起使用。    |
| version                   | 该Cookie使用的版本号。                                                 | 0表示遵循Netscape的Cookie规范,1表示遵循W3C的RFC 2109规范。                      |
| comment                   | 该Cookie的用处说明。                                                  | 浏览器显示Cookie信息时显示该说明。                                             |

## 工作原理

- **Cookie的创建**：
    
    - 当服务器第一次响应用户的请求时，它可以通过HTTP响应头中的`Set-Cookie`字段创建一个或多个Cookie。这个字段包含了Cookie的名称、值以及其他属性，如过期时间、路径、域等。
    - 例如：
    ```
    `Set-Cookie: session_id=abc123; Expires=Wed, 01 Jan 2025 00:00:00 GMT; Path=/; Secure; HttpOnly`
	```
        
- **Cookie的存储**：
    
    - 浏览器接收到服务器发送的Cookie后，会将其存储在客户端的Cookie存储中。每个域（网站）有自己的Cookie存储，浏览器会将Cookie与对应的域相关联。
- **Cookie的发送**：
    
    - 在用户的后续请求中，浏览器会自动将与请求URL匹配的所有Cookie添加到HTTP请求头中的`Cookie`字段。
    - 例如，浏览器会在请求头中添加：
    ```
    `Cookie: user_id=1`
	```
        
- **服务器处理Cookie**：
    
    - 服务器接收到包含Cookie的请求后，可以读取`Cookie`字段中的数据。服务器可以根据这些Cookie值来识别用户、维持会话状态或个性化响应。
    - 服务器根据Cookie中的信息执行相应的操作，例如验证用户身份、恢复用户的购物车状态等。
- **Cookie的更新**：
    
    - 服务器可以通过`Set-Cookie`字段更新Cookie的值或属性。在这种情况下，浏览器会用新的Cookie值替换旧的值，并重新存储更新后的Cookie。
- **Cookie的过期和删除**：
    
    - 每个Cookie都可以设置一个过期时间（`Expires`或`Max-Age`属性），表示Cookie的有效期。过期后，浏览器会自动删除该Cookie。
    - 用户也可以手动删除浏览器中的Cookie，或者通过JavaScript代码（`document.cookie`）在客户端删除Cookie。
- **Cookie的安全性**：
    
    - **Secure**：仅在HTTPS连接中发送Cookie，增加传输安全性。
    - **HttpOnly**：防止通过JavaScript访问Cookie，从而减少XSS攻击风险。
    - **SameSite**：控制跨站请求中是否发送Cookie，从而减少CSRF攻击。

## 存储方式
- **会话 Cookie（Session Cookies）**：
    
    - **存储方式**：会话 Cookies 存储在内存中，直到用户关闭浏览器。
    - **特点**：它们不会被写入到硬盘，浏览器在每次关闭时会自动删除这些 Cookies。适用于存储临时数据，比如用户的登录状态或浏览器的会话数据。
- **持久 Cookie（Persistent Cookies）**：
    
    - **存储方式**：持久 Cookies 会被写入到硬盘中，并根据设置的过期时间保持有效。
    - **特点**：这些 Cookies 在浏览器关闭后仍然存在，直到达到过期时间或者被显式删除。适用于存储长期信息，如用户的偏好设置或登录信息。
## 缺点
- **安全性问题**：
    
    - `Cookie` 以明文形式存储和传输，容易被窃取，特别是在未加密的 HTTP 连接中。攻击者可以通过跨站脚本攻击（XSS）或会话劫持（Session Hijacking）获取 `Cookie`，从而冒充用户。
- **容量限制**：
    
    - 每个 `Cookie` 的大小通常限制在 4KB 左右，这意味着它们只能存储少量的数据。如果需要存储更多信息，必须创建多个 `Cookie` 或使用其他存储方式（如 `localStorage` 或 `sessionStorage`）。
- **网络负担**：
    
    - `Cookie` 会随每次 HTTP 请求自动发送到服务器，增加了网络流量，尤其是当 `Cookie` 数量多或数据量大时，对性能产生影响。
- **隐私问题**：
    
    - `Cookie` 可用于跟踪用户行为，尤其是第三方 `Cookie`，它们会在不同网站之间共享，导致用户隐私泄露。这也是为什么浏览器和隐私保护工具通常会限制或阻止第三方 `Cookie`。
- **有限的存储和管理**：
    
    - `Cookie` 受限于每个域名只能存储一定数量的 `Cookie`（通常是 20 个），且总大小有限。浏览器可能会根据策略自动删除旧的 `Cookie`，这可能会导致一些问题。
- **依赖于浏览器设置**：
    
    - 用户可以通过浏览器设置禁用 `Cookie`，这会影响依赖 `Cookie` 的网站功能，如自动登录、购物车等。某些浏览器还会自动删除 `Cookie`，例如在无痕浏览模式下。
- **受浏览器兼容性影响**：
    
    - 不同浏览器对 `Cookie` 的支持和处理方式可能略有不同，特别是在处理 `SameSite`、`Secure` 和 `HttpOnly` 等属性时，可能导致兼容性问题。

## Session
## 定义
Session，目前主流翻译中『会话』二字最为贴切。

根据维基百科的定义，通信设备（或人机）之间的一次session是指一次半持久性（semi-permanent）的信息交换，也称为一次对话，一次会话，一次会议等。其中半持久性是指一个session会在某个时间点建立连接，又会在某个时间点断开连接。

可总结为**一句话**：通信设备之间，建立连接进行通信的过程都可以称之为session，其中通信过程中的历史状态信息即为session信息。

通常，对于面向连接的通信而言，其最基本的要求是：一个已建立好连接（established）的session。session的实现可能会作为网络协议或服务本身的一部分。如传输层的TCP socket连接、应用层的HTTP session。

不同层的协议实现session有所不同，TCP实现session采用子进程/多线程机制，当通信一方建立连接或启动session时则创建新进程/线程，即一个session建立一个子进程/线程，每个线程是一个实例，拥有当前连接历史信息以及封装好的变量；相对于把session信息存放在子进程/线程中，HTTP session则做法完全不同，它直接将所有的session信息存储在服务器某存储区（文件、数据库、缓存等）。前者优点是降低了软件实现的复杂性，缺点是消耗系统资源较多，而且session机制会随着系统的重启而中断。后者最大的挑战在于多个服务器组成集群的场景。试想，如果一个客户端访问同一个网站，每次可能被分配到不同的服务器上，那么存储在各服务器上的客户端session信息该如何保持一致性。解决办法则是将session信息存储在集群服务器的共享存储区。

虽然实现如此不同，但是原理却是想通的：建立连接的通信双方保存通信过程中的状态信息，以便下次复用。

## HTTP会话
基于上述对会话（session）的定义：通信设备之间，建立连接并进行通信的过程都可以称为会话，而通信过程中的历史状态信息即为会话信息。由此，我们可以推导出HTTP会话的定义：HTTP客户端与HTTP服务器之间建立连接并进行通信的过程，即为HTTP会话（HTTP session）。

在Web应用中，一次HTTP会话就是与同一个用户关联的一系列客户端与服务器之间的网络请求-响应事务的集合。

首先，HTTP客户端向服务器发起请求，与服务器的某个特定端口（通常为80）建立TCP连接。HTTP服务器在该特定端口监听客户端请求，收到请求后返回状态行（例如“HTTP/1.1 200 OK”）以及相应的数据。为了确保在下一次通信时，双方还能记住对方，至少一方需要保存会话中的历史信息，以便将来识别对方。

如果说cookie的出现是为了在客户端和服务器之间保存状态信息，那么HTTP会话的实现则是为了更系统化和便捷地管理这些状态信息。

这样一来，Web应用程序可以轻松地追踪任何曾经访问过的用户，并管理该用户的所有状态信息，从而在不同的请求之间保持一致的用户体验和数据连续性。

## 特点
- **持久性**：Session在用户和服务器之间保持状态，通常在用户与服务器之间的多次请求中维持相同的会话状态。这意味着用户在访问应用程序的不同页面时，可以保持其登录状态或其他状态信息。
    
- **唯一性**：每个用户会话通常由一个唯一的会话标识符（session ID）标识，这个标识符在用户的浏览器和服务器之间传递，用于识别和区分不同的用户会话。
    
- **数据存储**：Session数据通常存储在服务器端，例如在内存中、数据库中或文件系统中。这与cookie不同，cookie数据存储在客户端。
    
- **安全性**：Session数据存储在服务器端，相对来说比客户端存储的数据（如cookie）更安全，因为它们不容易被客户端篡改。但需要注意，session ID本身可能会成为攻击目标，例如会话劫持攻击。
    
- **过期机制**：Session通常有一个过期时间，在用户不再活动时，服务器会自动销毁过期的Session。这有助于释放服务器资源和提高安全性。
    
- **支持多种协议**：Session不仅限于HTTP，还可以用于其他协议。它广泛应用于Web开发中，但也可以用于其他需要状态保持的网络应用。
    
- **跨页面共享**：Session可以在用户访问的多个页面或请求之间共享数据，这对于需要在整个会话中保持用户状态的信息（如购物车内容）特别有用。
    
- **用户数据管理**：Session允许存储与用户相关的数据（如用户偏好、身份验证状态、临时数据等），便于个性化用户体验。
## 实现原理
- **会话初始化**：
    
    - 当用户首次访问一个Web应用时，服务器创建一个新的Session，并生成一个唯一的Session ID（会话标识符）。这个ID通常是一个随机生成的字符串。
- **Session ID传递**：
    
    - 服务器将生成的Session ID传递给用户的浏览器。这个ID通常通过以下几种方式传递：
        - **Cookie**：最常见的方式是通过HTTP Cookie。浏览器在后续的请求中会自动发送这个Cookie，包含Session ID。
        - **URL参数**：在URL中包含Session ID。这种方法较少用，但在一些特殊情况下（例如cookie被禁用）可以使用。
        - **隐藏字段**：在表单中使用隐藏字段存储Session ID，这在表单提交时会发送到服务器。
- **会话数据存储**：
    
    - 服务器使用Session ID来查找或创建与之相关联的Session数据。Session数据通常存储在服务器端的内存、数据库或文件系统中，而不是客户端。
- **会话数据访问**：
    
    - 当用户发出请求时，浏览器将Session ID发送到服务器。服务器根据这个ID检索对应的Session数据，来维持用户的状态和交互。
- **数据处理**：
    
    - 服务器利用检索到的Session数据来处理用户的请求。例如，检查用户是否已登录、加载用户的个性化设置等。
- **会话更新**：
    
    - 用户的操作可能会修改Session数据，例如更新用户的购物车内容或更改用户设置。服务器在处理请求时会更新Session数据，并将其存储回服务器端。
- **会话过期与销毁**：
    
    - Session有一个过期时间，通常设置为一定的空闲时间或绝对时间。如果用户在这段时间内没有进行任何操作，服务器会销毁过期的Session。这有助于释放资源和提高安全性。
    - 用户主动退出登录或服务器通过某些机制（如会话管理策略）也可以销毁Session。
### session-cookie认证图解
![Session-Cookie介绍和相关面试题总结配图](https://qiuniu.phlin.cn/bucket/202408290253454.png)

## 各方式传递session ID的优缺点
这三种在客户端传递Session ID的方式各有优缺点，适用于不同的场景。以下是它们的优缺点分析：

### 1. Cookie

**优点：**
- **自动处理**：浏览器会自动处理Cookie，无需额外的编程工作。只要在`Set-Cookie`响应头中设置，浏览器会在后续请求中自动附带这个Cookie。
- **隐蔽性**：Cookie存储在客户端的浏览器中，用户无需显式地看到或操作它们。
- **多功能**：支持设置过期时间、域、路径、Secure、HttpOnly等属性来控制Cookie的行为和安全性。

**缺点：**
- **安全风险**：如果不正确配置，Cookie可能面临安全风险，如会话劫持、XSS攻击等。需要使用`Secure`和`HttpOnly`属性来增强安全性。
- **大小限制**：每个Cookie的大小限制一般为4KB，浏览器对每个域名的Cookie总数也有限制。
- **隐私问题**：用户可能会禁用Cookie，影响功能正常运行。

### 2. URL参数

**优点：**
- **适用于无Cookie环境**：在Cookie被禁用或不支持的环境中，可以通过URL参数传递Session ID，确保应用依然能正常工作。
- **方便调试**：在开发和调试过程中，通过URL参数可以方便地查看和修改Session ID。

**缺点：**
- **暴露风险**：Session ID通过URL传递，可能被记录在浏览器历史记录、服务器日志、第三方分析工具中，增加了被泄露的风险。
- **书签和分享问题**：如果用户将包含Session ID的URL分享或书签，可能会导致会话泄露或被他人滥用。
- **限制性**：URL长度有限制，可能无法存储过多的数据。

### 3. 隐藏字段

**优点：**
- **适用于表单提交**：在需要通过表单提交数据的情况下，隐藏字段是一个简单的方式来传递Session ID。
- **避免暴露**：相比URL参数，隐藏字段不会被直接暴露在URL中，减少了泄露的风险。

**缺点：**
- **只适用于表单**：只能在表单提交时使用，不能用于非表单的请求。
- **易被篡改**：虽然隐藏字段对用户不显眼，但它们依然可以被用户通过浏览器开发者工具修改，因此需要在服务器端验证。
- **需要额外处理**：需要在表单中显式添加隐藏字段，并确保在每次表单提交时传递正确的Session ID。

### 总结

- **Cookie**是最常用的方法，适合大多数情况，但需要注意安全配置。
- **URL参数**适用于Cookie被禁用的特殊情况，但存在安全和隐私风险。
- **隐藏字段**适用于需要通过表单提交的场景，但限制性较大，并且可能需要额外的安全验证。


## 总缺点

- **服务器资源占用**：
    
    - Session数据存储在服务器端，这会占用服务器的内存或存储资源。对于高流量的应用，这可能会导致服务器负担加重，需要更多的资源来处理大量的Session数据。
- **扩展性问题**：
    
    - 在分布式环境中，尤其是当应用运行在多个服务器上时，管理和同步Session数据变得复杂。需要额外的机制来确保所有服务器能够访问和更新Session数据，比如使用共享存储或分布式缓存系统。
- **性能问题**：
    
    - 每次请求都需要从服务器端检索和更新Session数据，这可能会影响应用的性能。特别是当Session数据量很大时，这种影响可能更加明显。
- **会话劫持和安全问题**：
    
    - Session ID可能会被窃取，从而导致会话劫持。虽然可以使用HTTPS和其他安全措施来减少风险，但仍然需要额外的安全措施来保护Session数据。
- **过期管理**：
    
    - Session有过期时间，但管理会话的过期和清理可能会变得复杂。过期的Session需要及时清理，以释放服务器资源，但这需要额外的逻辑和机制来实现。
- **状态管理**：
    
    - Session用于存储用户的状态，但如果应用程序需要处理大量的状态信息或需要在多个会话中共享数据，这可能会变得困难。某些情况下，考虑使用其他状态管理解决方案可能更为合适。
- **与无状态设计的冲突**：
    
    - 在设计分布式系统时，通常推崇无状态设计（stateless architecture），即每个请求都是独立的，不依赖于之前的请求。Session机制与这种设计理念相矛盾，因为它需要依赖于存储在服务器端的状态信息。
- **依赖性问题**：
    
    - 某些应用或系统可能依赖于Session机制进行身份验证和会话管理。如果Session存储的实现出现问题，可能会导致整个应用的功能受到影响。
## 如何实现Session的共享
首先，我们要理解为什么要实现共享？当你的网站托管在单一服务器上时，Session数据存储在那台机器上，因此Session管理不会有任何问题。但如果你使用负载均衡将请求分发到多个服务器，就会出现Session共享的问题。

在负载均衡的环境中，请求可能会被分配到不同的服务器上。例如，如果用户的第一次请求被分配到服务器A，而第二次请求被分配到服务器B，那么Session数据可能只存在于服务器A上。由于服务器B没有Session数据，用户的第二次请求可能会失败或无法正确处理会话数据。因此，实现Session的共享和同步变得至关重要，以确保所有服务器能够访问和处理相同的Session数据。

以下几种实现方法：
### **1. 使用集中式存储**

**概念**：将Session数据存储在集中式的数据存储系统中，所有服务器都可以通过这个系统访问和管理Session数据。

**优点**：
- **统一管理**：所有服务器访问相同的Session数据，避免了数据不一致的问题。
- **扩展性**：集中式存储系统（如数据库或缓存）可以扩展以处理大量的Session数据和请求。

**实现方法**：
- **数据库**：将Session数据存储在关系型数据库（如MySQL、PostgreSQL）中。
- **NoSQL数据库**：使用NoSQL数据库（如MongoDB、Cassandra）进行存储。
- **分布式缓存**：使用缓存系统（如Redis、Memcached）来存储Session数据。

### **2. 不同服务器上Session数据进行复制**

**概念**：在多个服务器之间复制Session数据，使得每个服务器都有Session的副本。这种方法可以减少Session共享的复杂性，但可能会面临数据同步问题。

**优点**：
- **容错性**：即使某台服务器故障，其他服务器仍然可以访问Session数据。

**缺点**：
- **数据同步**：需要处理Session数据的同步问题，可能导致性能和一致性挑战。

**实现方法**：
- **同步机制**：使用数据同步工具或技术，如数据库的复制功能、分布式缓存的同步机制等。

### **3. 负载均衡器中的Session粘性**

**概念**：配置负载均衡器，将用户的所有请求路由到同一台服务器上，从而避免Session数据不一致的问题。

**优点**：
- **简单**：无需在多个服务器间共享Session数据，只需要确保用户的请求始终到达同一台服务器。

**缺点**：
- **扩展性限制**：可能限制了负载均衡器的负载均衡效果，影响系统的扩展性。


### **4. 分布式Session管理**

**概念**：使用分布式系统来管理Session数据，确保所有服务器能够协调访问和更新Session数据。

**优点**：
- **高可用性**：分布式Session管理系统通常具有高可用性和容错能力。

**缺点**：
- **复杂性**：需要配置和维护分布式Session管理系统，增加了系统的复杂性。

### **5. 使用共享文件系统**

**概念**：在共享的文件系统中存储Session数据，所有服务器都可以访问这些文件。

**优点**：
- **简单实现**：共享文件系统可以简单地将Session文件放置在一个共享目录中，所有服务器都可以读取和写入。

**缺点**：
- **性能**：文件系统的性能可能成为瓶颈，尤其是在高并发的情况下。
- **一致性**：需要确保文件系统的同步和一致性。

**实现方法**：
- **网络文件系统（NFS）**：使用NFS将Session文件存储在网络共享目录中。
- **分布式文件系统**：如HDFS、Ceph等，适用于需要高性能和高可用性的场景。

### **总结**

- **集中式存储**：适合需要集中管理和扩展性强的场景。
- **Session数据复制**：适合对容错性要求高的场景，但需要处理数据同步。
- **Session粘性**：适合简单的Session管理需求，但可能限制负载均衡效果。
- **分布式Session管理**：适合需要高可用和分布式环境的场景，但增加了系统复杂性。
- **共享文件系统**：适合简单的存储需求，但性能和一致性需要关注。
## 代码实现

目前，以下代码是将session ID存进cookie实现的，存放进url的可以自行操作。
### Golang实现
```yml
//config.yaml
session:
  name: wejh-session
  driver: redis  ##或者是memory
  
redis:
  host: 
  port: 
  db: 
  user:
  pass: 
```

```go
//demo 定义
type driver string

const (
    Memory driver = "memory"
    Redis  driver = "redis"
)

var defaultName = "wejh-session"

type sessionConfig struct {
    Driver string
    Name   string
}

//读取session存储配置信息
func getConfig() sessionConfig {
    wc := sessionConfig{}
    wc.Driver = string(Memory)
    if config.Config.IsSet("session.driver") {
        wc.Driver =strings.ToLower(config.Config.GetString("session.driver"))
    }
    wc.Name = defaultName
    if config.Config.IsSet("session.name") {
        wc.Name = strings.ToLower(config.Config.GetString("session.name"))
    }
    return wc

}
//读取redis配置信息
func getRedisConfig() redisConfig {
    Info := redisConfig{
        Host:     "localhost",
        Port:     "6379",
        DB:       0,
        Password: "",
    }
    if config.Config.IsSet("redis.host") {
        Info.Host = config.Config.GetString("redis.host")
    }

    if config.Config.IsSet("redis.port") {
        Info.Port = config.Config.GetString("redis.port")
    }

    if config.Config.IsSet("redis.db") {
        Info.DB = config.Config.GetInt("redis.db")
    }

    if config.Config.IsSet("redis.pass") {
        Info.Password = config.Config.GetString("redis.pass")
    }
    return Info

}

// 设置基于内存储存
func setMemory(r *gin.Engine, name string) {
    store := memstore.NewStore()
    r.Use(sessions.Sessions(name, store))

}

//设置基于redis数据库
type redisConfig struct {
    Host     string
    Port     string
    DB       int
    Password string
}

  
func setRedis(r *gin.Engine, name string) {
    Info := getRedisConfig()
    store, _ := sessionRedis.NewStore(10, "tcp", Info.Host+":"+Info.Port, Info.Password, []byte("secret"))
    r.Use(sessions.Sessions(name, store))
}

//初始化
func Init(r *gin.Engine) {
    config := getConfig()
    switch config.Driver {
    case string(Redis):
        setRedis(r, config.Name)
        break
    case string(Memory):
        setMemory(r, config.Name)
        break
    default:
        log.Fatal("ConfigError")
    }

}


```

```go
//demo 使用

//生成session
func SetUserSession(c *gin.Context, user *models.User) error {
    webSession := sessions.Default(c)
    webSession.Options(sessions.Options{MaxAge: 3600 * 24 * 7, Path: "/api"})
    webSession.Set("id", user.ID)
    return webSession.Save()
}

//获取session 
func GetUserSession(c *gin.Context) (*models.User, error) {
    webSession := sessions.Default(c)
    id := webSession.Get("id")
    if id == nil {
        return nil, errors.New("")
    }
    user, _ := userServices.GetUserID(id.(int))
    if user == nil {
        ClearUserSession(c)
        return nil, errors.New("")
    }
    return user, nil
}
```
## 内容补充
## 怎么处理跨域
如果session ID通过cookie携带，则需要设置`Access-Control-Allow-Credentials`，具体可见之前写的这篇文章[跨域的原因和处理](https://blog.phlin.cn/2024/08/03/cross-origin/)

## 实现单点同域名的登录
### 单点登录定义
单点登录（Single Sign-On，简称 SSO）是一种身份验证和访问控制机制，允许用户在一次登录操作后，访问多个互相关联但独立的系统，而无需在每个系统中单独进行登录。

#### 单点登录的核心概念

1. **一次登录，多次访问**：
    
    - 用户只需在一个系统中进行一次身份验证（即登录），然后可以无缝访问其他已授权的系统，而无需再次输入用户名和密码。这些系统通常属于同一组织或同一信任域。
2. **集中认证服务**：
    
    - 单点登录通常由一个集中认证服务（Identity Provider，简称 IdP）来管理。当用户登录某个系统时，该系统会请求 IdP 进行身份验证。验证成功后，IdP 会生成一个令牌或凭证，用于访问其他受信任的系统（Service Providers，简称 SP）。
3. **统一用户身份管理**：
    
    - 单点登录简化了用户身份的管理，因为用户只需记住一组登录凭证（如用户名和密码）。管理员也只需维护一个用户目录，从而减少了管理的复杂性和安全风险。
### 基于 Cookie-Session 机制的单点登录（SSO）

在基于 `cookie-session` 机制的系统中，用户登录后，服务器会生成一个 `sessionId`，并将其存储在浏览器的 Cookie 中。当用户在同一域名或父子域名下的其他系统中访问时，这个 `sessionId` 会自动发送给服务器，从而识别用户的身份，实现单点登录。

#### 共享 Cookie 的机制

1. **同域名下的共享**：
    
    - Cookie 可以在同一域名的不同端口之间共享。这意味着即使是不同的服务端程序，只要它们部署在相同的域名下，就可以共享 Cookie，并通过共同的 `sessionId` 识别用户的登录状态。
    - HTTP 的同域策略认为只有协议、域名、端口完全相同时才属于同域，然而，Cookie 的共享机制允许不同端口（例如 `http://example.com:8080` 和 `http://example.com:3000`）在同一域名下共享 Cookie。
2. **父子域名的共享**：
    
    - Cookie 的 `Domain` 属性可以设置为顶级域名（例如 `.example.com`），从而允许该顶级域名下的所有子域名（如 `app1.example.com` 和 `app2.example.com`）共享该 Cookie。这意味着用户在 `app1.example.com` 上登录后，`app2.example.com` 可以读取同样的 Cookie，并利用相同的 `sessionId` 进行用户身份验证，实现单点登录。

#### 实现单点登录的条件

- **共享 Session 存储**：这种方式适用于多个系统共享相同的 Session 验证程序。即这些系统必须访问同一个 Session 存储（例如 Redis 或数据库），以便通过 `sessionId` 查找并验证用户的登录状态。
    
- **适用范围**：
    
    - 如果多个应用的前端页面部署在相同的域名或父子域名下，并且这些系统共享 Session 存储，那么可以通过共享 Cookie 和 Session 机制来实现单点登录。
    - 但是，对于不同域名下的系统，或者跨系统（不同系统不共享 Session），此方案则无法直接使用。

#### 针对跨域、跨系统的限制

对于跨域或跨系统的情况，即多个系统不共享 Session，或者系统部署在不同的顶级域名（如 `example.com` 和 `example.net`）下时，基于 `cookie-session` 的 SSO 方案将无法直接应用。此时，通常需要引入更复杂的单点登录机制，如基于 OAuth、SAML 或者 OpenID Connect 等协议来实现跨域、跨系统的身份认证和授权。
## 补充面试题

## Session与Cookie的区别
**Cookie**和**Session**是Web开发中常用的两种保持用户状态的机制，它们的主要区别如下：

1. **存储位置**：
    
    - **Cookie**存储在客户端（用户的浏览器）中，属于浏览器的一部分。每次请求时，浏览器会将相应的Cookie发送给服务器。
    - **Session**存储在服务器端，客户端只保存一个Session ID。浏览器通过Session ID来标识不同的会话，并通过它与服务器进行关联。
2. **安全性**：
    
    - **Cookie**相对来说安全性较低，因为它存储在客户端，容易被恶意用户读取、篡改或截取。
    - **Session**安全性较高，因为所有的会话数据都保存在服务器端，用户无法直接访问。
3. **生命周期**：
    
    - **Cookie**可以设置过期时间，可以是几秒、几分钟、几天，甚至永不过期。如果没有设置过期时间，Cookie在会话结束（浏览器关闭）时自动删除。
    - **Session**默认在用户关闭浏览器或会话超时时被销毁，超时时间通常是服务器设置的。
4. **大小限制**：
    
    - **Cookie**有大小限制，通常每个Cookie的大小不能超过4KB，并且每个域名下的Cookie数量也有限制。
    - **Session**存储在服务器端，大小仅受服务器的内存或存储限制，一般来说可以存储更多的信息。
5. **使用场景**：
    
    - **Cookie**常用于保存用户偏好、跟踪用户行为、记住登录状态等。
    - **Session**常用于存储敏感信息，如用户登录后的权限信息、购物车信息等。
## 只要关闭浏览器，Session是否就消失了
在服务器端，Session 通常会一直保留，除非程序明确通知服务器删除它。然而，当我们关闭浏览器时，浏览器并不会主动通知服务器，即将关闭。因此，服务器无法得知浏览器已关闭，导致 Session 仍然在服务器上保持有效。

这种情况下，很多人可能会误以为关闭浏览器会导致 Session 失效，但实际上，这种错觉是因为大多数 Session 机制依赖会话 Cookie 来保存 SessionID 信息。会话 Cookie 是一种临时 Cookie，当浏览器关闭时，它们会被自动删除。因为 Cookie 消失了，再次打开浏览器访问服务器时，服务器无法再找到原来的 SessionID，因此也就无法恢复之前的会话。

如果服务器设置的 Cookie 是持久化的，即将 Cookie 保存在硬盘上，或者通过某些方式修改浏览器的 HTTP 请求头，以便在浏览器重新打开时仍然发送原来的 Cookie，那么即使关闭并重新打开浏览器，服务器仍然能够识别之前的 SessionID，从而保持用户的登录状态。

由于关闭浏览器不会自动删除服务器端的 Session，服务器通常会为每个 Session 设置一个失效时间。如果在设定的时间内，客户端没有进行任何活动，服务器会认为用户已经停止使用该 Session，并会将其删除，以节省存储空间。
## 如何在Web应用中实现Session的持久化？
Session通常与用户会话的生命周期绑定，当浏览器关闭或会话超时后会被销毁。要实现Session的持久化，可以采用以下方法：

1. 延长Session过期时间：通过设置Session的过期时间，使其在长时间内保持有效。这适合一些用户频繁访问的场景。

2. 使用持久化存储：将Session数据存储在数据库、Redis等持久化存储中，而不是仅仅保存在服务器的内存中。即使服务器重启或出现故障，Session数据仍然可用。

3. 设置持久化的Session ID Cookie：通过设置Cookie的expires或max-age属性，将Session ID保存在客户端的Cookie中，以实现持久化。客户端再次访问时，通过持久化的Cookie找回对应的Session。

4. Session备份与恢复：在分布式系统中，可以对Session数据进行备份，当某一服务器宕机时，从备份服务器恢复Session数据，确保Session的持续可用。

## 在高并发环境下，如何优化Session管理？
在高并发环境下，Session管理可能成为系统的瓶颈。优化Session管理可以采取以下措施：

1. Session集中管理：使用Session存储方案，如Redis、Memcached，集中管理Session数据，避免单个应用服务器成为瓶颈。

2. 无状态Session：使用JWT等无状态认证方式，将用户状态存储在客户端，而不是依赖服务器端Session，从而减少服务器的压力。

3. Session分布式存储：在分布式系统中，将Session数据分布式存储，以负载均衡的方式处理高并发请求。

4. Session数据压缩：对于大型Session数据，采用压缩技术减少存储和传输的开销。

5. 缓存策略：使用缓存技术，将频繁访问的Session数据缓存在内存中，减少对持久化存储的依赖，加快访问速度。

## 参考资料
[Session是怎么实现的？存储在哪里？](https://juejin.cn/post/6942852054847062053#heading-12)
[深入理解COOKIE&SESSION的原理和区别](https://cloud.tencent.com/developer/article/2002609)
[Session是什么意思？详解Session的特点、工作原理及与Cookie的区别](https://www.youhuaxing.cn/seojianzhan/17673.html)
[Cookie与Session基础知识点](https://cloud.tencent.com/developer/article/1113463)
[Session会话与Cookie简单说明](https://cloud.tencent.com/developer/article/1966321)
[session是什么？cookie是什么，两者的区别，以及应用的场景？](https://www.bilibili.com/read/cv26980721/)
[HTTP Session教程](https://ligexiao.gitbooks.io/http-sessions/content/1-basic.html)
[如何用 30s 给面试官讲清楚什么是 Session-Cookie 认证](https://www.cnblogs.com/cswiki/p/17029477.html)
