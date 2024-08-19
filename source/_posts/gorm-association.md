---
title: gorm的多种关联方式
date: 2023-11-23 11:56:12
categories: 后端
tags:
  - golang
  - 数据库
---
[Gorm官网](https://gorm.io/zh_CN/docs/belongs_to.html)上将这个分成了belongs to，has one，has many，many to many这些关系，今天笔者就简单分成这三种关系（一对一，一对多和多对多）来逐一讲解。

---
## 一对一
以笔者写的一份项目为例（一个用户对应一个用户信息）
```
package models

type User struct {
	UserID     int      `json:"-" gorm:"primaryKey"`
	Name       string   `json:"name"`
	Password   []byte   `json:"-"`
	Userinfo   Userinfo `json:"-"`
}

type Userinfo struct {
	ID       int    `json:"-" `
	UserID   int    `json:"-"`
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Birthday string `json:"birthday"`
	Address  string `json:"address"`
	Motto    string `json:"motto"`
	Avatar   string `json:"avatar"`
}
```
1. 增
* 创建用户并携带相关个人信息

* 新建用户并关联已有信息

* 新建个人信息并关联已有用户

* 已有用户关联已有信息

2. 删
* 清除用户与信息的关系

* 删除用户并连带信息一起删除

* 仅删除信息保留用户

* 仅删除用户保留信息

3. 改
* 直接通过信息表修改内容

* 通过用户表修改内容

4. 查


（等笔者找个时间补上）