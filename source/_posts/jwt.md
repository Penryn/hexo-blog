---
title: jwt
date: 2024-08-30 19:05:30
categories: 开发
tags:
  - 鉴权
  - jwt
  - 面试
---

# 定义
JSON Web Token（简称 JWT）是`目前最流行的跨域认证解决方案`，它是一种用于在不同方之间安全传递信息的开放标准（RFC 7519）。它以紧凑、自包含的方式将信息封装为 JSON 对象，常用于 Web 应用中的认证和信息交换，尤其适用于分布式系统中的单点登录（SSO）场景。

JWT 可以使用 HMAC 算法（基于密钥）或 RSA/ECDSA 的公钥/私钥对进行签名，确保传递的信息是可信的。JWT 中通常包含声明，这些声明是关于某个实体（通常是用户）的信息，以及一些元数据。这些声明可以用于身份验证、授权，甚至存储额外的业务逻辑相关信息。通过验证签名，可以确保 token 内容的完整性和真实性。
# 出现缘由
- **跨域认证需求**： 现代 Web 应用通常由多个服务组成，这些服务可能分布在不同的域名或子域名下。传统的基于会话的认证方式（如使用服务器上的 Session）在跨域环境中难以实现，因为每个域可能需要独立的会话管理，而共享状态又会带来复杂性和安全性问题。JWT 通过将认证信息打包为一个自包含的 token，可以轻松在多个服务间传递，实现跨域认证。
    
- **单点登录（SSO）**： 在单点登录场景中，一个用户登录后应该能够访问多个相关的系统或服务，而不需要重复登录。JWT 的自包含特性使得它非常适合用于 SSO，因为它可以携带所有必要的用户身份信息，并在多个系统之间安全传递。
    
- **分布式架构的需求**： 传统的会话管理方式通常依赖于服务器端存储，这在分布式系统中可能带来瓶颈或单点故障。JWT 的自包含和无状态特性，使得服务器不需要存储会话状态，只需要验证 token 的有效性，从而更好地支持分布式架构。
    
- **更好的性能**： JWT 是一种紧凑的格式，使用 Base64 编码，可以嵌入到 URL、HTTP 头部或其他不适合存储大量数据的场景中。这种紧凑性有助于减少带宽使用，提高传输效率。
    
- **灵活性和扩展性**： JWT 可以携带自定义的声明（claims），除了身份验证之外，还可以用于其他业务场景，比如授权、信息交换等。它的灵活性使得开发者可以根据需求定制 token 的内容，而不必局限于固定的格式或功能。

