---
title: 计网——概述
date: 2024-09-20 17:46:00
categories: 学习笔记
tags:
  - 计网
---

给以后计网复习用，先写点知识点

## 因特网服务提供者ISP（Internet Service Provider)
是指提供互联网接入和相关服务的公司或机构。ISP 连接用户的设备（如电脑、手机、路由器等）到互联网，允许他们访问网站、电子邮件、流媒体和其他在线服务。
### ISP 的分类：
1. **本地 ISP**：
    - 提供互联网服务给特定地理区域的用户，通常规模较小。
2. **全国性 ISP**：
    - 在一个国家范围内提供互联网服务，通常具有更大的基础设施和更广的覆盖范围。
3. **全球 ISP**：
    - 这些 ISP 拥有跨国的基础设施，能够为多个国家的用户提供互联网接入服务，通常包括跨国电信公司。

### 常见的 ISP：
- 中国的主要 ISP：**中国电信**、**中国联通**、**中国移动**
- 国际上的知名 ISP：**AT&T**、**Verizon**、**Comcast**、**British Telecom** (BT)
## 因特网的组成
- **边缘部分**：
    
    - 这是用户与互联网的交互点，通常包括个人电脑、手机、服务器、智能设备等。这些设备通过访问提供网络连接的本地网络或服务提供商的基础设施来访问互联网。
    - 边缘设备负责生成和接收数据，如用户发送的请求、访问的网页、进行的搜索等。
    - 例如，我们使用的浏览器、电子邮件客户端、智能手机上的应用程序都属于边缘部分。
- **核心部分**：
    
    - 这是支撑互联网运行的基础设施，主要由大型路由器、交换机、骨干网和数据中心组成。
    - 核心部分负责传输和路由边缘设备产生的数据，确保信息可以高效和准确地传输到全球各地。
    - 核心网络通常由主要的电信公司、互联网服务提供商（ISP）、云服务提供商维护和运营。

## 交换方式

### 1. **电路交换 (Circuit Switching)**
   **特点**：
   - 在通信双方建立连接之前，需要先建立一条专用的物理路径。
   - 路径一旦建立，整个通信过程中会专用这条路径，其他通信无法使用相同的资源。
   - 常见于传统电话网络，每次通话需要专用的通信线路。

   **优点**：
   - 通信过程中无延迟，因为路径专用，数据可以连续传输。
   - 数据按照发送顺序传送，不会出现乱序问题。
   - 适用于实时通信，如语音通话。
   - 没有冲突，不同双方使用不同信道
   - 适用范围广，既适用于模拟信号，也适用于数字信号
   - 控制简单

   **缺点**：
   - 资源利用率低，如果通信双方不在持续传输数据，专用路径上的带宽被浪费。
   - 建立连接的时间较长，特别是在远程连接时。
   - 网络不灵活，难以适应突发性的短暂通信需求。
   - 难以规格化，不同类型、不同规格、不同速率的终端很难相互通信，也很难进行差错控制

### 2. **报文交换 (Message Switching)**
   **特点**：
   - 报文作为一个整体被存储和转发，每个节点在收到整个报文后再将其发送到下一个节点。
   - 不需要建立专用路径，报文根据其目的地址动态选择路径。
   - 报文可以有任意长度，因此每次传输可能需要较长时间。

   **优点**：
   - 无需建立专用通道，资源利用率较高。
   - 动态分配路线。
   - 提供多目标服务
   - 通过线路可靠性。
   - 可以有效传输较长的报文，适合文件传输等非实时通信。

   **缺点**：
   - 每个节点需要存储和转发整个报文，可能导致较高的存储需求和传输延迟。
   - 引起了转发时延，报文越大，延迟越大，因此不适合实时应用。
   - 报文在传输过程中可能出现丢失或损坏，需重传。
   - 需要传输额外的信息量，报文要携带目标地址、原地址等信息。

### 3. **分组交换 (Packet Switching)**
   **特点**：
   - 数据被分割成多个较小的分组，每个分组独立传输，分组之间可以走不同的路径。
   - 每个分组有自己的目的地址，接收端可以重新组装分组以还原原始数据。
   - 分组交换是互联网的核心传输方式（如TCP/IP协议）。

   **优点**：
   - 无需建立专用通道，资源利用率较高。
   - 高效的带宽利用率，分组可以动态选择最优路径，网络资源可以共享。
   - 适应突发性流量，支持同时进行多个通信会话。
   - 每个分组可以独立传输和确认，因此传输更加可靠。
   - 相当于报文交换，简化了存储管理。
   - 加速传输，不同分组的转发操作可以同时进行
   - 减少出错概率和重发数据量

   **缺点**：
   - 分组在不同路径上传输，可能会到达顺序不一致，接收方需要进行排序和重新组装。
   - 适用于非实时通信，可能会出现延迟和抖动，不适合要求严格实时性应用（如某些视频或语音通话）。
   - 网络负载过高时，分组可能会丢失或需要重传。
   - 引起了转发时延。
   - 需要传输额外的信息量，每个数据块要加上源地址，目的地址等控制信息，从而构成分组。
