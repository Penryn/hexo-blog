---
title: Go 1.14 到 Go 1.26：版本特性归纳与学习笔记
date: 2026-2-12 22:35:00
keywords:
  - "golang"
  - "开发"
updated: 2026-8-21 18:00:00
description: "从语言、标准库、工具链和运行时四条主线，回顾 Go 1.14 到 Go 1.26 的变化，并按版本整理重点，方便日后查阅和复习。"
categories: 开发
tags:
  - golang
---

这份笔记整理 Go 1.14 到 Go 1.26 中影响日常开发的变化。按版本查引入时间时，可以先看下面的表；需要理解某个特性，再往下看对应说明和示例。

阅读时可以区分四类变化：语言语义、标准库 API、构建工具和运行时行为。前两类通常影响代码写法，后两类还可能影响依赖管理、构建结果和部署后的资源使用。

## 按版本快速查找

这一节适合“我记得某个版本加过一个东西，但忘了是哪一版”的时候回来查。

| 版本 | 发布时间 | 主要变化 |
|---|---|---|
| Go 1.14 | 2020-02-25 | 模块可用于生产、异步抢占、`defer` 优化 |
| Go 1.15 | 2020-08-11 | 新链接器、`time/tzdata`、X.509 SAN |
| Go 1.16 | 2021-02-16 | 模块默认开启、`embed`、`io/fs` |
| Go 1.17 | 2021-08-16 | 寄存器 ABI、`//go:build`、模块图裁剪 |
| Go 1.18 | 2022-03-15 | 泛型、Fuzzing、Workspace |
| Go 1.19 | 2022-08-02 | 内存模型、类型化原子变量、`GOMEMLIMIT` |
| Go 1.20 | 2023-02-01 | PGO 预览、`errors.Join`、取消原因 |
| Go 1.21 | 2023-08-08 | toolchain、`slog`、`slices/maps/cmp` |
| Go 1.22 | 2024-02-06 | 循环变量新语义、`range` 整数、新 ServeMux |
| Go 1.23 | 2024-08-13 | `range over func`、`iter`、`unique` |
| Go 1.24 | 2025-02-11 | 泛型类型别名、`go.mod tool`、Swiss Table |
| Go 1.25 | 2025-08-12 | 容器感知、Flight Recorder、`WaitGroup.Go` |
| Go 1.26 | 2026-02-10 | `new(expr)`、modernizers、Green Tea GC |

下面是每个版本稍微展开一点的说明。这里只挑能代表版本方向的变化，不追求完整。

### Go 1.14：异步抢占与模块支持

**关键词：异步抢占、低开销 `defer`、模块可用于生产。**

Go 1.14 引入异步抢占。以前，一个没有函数调用的长循环可能长时间占着线程；有了异步抢占，运行时能更及时地让出执行权，调度和 GC 延迟都更稳定。

编译器还对常见的 `defer` 做了优化。`defer` 一直很好用，但早期存在明显开销；从这一版开始，它更接近普通函数调用的成本。

模块功能也在这一版被官方认为可以用于生产。今天看起来只是一个普通节点，但当时意味着 Go 工程终于可以更坚定地离开 GOPATH。

语言本身只做了一个小调整：接口可以嵌入方法集有重叠的接口，只要同名方法的签名完全一致。这让接口组合更符合直觉。


### Go 1.15：链接器、时区与证书校验

**关键词：链接器重构、`time/tzdata`、Common Name 弃用。**

Go 1.15 重构了链接器，减少了链接时间和内存占用。对日常编码没有语法层影响，但大型项目和 CI 会直接感受到构建更轻快。

标准库加入 `time/tzdata`。只要空白导入它，时区数据库就能随二进制一起发布，不必依赖宿主系统是否安装了完整的 zoneinfo。

X.509 主机名校验开始明确转向 SAN，不再把证书的 Common Name 当作可靠的主机名来源。这是安全规范逐渐收紧的一部分。


### Go 1.16：模块默认开启与资源嵌入

**关键词：模块默认开启、`embed`、`io/fs`、`go install pkg@version`。**

