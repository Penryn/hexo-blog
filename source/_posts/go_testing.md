---
title: go测试（基于testing基本库）
date: 2024-05-02 12:38:15
keywords:
  - "golang"
  - "testing"
  - "测试"
  - "开发"
updated: 2024-05-02 12:38:15
description: "老登让我研究一下后端测试，看看MongoDB读写操作的性能，遂开始研究go的testing基本库 在testing的测试有这三种类型——单元测试，基准(性能)测试，示例测试 类型|格式|作用| 测试函数|函数名前缀为Test|测试程序..."
categories: 开发
tags:
  - golang
  - testing
  - 测试
---

老登让我研究一下后端测试，看看MongoDB读写操作的性能，遂开始研究go的testing基本库

在testing的测试有这三种类型——单元测试，基准(性能)测试，示例测试

|类型|格式|作用|
|----|----|----|
|测试函数|函数名前缀为Test|测试程序的一些逻辑行为是否正确|
|基准函数|函数名前缀为Benchmark|测试函数的性能|
|示例函数|函数名前缀为Example|为文档提供示例文档|

无论是上面哪一种，都是要依赖go test命令，所有以_test.go为后缀名的源代码文件都是go test测试的一部分，不会被go build编译到最终的可执行文件中。
### 测试用例
先以我这次写的测试为例
```
// mongodb.go
type Answer struct {
	QuestionID int    `json:"question_id"` //问题ID
	SerialNum  int    `json:"serial_num"`  //问题序号
	Subject    string `json:"subject"`     //问题
	Content    string `json:"content"`     //回答内容
}

type AnswerSheet struct {
	SurveyID int      `json:"survey_id"` //问卷ID
	Time     string   `json:"time"`      //回答时间
	Answers  []Answer `json:"answers"`   //回答
}

func SaveAnswerSheet(answerSheet AnswerSheet) error {
	_, err := database.MDB.InsertOne(context.Background(), answerSheet)
	if err != nil {
		log.Fatal(err)
	}
	return nil
}
```

### 测试函数
#### 基本信息
每个测试函数必须导入testing包，测试函数的基本格式（签名）如下：
```
//Name为对应的被测试函数
func TestName(t *testing.T){
    // ...
}
```
其中参数t用于报告测试失败和附加的日志信息。 testing.T的拥有的方法如下：
```
func (c *T) Error(args ...interface{})
func (c *T) Errorf(format string, args ...interface{})
func (c *T) Fail()
func (c *T) FailNow()
func (c *T) Failed() bool
func (c *T) Fatal(args ...interface{})
func (c *T) Fatalf(format string, args ...interface{})
func (c *T) Log(args ...interface{})
func (c *T) Logf(format string, args ...interface{})
func (c *T) Name() string
func (t *T) Parallel()
func (t *T) Run(name string, f func(t *T)) bool
func (c *T) Skip(args ...interface{})
func (c *T) SkipNow()
func (c *T) Skipf(format string, args ...interface{})
func (c *T) Skipped() bool
```
那么我们的测试函数则写在mongodb_test.go文件里
```
// TestSaveAnswerSheet 函数的单元测试（可支持多个测试用例）
func TestSaveAnswerSheet(t *testing.T) {
	tests := []struct {
		name        string
		answerSheet AnswerSheet
		expectError error
	}{
		{
			name: "有效答卷",
			answerSheet: AnswerSheet{
				SurveyID: 1,
				Time:     time.Now().Format("2006-01-02 15:04:05"),
				Answers: []Answer{
					{QuestionID: 1, SerialNum: 1, Subject: "subject", Content: "content"},
					{QuestionID: 2, SerialNum: 2, Subject: "subject", Content: "content"},
				},
			},
			expectError: nil,
		},
		//这里可以进行添加更多的测试用例
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 初始化 MongoDB
			database.MongodbInit()

			// 保存答卷
			err := SaveAnswerSheet(tt.answerSheet)

			if (err != nil) != (tt.expectError != nil) {
				t.Errorf("Test case %q failed, expected error: %v, got: %v", tt.name, tt.expectError, err)
			}
		})
	}
}
```
#### go test
这是go test的运行结果，比较简洁
```
PS C:\Users\Lenovo\Desktop\QA-System\app\services\mongodbService> go test
2024/05/02 13:27:51 Connected to MongoDB
PASS
ok      QA-System/app/services/mongodbService   0.613s
```
#### go test -v
所以我们可以试试加上-v的参数,查看测试函数名称和运行时间
```
PS C:\Users\Lenovo\Desktop\QA-System\app\services\mongodbService> go test -v
=== RUN   TestSaveAnswerSheet
2024/05/02 13:29:23 Connected to MongoDB
--- PASS: TestSaveAnswerSheet (0.27s)
PASS
ok      QA-System/app/services/mongodbService   0.547s
```
#### go test -run
我们还可以添加-run参数，它对应一个正则表达式，只有函数名匹配上的测试函数才会被go test命令执行，这里就不做展示了。

