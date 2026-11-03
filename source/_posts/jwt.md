---
title: JWT介绍和相关面试题总结
date: 2024-08-30 19:05:30
keywords:
  - "鉴权"
  - "jwt"
  - "面试"
  - "开发"
updated: 2024-08-30 19:05:30
description: "定义 JSON Web Token（简称 JWT）是 ，它是一种用于在不同方之间安全传递信息的开放标准（RFC 7519）。它以紧凑、自包含的方式将信息封装为 JSON 对象，常用于 Web 应用中的认证和信息交换，尤其适用于分..."
categories: 开发
tags:
  - 鉴权
  - jwt
  - 面试
---

JWT 经常和登录鉴权、跨服务认证一起出现。理解它时，我觉得需要先分清三件事：令牌里装了什么，服务端凭什么相信它，以及令牌发出去以后怎样失效。

## JWT 用来表达什么

JSON Web Token 是一种表达声明的令牌格式，定义在 [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519) 中。声明可以包含用户标识、签发者、接收方和过期时间等信息，接收方按约定验证后再使用。

JWT 可以用于认证系统，但它本身不包含完整的登录、授权或单点登录流程。跨服务使用时，各服务仍然需要约定信任的签发方、密钥和验证规则。

下面主要讨论常见的签名 JWT。它可以让接收方检查内容是否被篡改，但 Header 和 Payload 的 Base64URL 编码不提供保密性。需要加密时，要使用相应的 JWE 机制，不能把签名当成加密。

## 三段内容分别是什么

一个签名 JWT 通常由 Header、Payload 和 Signature 三段组成，中间用 `.` 分隔：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6InBobGluIiwiaWQiOjF9.ZVUAT1eOPAkXtcHZu2SFf2k7mXeKFM3BXzZpz_h6hBU
```

### Header：声明类型与算法

Header 描述令牌使用的算法等信息。常见字段包括 `typ` 和 `alg`，例如下面的头部片段：

```json
`{   "alg": "HS256",   "typ": "jwt" }`
```

Base64URL 编码后的形式如下：

```Base64
`eyJhbGciOiJIUzI1NiIsInR5cCI6Imp3dCJ9`
```

下面是算法选项的截图：

![JWT介绍和相关面试题总结配图](https://qiuniu.phlin.cn/bucket/202408301549178.png)

接收方应在自己的配置中限定可接受的算法，不能仅凭令牌里的 `alg` 决定如何验证。与密钥相关的头部字段也需要经过受信任配置约束。

| 字段 | 作用 |
| --- | --- |
| `typ` | 声明令牌类型，JWT 常使用 `JWT` |
| `cty` | 描述内容类型，嵌套 JWT 常使用 `JWT` |
| `alg` | 声明签名或 MAC 算法，验证方还要核对允许的算法 |
| `kid` | 密钥标识，帮助验证方选择已知密钥 |
| `x5c` | 携带 X.509 证书链 |
| `x5u` | 指向 X.509 证书资源的地址，不能因此信任任意来源 |
| `crit` | 列出接收方必须理解并处理的扩展头部 |

### Payload：携带声明

Payload 中的声明分为注册声明、公共声明和私有声明。注册声明定义了通用含义，具体哪些字段必须存在，则由应用协议约定。

| 字段 | 含义 |
| --- | --- |
| `iss` | 签发者 |
| `sub` | 令牌描述的主体 |
| `aud` | 预期接收方，验证方要检查自己是否在允许范围内 |
| `exp` | 过期时间 |
| `nbf` | 在此时间之前不能接受令牌 |
| `iat` | 签发时间 |
| `jti` | 令牌的唯一标识，可用于追踪或撤销记录 |

`exp`、`nbf`、`iat` 使用 NumericDate，通常以 Unix 时间秒数表示。下面是 Payload 片段：

```json
  "sub": "1234567890",
  "name": "phlin",
  "id": 1
}
```

编码后的形式：

```base64
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6InBobGluIiwiaWQiOjF9
```

任何拿到签名 JWT 的人都可能解码这些内容，所以不要在里面放密码、密钥等敏感信息。角色或权限也可能在签发后发生变化，不能把令牌中的旧值无限期当成当前状态。

### Signature：验证内容是否被篡改

以 HS256 为例，签名计算会使用编码后的 Header、Payload 和共享密钥：

```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  your-256-bit-secret
)
```

这里的 `secret` 是 HMAC 共享密钥，应保存在受信任的服务端。它与 RSA、ECDSA 签名中的私钥属于不同的密钥用法。持有 HMAC 密钥的一方既能验证，也能签发令牌，因此密钥泄露后，攻击者可能伪造身份。

验证签名以后，还要检查有效期、签发者、接收方，以及当前接口需要的权限。[RFC 8725](https://www.rfc-editor.org/rfc/rfc8725.html) 对算法、密钥和声明验证给出了具体要求。

## 一次登录怎样使用 JWT

1. 用户提交登录凭据，服务端验证身份。
2. 服务端生成声明并签名，将令牌交给客户端。
3. 客户端访问受保护接口时携带令牌，常见形式是 `Authorization: Bearer <JWT>`。
4. 服务端验证签名和声明，再做当前操作的权限检查。

![JWT介绍和相关面试题总结配图](https://qiuniu.phlin.cn/bucket/202408301713373.png)

JWT 的自包含特性，可以让多个服务在拥有验证所需信息时，分别完成一部分检查。它省去的是某些会话查询，而不是所有状态管理：账号封禁、权限变化、即时注销等需求，仍然可能要求访问服务端状态。

令牌体积和验证开销也要考虑。声明越多，每次请求携带的数据越大；JWT 并不必然比一个短 Session ID 更省带宽或更快。

## Go 接入示例

下面保留原项目里的签发、解析和中间件片段。它依赖项目中的配置、JWT 库和 Gin，用来说明令牌在请求链路中的位置：

```go
// jwt过期时间
const expiration = time.Hour*2

  
// Claims jwt声明
type Claims struct{
    UserID int
    jwt.StandardClaims
}