从 Go 1.16 开始，模块模式默认开启。无论当前目录是否存在 `go.mod`，`GO111MODULE` 的默认值都变成了 `on`。

安装命令行工具也有了清晰的写法：

```bash
go install golang.org/x/tools/cmd/stringer@v0.30.0
```

它不会把工具依赖写进当前项目的 `go.mod`。从这里开始，`go get` 更专注于依赖，`go install` 更专注于安装可执行程序。

这一版还加入了 `//go:embed` 和 `io/fs`。前者能把模板、前端资源或配置文件编进二进制；后者用统一接口描述文件系统，让真实目录、内嵌文件和测试文件系统可以用同一种方式访问。


### Go 1.17：寄存器 ABI 与构建约束

**关键词：寄存器 ABI、`//go:build`、模块图裁剪。**

Go 1.17 在 amd64 上启用了基于寄存器的调用约定。函数参数和返回值不再主要依赖栈传递，常见调用路径因此更快，生成的二进制也可能更小。

构建标签有了更容易读懂的 `//go:build` 语法，用布尔表达式代替难懂的旧式 `// +build` 组合规则。

模块图裁剪和延迟加载减少了需要读取的依赖信息。项目依赖很多时，`go` 命令不必每次把整张依赖图都完整展开。

语言还允许把切片转换为数组指针，例如 `(*[4]byte)(buf)`。配合 `unsafe.Add` 和 `unsafe.Slice`，底层编程所需的能力更加完整。


### Go 1.18：泛型、Fuzzing 与 Workspace

**关键词：泛型、Fuzzing、Workspace。**

Go 1.18 是这段历史里最容易记住的一版，因为它正式加入了类型参数、约束和类型推断，也新增了 `any`、`comparable` 等预声明标识符。

泛型解决的不是“让业务代码看起来更高级”，而是让容器、算法和通用工具函数可以保留类型信息，不必在重复代码与 `interface{}` 之间二选一。

```go
func Sum[T ~int | ~int64 | ~float64](values []T) T {
	var total T
	for _, value := range values {
		total += value
	}
	return total
}
```

`~int` 表示底层类型为 `int` 的类型也满足约束，因此自定义的 `type Score int` 同样能使用这个函数。

Fuzzing 也被并入 `go test`。测试不再只能验证手写样例，还可以让工具持续生成输入，寻找崩溃、越界和不满足性质的边界情况。

`go.work` 则解决了本地同时开发多个模块的问题。它把多个模块临时组织在一个 Workspace 中，又不必修改各自的 `go.mod`。


### Go 1.19：类型化原子变量与软内存上限

**关键词：内存模型、类型化原子变量、`GOMEMLIMIT`。**

Go 1.19 更新了内存模型，明确了更多并发行为，并在 `sync/atomic` 中加入 `Bool`、`Int64`、`Pointer[T]` 等类型化原子变量。

过去使用原子操作时，状态和操作函数是分开的。类型化 API 把它们放在一起，减少了传错地址、混用类型和手写封装的机会。

这一版更值得记住的是软内存上限。`GOMEMLIMIT` 和 `runtime/debug.SetMemoryLimit` 让运行时知道进程希望控制在多大的内存范围内。

它不是简单限制 Go 堆，而是让 GC 在内存压力变大时主动调整工作频率。对容器中的服务而言，这比只依赖 `GOGC` 更贴近真实资源边界。

`GOGC` 关注“堆增长多少后回收”，`GOMEMLIMIT` 关注“运行时管理的内存最好别超过多少”。两者解决的是不同层次的问题。

### Go 1.20：PGO 预览与错误处理

**关键词：PGO 预览、`errors.Join`、Context 取消原因。**

Go 1.20 首次提供 PGO 预览。编译器可以读取程序的 CPU Profile，识别真实负载中的热点，再据此做更积极的内联和优化。

优化效果取决于 Profile 是否能代表实际负载。

`errors.Join` 让一个错误可以包装多个错误，`errors.Is` 和 `errors.As` 也能沿着整棵错误树查找。

```go
err := errors.Join(
	closeDatabase(),
	closeMessageQueue(),
	flushLogs(),
)
```

