---
title: gRPC-Go框架学习
date: 2024-10-02 19:09:11
categories: 开发
tags:
  - golang
  - gRPC
---

# grpc介绍

gRPC（**Google Remote Procedure Call**）是一个现代、高性能、开源的远程过程调用（RPC）框架，最初由 Google 开发。它允许客户端和服务器应用程序之间通过网络进行通信，支持跨语言和跨平台的开发。gRPC 依赖于 Protocol Buffers（**Protobuf**）作为其接口定义语言（IDL）来定义服务和消息格式，并支持 HTTP/2 进行高效的网络传输。默认情况下，gRPC 使用 [Protocol Buffers](https://protobuf.com.cn/overview)，Google 的成熟开源机制来序列化结构化数据（尽管它可以使用其他数据格式，例如 JSON）。

在 gRPC 中，客户端应用程序可以直接调用不同机器上的服务器应用程序中的方法，就像调用本地对象一样，从而更容易创建分布式应用程序和服务。与许多 RPC 系统一样，gRPC 基于定义服务的思想，指定可以远程调用的方法及其参数和返回类型。在服务器端，服务器实现此接口并运行 gRPC 服务器来处理客户端调用。在客户端端，客户端有一个存根（在某些语言中称为客户端），它提供与服务器相同的函数。
![](https://qiuniu.phlin.top/bucket/202410021906667.png)
gRPC 客户端和服务器可以在各种环境中运行和通信，从 Google 内部服务器到您的桌面，并且可以使用 gRPC 支持的任何语言编写。因此，例如，您可以轻松地在 Java 中创建 gRPC 服务器，并在 Go、Python 或 Ruby 中使用客户端。此外，最新的 Google API 将具有其接口的 gRPC 版本，让您轻松地将 Google 功能集成到您的应用程序中。
# proto介绍
## 简介
Protocol Buffers（简称 Proto 或 Protobuf）是一种由 Google 开发的数据序列化格式。它用于将结构化数据序列化为二进制格式，以便于高效存储和网络传输。Protobuf 支持多种编程语言，且与 JSON 或 XML 等其他数据交换格式相比，具有更高的性能和更小的消息体积。

### 主要特点：

1. **高效性**：
    - Protobuf 使用二进制格式进行数据存储和传输，能够在带宽受限或存储空间有限的情况下，提高数据的传输速度和存储效率。
2. **可扩展性**：
    
    - Protobuf 允许你在不破坏已有数据结构的情况下，对消息进行版本控制和扩展。这意味着你可以添加新的字段，而不需要更改现有的代码或数据格式。
3. **多语言支持**：
    
    - Protobuf 支持多种编程语言，包括 C++, Java, Python, Go, C#, Ruby, Dart, 等等，使得它在多种环境下都能使用。
4. **自定义数据结构**：
    
    - 通过定义 `.proto` 文件，你可以指定数据的结构，包括字段的名称、类型以及规则。
5. **简单的序列化和反序列化**：
    
    - Protobuf 提供了简单的方法来将对象转换为字节流（序列化），以及将字节流转换回对象（反序列化）。
## 数据类型
### 基本数据类型
```proto
message Request {
  double a1 = 1;
  float a2 = 2;
  int32 a3 = 3;
  uint32 a4 = 4;
  uint64 a5 = 5;
  sint32 a6 = 6;
  sint64 a7 = 7;
  fixed32 a8 = 8;
  fixed64 a9 = 9;
  sfixed32 a10 = 10;
  sfixed64 a11 = 11;
  bool a12 = 12;
  string a13 = 13;
  bytes a14 = 14;
}
```
对应go类型
```go
type Request struct {
  state         protoimpl.MessageState
  sizeCache     protoimpl.SizeCache
  unknownFields protoimpl.UnknownFields

  A1  float64 `protobuf:"fixed64,1,opt,name=a1,proto3" json:"a1,omitempty"`
  A2  float32 `protobuf:"fixed32,2,opt,name=a2,proto3" json:"a2,omitempty"`
  A3  int32   `protobuf:"varint,3,opt,name=a3,proto3" json:"a3,omitempty"`
  A4  uint32  `protobuf:"varint,4,opt,name=a4,proto3" json:"a4,omitempty"`
  A5  uint64  `protobuf:"varint,5,opt,name=a5,proto3" json:"a5,omitempty"`
  A6  int32   `protobuf:"zigzag32,6,opt,name=a6,proto3" json:"a6,omitempty"`
  A7  int64   `protobuf:"zigzag64,7,opt,name=a7,proto3" json:"a7,omitempty"`
  A8  uint32  `protobuf:"fixed32,8,opt,name=a8,proto3" json:"a8,omitempty"`
  A9  uint64  `protobuf:"fixed64,9,opt,name=a9,proto3" json:"a9,omitempty"`
  A10 int32   `protobuf:"fixed32,10,opt,name=a10,proto3" json:"a10,omitempty"`
  A11 int64   `protobuf:"fixed64,11,opt,name=a11,proto3" json:"a11,omitempty"`
  A12 bool    `protobuf:"varint,12,opt,name=a12,proto3" json:"a12,omitempty"`
  A13 string  `protobuf:"bytes,13,opt,name=a13,proto3" json:"a13,omitempty"`
  A14 []byte  `protobuf:"bytes,14,opt,name=a14,proto3" json:"a14,omitempty"`
}
```

| .proto Type | 解释                                       | Go Type |
| ----------- | ---------------------------------------- | ------- |
| double      |                                          | float64 |
| float       |                                          | float32 |
| int32       | 使用变长编码，对于负值的效率很低，如果你的域有可能有负值，请使用sint64替代 | int32   |
| uint32      | 使用变长编码                                   | uint32  |
| uint64      | 使用变长编码                                   | uint64  |
| sint32      | 使用变长编码，这些编码在负值时比int32高效的多                | int32   |
| sint64      | 使用变长编码，有符号的整型值。编码时比通常的int64高效            | int64   |
| fixed32     | 总是4个字节，如果数值总是比总是比228大的话，这个类型会比uint32高效。  | uint32  |
| fixed64     | 总是8个字节，如果数值总是比总是比256大的话，这个类型会比uint64高效。  | uint64  |
| sfixed32    | 总是4个字节                                   | int32   |
| sfixed64    | 总是8个字节                                   | int64   |
| bool        |                                          | bool    |
| string      | 一个字符串必须是UTF-8编码或者7-bit ASCII编码的文本        | string  |
| bytes       | 可能包含任意顺序的字节数据                            | []byte  |
### 数组类型
```proto
message ArrayRequest {
  repeated int64 a1 = 1;
  repeated string a2 = 2;
  repeated Request request_list = 3;
}
```
对应go类型
```go
type ArrayRequest struct {
  A1          []int64 
  A2          []string   
  RequestList []*Request
}
```
### map类型
```proto
message MapRequest {
  map<int64, string> m_i_s = 1;
  map<string, bool> m_i_b = 2;
  map<string, ArrayRequest> m_i_arr = 3;
}
```
对应go类型
```go
type MapRequest struct {

  MIS   map[int64]string
  MIB   map[string]bool
  MIArr map[string]*ArrayRequest
}
```
### 嵌套类型
```proto
message Q1 {
  message Q2{
    string name2 = 2;
  }
  string name1 = 1;
  Q2 q2 = 2;
}
```
对应go类型
```go
type Q1 struct {
  state         protoimpl.MessageState
  sizeCache     protoimpl.SizeCache
  unknownFields protoimpl.UnknownFields

  Name1 string `protobuf:"bytes,1,opt,name=name1,proto3" json:"name1,omitempty"`
  Q2    *Q1_Q2 `protobuf:"bytes,2,opt,name=q2,proto3" json:"q2,omitempty"`
}
```
### 编写风格建议

1. 文件名建议下划线，例如：my_file.proto
2. 包名和目录名对应
3. 服务名、方法名、消息名均为大驼峰
4. 字段名为下划线

# 多服务使用
## 单proto文件
### proto
```proto
syntax = "proto3"; // 指定proto版本
// 指定golang包名
option go_package = "/duo_proto";

service VideoService {
  rpc Look(Request)returns(Response){}
}

message Request{
  string name = 1;
}
message Response{
  string name = 1;
}


service OrderService {
  rpc Buy(Request)returns(Response){}
}
```
### 服务端
```go
package main

import (
  "context"
  "fmt"
  "google.golang.org/grpc"
  "grpc_study/grpc_proto/duo_proto"
  "log"
  "net"
)

type VideoServer struct {
}

func (VideoServer) Look(ctx context.Context, request *duo_proto.Request) (res *duo_proto.Response, err error) {
  fmt.Println("video:", request)
  return &duo_proto.Response{
    Name: "fengfeng",
  }, nil
}

type OrderServer struct {
}

func (OrderServer) Buy(ctx context.Context, request *duo_proto.Request) (res *duo_proto.Response, err error) {
  fmt.Println("order:", request)
  return &duo_proto.Response{
    Name: "fengfeng",
  }, nil
}

func main() {
  listen, err := net.Listen("tcp", ":8080")
  if err != nil {
    log.Fatal(err)
  }
  s := grpc.NewServer()
  duo_proto.RegisterVideoServiceServer(s, &VideoServer{})
  duo_proto.RegisterOrderServiceServer(s, &OrderServer{})
  fmt.Println("grpc server程序运行在：8080")
  err = s.Serve(listen)
}
```
### 客户端
```go
package main

import (
  "context"
  "fmt"
  "google.golang.org/grpc"
  "google.golang.org/grpc/credentials/insecure"
  "grpc_study/grpc_proto/duo_proto"
  "log"
)

func main() {
  addr := ":8080"
  // 使用 grpc.Dial 创建一个到指定地址的 gRPC 连接。
  // 此处使用不安全的证书来实现 SSL/TLS 连接
  conn, err := grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
  if err != nil {
    log.Fatalf(fmt.Sprintf("grpc connect addr [%s] 连接失败 %s", addr, err))
  }
  defer conn.Close()

  orderClient := duo_proto.NewOrderServiceClient(conn)
  res, err := orderClient.Buy(context.Background(), &duo_proto.Request{
    Name: "枫枫",
  })
  fmt.Println(res, err)

  videoClient := duo_proto.NewVideoServiceClient(conn)
  res, err = videoClient.Look(context.Background(), &duo_proto.Request{
    Name: "枫枫",
  })
  fmt.Println(res, err)

}
```
## 多proto文件
当项目大起来之后，会有很多个service，rpc，message

我们会将不同服务放在不同的proto文件中

还可以放一些公共的proto文件
### proto
common.proto
```proto
syntax = "proto3";
package proto;   
option go_package = "/proto";


message Request{
  string name = 1;
}
message Response{
  string name = 1;
}

```
video.proto
```proto
syntax = "proto3";
package proto1;
option go_package = "/proto";
import "common.proto";

service VideoService {
  rpc Look(Request)returns(Response){}
}
```
order.proto
```proto
syntax = "proto3";
package proto;
option go_package = "/proto";
import "common.proto";

service OrderService {
  rpc Look(Request)returns(Response){}
}
```
生成命令
```sh
protoc -I .\service_proto --go_out=plugins=grpc:./service_proto .\service_proto\order.proto
protoc -I .\service_proto --go_out=plugins=grpc:./service_proto .\service_proto\video.proto
protoc -I .\service_proto --go_out=plugins=grpc:./service_proto .\service_proto\common.proto
```
如果有import的话，必须得加上package
并且要和import的package相同

### 服务端
```go
package main

import (
  "context"
  "fmt"
  "google.golang.org/grpc"
  "grpc_study/service_proto/proto"
  "log"
  "net"
)

type VideoServer struct {
}

func (VideoServer) Look(ctx context.Context, request *proto.Request) (res *proto.Response, err error) {
  fmt.Println("video:", request)
  return &proto.Response{
    Name: "fengfeng",
  }, nil
}

type OrderServer struct {
}

func (OrderServer) Look(ctx context.Context, request *proto.Request) (res *proto.Response, err error) {
  fmt.Println("order:", request)
  return &proto.Response{
    Name: "fengfeng",
  }, nil
}

func main() {
  listen, err := net.Listen("tcp", ":8080")
  if err != nil {
    log.Fatal(err)
  }
  s := grpc.NewServer()
  proto.RegisterVideoServiceServer(s, &VideoServer{})
  proto.RegisterOrderServiceServer(s, &OrderServer{})
  fmt.Println("grpc server程序运行在：8080")
  err = s.Serve(listen)
}

```
### 客户端
```go
package main

import (
  "context"
  "fmt"
  "google.golang.org/grpc"
  "google.golang.org/grpc/credentials/insecure"
  "grpc_study/service_proto/proto"
  "log"
)

func main() {
  addr := ":8080"
  // 使用 grpc.Dial 创建一个到指定地址的 gRPC 连接。
  // 此处使用不安全的证书来实现 SSL/TLS 连接
  conn, err := grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
  if err != nil {
    log.Fatalf(fmt.Sprintf("grpc connect addr [%s] 连接失败 %s", addr, err))
  }
  defer conn.Close()

  orderClient := proto.NewOrderServiceClient(conn)
  res, err := orderClient.Look(context.Background(), &proto.Request{
    Name: "枫枫",
  })
  fmt.Println(res, err)

  videoClient := proto.NewVideoServiceClient(conn)
  res, err = videoClient.Look(context.Background(), &proto.Request{
    Name: "枫枫",
  })
  fmt.Println(res, err)

}

```

# 生命周期
## 服务端流式

### 基本使用
#### proto
```proto 
syntax = "proto3";
option go_package = "/proto";

service Simple {
  rpc Fun(Request)returns(Response){}
}
message Request {
  string name = 1;
}
message Response {
  string Text = 1;
}
```
#### 服务端
```go
package main

import (
  "fmt"
  "google.golang.org/grpc"
  "grpc_study/stream_proto/proto"
  "log"
  "net"
)

type ServiceStream struct{}

func (ServiceStream) Fun(request *proto.Request, stream proto.ServiceStream_FunServer) error {
  fmt.Println(request)
  for i := 0; i < 10; i++ {
    stream.Send(&proto.Response{
      Text: fmt.Sprintf("第%d轮数据", i),
    })
  }
  return nil
}

func main() {
  listen, err := net.Listen("tcp", ":8080")
  if err != nil {
    log.Fatal(err)
  }
  server := grpc.NewServer()
  proto.RegisterServiceStreamServer(server, &ServiceStream{})

  server.Serve(listen)
}
```
#### 客户端
```go
package main

import (
  "context"
  "fmt"
  "google.golang.org/grpc"
  "google.golang.org/grpc/credentials/insecure"
  "grpc_study/stream_proto/proto"
  "log"
)

func main() {
  addr := ":8080"
  // 使用 grpc.Dial 创建一个到指定地址的 gRPC 连接。
  // 此处使用不安全的证书来实现 SSL/TLS 连接
  conn, err := grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
  if err != nil {
    log.Fatalf(fmt.Sprintf("grpc connect addr [%s] 连接失败 %s", addr, err))
  }
  defer conn.Close()
  // 初始化客户端
  client := proto.NewServiceStreamClient(conn)

  stream, err := client.Fun(context.Background(), &proto.Request{
    Name: "张三",
  })
  for i := 0; i < 10; i++ {
    response, err := stream.Recv()
    fmt.Println(response, err)
  }

}
```
### 案例
#### 客户端不知道服务端什么时候结束
```go
stream, err := client.Fun(context.Background(), &proto.Request{
  Name: "张三",
})
for {
  response, err := stream.Recv()
  if err == io.EOF {
    break
  }
  fmt.Println(response)
}
```
#### 下载文件
##### proto
```proto
syntax = "proto3";
option go_package = "/proto";


message Request {
  string name = 1;
}

message FileResponse{
  string file_name = 1;
  bytes content = 2;
}
service ServiceStream{
  rpc DownLoadFile(Request)returns(stream FileResponse){}
}


// protoc -I . --go_out=plugins=grpc:./stream_proto .\stream_proto\stream.proto
```
##### 服务端
```go
package main

import (
  "fmt"
  "google.golang.org/grpc"
  "grpc_study/stream_proto/proto"
  "io"
  "log"
  "net"
  "os"
)

type ServiceStream struct{}


func (ServiceStream) DownLoadFile(request *proto.Request, stream proto.ServiceStream_DownLoadFileServer) error {
  fmt.Println(request)
  file, err := os.Open("static/1.gvb_web项目搭建.mp4")
  if err != nil {
    return err
  }
  defer file.Close()

  for {
    buf := make([]byte, 2048)
    _, err = file.Read(buf)
    if err == io.EOF {
      break
    }
    if err != nil {
      break
    }
    stream.Send(&proto.FileResponse{
      Content: buf,
    })
  }
  return nil
}

func main() {
  listen, err := net.Listen("tcp", ":8080")
  if err != nil {
    log.Fatal(err)
  }
  server := grpc.NewServer()
  proto.RegisterServiceStreamServer(server, &ServiceStream{})

  server.Serve(listen)
}
```
##### 客户端
```
package main

import (
  "bufio"
  "context"
  "fmt"
  "google.golang.org/grpc"
  "google.golang.org/grpc/credentials/insecure"
  "grpc_study/stream_proto/proto"
  "io"
  "log"
  "os"
)

func main() {
  addr := ":8080"
  // 使用 grpc.Dial 创建一个到指定地址的 gRPC 连接。
  // 此处使用不安全的证书来实现 SSL/TLS 连接
  conn, err := grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
  if err != nil {
    log.Fatalf(fmt.Sprintf("grpc connect addr [%s] 连接失败 %s", addr, err))
  }
  defer conn.Close()
  // 初始化客户端
  client := proto.NewServiceStreamClient(conn)
  
  stream, err := client.DownLoadFile(context.Background(), &proto.Request{
    Name: "张三",
  })

  file, err := os.OpenFile("static/1.gvb_web项目搭建1.mp4", os.O_CREATE|os.O_WRONLY, 0600)
  if err != nil {
    log.Fatalln(err)
  }
  defer file.Close()

  writer := bufio.NewWriter(file)
  var index int
  for {
    index++
    response, err := stream.Recv()
    if err == io.EOF {
      break
    }
    fmt.Printf("第%d 次， 写入 %d 数据\n", index, len(response.Content))
    writer.Write(response.Content)
  }
  writer.Flush()
}
```

## 客户端流式
### 基本使用
#### proto
```proto
syntax = "proto3";
option go_package = "/proto";
message Response {
  string Text = 1;
}
message FileRequest{
  string file_name = 1;
  bytes content = 2;
}
service ClientStream{
  rpc UploadFile(stream FileRequest)returns(Response){}
}
```
#### 服务端
```go
package main

import (
  "fmt"
  "google.golang.org/grpc"
  "grpc_study/stream_proto/proto"
  "log"
  "net"
)

type ClientStream struct{}

func (ClientStream) UploadFile(stream proto.ClientStream_UploadFileServer) error {
  for i := 0; i < 10; i++ {
    response, err := stream.Recv()
    fmt.Println(response, err)
  }
  stream.SendAndClose(&proto.Response{Text: "完毕了"})
  return nil
}

func main() {
  listen, err := net.Listen("tcp", ":8080")
  if err != nil {
    log.Fatal(err)
  }
  server := grpc.NewServer()
  proto.RegisterClientStreamServer(server, &ClientStream{})

  server.Serve(listen)
}

```
#### 客户端
```go
package main

import (
  "context"
  "fmt"
  "google.golang.org/grpc"
  "google.golang.org/grpc/credentials/insecure"
  "grpc_study/stream_proto/proto"
  "log"
)

func main() {
  addr := ":8080"
  conn, err := grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
  if err != nil {
    log.Fatalf(fmt.Sprintf("grpc connect addr [%s] 连接失败 %s", addr, err))
  }
  defer conn.Close()
  // 初始化客户端
  client := proto.NewClientStreamClient(conn)
  stream, err := client.UploadFile(context.Background())
  for i := 0; i < 10; i++ {
    stream.Send(&proto.FileRequest{FileName: fmt.Sprintf("第%d次", i)})
  }
  response, err := stream.CloseAndRecv()
  fmt.Println(response, err)
}
```

### 案例
#### 上传文件
##### 服务端
```go
package main

import (
  "bufio"
  "fmt"
  "google.golang.org/grpc"
  "grpc_study/stream_proto/proto"
  "io"
  "log"
  "net"
  "os"
)

type ClientStream struct{}

func (ClientStream) UploadFile(stream proto.ClientStream_UploadFileServer) error {

  file, err := os.OpenFile("static/x.png", os.O_CREATE|os.O_WRONLY, 0600)
  if err != nil {
    log.Fatalln(err)
  }
  defer file.Close()

  writer := bufio.NewWriter(file)
  var index int
  for {
    index++
    response, err := stream.Recv()
    if err == io.EOF {
      break
    }
    writer.Write(response.Content)
    fmt.Printf("第%d次", index)
  }
  writer.Flush()
  stream.SendAndClose(&proto.Response{Text: "完毕了"})
  return nil
}

func main() {
  listen, err := net.Listen("tcp", ":8080")
  if err != nil {
    log.Fatal(err)
  }
  server := grpc.NewServer()
  proto.RegisterClientStreamServer(server, &ClientStream{})

  server.Serve(listen)
}
```
##### 客户端
```go
package main

import (
  "context"
  "fmt"
  "google.golang.org/grpc"
  "google.golang.org/grpc/credentials/insecure"
  "grpc_study/stream_proto/proto"
  "io"
  "log"
  "os"
)

func main() {
  addr := ":8080"
  // 使用 grpc.Dial 创建一个到指定地址的 gRPC 连接。
  // 此处使用不安全的证书来实现 SSL/TLS 连接
  conn, err := grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
  if err != nil {
    log.Fatalf(fmt.Sprintf("grpc connect addr [%s] 连接失败 %s", addr, err))
  }
  defer conn.Close()
  // 初始化客户端
  client := proto.NewClientStreamClient(conn)
  stream, err := client.UploadFile(context.Background())

  file, err := os.Open("static/21.png")
  if err != nil {
    log.Fatalln(err)
  }
  defer file.Close()

  for {
    buf := make([]byte, 2048)
    _, err = file.Read(buf)
    if err == io.EOF {
      break
    }
    if err != nil {
      break
    }
    stream.Send(&proto.FileRequest{
      FileName: "x.png",
      Content:  buf,
    })
  }
  response, err := stream.CloseAndRecv()
  fmt.Println(response, err)
}
```
## 双向流
### 基本使用
#### proto
```proto
syntax = "proto3";
option go_package = "/proto";

message Request {
  string name = 1;
}
message Response {
  string Text = 1;
}

service BothStream{
  rpc Chat(stream Request)returns(stream Response){}
}
```
#### 服务端
```go
package main

import (
  "fmt"
  "google.golang.org/grpc"
  "grpc_study/stream_proto/proto"
  "log"
  "net"
)

type BothStream struct{}

func (BothStream) Chat(stream proto.BothStream_ChatServer) error {
  for i := 0; i < 10; i++ {
    request, _ := stream.Recv()
    fmt.Println(request)
    stream.Send(&proto.Response{
      Text: "你好",
    })
  }
  return nil
}

func main() {
  listen, err := net.Listen("tcp", ":8080")
  if err != nil {
    log.Fatal(err)
  }
  server := grpc.NewServer()
  proto.RegisterBothStreamServer(server, &BothStream{})

  server.Serve(listen)
}
```
#### 客户端
```go
package main

import (
  "context"
  "fmt"
  "google.golang.org/grpc"
  "google.golang.org/grpc/credentials/insecure"
  "grpc_study/stream_proto/proto"
  "log"
)

func main() {
  addr := ":8080"
  // 使用 grpc.Dial 创建一个到指定地址的 gRPC 连接。
  // 此处使用不安全的证书来实现 SSL/TLS 连接
  conn, err := grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
  if err != nil {
    log.Fatalf(fmt.Sprintf("grpc connect addr [%s] 连接失败 %s", addr, err))
  }
  defer conn.Close()
  // 初始化客户端
  client := proto.NewBothStreamClient(conn)
  stream, err := client.Chat(context.Background())

  for i := 0; i < 10; i++ {
    stream.Send(&proto.Request{
      Name: fmt.Sprintf("第%d次", i),
    })
    response, err := stream.Recv()
    fmt.Println(response, err)
  }
}
```

# 参考资料
[gRPC官方文档](https://grpc.org.cn/docs/what-is-grpc/)
[gRPC文档-枫枫知道](https://docs.fengfengzhidao.com/#/docs/grpc%E6%96%87%E6%A1%A3/3.hello_world?id=%e7%bc%96%e5%86%99protobuf%e6%96%87%e4%bb%b6)