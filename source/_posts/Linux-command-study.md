---
title: Linux命令简单学习
date: 2024-10-29 16:33:50
categories: 运维
tags: 
 - linux
 - shell
---
## linux常用命令

| 命令        | 功能说明                                                      | 应用场景                                             | 示例                                                       |
|-------------|---------------------------------------------------------------|------------------------------------------------------|------------------------------------------------------------|
| `ls`        | 列出指定目录中的文件和目录。                                  | 查看目录内容                                         | `ls -lh` 显示当前目录内容，并以人类可读格式显示文件大小。 |
| `cd`        | 更改当前工作目录。                                            | 文件系统导航                                         | `cd /home/user` 切换到 `/home/user` 目录。               |
| `pwd`       | 显示当前工作目录的完整路径。                                  | 确认当前位置                                         | `pwd` 输出当前目录路径。                                 |
| `mkdir`     | 创建一个新目录。                                              | 创建新文件夹                                         | `mkdir new_folder` 创建名为 `new_folder` 的目录。       |
| `rmdir`     | 删除空目录。                                                  | 删除不再需要的空目录                                 | `rmdir old_folder` 删除 `old_folder` 目录。             |
| `touch`     | 创建新文件或更新文件时间戳。                                  | 快速创建空文件                                       | `touch new_file.txt` 创建空文件 `new_file.txt`。        |
| `rm`        | 删除文件或目录。                                              | 移除不需要的文件或目录                               | `rm file.txt` 删除 `file.txt` 文件。                    |
| `cp`        | 复制文件或目录。                                              | 复制文件或目录到新位置                               | `cp source.txt destination.txt` 复制文件。              |
| `mv`        | 移动或重命名文件或目录。                                      | 整理文件或更改文件名                                 | `mv old_name.txt new_name.txt` 重命名文件。             |
| `grep`      | 搜索符合条件的文本行。                                        | 查找包含特定文本的文件                               | `grep "search_term" file.txt` 在文件中搜索文本。        |
| `find`      | 在目录树中搜索文件。                                          | 查找符合条件的文件                                   | `find /home -name "*.txt"` 查找 `.txt` 文件。          |
| `cat`       | 查看文件内容或连接多个文件内容。                              | 查看或合并文件内容                                   | `cat file1.txt file2.txt` 查看两个文件内容。           |
| `echo`      | 在标准输出显示一行文本或变量。                                | 显示消息或变量值                                     | `echo "Hello World"` 显示 "Hello World"。               |
| `tail`      | 显示文件的最后几行。                                          | 查看日志或文件的最新内容                             | `tail -f /var/log/syslog` 实时查看系统日志。            |
| `head`      | 显示文件的前几行。                                            | 快速查看文件开头部分                                 | `head -n 5 file.txt` 显示文件前 5 行。                |
| `sort`      | 对文件内容按顺序排序。                                        | 对文件进行排序或合并                                 | `sort file.txt` 排序文件内容。                          |
| `uniq`      | 从输入中删除重复的连续行。                                    | 删除或统计重复行                                     | `sort file.txt | uniq` 删除排序后的重复行。           |
| `cut`       | 按列提取文件内容。                                            | 提取指定列内容                                       | `cut -d':' -f 1 /etc/passwd` 提取第一列内容。           |
| `awk`       | 强大的文本处理工具，适合复杂文本处理。                         | 复杂文本分析与报告                                   | `awk '{print $2, $1}' file.txt` 交换每行字段。         |
| `sed`       | 执行文本替换、插入、删除等操作。                              | 替换文件内容                                         | `sed 's/old/new/g' file.txt` 全部替换指定文本。         |
| `chmod`     | 更改文件或目录的访问权限。                                    | 设置文件读、写、执行权限                             | `chmod 755 script.sh` 设置文件权限。                   |
| `chown`     | 更改文件或目录的所有者和组。                                  | 管理文件所有权                                       | `chown user:group file.txt` 设置文件所有者。           |
| `df`        | 显示文件系统的磁盘空间使用情况。                              | 监控磁盘空间                                         | `df -h` 显示人类可读的磁盘空间。                       |
| `du`        | 显示文件或目录占用的磁盘空间。                                | 查找占用大量磁盘空间的文件                           | `du -sh /path/to/dir` 显示目录占用空间。               |
| `ps`        | 显示当前系统的活动进程。                                      | 监控和管理进程                                       | `ps aux` 显示系统所有进程。                            |
| `top`       | 实时显示进程及系统资源的使用情况。                            | 实时监控系统和进程状态                               | 直接运行 `top` 查看动态资源使用情况。                 |
| `kill`      | 终止进程。                                                    | 终止挂起的或无响应的进程                             | `kill -9 1234` 强制终止指定进程。                      |
| `tar`       | 打包和解压文件。                                              | 文件备份和压缩                                       | `tar -czvf archive.tar.gz /path/to/dir` 打包压缩目录。  |
| `crontab`   | 安排定时任务。                                                | 自动执行周期性任务                                   | `crontab -e` 编辑定时任务。                            |
| `wget`      | 从网络下载文件。                                              | 命令行下载网页、文件等                               | `wget http://example.com/file.zip` 下载指定文件。      |
| `curl`      | 与服务器交换数据。                                            | API 测试、上传、下载                                 | `curl http://example.com` 显示URL内容。                |
| `ssh`       | 安全地远程登录另一台计算机。                                  | 远程管理服务器                                       | `ssh user@example.com` 连接到服务器。                 |
| `scp`       | 通过 SSH 安全地传输文件。                                     | 在不同计算机间安全地复制文件                         | `scp file.txt user@example.com:/path` 传输文件。       |
| `iptables`  | 配置 Linux 防火墙。                                           | 设置网络访问控制规则                                 | `iptables -L` 列出防火墙规则。                         |
| `man`       | 显示命令手册页（帮助文档）。                                  | 学习特定命令的用法                                   | `man ls` 显示 ls 命令的手册页。                       |
| `history`   | 显示用户命令历史。                                            | 回顾或重用之前的命令                                 | `history` 显示命令历史列表。                           |
| `ping`      | 检查网络连接。                                                | 诊断网络连接问题                                     | `ping google.com` 测试与目标网络的连接。               |
| `traceroute`| 显示数据包到达主机所经过的路由。                              | 网络路径分析                                         | `traceroute google.com` 跟踪到目标的网络路径。         |
| `hostname`  | 显示或设置系统的主机名。                                      | 系统主机名管理                                       | `hostname` 显示当前系统主机名。                         |
| `useradd`   | 添加系统用户。                                                | 用户账户管理                                         | `useradd newuser` 添加新用户。                          |
| `groupadd`  | 添加系统用户组。                                              | 用户组管理                                           | `groupadd newgroup` 添加新组。                          |
| `passwd`    | 更新用户密码。                                                | 修改用户账户密码                                     | `passwd username` 修改指定用户的密码。                 |