这种写法适合表达“几件相互独立的事情都失败了”，例如并行任务收尾或批量校验。

`context.WithCancelCause` 则让取消操作携带原因。调用方不仅知道 Context 已经结束，还能用 `context.Cause` 知道是谁、因为什么取消了它。


### Go 1.21：工具链管理与通用标准库

**关键词：toolchain、`slog`、`slices`、`maps`、`cmp`、PGO。**

Go 1.21 将 `go.mod` 中的 `go` 版本解释为严格的最低要求，并加入 `toolchain` 指令。`go` 命令可以发现或按需下载合适的工具链版本。

这意味着 Go 的版本不再只依赖机器上手工安装的那一份工具链，项目本身也能表达需要什么语言版本和建议使用什么工具链。

标准库加入结构化日志 `log/slog`，可以携带键值字段，并交给 JSON 等不同 Handler 输出。

```go
slog.Info("request completed",
	"method", "GET",
	"status", 200,
	"duration", 37*time.Millisecond,
)
```

由泛型支撑的 `slices`、`maps`、`cmp` 同时进入标准库，`min`、`max`、`clear` 成为内建函数。许多过去要自己写或从辅助库引入的操作，终于有了官方版本。

PGO 也从 1.20 的预览走向常规使用。主包目录存在 `default.pgo` 时，构建命令会自动使用它。


### Go 1.22：循环变量语义与路由匹配

**关键词：循环变量每轮新建、`range` 整数、增强的 ServeMux。**

以前，`for` 循环声明的变量会在各轮之间复用。闭包保存的是同一个变量，因此很容易得到意料之外的结果。

从 Go 1.22 开始，每轮迭代都会创建新的循环变量。下面这种代码终于和大多数人的第一直觉一致：

```go
for _, name := range []string{"Alice", "Bob", "Carol"} {
	go func() {
		fmt.Println(name)
	}()
}
```

这一版还支持对整数使用 `range`：

```go
for i := range 5 {
	fmt.Println(i) // 0、1、2、3、4
}
```

`net/http.ServeMux` 增加了按请求方法匹配、路径通配符和参数提取。小型服务只用标准库，也能写出更清晰的路由。

`math/rand/v2` 则展示了标准库演进的另一种方式：当旧 API 受兼容承诺限制时，用带版本号的新包重新设计。


### Go 1.23：函数迭代器与 iter

**关键词：`range over func`、`iter`、`unique`、Telemetry。**

Go 1.23 允许 `for range` 遍历特定签名的函数。集合不必先构造完整切片，也能用熟悉的循环语法逐个产生值。

```go
func Backward[E any](values []E) iter.Seq[E] {
	return func(yield func(E) bool) {
		for i := len(values) - 1; i >= 0; i-- {
			if !yield(values[i]) {
				return
			}
		}
	}
}

for value := range Backward([]string{"a", "b", "c"}) {
	fmt.Println(value)
}
```

关键不是“函数式编程进入 Go”，而是生产者和消费者之间有了统一协议。生产者负责调用 `yield`，消费者仍然使用普通 `for range`，并可以随时 `break`。

标准库新增 `iter` 定义迭代器类型，`slices` 和 `maps` 也增加与迭代器配合的函数。`unique` 可以对可比较值进行驻留，减少大量重复值占用的内存。

Go Telemetry 同样在这一版出现。默认只在本地记录计数，用户主动开启后才会上传匿名汇总数据，帮助 Go 团队理解工具链的真实使用情况。

泛型解决“一个算法如何适配多种类型”，迭代器解决“数据如何逐个交给算法”。到 1.23，这两块终于接上了。

### Go 1.24：泛型别名、工具依赖与 map 实现

**关键词：泛型类型别名、`go.mod tool`、Swiss Table、`os.Root`。**

Go 1.24 正式支持泛型类型别名。别名本身也可以带类型参数，在重构泛型 API 或跨包移动类型时更有用。

```go
type Set[T comparable] = map[T]struct{}
```

