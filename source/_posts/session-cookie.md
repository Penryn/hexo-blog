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

HTTP 本身不负责记住“这次请求和上次请求属于同一个用户”。登录、购物车等功能需要应用额外维护状态，Cookie 和 Session 就经常在这里配合使用。

先把关系分清楚：Cookie 是浏览器保存并按规则发送的数据；服务端 Session 保存会话状态；Session ID 则把客户端的请求与那份状态关联起来。Cookie 可以携带 Session ID，也可以保存偏好设置等其他内容。

## 从登录到下一次请求

以 Session ID 放进 Cookie 的方式为例，一次登录大致经过以下步骤：

1. 用户提交用户名和密码，服务端验证身份。
2. 服务端建立会话，保存用户标识等状态，并生成 Session ID。
3. 响应通过 `Set-Cookie` 把 Session ID 交给浏览器。
4. 后续请求满足 Cookie 的发送条件时，浏览器自动携带它。
5. 服务端通过 Session ID 查找会话，再判断用户身份和权限。

![Session-Cookie介绍和相关面试题总结配图](https://qiuniu.phlin.cn/bucket/202408290253454.png)

因此，后续请求不必每次重新提交用户名和密码。在调试或爬虫程序中，复用登录后拿到的 Cookie，也是利用了同样的会话关联。

## Cookie 怎样写入和发送

Cookie 是一小段名称和值。服务端可以在响应中使用 `Set-Cookie`，同时指定有效期、路径和安全属性：

    ```
    `Set-Cookie: session_id=abc123; Expires=Wed, 01 Jan 2025 00:00:00 GMT; Path=/; Secure; HttpOnly`
	```

浏览器后续发送的 `Cookie` 请求头只携带匹配的名称和值，例如：

    ```
    `Cookie: user_id=1`
	```

浏览器会根据域名、路径、传输协议和跨站策略等条件决定是否携带 Cookie。它并不是向任意地址发送所有 Cookie。服务端修改 Cookie 时，也需要对准原来的名称、域和路径。

### 常见属性

| 属性 | 要点 |
| --- | --- |
| `Name` / `Value` | Cookie 的名称和值；名称相同但域或路径不同的 Cookie 可以同时存在 |
| `Domain` | 不设置时通常只发给设置它的主机；设置合法父域后，可覆盖相应子域 |
| `Path` | 限定发送路径，不能把它当成安全隔离边界 |
| `Expires` / `Max-Age` | 分别用绝对时间和秒数表示期限；同时设置时 `Max-Age` 优先 |
| `Secure` | 要求通过安全连接发送，不能代替服务端的其他安全检查 |
| `HttpOnly` | 限制 JavaScript 直接读取 Cookie，降低凭据被脚本窃取的风险 |
| `SameSite` | 控制跨站请求携带 Cookie 的行为，常见值有 `Strict`、`Lax`、`None`；`None` 需要配合 `Secure` |
| `version` / `comment` | 历史 Cookie 机制中的属性，日常配置应以当前浏览器支持的属性为准 |

容量通常按每个 Cookie 约 4KB 理解，具体数量与大小限制取决于浏览器。Cookie 会增加请求体积，也可能用于行为跟踪，所以应该只保存需要的数据，并留意浏览器对第三方 Cookie 的限制。

### 会话 Cookie 与持久 Cookie

没有设置 `Expires` 或 `Max-Age` 的是会话 Cookie，其生命周期由浏览器会话决定；设置期限后，则可以在浏览器重启后继续保留，直到到期或被删除。

不能简单把“关闭浏览器”当成可靠的注销操作。一些浏览器会恢复会话 Cookie，具体行为见 [MDN Cookie 指南](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)。删除 Cookie 时，也要匹配原有作用范围，通常通过设置过期时间或 `Max-Age=0` 完成。

## Session 保存在哪里

这里讨论的是 Web 应用中的服务端会话。会话数据可以放在进程内存、数据库、Redis 或文件里，客户端通常只保存一个难以猜测的 Session ID。

它可以跨越多次 HTTP 请求和多条网络连接，不要求每个用户固定对应一个 TCP 连接、子进程或线程。会话是否存在，由会话存储和过期策略决定。

把状态放在服务端，便于更新权限、销毁会话和控制过期；代价是每次识别会话时，需要访问相应存储。Session ID 仍然是登录凭据，泄露后也可能被他人冒用，不能因为数据放在服务端就忽略它的保护。

Session ID 还可以通过 URL 参数或表单隐藏字段传递，但两者都有额外限制。URL 容易出现在历史记录、日志和分享链接中；隐藏字段只会随对应表单提交，也能够被客户端修改。浏览器应用通常优先使用有合适安全属性的 Cookie，具体建议可参考 [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)。

## 多实例部署以后怎样共享会话

单实例把 Session 放在内存中很直接。换成多实例后，请求可能先到服务器 A，再到服务器 B；如果状态只在 A 的内存里，B 就无法通过 Session ID 找到它。

常见做法有下面几类：

| 方式 | 做法 | 需要处理的问题 |
| --- | --- | --- |
| 共享存储 | 多个应用实例访问同一套数据库或 Redis、Memcached 等存储 | 存储的容量、可用性、访问延迟和过期策略 |
| 会话复制 | 在多个实例之间同步会话副本 | 同步成本、并发修改和副本一致性 |
| 会话粘性 | 负载均衡尽量把同一用户送到同一实例 | 实例故障、重启或流量不均时，会话仍可能受影响 |
| 共享文件 | 多个实例访问同一套会话文件 | 文件系统可用性、并发读写和性能 |

所谓分布式 Session 管理，往往就是围绕这些存储与访问方式组织的能力，不能只靠名字判断是否高可用。共享 Redis 或数据库时，应用实例可以不保存本地会话，但会话状态仍然存在于外部存储中。

## Go 接入示例

下面是原项目里根据配置选择内存或 Redis 存储的片段。配置项如下：

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

初始化会话存储：

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

在处理请求时保存和读取用户标识：

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

这些片段依赖项目中的 Gin 会话库、配置和用户查询方法，主要展示接入位置。实际使用还要处理存储初始化失败、凭据配置和 Cookie 安全属性，不能把示例中的固定密钥直接作为线上配置。

## 跨域请求怎样携带会话

Session ID 通过 Cookie 携带时，前端需要允许请求发送凭据，后端也需要返回允许的具体 Origin 和 `Access-Control-Allow-Credentials: true`。这种情况下不能把允许来源简单设置成 `*`。

Cookie 自身的 `Domain`、`Path`、`SameSite`、`Secure` 和浏览器策略也会影响它能否发送。CORS 配对了，仍然需要检查 Cookie 的发送条件。请求过程可以结合[跨域的原因和处理](https://blog.phlin.cn/2024/08/03/cross-origin/)来看。

## 同一父域下怎样共享登录状态

单点登录希望用户完成一次身份验证后，能够访问多个相互信任的系统。共享 Cookie 与 Session 是其中一种实现方式，适用范围需要分清。

Cookie 不按端口隔离。同一个主机上的不同端口，可能收到相同作用范围内的 Cookie；但浏览器的同源策略仍然区分协议、主机和端口。

如果 Cookie 的 `Domain` 设置为合法父域，例如 `example.com`，相应子域也可能收到它。不过，接收到同一个 Session ID 只是第一步，各系统还需要访问兼容的会话存储，并采用一致的验证规则。扩大发送范围，也意味着需要信任相关子域。

`example.com` 和 `example.net` 之间无法直接依靠一个父域 Cookie 共享会话。跨独立域名的登录，需要集中认证以及相应协议，例如 OpenID Connect 或 SAML；不能把共享 Cookie 当成适用于所有系统的单点登录方案。

## 过期、注销与持久化

客户端 Cookie 与服务端 Session 有各自的期限。Cookie 还在，服务端会话可能已经过期；浏览器关闭了，服务端也不会因此自动收到销毁通知。

注销时，需要让服务端拒绝原会话，并清理客户端凭据。只清理浏览器 Cookie，并不能使已经泄露的 Session ID 自动失效。

如果希望重启后继续登录，需要同时考虑持久 Cookie 和服务端状态的保留。会话放在数据库或 Redis 中，不等于已经保证故障后不丢数据，还要看存储本身的持久化、备份和恢复配置。延长有效期同样会延长凭据泄露后的风险窗口。

## 复习时容易混淆的地方

**Cookie 和 Session 并不是二选一。** 前者负责客户端存储与自动发送，后者负责应用会话状态；常见登录方案会同时使用它们。

**HttpOnly 也不能防住所有 XSS。** 它限制脚本直接读取 Cookie，但恶意脚本仍可能在当前页面上下文中发起操作。Cookie 自动携带的场景，还需要独立考虑 CSRF。

**优化会话管理，要先看瓶颈在哪里。** 会话数据过大、每次请求反复查询、过期数据未清理，或共享存储延迟过高，需要不同的处理方式。集中存储、缓存和数据压缩都有各自成本；改用 JWT 则会改变撤销与状态管理方式，需要重新权衡。

## 参考资料

- [MDN：Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
- [OWASP：Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
[Session是怎么实现的？存储在哪里？](https://juejin.cn/post/6942852054847062053#heading-12)
[深入理解COOKIE&SESSION的原理和区别](https://cloud.tencent.com/developer/article/2002609)
[Session是什么意思？详解Session的特点、工作原理及与Cookie的区别](https://www.youhuaxing.cn/seojianzhan/17673.html)
[Cookie与Session基础知识点](https://cloud.tencent.com/developer/article/1113463)
[Session会话与Cookie简单说明](https://cloud.tencent.com/developer/article/1966321)
[session是什么？cookie是什么，两者的区别，以及应用的场景？](https://www.bilibili.com/read/cv26980721/)
[HTTP Session教程](https://ligexiao.gitbooks.io/http-sessions/content/1-basic.html)
[如何用 30s 给面试官讲清楚什么是 Session-Cookie 认证](https://www.cnblogs.com/cswiki/p/17029477.html)