#### go test -cover
测试覆盖率是你的代码被测试套件覆盖的百分比。通常我们使用的都是语句的覆盖率，也就是在测试中至少被运行一次的代码占总代码的比例。

Go提供内置功能来检查你的代码覆盖率。我们可以使用go test -cover来查看测试覆盖率。例如(哎呀，这占比真低)：
```
PS C:\Users\Lenovo\Desktop\QA-System\app\services\mongodbService> go test -cover
2024/05/02 13:38:24 Connected to MongoDB
PASS
coverage: 9.4% of statements
ok      QA-System/app/services/mongodbService   0.639s
```

### 基准函数
基准测试就是在一定的工作负载之下检测程序性能的一种方法。基准测试的基本格式如下：
```
func BenchmarkName(b *testing.B){
    // ...
}
```
基准测试以Benchmark为前缀，需要一个*testing.B类型的参数b，基准测试必须要执行b.N次，这样的测试才有对照性，b.N的值是系统根据实际情况去调整的，从而保证测试的稳定性。 testing.B拥有的方法如下：
```
func (c *B) Error(args ...interface{})
func (c *B) Errorf(format string, args ...interface{})
func (c *B) Fail()
func (c *B) FailNow()
func (c *B) Failed() bool
func (c *B) Fatal(args ...interface{})
func (c *B) Fatalf(format string, args ...interface{})
func (c *B) Log(args ...interface{})
func (c *B) Logf(format string, args ...interface{})
func (c *B) Name() string
func (b *B) ReportAllocs()
func (b *B) ResetTimer()
func (b *B) Run(name string, f func(b *B)) bool
func (b *B) RunParallel(body func(*PB))
func (b *B) SetBytes(n int64)
func (b *B) SetParallelism(p int)
func (c *B) Skip(args ...interface{})
func (c *B) SkipNow()
func (c *B) Skipf(format string, args ...interface{})
func (c *B) Skipped() bool
func (b *B) StartTimer()
func (b *B) StopTimer()
```

我们样例的基准测试函数如下
```
func BenchmarkSaveAnswerSheet(b *testing.B) {
	// 初始化 MongoDB
	database.MongodbInit()

	for i := 0; i < b.N; i++ {
		// 创建 AnswerSheet 实例并保存
		answerSheet := AnswerSheet{
			SurveyID: 1,
			Time:     time.Now().Format("2006-01-02 15:04:05"),
			Answers: []Answer{
				{QuestionID: 1, SerialNum: 1, Subject: "subject", Content: "content"},
				{QuestionID: 2, SerialNum: 2, Subject: "subject", Content: "content"},
			},
		}
		if err := SaveAnswerSheet(answerSheet); err != nil {
			b.Errorf("SaveAnswerSheet() error = %v", err)
		}
	}
}
```
#### go test -bench=SaveAnswerSheet
基准测试并不会默认执行，需要增加-bench参数，所以我们通过执行go test -bench=SaveAnswerSheet命令执行基准测试，输出结果如下：
```
PS C:\Users\Lenovo\Desktop\QA-System\app\services\mongodbService> go test -bench=SaveAnswerSheet
2024/05/02 14:08:16 Connected to MongoDB
2024/05/02 14:08:16 Connected to MongoDB
2024/05/02 14:08:16 Connected to MongoDB
2024/05/02 14:08:17 Connected to MongoDB
goos: windows
goarch: amd64
pkg: QA-System/app/services/mongodbService
cpu: AMD Ryzen 7 4800H with Radeon Graphics
BenchmarkSaveAnswerSheet-16     2024/05/02 14:08:17 Connected to MongoDB
2024/05/02 14:08:17 Connected to MongoDB
2024/05/02 14:08:18 Connected to MongoDB
2024/05/02 14:08:19 Connected to MongoDB
      30          39870327 ns/op
PASS
ok      QA-System/app/services/mongodbService   4.328s
```
其中BenchmarkSaveAnswerSheet-16表示对SaveAnswerSheet函数进行基准测试，数字16表示GOMAXPROCS的值，这个对于并发基准测试很重要。30和39870327 ns/op表示每次调用Split函数耗时39870327ns，这个结果是30次调用的平均值。
#### go test -bench=SaveAnswerSheet -benchmem
我们还可以为基准测试添加-benchmem参数，来获得内存分配的统计数据。
```
PS C:\Users\Lenovo\Desktop\QA-System\app\services\mongodbService> go test -bench=SaveAnswerSheet -benchmem
2024/05/02 14:10:55 Connected to MongoDB
2024/05/02 14:10:55 Connected to MongoDB
2024/05/02 14:10:55 Connected to MongoDB
2024/05/02 14:10:55 Connected to MongoDB
goos: windows
goarch: amd64
pkg: QA-System/app/services/mongodbService
cpu: AMD Ryzen 7 4800H with Radeon Graphics
BenchmarkSaveAnswerSheet-16     2024/05/02 14:10:56 Connected to MongoDB
2024/05/02 14:10:56 Connected to MongoDB
2024/05/02 14:10:57 Connected to MongoDB
2024/05/02 14:10:58 Connected to MongoDB
      25          43956060 ns/op           10080 B/op        105 allocs/op
PASS
ok      QA-System/app/services/mongodbService   4.374s
```
其中，10080 B/op表示每次操作内存分配了10080字节，105 allocs/op则表示每次操作进行了105次内存分配。
我们可以根据这些测试结果进一步优化我们代码，通过性能测试，我们可以很直观的看见优化后的变化程度

