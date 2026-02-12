---
title: eino学习小记(一)
date: 2025-03-19 21:11:28
keywords:
  - "golang"
  - "eino"
  - "cloudwego"
  - "开发"
updated: 2025-03-19 21:11:28
description: "最近因为服外可能要调用ai，因此去调研 Go 相关的 AI 框架。"
categories: 开发
tags:
  - golang
  - eino
  - cloudwego
---
最近因为服外可能要调用ai，因此去调研 Go 相关的 AI 框架。

考虑到字节的 CloudWeGo 是 Go 生态中较为活跃的社区，我也特意了解了它新推出的 [Eino 框架](https://www.cloudwego.io/zh/docs/eino/overview/)。

## 框架简介
**Eino[‘aino]** (近似音: i know，希望应用程序达到 “i know” 的愿景) 旨在提供基于 Golang 语言的终极大模型应用开发框架。 它从开源社区中的诸多优秀 LLM 应用开发框架，如 LangChain 和 LlamaIndex 等获取灵感，同时借鉴前沿研究成果与实际应用，提供了一个强调简洁性、可扩展性、可靠性与有效性，且更符合 Go 语言编程惯例的 LLM 应用开发框架。

Eino 提供的价值如下：

- 精心整理的一系列 **组件（component）** 抽象与实现，可轻松复用与组合，用于构建 LLM 应用。
- 强大的 **编排（orchestration）** 框架，为用户承担繁重的类型检查、流式处理、并发管理、切面注入、选项赋值等工作。
- 一套精心设计、注重简洁明了的 **API**。
- 以集成 **流程（flow）** 和 **示例（example）** 形式不断扩充的最佳实践集合。
- 一套实用 **工具（DevOps tools）**，涵盖从可视化开发与调试到在线追踪与评估的整个开发生命周期。

## 项目初体验
  废话不多说，先看看一些[基础概念](https://www.cloudwego.io/zh/docs/eino/quick_start/simple_llm_application/)然后就简单上手吧
下面以编写一个后端面试答疑的ai为例(~~因为蹭不到黑白的gpt了QAQ~)
```go
package main  
  
import (  
    "context"  
    "errors"
    "fmt"
	"github.com/joho/godotenv"
	"io"
	"log"
	"os"  
	"github.com/cloudwego/eino-ext/components/model/openai"    
	"github.com/cloudwego/eino/components/prompt"    
	"github.com/cloudwego/eino/schema"
	)  
// 模型基本信息
var (  
    ModelType   string  // 模型名称
    OwnerAPIKey string  // apiKey
    BaseURL     string  // 模型api地址
)  
  
var (  
// 系统信息背景
    SystemMessageTemplate = `作为{role}，你需要以{style}风格进行面试答疑，要求：  
1. 结合真实企业面试场景  
2. 准确识别候选人技术短板  
3. 解析核心考点及其深入考察方式  
4. 结合实际应用场景提供最佳回答策略  
5. 使用分层解析法：基础概念 → 核心原理 → 进阶考察 → 最佳解法`  
// 用户信息背景
    UserMessageTemplate = `后端技术面试答疑请求：  
【问题描述】{question}  //提问内容会被插到这里
【回答要求】请按以下结构回答：  
6. 核心考点解析  
7. 真实企业面试案例  
8. 面试官深入追问方向  
9. 最优回答策略与示例`  
)  
  
// 示例技术问答对  
var Examples = []*schema.Message{  
    schema.UserMessage(`Redis 缓存雪崩如何解决？`),  
    schema.AssistantMessage(  
       `1. 核心考点：缓存雪崩指大量缓存同时过期导致数据库压力骤增。  
5. 面试案例：某电商平台秒杀活动大量缓存过期，导致数据库 QPS 飙升。  
6. 深入追问：如何避免热点 key 失效？如何设计分布式缓存架构？  
7. 最优解法：  
   - 过期时间加随机值避免集中失效  
   - 使用双写模式确保数据一致性  
   - 结合 Hystrix 进行熔断降级`, nil),  
}  
  
type TechnicalAnalysisMaster struct {  
    model    *openai.ChatModel  
    template *prompt.DefaultChatTemplate  
    history  []*schema.Message  
}  

// 配置agent基本信息
func NewTechnicalMaster(ctx context.Context) (*TechnicalAnalysisMaster, error) { 
    config := &openai.ChatModelConfig{  
       Model:   ModelType,  
       APIKey:  OwnerAPIKey,  
       BaseURL: BaseURL,  
    }  
  
    model, err := openai.NewChatModel(ctx, config)  
    if err != nil {  
       return nil, fmt.Errorf("模型初始化失败: %w", err)  
    }  
  
    template := prompt.FromMessages(schema.FString,  
       schema.SystemMessage(SystemMessageTemplate),  
       schema.MessagesPlaceholder("examples", true),  
       schema.MessagesPlaceholder("chat_history", false),  
       schema.UserMessage(UserMessageTemplate),  
    )  
  
    return &TechnicalAnalysisMaster{  
       model:    model,  
       template: template,  
       history:  make([]*schema.Message, 0, 10),  
    }, nil  
}  

//调用大模型解析问题获取答案
func (t *TechnicalAnalysisMaster) Analyze(ctx context.Context, question string) (string, error) {  
    messages, err := t.template.Format(ctx, map[string]any{  
       "role":         "资深专业后端工程师",  
       "style":        "面试官视角的技术解析",  
       "question":     question,  
       "chat_history": t.history,  
       "examples":     Examples,  
    })  
    if err != nil {  
       return "", fmt.Errorf("提示工程构建失败: %w", err)  
    }  
	//流式输出
    stream, err := t.model.Stream(ctx, messages)  
    if err != nil {  
       return "", fmt.Errorf("推理请求失败: %w", err)  
    }  
    defer stream.Close()  
  
    var fullResponse string  
    for {  
       resp, err := stream.Recv()  
       if errors.Is(err, io.EOF) {  
          t.history = append(t.history, schema.AssistantMessage(fullResponse, nil))  
          return fullResponse, nil  
       }  
       if err != nil {  
          return "", fmt.Errorf("流式处理异常: %w", err)  
       }  
       fmt.Print(resp.Content)  
       fullResponse += resp.Content  
    }  
}  
  
func main() {  
	//读取环境变量
    err := godotenv.Load()  
    if err != nil {  
       log.Fatal("加载 .env 文件出错")  
    }  
    ModelType = os.Getenv("Model_Type")  
    OwnerAPIKey = os.Getenv("Owner_API_Key")  
    BaseURL = os.Getenv("Base_URL")  
    
    ctx := context.Background()  
    master, err := NewTechnicalMaster(ctx)  
    if err != nil {  
       fmt.Println("系统初始化失败:", err)  
       return  
    }  
  
    for {  
	    //读取问题
       fmt.Print("\n请输入技术命题（输入exit退出）: ")  
       var input string  
       if _, err := fmt.Scanln(&input); err != nil {  
          fmt.Println("输入读取错误:", err)  
          return  
       }  
       if input == "exit" {  
          break  
       }  
	  //问题解析
       response, err := master.Analyze(ctx, input)  
       if err != nil {  
          fmt.Println("\n分析失败:", err)  
          continue  
       }  
       _ = response // 响应已实时输出  
    }  
}
```

## 项目简单优化
但是感觉纯靠gpt可能会担心它~~胡说八道~~不贴近实际，因此，我们希望让它先进行联网搜索，获取一些参考资料后再进行讲解。

这里Eino官方也封装好了一些这样的工具给我们使用，比如[duckduckgo](https://www.cloudwego.io/zh/docs/eino/ecosystem_integration/tool/tool_duckduckgo_search/)和[googleSearch](https://www.cloudwego.io/zh/docs/eino/ecosystem_integration/tool/tool_googlesearch/)。

但是这两个文档中的示例代码我运行下来都会报错，但好在去飞书询问时给我回复得很快，态度也很不错，最后成功跑duckduckgo的代码。

最终大体思路是用duckduckgo工具去查询相关网页，再将拿起到的网页链接通过goquery去解析出对应的网页内容，再将内容放进参考资料给gpt读取解析。

```go
package main  
  
import (  
    "context"  
    "encoding/json"    
    "errors"    
    "fmt"    
    "github.com/PuerkitoBio/goquery"    
    "github.com/cloudwego/eino-ext/components/tool/duckduckgo"    
    "github.com/cloudwego/eino-ext/components/tool/duckduckgo/ddgsearch"    
    "github.com/joho/godotenv"    
    "io"    
    "log"    
    "net/http"    
    "os"    
    "strings"  
    "github.com/cloudwego/eino-ext/components/model/openai"    
    "github.com/cloudwego/eino/components/prompt"    
    "github.com/cloudwego/eino/schema")  
  
var (  
    ModelType   string  
    OwnerAPIKey string  
    BaseURL     string  
)  
  
var (  
    SystemMessageTemplate = `作为{role}，你需要以{style}风格进行面试答疑，要求：  
1. 结合真实企业面试场景  
2. 准确识别候选人技术短板  
3. 解析核心考点及其深入考察方式  
4. 结合实际应用场景提供最佳回答策略  
5. 使用分层解析法：基础概念 → 核心原理 → 进阶考察 → 最佳解法`  
  
    UserMessageTemplate = `后端技术面试答疑请求：  
【问题描述】{question}  // 你的问题  
【参考资料】{source}    // 联网搜集到的提供的相关资料链接  
【回答要求】请按以下结构回答：  
6. 核心考点解析  
7. 真实企业面试案例  
8. 面试官深入追问方向  
9. 最优回答策略与示例`  
)
  
// 示例技术问答对  
var Examples = []*schema.Message{  
    schema.UserMessage(`Redis 缓存雪崩如何解决？`),  
    schema.AssistantMessage(  
       `1. 核心考点：缓存雪崩指大量缓存同时过期导致数据库压力骤增。  
5. 面试案例：某电商平台秒杀活动大量缓存过期，导致数据库 QPS 飙升。  
6. 深入追问：如何避免热点 key 失效？如何设计分布式缓存架构？  
7. 最优解法：  
   - 过期时间加随机值避免集中失效  
   - 使用双写模式确保数据一致性  
   - 结合 Hystrix 进行熔断降级`, nil),  
}  
  
type TechnicalAnalysisMaster struct {  
    model    *openai.ChatModel  
    template *prompt.DefaultChatTemplate  
    history  []*schema.Message  
}  
  
func NewTechnicalMaster(ctx context.Context) (*TechnicalAnalysisMaster, error) {  
    config := &openai.ChatModelConfig{  
       Model:   ModelType,  
       APIKey:  OwnerAPIKey,  
       BaseURL: BaseURL,  
    }  
  
    model, err := openai.NewChatModel(ctx, config)  
    if err != nil {  
       return nil, fmt.Errorf("模型初始化失败: %w", err)  
    }  
  
    template := prompt.FromMessages(schema.FString,  
       schema.SystemMessage(SystemMessageTemplate),  
       schema.MessagesPlaceholder("examples", true),  
       schema.MessagesPlaceholder("chat_history", false),  
       schema.UserMessage(UserMessageTemplate),  
    )  
  
    return &TechnicalAnalysisMaster{  
       model:    model,  
       template: template,  
       history:  make([]*schema.Message, 0, 10),  
       
    }, nil  
}  
  
func (t *TechnicalAnalysisMaster) Analyze(ctx context.Context, question string, source []string) (string, error) {  
    messages, err := t.template.Format(ctx, map[string]any{  
       "role":         "资深专业后端工程师",  
       "style":        "面试官视角的技术解析",  
       "question":     question,  
       "source":       strings.Join(source, "+"),  
       "chat_history": t.history,  
       "examples":     Examples,  
    })  
    if err != nil {  
       return "", fmt.Errorf("提示工程构建失败: %w", err)  
    }  
  
    stream, err := t.model.Stream(ctx, messages)  
    if err != nil {  
       return "", fmt.Errorf("推理请求失败: %w", err)  
    }  
    defer stream.Close()  
  
    var fullResponse strings.Builder  
    for {  
       resp, err := stream.Recv()  
       if errors.Is(err, io.EOF) {  
          t.history = append(t.history, schema.AssistantMessage(fullResponse.String(), nil))  
          return fullResponse.String(), nil  
       }  
       if err != nil {  
          return "", fmt.Errorf("流式处理异常: %w", err)  
       }  
       fmt.Print(resp.Content)  
       fullResponse.WriteString(resp.Content)  
    }  
}  
  
func extractMainContent(url string) string {  
    resp, err := http.Get(url)  
    if err != nil {  
       log.Println("获取网页失败:", err)  
       return ""  
    }  
    defer resp.Body.Close()  
  
    doc, err := goquery.NewDocumentFromReader(resp.Body)  
    if err != nil {  
       log.Println("解析网页失败:", err)  
       return ""  
    }  
  
    // 优先查找 <article> 或 <main>，这些通常是文章正文  
    var contentBuilder strings.Builder  
    doc.Find("article, main").Each(func(i int, selection *goquery.Selection) {  
       selection.Find("p").Each(func(j int, p *goquery.Selection) {  
          text := strings.TrimSpace(p.Text())  
          if len(text) > 50 { // 过滤掉过短无意义内容  
             contentBuilder.WriteString(text + "\n")  
          }  
       })  
    })  
  
    // 如果未找到正文，则回退到查找所有 <p> 标签  
    if contentBuilder.Len() == 0 {  
       doc.Find("p").Each(func(i int, p *goquery.Selection) {  
          text := strings.TrimSpace(p.Text())  
          if len(text) > 50 {  
             contentBuilder.WriteString(text + "\n")  
          }  
       })  
    }  
  
    // 移除多余空行  
    mainContent := strings.TrimSpace(contentBuilder.String())  
    if mainContent == "" {  
       log.Println("未找到有效正文内容")  
    }  
    return mainContent  
}  
  
func main() {  
    err := godotenv.Load()  
    if err != nil {  
       log.Fatal("加载 .env 文件出错")  
    }  
  
    ModelType = os.Getenv("Model_Type")  
    OwnerAPIKey = os.Getenv("Owner_API_Key")  
    BaseURL = os.Getenv("Base_URL")  
  
    // 检查环境变量  
    if ModelType == "" || OwnerAPIKey == "" || BaseURL == "" {  
       log.Fatal("请确保 .env 配置了 Model_Type, Owner_API_Key, Base_URL")  
    }  
  
    ctx := context.Background()  
  
    master, err := NewTechnicalMaster(ctx)  
    if err != nil {  
       log.Fatal("系统初始化失败:", err)  
    }  
  
    for {  
       fmt.Print("\n请输入技术命题（输入 exit 退出）: ")  
       var input string  
       if _, err := fmt.Scanln(&input); err != nil {  
          log.Println("输入读取错误:", err)  
          continue  
       }  
       if input == "exit" {  
          break  
       }  
  
       // 创建 DuckDuckGo 搜索工具  
       config := &duckduckgo.Config{  
          MaxResults: 3,  
          Region:     ddgsearch.RegionCN,  
          DDGConfig: &ddgsearch.Config{  
             Cache:      true,  
             MaxRetries: 5,  
          },  
       }  
       searchTool, err := duckduckgo.NewTool(ctx, config)  
       if err != nil {  
          log.Println("搜索工具初始化失败:", err)  
          continue  
       }  
  
       searchReq := &duckduckgo.SearchRequest{  
          Query: input,  
          Page:  1,  
       }  
       jsonReq, err := json.Marshal(searchReq)  
       if err != nil {  
          log.Fatalf("搜索请求序列化失败: %v", err)  
       }  
  
       resp, err := searchTool.InvokableRun(ctx, string(jsonReq))  
       if err != nil {  
          log.Println("搜索失败:", err)  
          continue  
       }  
  
       var searchResp duckduckgo.SearchResponse  
       if err := json.Unmarshal([]byte(resp), &searchResp); err != nil {  
          log.Println("解析搜索结果失败:", err)  
          continue  
       }  
  
       sources := make([]string, 0, len(searchResp.Results))  
  
       for _, result := range searchResp.Results {  
          content := extractMainContent(result.Link)  
          if content != "" {  
             sources = append(sources, content)  
          }  
       }  
  
       response, err := master.Analyze(ctx, input, sources)  
       if err != nil {  
          log.Println("\n分析失败:", err)  
          continue  
       }  
       _ = response  
    }  
}
```
最终效果
```bash
~/Public/code/go/eino-llm
go run main.go

请输入技术问题（输入空行结束）:
请讲解一下redis的zset的应用

### 1. 核心考点解析
Redis 的 Zset（有序集合）是面试中的高频考点，主要考察以下几个方面：
- **数据结构理解**：Zset 是 Set 的升级版，元素唯一且有序，排序依据是 score（分数）。
- **底层实现**：Zset 的底层实现是跳跃表（skiplist）或压缩列表（ziplist），面试官可能会考察你对这两种数据结构的理。
- **常用命令**：如 `ZADD`、`ZRANGE`、`ZREVRANGE`、`ZSCORE`、`ZRANK` 等，考察你是否能熟练使用这些命令解决实际问题。
- **应用场景**：Zset 常用于排行榜、实时排序、优先级队列等场景，面试官会考察你如何在实际项目中应用 Zset。

### 2. 真实企业面试案例
**案例**：某电商平台需要实现一个实时商品热度排行榜，要求支持以下功能：
- 根据商品的点击量实时更新排行榜。
- 支持查询前 N 名的商品。
- 支持查询某个商品的排名和点击量。

**面试官提问**：
- 你会如何设计这个排行榜系统？
- 如何保证排行榜的实时性和性能？
- 如果商品点击量非常大，如何优化 Zset 的使用？

### 3. 面试官深入追问方向
- **底层实现**：跳跃表和压缩列表的区别是什么？Zset 在什么情况下会从压缩列表切换到跳跃表？
- **性能优化**：如果 Zset 的元素数量非常大（如百万级别），如何优化查询和更新性能？
- **扩展性**：如果排行榜需要支持多维度排序（如点击量、销量、评分），你会如何设计？
- **数据一致性**：在高并发场景下，如何保证 Zset 的数据一致性？

### 4. 最优回答策略与示例
**回答策略**：
- **分层解析**：从基础概念到核心原理，再到实际应用，逐步深入。
- **结合实际场景**：结合电商平台的案例，展示如何用 Zset 解决实际问题。
- **性能优化**：提到压缩列表和跳跃表的切换机制，以及如何通过分片、缓存等手段优化性能。

**示例回答**：
1. **设计排行榜系统**：
   - 使用 Redis 的 Zset 存储商品的热度数据，key 为 `product:hot:rank`，member 为商品 ID，score 为点击量。
   - 每次用户点击商品时，使用 `ZINCRBY` 命令更新商品的点击量。
   - 查询前 N 名商品时，使用 `ZREVRANGE` 命令获取排名靠前的商品 ID。

2. **保证实时性和性能**：
   - Zset 的底层实现是跳跃表，查询和更新的时间复杂度为 O(logN)，适合实时排行榜场景。
   - 如果商品数量非常大，可以通过分片（sharding）将数据分散到多个 Zset 中，减少单个 Zset 的压力。

3. **优化 Zset 使用**：
   - 使用压缩列表（ziplist）存储小规模的 Zset，减少内存占用。
   - 当 Zset 元素数量超过 `zset-max-ziplist-entries` 或元素长度超过 `zset-max-ziplist-value` 时，自动切换到跳跃表，保证性能。

4. **多维度排序**：
   - 如果需要支持多维度排序，可以将多个维度的分数拼接成一个复合分数，如 `score = 点击量 * 10000 + 销量`，然后使用 Zset 进行排序。

5. **高并发数据一致性**：
   - 使用 Redis 的事务（MULTI/EXEC）或 Lua 脚本保证操作的原子性。
   - 结合分布式锁（如 Redlock）防止并发更新导致的数据不一致。

通过以上回答，展示了你对 Zset 的深入理解、实际应用能力以及性能优化思路，能够很好地应对面试官的考察。
```
代码也可自行到[仓库](https://github.com/Penryn/eino-llm)自取

以上代码仅展示了ai的聊天交互功能，工具调用等笔者后续再更新。



## 参考资料
[Eino用户手册](https://www.cloudwego.io/zh/docs/eino/)(~~可能文档还是有点旧，代码会有些问题~~)

<!-- auto-internal-links -->
## 延伸阅读
- [文章归档](/archives/)
- [分类导航](/categories/)
- [标签导航](/tags/)
- [同分类更多内容](/categories/%E5%BC%80%E5%8F%91/)