func GenToken(userid int)(string,error){
    //创建声明
    secret :=config.Config.GetString("jwt.pass")
    var Secret = []byte(secret)
    a:=Claims{
        UserID:userid,
        StandardClaims: jwt.StandardClaims{
            ExpiresAt: time.Now().Add(expiration).Unix(),
            IssuedAt: time.Now().Unix(),
            Issuer: "gin-jwt-demo",
            Id: "",
            NotBefore: 0,
            Subject: "",
        },
    }
    //哈希方法创建签名
    tt:=jwt.NewWithClaims(jwt.SigningMethodHS256,a)
    tokenString, err := tt.SignedString(Secret)
    if err != nil {
        return "", err
    }
    return  tokenString, nil
}

  

func ParseToken(tokenStr string)(*Claims,error){
    secret :=config.Config.GetString("jwt.pass")
    var Secret = []byte(secret)
    if len(tokenStr) > 7 && tokenStr[:7] == "Bearer " {
        tokenStr = tokenStr[7:]
    }
    token,err:=jwt.ParseWithClaims(tokenStr,&Claims{},func (token *jwt.Token)(interface{},error){
        return Secret,nil
    } )
    if err !=nil{
        return nil,err
    }
    //检验token
    if claims,ok:=token.Claims.(*Claims);ok&&token.Valid{
        return claims,nil
    }
    return nil,errors.New("invalid token")
}

