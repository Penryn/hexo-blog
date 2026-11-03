---
title: 全局错误处理和日志的简单使用
date: 2024-05-15 15:48:34
keywords:
  - "golang"
  - "中间件"
  - "日志"
  - "开发"
updated: 2024-05-15 15:48:34
description: "因为，前端总是因为各种稀奇原因报服务错误，而gin本身的日志信息及其简洁，因此 老登 部长让我写一个日志系统，在写日志系统前，应该先了解一下全局错误处理，这样可方便我们对错误信息进行处理，以便形成一个日志。"
categories: 开发
tags:
  - golang
  - 中间件
  - 日志
---


因为，前端总是因为各种稀奇原因报服务错误，而gin本身的日志信息及其简洁，因此~~老登~~部长让我写一个日志系统，在写日志系统前，应该先了解一下全局错误处理，这样可方便我们对错误信息进行处理，以便形成一个日志。

### 全局错误处理
Gin 的处理函数通过 `*gin.Context` 读写请求和响应。要集中记录错误，需要先约定业务处理函数怎样把错误交给中间件。

#### 原因

这次需要解决的是两个问题：接口返回给前端的错误格式不统一，排查时又缺少原始错误、请求路径等信息。

把这些处理集中起来，可以减少每个接口里重复写响应和日志的代码。不过，中间件能记录哪些错误，仍然取决于业务代码是否按约定提交错误；普通错误收集和后面的 panic 恢复，也需要分别处理。

#### 实操
在了解了上述这些原因后，我们可以开始上手。

`gin.HandlerFunc` 是一个函数类型，参数为 `*gin.Context`，没有返回值。它的定义如下：

具体来说，gin.HandlerFunc的定义如下：
```
type HandlerFunc func(*Context)
```
这里的Context是Gin框架中的核心类型，它是一个结构体，包含了HTTP请求的相关信息（如请求头、查询参数、请求体等）以及响应的方法（如设置响应状态码、发送响应体等）。
在Gin中，你可以为每个路由定义一个或多个处理函数，这些函数就是HandlerFunc类型的。当HTTP请求到达对应的路由时，Gin会调用这些处理函数来处理请求。

所以我们可以通过调整gin.HandlerFunc来对每个请求产生的错误进行处理，但从定义上看，HandlerFunc是没有返回值的

带着这个思考我们定义一个type
```
type HandlerFunc func(c *gin.Context) error
```
这个自定义类型带有 `error` 返回值，如果直接用于 Gin 路由，需要额外适配。下面先采用 Gin 已有的错误收集方式：业务处理函数调用 `c.Error()`，中间件在 `c.Next()` 之后读取 `c.Errors`。

```
func ErrHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		if length := len(c.Errors); length > 0 {
			e := c.Errors[length-1]
			err := e.Err
			if err != nil {
				// TODO 建立日志系统
				
				return
			}
		}
	}
}
```

如此，我们就能通过c.Error(),把报错信息传给这个中间件，然后在这个中间件统一处理。

### 自定义错误
既然实现了错误的全局管理，所以是不是我们可以进一步实现自定义错误，使得后端服务报错返回给前端的错误信息在一块处理，而不是每个接口都要写。

如此便是微精弘的代码处理了。

```
func ErrHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		fmt.Println(c.Errors)
		if length := len(c.Errors); length > 0 {
			e := c.Errors[length-1]
			err := e.Err
			if err != nil {
				var Err *apiException.Error
				if e, ok := err.(*apiException.Error); ok {
					Err = e
				} else if e, ok := err.(error); ok {
					Err = apiException.OtherError(e.Error())
				} else {
					Err = apiException.ServerError
				}
				// TODO 建立日志系统

				c.JSON(Err.StatusCode, Err)
				return
			}
		}

	}
}
// 微精弘的这个中间件是把错误信息也在中间件返回给前端了。
```
### 日志记录
但是如果我们要设置日志的话，那微精弘的这个缺会丢失掉最初的报错信息了（可能理解有误），所以我中间件是专门处理原始的错误信息记录，返回给前端就在utils的JsonResponse统一处理掉成功信息和自定义错误了。

然后再学长的推荐下，我使用的是zap的第三方日志库。