#### 并行测试
func (b *B) RunParallel(body func(*PB))会以并行的方式执行给定的基准测试。

RunParallel会创建出多个goroutine，并将b.N分配给这些goroutine执行， 其中goroutine数量的默认值为GOMAXPROCS。用户如果想要增加非CPU受限（non-CPU-bound）基准测试的并行性， 那么可以在RunParallel之前调用SetParallelism 。RunParallel通常会与-cpu标志一同使用。
```
func BenchmarkSaveAnswerSheet(b *testing.B) {
	// 初始化 MongoDB
	database.MongodbInit()

	// 并行度设置为 10
	b.SetParallelism(100)

	// 并发测试
	b.RunParallel(func(pb *testing.PB) {
		// 每个并发测试独立地运行 b.N 次
		for pb.Next() {
			// 创建 AnswerSheet 实例并保存
			answerSheet := AnswerSheet{
				SurveyID: 1,
				Time:     time.Now().Format("2006-01-02 15:04:05"),
				Answers: []Answer{
					{QuestionID: 1, SerialNum: 1, Subject: "subject", Content: "content"},
					{QuestionID: 2, SerialNum: 2, Subject: "subject", Content: "content"},
				},
			}
			if err := SaveAnswerSheet(answerSheet); err != nil {
				b.Errorf("SaveAnswerSheet() error = %v", err)
			}
		}
	})
}
```
虽然设置了100，其实最大也就16，除此之外还可以通过在测试命令后添加-cpu参数如go test -bench=. -cpu 1来指定使用的CPU数量。

#### 其他
对于还有性能比较函数等等，这里就不多介绍了（主要我也没用到）

### 示例函数
被go test特殊对待的第三种函数就是示例函数，它们的函数名以Example为前缀。它们既没有参数也没有返回值。标准格式如下：
```
func ExampleName() {
    // ...
}
```
为你的代码编写示例代码有如下三个用处：

1. 示例函数能够作为文档直接使用，例如基于web的godoc中能把示例函数与对应的函数或包相关联。

2. 示例函数只要包含了// Output:也是可以通过go test运行的可执行测试。

3. 示例函数提供了可以直接运行的示例代码，可以直接在golang.org的godoc文档服务器上使用Go Playground运行示例代码。
```

func ExampleSaveAnswerSheet() {
	// 初始化 MongoDB
	database.MongodbInit()

	// 创建 AnswerSheet 实例并保存
	answerSheet := AnswerSheet{
		SurveyID: 1,
		Time:     time.Now().Format("2006-01-02 15:04:05"),
		Answers: []Answer{
			{QuestionID: 1, SerialNum: 1, Subject: "subject", Content: "content"},
			{QuestionID: 2, SerialNum: 2, Subject: "subject", Content: "content"},
		},
	}
	if err := SaveAnswerSheet(answerSheet); err != nil {
	}
}

```

testing库的基本用法大概就这样。

<!-- auto-internal-links -->
## 延伸阅读
- [文章归档](/archives/)
- [分类导航](/categories/)
- [标签导航](/tags/)
- [同分类更多内容](/categories/%E5%BC%80%E5%8F%91/)