`go.mod` 新增 `tool` 指令，可以直接记录代码生成器、Lint 工具等可执行依赖。此前常见的 `tools.go` 空白导入技巧，终于有了正式替代方案。

运行时把内建 `map` 改为基于 Swiss Table 的实现，并改进小对象分配和内部锁。现有 API 保持不变，实际性能收益仍取决于负载。

标准库加入 `os.Root`。它把文件操作限制在指定目录树中，为处理不可信路径提供了更明确的安全边界。

这一版还加入后量子密钥封装相关的 `crypto/mlkem`。密码学标准库开始为未来的协议迁移准备基础能力。


### Go 1.25：容器资源与运行轨迹

**关键词：容器感知 `GOMAXPROCS`、Green Tea GC 实验、Flight Recorder、`WaitGroup.Go`。**

过去，`GOMAXPROCS` 默认取机器可见的逻辑 CPU 数量。在容器中，进程可能看见很多 CPU，实际却只分到很小的 CPU quota，两者并不一致。

Go 1.25 在 Linux 上会考虑 cgroup CPU 限额，并在限额变化时周期性更新默认值。部署时需要区分运行时默认值与显式配置的 `GOMAXPROCS`。

这一版还提供实验性的 Green Tea GC。它通过改善局部性和多核扩展能力，降低大量小对象场景中的标记与扫描成本。

`runtime/trace.FlightRecorder` 使用内存环形缓冲区持续保留最近一段运行轨迹。遇到偶发延迟或异常时，可以把事发前后的 trace 保存下来，而不必长期写入庞大的完整追踪。

`sync.WaitGroup.Go` 把 `Add`、启动 goroutine 和 `Done` 组合成一个方法：

```go
var group sync.WaitGroup

for _, job := range jobs {
	group.Go(func() {
		process(job)
	})
}

group.Wait()
```

`encoding/json/v2` 也作为实验出现，尝试重新设计长期受兼容性限制的 JSON 行为和 API。


### Go 1.26：new 表达式、go fix 与 Green Tea GC

**关键词：`new(expr)`、泛型约束自引用、modernizers、Green Tea GC。**

Go 1.26 允许把表达式直接传给 `new`，得到一个带初始值的指针：

```go
type User struct {
	Name *string `json:"name,omitempty"`
}

user := User{Name: new("Alice")}
```

以前通常要先声明临时变量，或自己写一个 `ptr` 辅助函数。这个小语法尤其适合 JSON、Protobuf 等用指针表达“字段是否存在”的结构。

泛型类型也可以在自身的类型参数约束中引用自己。这让某些递归式约束更容易表达，同时简化了语言规范中的限制。

`go fix` 在这一版被重写，成为 modernizers 的入口。它不只是修复远古版本语法，而是能把代码更新为新的语言习惯和标准库 API。

1.25 中实验性的 Green Tea GC 在 1.26 默认启用。它重点优化小对象的标记与扫描，并改善 CPU 局部性和多核扩展能力。

标准库还加入泛型函数 `errors.AsType`，以类型安全的方式替代常见的 `errors.As` 指针样板；`crypto/hpke` 则提供了 HPKE 的标准实现。


## 再按四条主线串一次

按版本看适合查资料，按主题看更容易形成长期记忆。下面把前面的内容重新压缩成四条线。

### 语言：从克制到有限但实用的抽象

Go 1.14 到 1.17 的语言变化很少，主要补齐接口组合、切片与数组转换、`unsafe` 等已有能力。

真正的转折点是 1.18 泛型。它给了 Go 一种新的代码复用方式，但没有加入类继承、高阶类型等更复杂的抽象体系。

之后的变化都在消化泛型带来的可能性：1.21 用泛型建设标准库，1.23 加入迭代器，1.24 完成泛型类型别名，1.26 又增强约束表达。

另一条支线是让常见写法更符合直觉：1.22 修正循环变量语义并允许 `range` 整数，1.26 允许 `new(expr)`。

可以把语言主线记成：

```text
接口与底层语义补齐
        ↓
     泛型落地
        ↓
泛型标准库与迭代器
        ↓
类型别名、约束和小语法继续完善
```