# 结构组成
这是一个JWT的token串：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6InBobGluIiwiaWQiOjF9.ZVUAT1eOPAkXtcHZu2SFf2k7mXeKFM3BXzZpz_h6hBU
```
很复杂，看不懂是不是？其实这一串是经过加密之后的密文字符串，中间通过`.`来分割。每个`.`之前的字符串分别表示JWT的三个组成部分：`Header`、`Payload`、`Signature`。
## Header（头信息）
Header的主要作用是用来标识。通常是两部分组成：

- `typ`：type 的简写，令牌类型，也就是JWT。
- `alg`：Algorithm 的简写，加密签名算法。一般使用HS256，jwt官网提供了12种的加密算法，截图如下：
![](https://qiuniu.phlin.top/bucket/202408301549178.png)
Header的明文示例：

```json
`{   "alg": "HS256",   "typ": "jwt" }`
```

经过Base64编码之后的明文，变为：
```Base64
`eyJhbGciOiJIUzI1NiIsInR5cCI6Imp3dCJ9`
```


也就是第一个`.`之前的密文串。以下是Header部分常用部分的声明：

| **Key** | **Name**      | **说明** |
|---------|---------------|----------|
| typ     | 令牌类型      | 如果存在，则必须将其设置为已注册的 IANA 媒体类型。 |
| cty     | 内容类型      | 如果使用嵌套签名或加密，建议将其设置为 `application/jwt`；否则，请省略此字段。 |
| alg     | 消息身份验证代码算法 | 发行者可以自由设置算法来验证令牌上的签名。但某些受支持的算法不安全。 |
| kid     | 密钥标识      | 指示客户端用于生成令牌签名的密钥的提示。服务器将此值与文件上的密钥匹配，以验证签名是否有效以及令牌是否真实。 |
| x5c     | x.509 证书链  | RFC 4945 格式的证书链，对应于用于生成令牌签名的私钥。服务器将使用此信息来验证签名是否有效以及令牌是否真实。 |
| x5u     | x.509 证书链网址 | 服务器可在其中检索与用于生成令牌签名的私钥对应的证书链的 URL。服务器将检索并使用此信息来验证签名是否真实。 |
| crit    | 危急          | 服务器必须理解的标头列表，以便接受令牌为有效令牌。 |

## Payload（负载信息）
  也称为JWT claims，放置需要传输的信息，有三类：

- `保留claims`：主要包括iss发行者、exp过期时间、sub主题、aud用户等(建议但不强制使用) 。
- `公共claims`：定义新创的信息，比如用户信息和其他重要信息。
- `私有claims`：用于发布者和消费者都同意以私有的方式使用的信息。

以下是Payload的官方定义内容：

| **Key** | **Name**    | **说明**                                                                           |
| ------- | ----------- | -------------------------------------------------------------------------------- |
| iss     | 发送者标识       | 颁发 JWT 的发送主体。                                                                    |
| sub     | 主题标识        | JWT 的主题。                                                                         |
| aud     | 接收者标识       | JWT 所针对的接收者。每个在处理 JWT 的主体都必须使用受众声明中的值来标识自己。如果处理的主体在存在此声明时未将自己标识为声明中的值，则必须拒绝 JWT。 |
| exp     | 到期时间        | 标识不得接受 JWT 进行处理的过期时间。该值必须是日期类型，而且是1970-01-01 00:00:00Z 之后的日期秒。                   |
| nbf     | JWT 的开始处理时间 | 标识 JWT 开始接受处理的时间。该值必须是日期。                                                        |
| iat     | JWT 发出的时间   | 标识 JWT 的发出的时间。该值必须是日期。                                                           |
| jti     | JWT ID      | 令牌的区分大小写的唯一标识符，即使在不同的颁发者之间也是如此。                                                  |
Payload明文示例：

```json
  "sub": "1234567890",
  "name": "phlin",
  "id": 1
}
```

经过Base64加密之后的明文，变为：


```base64
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6InBobGluIiwiaWQiOjF9
```

也就是第一个`.`和第二个`.` 之间的密文串内容。

## Signatrue（签名信息）

Signature 部分是对Header和Payload两部分的签名，作用是防止 JWT 被篡改。这个部分的生成规则主要是是公式（伪代码）是：

```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  your-256-bit-secret
)
```

`secret`是存放在服务端加密使用到的盐。

得到签名之后，把Header的密文、Payload的密文、Signatrue的密文按顺序拼接成为一个字符串，中间通过`.`来连接并分割，整个串就是JWT了。

注意：secret是保存在服务器端的，jwt的签发生成也是在服务器端的，secret就是用来进行jwt的签发和jwt的验证，所以，它就是你服务端的私钥，在任何场景都不应该流露出去。一旦客户端得知这个secret, 那就意味着客户端是可以自我签发jwt了。

  

# 优缺点
## **优点：**

1. **无状态性：** JWT 鉴权是无状态的，不需要服务器存储用户的会话信息。这使得应用程序更加可扩展，特别是在分布式系统或微服务架构中。
    
2. **跨域支持：** 由于 JWT 是通过HTTP头部传递的，它支持跨域访问，适用于不同域名之间的认证。
    
3. **易于集成：** JWT 鉴权可以很容易地与API和Web应用集成，特别是单页应用（SPA），无需额外的会话管理。
    
4. **高效性：** 服务器只需要验证JWT的签名和有效期即可完成鉴权，无需查询数据库或其他外部存储，减少了延迟。
    
5. **灵活性：** JWT 可以在令牌中包含自定义的用户信息（例如权限级别、角色），便于扩展和调整权限策略，同时，JWT 既可以在HTTP头部传输，也可以在URL或Cookie中传输，非常灵活
    
- 6. 跨语言支持：因为json的通用性，所以JWT是可以进行跨语言支持的，像JAVA,JavaScript,NodeJS,PHP等很多语言都可以使用。
## **缺点：**

1. **安全性风险：** 由于JWT是自包含的，一旦令牌泄露，攻击者可以在令牌有效期内进行未经授权的操作，除非采取额外的措施（如黑名单机制）来撤销令牌。
    
2. **不可变性：** 一旦JWT签发后，无法修改或撤销有效期内的令牌。这意味着一旦用户权限改变，必须生成新令牌，旧令牌在过期之前仍然有效。
    
3. **令牌过期处理：** 处理令牌过期和刷新是一个复杂的问题，尤其是在需要即时撤销用户访问权限的场景下。
    
4. **数据量大：** JWT 包含的负载可能会导致请求数据量增大，尤其是在频繁传递令牌的情况下，这可能对带宽和性能产生影响。
    
5. **管理复杂性：** 当应用程序规模扩大时，管理 JWT 的生命周期、刷新、黑名单等机制会变得复杂，增加了开发和维护的难度。

6.  **非加密**：JWT的payload部分默认是不加密的，所以任何人都可以解码并读取其中的内容。虽然这些信息是Base64URL编码的，但它并不提供实际的加密保护。需要保护敏感信息的场景中，JWT的payload应避免存储敏感数据，或使用加密JWT（JWE）来保护数据。
# 工作原理
## 使用流程
1.  用户登录时，向后端提交用户名和密码。
2.  后端验证用户的凭据，验证通过后生成一个JWT并返回给前端。
2.  前端将JWT保存在本地，可以使用浏览器的localStorage、sessionStorage，或通过HTTP Only的Cookie存储。
3.  当前端需要访问受保护的资源时，将JWT附加到请求头中发送给后端。
4.  后端验证JWT的合法性，包括签名和有效期等，验证通过后返回请求的资源。
建议
- 将 JWT 存放在 localStorage 中，放在 Cookie 中会有 CSRF 风险。
- 请求服务端并携带 JWT 的常见做法是将其放在 HTTP Header 的 `Authorization` 字段中（`Authorization: Bearer Token`）。
## 工作流程
### 概括
JWT的工作流程可概括为三个阶段：认证、签发和验证。

1. **认证（Authentication）**：用户在登录时提供有效的用户名和密码，服务器验证用户身份，并生成一个JWT作为凭证。
2.  **签发（Issuance）**：服务器根据用户身份信息（如角色、权限等）生成JWT，并使用密钥对其签名，确保JWT的完整性和真实性。
3.  **验证（Verification）**：用户在后续请求中将JWT作为凭证发送至服务器。服务器验证JWT的签名和有效期，通过后根据JWT中的信息判断用户身份和权限，执行相应操作或返回资源。
### 具体
具体流程为：

1. 用户提供用户名和密码登录。
2. 服务器验证用户身份，并生成包含三部分的JWT：头部（Header）、载荷（Payload）和签名（Signature）。
    - **头部**：包含JWT类型和签名算法信息。
    - **载荷**：包括用户身份信息，如用户ID、角色、权限等，还可包含如过期时间（exp）等自定义信息。
    - **签名**：通过头部、载荷与服务器密钥生成，用于验证JWT的完整性与真实性。
3. 服务器将生成的JWT返回给用户。
4. 用户在后续请求中将JWT作为凭证，通常放在请求头的Authorization字段中（格式为`Authorization: Bearer <JWT>`），发送至服务器。
5. 服务器收到请求后，解析JWT并验证其签名与有效期，验证通过则根据JWT信息判断用户身份和权限，返回资源或执行操作。
流程图如下：
![](https://qiuniu.phlin.top/bucket/202408301713373.png)

# 代码实现
## Golang实现
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
# 内容补充
## 跨域处理
通常情况下，前端会将后端返回的`token`前加上Bearer令牌（即在前面加上`Bearer `,含一个空格），并放在请求头的`Authorization`字段里返回给后端，因此后端处理跨域是要设置`Access-Control-Allow-Headers`为`Authorization`,具体可见之前写的这篇文章[跨域的原因和处理](https://blog.phlin.top/2024/08/03/cross-origin/)
## 单点登录
由于jwt鉴权的无状态性，使得其实现单点登录很容易，因此这里就不过多赘述，后面有空再补充完善吧。
## 注销问题

在使用 JWT 认证的场景中，处理以下情况是具有挑战性的：

- **退出登录**
- **修改密码**
- **服务端修改用户权限或角色**
- **用户账户被封禁或删除**
- **用户被服务端强制注销**
- **用户被踢下线**

这些问题在 Session 认证中容易解决，因为服务器可以直接删除或更新 Session 记录。然而，在 JWT 认证中，JWT 一旦发放出去，通常在其过期之前不会失效，除非后端添加额外的处理逻辑。

### 解决方案

**1. 将 JWT 存入数据库**

将有效的 JWT 存入数据库（推荐使用内存数据库如 Redis），可以在需要使某个 JWT 失效时，从 Redis 中删除该 JWT。这种方法虽然能处理 JWT 失效的问题，但会增加每次请求时检查 JWT 的开销，并违背了 JWT 的无状态原则。

**2. 黑名单机制**

类似于上面的方式，使用内存数据库如 Redis 维护一个黑名单。如果要使某个 JWT 失效，只需将其加入黑名单。每次请求时，服务器会检查 JWT 是否在黑名单中。这种方法虽然也违背了 JWT 的无状态原则，但在实际项目中仍然常用。

**3. 修改密钥（Secret）**

为每个用户创建专属密钥，修改密钥可以使特定 JWT 失效。然而，这种方法有以下问题：
- **分布式环境**：在分布式服务中，必须同步密钥到所有机器，类似于 Session 认证的处理方式。
- **多设备登录**：用户在多个设备上同时登录，如果在一个设备上退出登录，其他设备也需重新登录，这可能影响用户体验。

**4. 保持令牌的有效期限短并经常轮换**

这种方法通过保持 JWT 的有效期限较短来减少问题，但会导致用户需要频繁登录，影响用户体验。 

**5. 基于密码哈希签名**

一种较好的方法是使用用户密码的哈希值对 JWT 进行签名。如果用户密码更改，先前的 JWT 将无法再通过签名验证，从而实现令牌的自动失效。这种方法简化了对密码更改后的 JWT 失效处理。

## 实现token自动续期
由于现在没实操过，后面有空再补充。

# 补充面试题
## 如何在JWT中处理敏感信息？
- **尽量避免将敏感信息存储在JWT的负载部分**，因为负载部分是明文的，虽然签名能保证数据的完整性，但不能保证数据的保密性。
    
- **加密JWT**：可以在签名JWT之前，使用对称或非对称加密算法对JWT的负载部分进行加密，以确保即使JWT被拦截，攻击者也无法解读其中的敏感信息。
    
- **最小化声明**：仅在JWT中存储必要的信息，将敏感信息保存在服务器端或其他更安全的地方。
    
- **设置合理的过期时间**：通过`exp`字段设置较短的过期时间，减少JWT泄露后被滥用的可能性。
    
- **使用HTTPS**：始终通过HTTPS传输JWT，以防止中间人攻击（MITM）导致JWT泄露。

## 在实现JWT认证时，如何处理JWT的过期和刷新？
- **设置过期时间（exp）**：JWT生成时在负载中设置一个较短的过期时间`exp`，例如15分钟，以减少JWT泄露后的风险。
    
- **刷新Token**：当用户的JWT快过期时，可以通过一个专门的刷新Token来获取一个新的JWT。刷新Token通常有较长的过期时间，可以在用户主动请求或后台自动请求时进行刷新。
    
    - **刷新Token策略**：在用户使用刷新Token获取新JWT时，应验证刷新Token的合法性，并生成一个新的JWT和刷新Token，同时使旧的刷新Token失效。
- **使用黑名单**：在服务器上维护一个JWT黑名单，对于已经失效或用户登出后不再有效的JWT进行标记，从而防止这些JWT被继续使用。

## 如何加强JWT的安全性
- 使用安全系数高的加密算法。
- 使用成熟的开源库，没必要造轮子。
- JWT 存放在 localStorage 中而不是 Cookie 中，避免 CSRF 风险。
- 一定不要将隐私信息存放在 Payload 当中。
- 密钥一定保管好，一定不要泄露出去。JWT 安全的核心在于签名，签名安全的核心在密钥。
- Payload 要加入 `exp` （JWT 的过期时间），永久有效的 JWT 不合理。并且，JWT 的过期时间不易过长。

## 与Session相比，JWT有什么优势

### 无状态

JWT（JSON Web Token）的主要优势在于其无状态性。因为 JWT 本身包含了所有必需的身份验证信息，所以服务器端不需要存储会话信息。这种无状态的特性提升了系统的可用性和扩展性，显著减轻了服务器的负担。然而，这也带来了一些缺点，特别是它的不可控性。例如，如果需要在 JWT 的有效期内使某个 JWT 失效或更改其权限，通常必须等到当前有效期结束后才会生效。此外，即使用户退出登录，JWT 仍然有效。为了应对这些问题，通常需要在后端添加额外的逻辑，如存储失效的 JWT 以便进行验证。

### 有效避免 CSRF 攻击

**跨站请求伪造（CSRF）** 是一种网络攻击手段，其主要通过利用用户的身份发起恶意请求。攻击者通过伪造用户的请求进行不当操作，即使用户的 SessionID 没有被泄露，也可以通过用户的浏览器发送这些请求。由于 CSRF 攻击依赖于浏览器自动携带的 Cookie，所以即使攻击者无法获取用户的 SessionID，只要用户访问了恶意链接，就可能受到攻击。

JWT 的设计能够有效防止 CSRF 攻击，因为 JWT 通常存储在 `localStorage` 中，并且在每个请求中附带 JWT，而不涉及 Cookie。因此，即使用户点击了恶意链接，JWT 不会随请求一起发送，从而避免了 CSRF 攻击的风险。需要注意的是，尽管 JWT 免疫于 CSRF，但仍然面临 XSS（跨站脚本攻击）的风险。为了防御 XSS 攻击，可以对请求中的可疑字符串进行过滤或将 JWT 存储在标记为 `httpOnly` 的 Cookie 中，但这需要额外的 CSRF 保护。

### 适合移动端应用

相较于基于 Session 的身份验证方式，JWT 更适合移动端应用。这是因为：

1. **状态管理**：Session 需要在服务器端维护状态，而移动端应用通常是无状态的。移动设备的网络连接可能不稳定或中断，因此难以维持长期的会话状态。使用 Session 会导致频繁的服务器交互，从而增加网络开销和复杂性。
   
2. **兼容性**：移动端应用通常面向多个平台（如 iOS、Android 和 Web），这些平台对 Session 的管理和存储方式可能有所不同，从而导致跨平台兼容性问题。

3. **安全性**：移动设备经常处于不受信任的网络环境中，存储敏感会话信息可能增加被攻击的风险。

JWT 只要能被客户端存储，就可以被有效使用，并且支持跨语言使用，这使得它在移动端应用中表现得更为灵活和可靠。

### 单点登录友好

在实现单点登录（SSO）时，Session 方式需要将用户的会话信息保存在一台服务器上，并处理跨域 Cookie 的问题。而使用 JWT 进行认证则不受这些限制，因为 JWT 保存在客户端，避免了跨域 Cookie 的困扰。这使得 JWT 更适合用于单点登录的场景。
# 参考资料
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