[Zap](https://pkg.go.dev/go.uber.org/zap) 是 Uber 开源的 Go 日志库。这次用到的是结构化字段、日志级别和 JSON 编码：把路径、方法和原始错误放进同一条记录，后续查日志时能按字段定位。

下面的配置把日志追加写入文件，再由中间件读取 `c.Errors` 并记录。

因此日志的实现效果如下
```
func ErrHandler() gin.HandlerFunc {
	logFilePath := "app.log"

	// 检查日志文件是否存在
	if _, err := os.Stat(logFilePath); os.IsNotExist(err) {
		// 如果日志文件不存在，则创建新的日志文件
		_, err := os.Create(logFilePath)
		if err != nil {
			// 创建日志文件失败，记录错误并返回空的中间件处理函数
			zap.S().Error("Failed to create log file:", err)
			return func(c *gin.Context) {}
		}
	}

	// 打开日志文件
	logFile, err := os.OpenFile(logFilePath, os.O_APPEND|os.O_WRONLY, os.ModeAppend)
	if err != nil {
		// 打开日志文件失败，记录错误并返回空的中间件处理函数
		zap.S().Error("Failed to open log file:", err)
		return func(c *gin.Context) {}
	}
	writeSyncer := zapcore.AddSync(logFile)
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	encoder := zapcore.NewJSONEncoder(encoderConfig)
	core := zapcore.NewCore(encoder, writeSyncer, zapcore.DebugLevel)

	logger := zap.New(core, zap.AddCaller())
	defer logger.Sync()

	return func(c *gin.Context) {
		c.Next()
		if length := len(c.Errors); length > 0 {
			e := c.Errors[length-1]
			err := e.Err
			if err != nil {
				// TODO 建立日志系统
				logger.Error("Request error",
                    zap.String("path", c.Request.URL.Path),
                    zap.String("method", c.Request.Method),
                    zap.Int("status", Err.StatusCode),
                    zap.Error(err)
                )
				return
			}
		}
	}
}
```
如此，我们便实现了全局错误的日志记录。

### 日志分级
现在所有记录都用了 error 级别。为了区分错误类型，我继续查看了 `c.Error()` 使用的错误结构，尝试把类型映射到不同日志级别。
我在看到c.Error()返回的是*gin.Error，也就是上面代码中的e，而它的定义是
```
type Error struct {
    Err  error
    Type ErrorType
    Meta any
}
```

所以我发现了这个错误定义其实是有错误类型的，所以我们只要根据这个类型设置并处理就可以实现我们的结果。
将
```
logger.Error("Request error",
    zap.String("path", c.Request.URL.Path),
    zap.String("method", c.Request.Method),
    zap.Int("status", Err.StatusCode),
    zap.Error(err)
)
```
变成

```
var logLevel zapcore.Level
switch e.Type {
	case gin.ErrorTypePublic:
		logLevel = zapcore.ErrorLevel
	case gin.ErrorTypeBind:
    	logLevel = zapcore.WarnLevel
	case gin.ErrorTypePrivate:
		logLevel = zapcore.DebugLevel
	default:
		logLevel = zapcore.InfoLevel
}
logger.Check(logLevel, "Error reported").Write(
	zap.String("path", c.Request.URL.Path),
	zap.String("method", c.Request.Method),
	zap.Error(err),
)
```
所以我们传来错误的时候也要进行处理一下,变成以下这样
```
c.Error(gin.Error{Err: err, Type: gin.ErrorTypeBind}) //c.Error()传输的Type默认是ErrorTypePrivate
```
然后，运行一下看看结果，发现失败了，什么原因呢，好像只把Err的副本传过去了，所以我们改成引用试试。
```
c.Error(&gin.Error{Err: err, Type: gin.ErrorTypeBind})
```
最后不出所料的成功了。

~~因为日志分级和日志自定义还没有什么具体的实现场景，先这样了。~~


### panic异常处理
有时候我们还会遇到比如数组越界，数据库异常时产生panic报错，但我们肯定不能直接让服务崩掉，所以也可以在这个中间件用recover()处理并用日志记录下来。
```
defer func() {
			if r := recover(); r != nil {
				// Handle panic and log the error
				stack := debug.Stack()
				logger.Error("Panic recovered",
					zap.String("path", c.Request.URL.Path),
					zap.String("method", c.Request.Method),
					zap.Any("panic", r),
					zap.ByteString("stacktrace", stack),
				)

				c.JSON(http.StatusInternalServerError, gin.H{
					"code":  http.StatusInternalServerError,
					"msg": apiException.ServerError.Msg,
				})
				c.Abort()
			}
		}()
```

综上，我们实现了一个Panic捕获和全局错误日志记录的中间件，完整代码如下
```
func ErrHandler() gin.HandlerFunc {
	logFilePath := "app.log"

	// 检查日志文件是否存在
	if _, err := os.Stat(logFilePath); os.IsNotExist(err) {
		// 如果日志文件不存在，则创建新的日志文件
		_, err := os.Create(logFilePath)
		if err != nil {
			// 创建日志文件失败，记录错误并返回空的中间件处理函数
			zap.S().Error("Failed to create log file:", err)
			return func(c *gin.Context) {}
		}
	}

	// 打开日志文件
	logFile, err := os.OpenFile(logFilePath, os.O_APPEND|os.O_WRONLY, os.ModeAppend)
	if err != nil {
		// 打开日志文件失败，记录错误并返回空的中间件处理函数
		zap.S().Error("Failed to open log file:", err)
		return func(c *gin.Context) {}
	}
	writeSyncer := zapcore.AddSync(logFile)
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	encoder := zapcore.NewJSONEncoder(encoderConfig)
	core := zapcore.NewCore(encoder, writeSyncer, zapcore.DebugLevel)

	logger := zap.New(core, zap.AddCaller())
	defer logger.Sync()

	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				// Handle panic and log the error
				stack := debug.Stack()
				logger.Error("Panic recovered",
					zap.String("path", c.Request.URL.Path),
					zap.String("method", c.Request.Method),
					zap.Any("panic", r),
					zap.ByteString("stacktrace", stack),
				)

				c.JSON(http.StatusInternalServerError, gin.H{
					"code":  http.StatusInternalServerError,
					"msg": apiException.ServerError.Msg,
				})
				c.Abort()
			}
		}()

		c.Next()
		if length := len(c.Errors); length > 0 {
			e := c.Errors[length-1]
			err := e.Err
			if err != nil {
				// TODO 建立日志系统
				var logLevel zapcore.Level
				switch e.Type {
				case gin.ErrorTypePublic:
					logLevel = zapcore.ErrorLevel
				case gin.ErrorTypeBind:
					logLevel = zapcore.WarnLevel
				case gin.ErrorTypePrivate:
					logLevel = zapcore.DebugLevel
				default:
					logLevel = zapcore.InfoLevel
				}
				logger.Check(logLevel, "Error reported").Write(
					zap.String("path", c.Request.URL.Path),
					zap.String("method", c.Request.Method),
					zap.Error(err),
				)
				return
			}
		}
	}
}
```

<!-- auto-internal-links -->
## 延伸阅读
- [文章归档](/archives/)
- [分类导航](/categories/)
- [标签导航](/tags/)
- [同分类更多内容](/categories/%E5%BC%80%E5%8F%91/)