// 中间件鉴权
func JWTAuthMiddleware()func(c *gin.Context){
    return func(c *gin.Context) {
        tokenStr:=c.Request.Header.Get("Authorization")
        if tokenStr ==""{
            c.AbortWithStatusJSON(http.StatusUnauthorized,gin.H{
                "code":200,
                "msg":"auth is null",

            })
            c.Abort()
            return
        }
        parts:=strings.Split(tokenStr,".")
        if len(parts)!=3{
            c.JSON(http.StatusUnauthorized,gin.H{
                "code":200,
                "msg":"auth is error",
            })
            c.Abort()
            return
        }

        mc,err:=ParseToken(tokenStr)

        if err !=nil{

            c.JSON(http.StatusUnauthorized,gin.H{

                "code":200,

                "msg":"Token is not vaild",

            })

            c.Abort()

            return

        }else if time.Now().Unix()>mc.ExpiresAt{

            c.AbortWithStatusJSON(http.StatusUnauthorized,gin.H{

                "code":200,

                "msg": "Token is overdue",

            })

            c.Abort()

            return

        }

  

        c.Set("UserID",mc.UserID)

        c.Next()

    }

}
```

这份片段使用的库接口属于原项目版本。实际接入时还需要补齐允许算法、签发者与接收方检查，以及密钥配置等验证要求，不能只按字符串段数判断令牌有效。

## 注销、改密码与权限变化

退出登录、修改密码、封禁账号、调整角色或踢掉某个设备，都涉及同一个问题：令牌还没过期，服务端怎样提前拒绝它？

只在客户端删除令牌，无法阻止已经复制出去的令牌继续被使用。常见处理方式包括：

- **允许列表**：服务端保存有效令牌或会话标识，验证时确认它仍然存在；注销时删除。
- **撤销列表**：保存已经失效的 `jti` 等标识，验证时检查，并在令牌自然过期后清理记录。
- **用户或设备状态**：维护用户、设备或令牌版本，使密码修改、封禁和单设备注销能被后续请求识别。
- **短期令牌与刷新机制**：缩短访问令牌有效期，例如以 15 分钟作为讨论起点，再由刷新凭据换取新令牌。具体期限要按业务调整。

这些方案都需要权衡额外查询、存储和失效速度。短有效期只能缩短风险窗口，不能保证立即注销；如果使用刷新令牌，还要校验它的状态，并处理轮换与旧凭据失效。

修改签名密钥也会影响旧令牌，但它可能让同一密钥签发的多个会话一起失效。为每个用户维护密钥，又会引入查询、分发和多设备管理问题。签名密钥应独立管理，不宜直接复用用户密码哈希；密码变化可以通过会话撤销或版本检查处理。

自动续期的完整实现我还没有实操，这里先把需要解决的状态关系记清楚。

## 浏览器里如何保存令牌

令牌格式与存储位置是两回事。JWT 可以放在 Cookie 中，也可以由客户端显式放入请求头；Session ID 同样可以作为凭据传递。

浏览器自动携带 Cookie 时，需要考虑 CSRF，并结合 `SameSite`、CSRF Token 等机制保护修改状态的请求。`HttpOnly` 可以限制脚本直接读取 Cookie，但无法消除所有 XSS 影响。

`localStorage` 不会自动随请求发送，却能被同源脚本读取，发生 XSS 时令牌可能泄露。因此，不能只为了避开 CSRF 就推荐把长期凭据放进去。浏览器会话的存储选择可以参考 [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)。

无论放在哪里，都应通过 HTTPS 传输，减少声明内容，设置合理有效期，并保管好签名密钥。

## 跨域、移动端和单点登录

跨域请求携带 `Authorization` 时，服务端的 CORS 配置需要允许这个请求头，具体过程可以结合[跨域的原因和处理](https://blog.phlin.cn/2024/08/03/cross-origin/)来看。使用 JWT 不会自动解除浏览器的跨域限制。

移动端也能保存令牌并放进请求头，但这不是 JWT 独有的能力。选择 JWT 还是服务端会话，需要看是否需要独立验证、即时撤销和集中管理，而不是只看客户端是不是手机。

单点登录则需要统一的身份信任和认证流程。JWT 可以充当其中的令牌格式，但多个系统拿到一个 JWT，并不意味着单点登录就已经完成。

## 参考资料

- [RFC 7519：JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519)
- [RFC 8725：JWT Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725.html)
- [OWASP：Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
[JWT官网](https://jwt.io/)
[什么是 JWT -- JSON WEB TOKEN](https://www.jianshu.com/p/576dbf44b2ae)
[详解Session、Token、JWT 、OAuth2](https://juejin.cn/post/7028091738791084039#heading-5)
[JWT 基础概念详解](https://javaguide.cn/system-design/security/jwt-intro.html)
[了解 JWT Token 释义及使用](https://docs.authing.cn/v2/concepts/jwt-token.html)
[了解什么是JWT的原理及实际应用](https://blog.csdn.net/SAME_LOVE/article/details/133811830)
[什么是 JSON Web Token](https://open.alipay.com/portal/forum/post/138501018)
[JWT | 一分钟掌握JWT | 概念及实例](https://juejin.cn/post/7232550589964140602)
[看图理解JWT如何用于单点登录](https://www.cnblogs.com/lyzg/p/6132801.html)
[最全！2024字节跳动Spring JWT面试题大全，详解核心要点，收藏必备！](https://blog.csdn.net/calculusstill/article/details/138403278)