以上是部分常用Shell命令的示例说明，可以在命令行使用`man`查看详细的手册信息。

## shell脚本

| 命令/结构                        | 用法                                                                     |
| ---------------------------- | ---------------------------------------------------------------------- |
| `#!/bin/bash`                | 指定脚本使用的解释器，通常放在脚本的第一行。                                                 |
| `read`                       | 从用户获取输入，例如 `read name`。                                                |
| `variable=value`             | 定义变量，例如 `name="Alice"`。                                                |
| `$variable`                  | 引用变量值，例如 `echo $name`。                                                 |
| `$(command)`                 | 命令替换，例如 `files=$(ls)`，将 `ls` 命令结果存入变量。                                 |
| `expr`                       | 计算表达式，例如 `expr 5 + 3`。                                                 |
| `let`                        | 进行整数运算，例如 `let "a = 5 + 3"`。                                           |
| `test` / `[ ]`               | 进行条件测试，例如 `[ $a -lt $b ]`。                                             |
| `if` … `then` … `fi`         | 条件判断语句，例如 `if [ $a -gt $b ]; then echo "a is greater"; fi`。            |
| `else`                       | 否则条件，例如 `if [ $a -gt $b ]; then echo "a"; else echo "b"; fi`。          |
| `elif`                       | 多条件判断，例如 `if [ $a -gt $b ]; then ... elif [ $a -lt $b ]; then ... fi`。 |
| `for` … `in` … `do` … `done` | 循环结构，例如 `for i in {1..5}; do echo $i; done`。                           |
| `while` … `do` … `done`      | `while` 循环，例如 `while [ $a -lt 10 ]; do echo $a; let "a++"; done`。      |
| `case` … `in` … `esac`       | 条件分支，例如 `case $variable in pattern1) ... ;; pattern2) ... ;; esac`。    |
| `function`                   | 定义函数，例如 `function my_func { echo "Hello"; }`。                          |
| `$?`                         | 获取上一个命令的退出状态。0 表示成功，非 0 表示失败。                                          |
| `exit`                       | 退出脚本并返回状态码，例如 `exit 1`。                                                |
| `&&` / `｜｜`                  | 逻辑操作符。例如，`command1 && command2` 表示 `command1` 成功时才执行 `command2`。       |
| `>` / `>>`                   | 输出重定向。例如 `echo "Hello" > file` 覆盖写入，`echo "Hello" >> file` 追加写入。       |
| `<` / `<<`                   | 输入重定向。例如 `command < file` 从文件读取输入，`command << EOF ... EOF` 用作多行输入。     |
| `"` 和 `'`                    | 引号。双引号允许变量替换，单引号原样输出内容。                                                |
| `$(<filename)`               | 读取文件内容到变量，例如 `content=$(<file)`。                                       |
| `trap`                       | 捕获信号，例如 `trap "echo 'Signal received'" SIGINT`。                        |
| `shift`                      | 移动命令行参数位置，例如 `shift 2` 会使 `$3` 成为 `$1`。                                |
| `$@` / `$*`                  | 获取所有参数。`$@` 把每个参数视作单独的字符串，`$*` 把所有参数当成一个字符串。                           |
| `"$#"`                       | 获取参数数量，例如 `echo "Number of parameters: $#"。`                           |
| `basename`                   | 获取文件名，不包括路径，例如 `basename /path/to/file`。                               |
| `dirname`                    | 获取文件路径，不包括文件名，例如 `dirname /path/to/file`。                              |

## 延伸阅读
- [文章归档](/archives/)
- [分类导航](/categories/)
- [标签导航](/tags/)
- [同分类更多内容](/categories/%E8%BF%90%E7%BB%B4/)
