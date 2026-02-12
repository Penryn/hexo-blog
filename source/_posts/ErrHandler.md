---
title: 全局错误处理和日志的简单使用
date: 2024-05-15 15:48:34
updated: 2024-05-15 15:48:34
description: "因为，前端总是因为各种稀奇原因报服务错误，而gin本身的日志信息及其简洁，因此~~老登~~部长让我写一个日志系统，在写日志系统前，应该先了解一下全局错误处理，这样可方便我们对错误信息进行处理，以便形成一个日志。"
keywords:
  - "golang"
  - "中间件"
  - "日志"
  - "开发"
index_img: https://qiuniu.phlin.cn/bucket/hero.webp
categories: 开发
tags:
  - golang
  - 中间件
  - 日志
---


因为，前端总是因为各种稀奇原因报服务错误，而gin本身的日志信息及其简洁，因此~~老登~~部长让我写一个日志系统，在写日志系统前，应该先了解一下全局错误处理，这样可方便我们对错误信息进行处理，以便形成一个日志。

### 全局错误处理
在 golang 开发中我们经常会使用 gin 作为 web 框架，gin 一直以高性能和简单著称，但gin 的错误处理却不太尽人意。

#### 原因
首先，我们要明白一点，为什么要进行全局的错误管理，有以下几点原因。
1. 一致性：全局错误管理确保无论在应用的哪个部分发生错误，都能以一致的方式进行处理和响应，避免了不同部分使用不同的错误处理策略。
2. 可维护性：集中式的错误处理使得错误处理逻辑更加集中，便于维护和更新。
3. 简洁性：通过全局错误管理，可以避免错误处理逻辑在每个路由或服务中重复编写。
4. 容错性：全局错误管理有助于构建更加健壮的应用，即使在出现错误的情况下，应用也能继续运行而不是崩溃。
5. 日志记录：全局错误管理通常包括详细的错误日志记录，这对于分析错误原因和进行后续的优化非常重要。

#### 实操
在了解了上述这些原因后，我们可以开始上手。

~~众所周知~~，在Gin框架中，gin.HandlerFunc是一个类型别名，代表了一个处理HTTP请求的函数。这个函数接收一个*gin.Context作为参数，这个上下文对象包含了HTTP请求和响应的所有信息，以及处理请求所需的各种方法。

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
这样一来我们的HandlerFunc就变成一个有返回值的函数，那么有什么办法让gin的HandlerFunc支持我们定义的这个函数格式呢？这时候我们想到了在golang里面函数是一等公民，我们可以把函数作为参数或者返回值。我们试着把这个定义好HandlerFunc作为一个参数传进函数返回一个gin支持的HandlerFunc。下面我们来尝试一下。代码如下：

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

Zap 是 Uber 开源的高性能日志库，专为 Go 语言设计。以下是 Zap 的一些主要优点：
1. 高性能：Zap 通过避免使用 interface{} 带来的开销、减少内存分配和垃圾收集（GC）的压力，实现了高性能日志记录。
2. 零内存分配：Zap 在某些关键路径上实现了零内存分配技术，进一步提高了性能。
3. 结构化日志：Zap 支持记录结构化日志，可以直接将结构体、map、slice 等复杂类型作为日志字段，方便日志的后续处理和分析。
4. 多种日志级别：Zap 提供了多种日志级别，如 debug、info、warn、error 等，方便开发者根据不同情况记录不同级别的日志。
5. 灵活的配置：Zap 提供了灵活的配置选项，允许开发者自定义日志输出格式、输出目标等。
6. 内置的 Encoder：Zap 内置了 ConsoleEncoder 和 JSONEncoder 两种编码器，分别适用于人类阅读和机器处理的场景。
7. 对象池：Zap 使用 sync.Pool 来减少内存分配，通过对象复用来降低 GC 压力。
8. 并发安全：Zap 的设计考虑到了并发控制，通过写时复制机制等策略有效避免了竞态条件。
9. 社区支持：作为一个开源项目，Zap 拥有活跃的社区支持，保证了其持续的维护和更新。

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
但是，我们又遇到了一个问题，就是zap的功能强大有一点事它支持多种日志级别，而我们现在这个是只有error一种级别，所以我们要让这个中间件可以识别不同的错误类型然后进行不同级别的日志处理。
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