### 总结
![](https://qiuniu.phlin.top/bucket/202409201524429.png)


## 计算机网络分类
### 按交换技术
1. 电路交换网络
2. 报文交换网络
3. 分组交换网络
### 按使用者
1. 公用网
2. 专用网
### 按传输介质
1. 有线网络
2. 无线网络

### 按覆盖范围
1. 广域网WAN
2. 城域网MAN
3. 局域网LAN
4. 个域网PAN（如无线个人局域网WPAN）

### 按拓扑结构
1. 总线型网络
2. 星型网络
3. 环型网络
4. 网状型网络

## 性能指标
### 速率
连接在计算机网络上的主机在数字信道上传送比特速率，也称为比特率或数据率。
![](https://qiuniu.phlin.top/bucket/202409201553747.png)
下面补充数据量的单位转换
![[Pasted image 20240920155338.png]]
### 带宽
#### 在模拟信号系统中的意义
信号所包含的各种不同频率成分所占据的频率范围（单位:Hz）
#### 在计算机网络中的意义
用来表示网络的通信线路所能传送数据的能力，因此网络带宽表示在单位时间内从网络中的某一点到另一点所能通过的“最高数据率”。（单位：b/s）
### 吞吐量
单位时间内通过某个网络（信道、接口）的数据量，受网络带宽或额定速率限制。
### 时延
时延是指数据从源到达目的地所花费的时间，在网络通信中可以分为以下几类：

#### 1. **发送时延 (Transmission Delay)**
   **定义**：
   - 发送时延是指主机将数据从发送端的网络接口传输到网络中的时间。它取决于要发送的数据量和网络链路的带宽。
   ![[Pasted image 20240920160921.png]
![](https://qiuniu.phlin.top/bucket/202409201606814.png)
   
   **影响因素**：
   - 数据包大小：数据包越大，发送时延越长。
   - 链路带宽：带宽越大，发送时延越短。

   **特点**：
   - 发送时延只与数据包的大小和链路的带宽有关，传输距离不影响发送时延。
   - 在高带宽网络中，发送时延通常很短。

#### 2. **传播时延 (Propagation Delay)**
   **定义**：
   - 传播时延是指数据在物理介质（如光纤、电缆）上传播的时间，它取决于信号传播的距离和传播速度（通常是光速的一部分）。
   
![](https://qiuniu.phlin.top/bucket/202409201607613.png)
   
   **影响因素**：
   - 传输距离：距离越远，传播时延越长。
   - 信号传播速度：通常为光速的某个百分比，依赖于介质类型，如光纤、铜线等。

   **特点**：
   - 传播时延与距离和介质有关，与数据包的大小无关。
   - 对于长距离传输（如卫星通信或跨大洲通信），传播时延较显著。

   **举例**：
![](https://qiuniu.phlin.top/bucket/202409201608627.png)
#### 3. **处理时延 (Processing Delay)**
   **定义**：
   - 处理时延是指路由器或交换机在接收数据包时，解析包头信息、决定转发路径，以及执行其他相关处理所花费的时间。（可包含排队时延）
   
   **影响因素**：
   - 设备处理能力：处理能力越强，处理时延越短。
   - 数据包的复杂度：数据包越复杂或需进行的操作越多，处理时延越长。

   **特点**：
   - 处理时延通常较短，但可能因设备的繁忙程度和网络配置不同而波动。
   - 如果设备负载过高，处理时延可能显著增加。 


### 时延带宽积
传播时延×带宽
链路的时延带宽积又称为以比特为单位的链路长度
### 往返时间
双向交互一次所需的时间
### 利用率
#### 信道利用率
用来表示某信道有百分之几的时间是被利用的（有数据通过）。
因为信道利用率增大时，该信道因求偶的时延也会迅速增加。所有信道利用率并非越高越好。
#### 网络利用率 
全网络的通信利用率的加权平均
![[Pasted image 20240920161957.png]]
### 丢包率
即分组丢失率，是指在一定的时间范围内，传输过程中丢失的分组数量与总分组数量的比率，反映了网络拥塞情况。
无拥塞时路径丢包率为0
轻度拥塞时路径丢包率为1%~4%
重度拥塞时路径丢包率为5%~15%
#### 分类
接口丢包率、结点丢包率、链路丢包率、路径丢包率、网络丢包率等。
#### 分组丢失的情况
分组在传输过程中出现误码，被结点丢弃，
分组到达一会队列已港的分组交换机时被丢弃，在通信量较大是就可能造成网络拥塞。


## 常见体系结构

![](https://qiuniu.phlin.top/bucket/202409201635098.png)


![](https://qiuniu.phlin.top/bucket/202409201634663.png)

### 分层必要性
![](https://qiuniu.phlin.top/bucket/202409201642458.png)
### 各层数据单元
![](https://qiuniu.phlin.top/bucket/202409201740230.png)