### 标准库：官方开始给出“现代写法”

早期的变化更像补充基础设施，例如 1.15 的 `time/tzdata`，1.16 的 `embed` 和 `io/fs`。

1.19 之后，标准库开始系统性替代常见的手写辅助代码：类型化原子变量、`errors.Join`、Context 取消原因、`slog`、`slices`、`maps`、`cmp` 相继出现。

1.23 的 `iter` 把迭代协议标准化，1.24 的 `os.Root` 给文件访问增加安全边界，1.25 的 `WaitGroup.Go` 则消除一段到处重复的并发样板。

这条线背后的方向很明确：Go 不急着增加大量语法，而是优先把被反复验证的工程模式沉淀进标准库。

### 工具链：从构建项目到理解项目

1.14 到 1.17 解决的是“如何稳定管理和构建模块”：模块可用于生产、默认开启、模块图裁剪、构建标签统一。

1.18 的 Workspace 让多个模块可以在本地协同开发，Fuzzing 则把自动生成测试输入纳入 `go test`。

1.20 和 1.21 的 PGO 让工具链开始利用程序的真实运行数据。1.21 的 toolchain 管理又让项目能够表达所需的 Go 版本。

1.24 用 `go.mod tool` 管理工具依赖，1.26 用 modernizers 自动更新代码风格和 API。这些工具分别处理构建、版本选择和代码迁移，使用时需要看清各自的适用范围。

可以把它记成：

```text
模块化 → 多模块协作 → 运行数据反馈 → 工具链版本管理 → 自动现代化
```

### 运行时：越来越懂生产环境

1.14 的异步抢占解决调度问题，1.17 的寄存器 ABI 优化函数调用，二者都是不改业务代码就能获得的底层收益。

1.19 的 `GOMEMLIMIT` 是另一处转折。运行时不再只按堆增长比例触发 GC，也开始理解应用希望遵守的整体内存预算。

1.24 更换 map 实现，1.25 感知容器 CPU 限额，1.26 默认启用 Green Tea GC。这些变化共同指向一个目标：让默认运行时更接近现代服务的真实环境。

部署验证时，可以分别观察调度延迟、资源边界和 GC 开销，而不是只凭版本号预期性能。

## 查完特性以后，还要看适用条件

确认特性在哪个版本引入，只是第一步。准备使用时，还需要检查项目的 `go` 版本声明、相关实验是否启用、目标平台，以及依赖库是否支持。

语言语义变化要对照测试和静态检查；运行时与编译器的性能变化，则需要拿项目自己的工作负载验证。完整变更和兼容条件都在下面的官方资料中。

## 官方资料

- [Go Release History](https://go.dev/doc/devel/release)
- [Go 1.14 Release Notes](https://go.dev/doc/go1.14)
- [Go 1.15 Release Notes](https://go.dev/doc/go1.15)
- [Go 1.16 Release Notes](https://go.dev/doc/go1.16)
- [Go 1.17 Release Notes](https://go.dev/doc/go1.17)
- [Go 1.18 Release Notes](https://go.dev/doc/go1.18)
- [Go 1.19 Release Notes](https://go.dev/doc/go1.19)
- [Go 1.20 Release Notes](https://go.dev/doc/go1.20)
- [Go 1.21 Release Notes](https://go.dev/doc/go1.21)
- [Go 1.22 Release Notes](https://go.dev/doc/go1.22)
- [Go 1.23 Release Notes](https://go.dev/doc/go1.23)
- [Go 1.24 Release Notes](https://go.dev/doc/go1.24)
- [Go 1.25 Release Notes](https://go.dev/doc/go1.25)
- [Go 1.26 Release Notes](https://go.dev/doc/go1.26)
- [Go Toolchains](https://go.dev/doc/toolchain)
- [PGO](https://go.dev/doc/pgo)
- [GC Guide](https://go.dev/doc/gc-guide)

<!-- auto-internal-links -->
## 延伸阅读

- [文章归档](/archives/)
- [分类导航](/categories/)
- [标签导航](/tags/)
- [同分类更多内容](/categories/%E5%BC%80%E5%8F%91/)
