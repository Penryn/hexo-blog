---
title: 一次mysql差点爆了的事故
date: 2024-12-11 19:25:13
keywords:
  - "mysql"
  - "事故"
updated: 2024-12-11 19:25:13
description: "今天中午，离谱告诉我投票问卷的的获取投票数据接口基本显示超时(10s)，然后我看到后自己用apifox测了一下，有7s、11s甚至14s(复盘发现最高甚至有2min)，于是先去看了一下有多少数据量，发现有八百多条，当时是觉得应该是循环..."
categories: 事故
tags:
  - mysql
---

  
今天中午，离谱告诉我投票问卷的的获取投票数据接口基本显示超时(10s)，然后我看到后自己用apifox测了一下，有7s、11s甚至14s(复盘发现最高甚至有2min)，于是先去看了一下有多少数据量，发现有八百多条，当时是觉得应该是循环太多了，没处理好，而且也因为潜意识觉得只是超时，可能问题不大，多试几次是可以拿到数据的，所以当时认为还不是很急。

![一次mysql差点爆了的事故配图](https://qiuniu.phlin.cn/bucket/20241211193735907.png)

![一次mysql差点爆了的事故配图](https://qiuniu.phlin.cn/bucket/20241211223246098.png)
没几分钟，青鸟在群里@我说，服务器mysql要爆了(mysql的cpu的占用会时不时蹦上>100%，据说甚至有190%)，随时处于被kill的状态，因此情况就紧急起来，因为那个数据库关系精弘全部服务，一旦kill了，所有服务都会停止。。。

![一次mysql差点爆了的事故配图](https://qiuniu.phlin.cn/bucket/20241211193943106.jpg)

![一次mysql差点爆了的事故配图](https://qiuniu.phlin.cn/bucket/20241211194015465.jpg)

因为mysql的cpu占用变化很大，怀疑是某个接口的sql写的有问题，而且当时是投票问卷的发布时间，可以把排查接口限制为`获取问卷`、`提交答卷`、`统一验证`和`获取投票数据`。

综上,最后确认是`获取投票数据`的问题，应该是循环太多反复向数据库读取数据的问题。
这块码是基本 ~~CV~~复用之前用管理端获取选项数据的接口，所以较为陌生，重新查阅了一下代码。
```
func GetSurveyStatistics(c *gin.Context) {
// 避免产生水字数的嫌疑，省略一些无关代码

	questionMap := make(map[int]models.Question)
	for _, question := range questions {
		questionMap[question.ID] = question
	}

	optionCounts := make(map[int]map[int]int)
	for _, sheet := range answersheets {
		for _, answer := range sheet.Answers {
			options, err := service.GetOptionsByQuestionID(answer.QuestionID)
			if err != nil {
				c.Error(&gin.Error{Err: errors.New("获取选项信息失败原因: " + err.Error()), Type: gin.ErrorTypeAny})
				utils.JsonErrorResponse(c, code.ServerError)
				return
			}
			question := questionMap[answer.QuestionID]
			if err != nil {
				c.Error(&gin.Error{Err: errors.New("获取选项信息失败原因: " + err.Error()), Type: gin.ErrorTypeAny})
				utils.JsonErrorResponse(c, code.ServerError)
				return
			}
			if question.QuestionType == 1 || question.QuestionType == 2 {
				answerOptions := strings.Split(answer.Content, "┋")
				for _, answerOption := range answerOptions {
					option, err := service.GetOptionByQIDAndAnswer(answer.QuestionID, answerOption)
					if err == gorm.ErrRecordNotFound {
						// 则说明是其他选项，计为其他
						if optionCounts[question.ID] == nil {
							optionCounts[question.ID] = make(map[int]int)
						}
						optionCounts[question.ID][0]++
						continue
					} else if err != nil {
						c.Error(&gin.Error{Err: errors.New("获取选项信息失败原因: " + err.Error()), Type: gin.ErrorTypeAny})
						utils.JsonErrorResponse(c, code.ServerError)
						return
					}
					if optionCounts[question.ID] == nil {
						optionCounts[question.ID] = make(map[int]int)
					}
					optionCounts[question.ID][option.SerialNum]++
				}
			}
			for _, option := range options {
				if optionCounts[question.ID] == nil {
					optionCounts[question.ID] = make(map[int]int)
				}
				if _, exists := optionCounts[question.ID][option.SerialNum]; !exists {
					optionCounts[question.ID][option.SerialNum] = 0
				}
			}

		}
	}

}
```
再较为仔细地审阅了当时写的代码，首先发现循环多次向数据库获取相同的数据（假设答卷有800份数据，一个问卷一道多选题19个选项，一个请求起码向数据库打了800✖️19=15200个请求），所以一开始就打算先把几个重复拿取的数据缓存进redis中（`GetOptionsByQuestionID`和`GetOptionByQIDAndAnswer`），再把这个新的包上了生产环境后，mysql的cpu终于下来了(最高也就20%)，同时请求响应时间从14秒优化到了1秒内(虽然14秒本身就是不正常的数据)。

后面，肉会表示可以先把数据先存进map，甚至可以不需要用redis，这次明显是我考虑不周的问题（QAQ）。修改后的代码如下

```
func GetSurveyStatistics(c *gin.Context) {  
	// 避免产生水字数的嫌疑，省略一些无关代码
  
    questionMap := make(map[int]models.Question)  
    optionsMap := make(map[int][]models.Option)  
    optionAnswerMap := make(map[int]map[string]models.Option)  
    optionSerialNumMap := make(map[int]map[int]models.Option)  
    for _, question := range questions {  
       questionMap[question.ID] = question  
       optionAnswerMap[question.ID] = make(map[string]models.Option)  
       optionSerialNumMap[question.ID] = make(map[int]models.Option)  
       options, err := service.GetOptionsByQuestionID(question.ID)  
       if err != nil {  
          c.Error(&gin.Error{Err: errors.New("获取选项信息失败原因: " + err.Error()), Type: gin.ErrorTypeAny})  
          utils.JsonErrorResponse(c, code.ServerError)  
          return  
       }  
       optionsMap[question.ID] = options  
       for _, option := range options {  
          optionAnswerMap[question.ID][option.Content] = option  
          optionSerialNumMap[question.ID][option.SerialNum] = option  
       }  
    }  
  
    optionCounts := make(map[int]map[int]int)  
    for _, sheet := range answersheets {  
       for _, answer := range sheet.Answers {  
          options := optionsMap[answer.QuestionID]  
          question := questionMap[answer.QuestionID]  
          // 初始化选项统计（确保每个选项的计数存在且为 0）  
          if _, initialized := optionCounts[question.ID]; !initialized {  
             counts := ensureMap(optionCounts, question.ID)  
             for _, option := range options {  
                counts[option.SerialNum] = 0  
             }  
          }  
          if question.QuestionType == 1 || question.QuestionType == 2 {  
             answerOptions := strings.Split(answer.Content, "┋")  
             questionOptions := optionAnswerMap[answer.QuestionID]  
             for _, answerOption := range answerOptions {  
                // 查找选项  
                if questionOptions != nil {  
                   option, exists := questionOptions[answerOption]  
                   if exists {  
                      // 如果找到选项，处理逻辑  
                      ensureMap(optionCounts, answer.QuestionID)[option.SerialNum]++  
                      continue  
                   }  
                }  
                // 如果选项不存在，处理为 "其他" 选项  
                ensureMap(optionCounts, answer.QuestionID)[0]++  
             }  
          }  
       }  
    }  
  
}  
  
func ensureMap(m map[int]map[int]int, key int) map[int]int {  
    if m[key] == nil {  
       m[key] = make(map[int]int)  
    }  
    return m[key]  
}
```

反思一下，这个问题虽说是cv之前代码，但确实造成了比较严重的生产事故，我应该在拿来使用的时候重新审查一遍代码，在问题发现前排查出来(也可能当时觉得这块写的很抽象，不想再细看，觉得~~能用就行~~)，反正今后写码以此为鉴，避免再出现这种情况。

<!-- auto-internal-links -->
## 延伸阅读
- [文章归档](/archives/)
- [分类导航](/categories/)
- [标签导航](/tags/)
- [同分类更多内容](/categories/%E4%BA%8B%E6%95%85/)
