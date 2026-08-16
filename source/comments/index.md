---
title: 留言弹幕板
date: 2024-11-05 19:27:02
description: 欢迎在这里留言交流，也可以发送会在页面上滚动展示的弹幕。
comment: 'waline'
sitemap: false
indexing: false
---

<style>
  #danmu {
    width: 100%;
    height: calc(100% - 60px);
    position: fixed;
    left: 0;
    top: 60px;
    z-index: 999;
    pointer-events: none;
    opacity: 0.9; /* 添加轻微透明效果 */
    transition: opacity 0.3s ease-in-out; /* 平滑的过渡效果 */
  }

  #danmu.hidedanmu {
    opacity: 0 !important;
    pointer-events: none !important;
  }

  #danmuBtn {
    display: flex;
    justify-content: center;
    margin-top: 20px; /* 为了更好的可见性，增加一些边距 */
    position: relative;
    z-index: 1001; /* 放在弹幕层之上 */
  }

  #danmuBtn button {
    background: var(--anzhiyu-main);
    color: white;
    padding: 8px 20px;
    margin: 0 10px;
    border-radius: 100px;
    cursor: pointer;
    border: none;
    transition: background-color 0.3s ease;
  }

  #danmuBtn button:hover {
    background-color: darken(var(--anzhiyu-main), 10%);
  }

  /* 默认评论样式 */
  .default-style a {
    background-color: rgba(0, 0, 0, 0.5);
    transition: 0.3s;
    color: #eee !important;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 16px 6px 6px;
    text-decoration: none !important;
  }

  .default-style a:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }

  .default-style img {
    height: 30px;
    width: 30px;
    margin-right: 5px;
    border-radius: 50%;
  }

  .default-style p {
    margin: 0;
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 300px;
  }
</style>


{% note success flat %}
欢迎在此留言或发送弹幕！😊你可以直接发表评论，评论内容将以弹幕形式显示在页面上。
{% endnote %}


<div id="danmuBtn"></div>
<div id="danmu"></div>

<!-- 弹幕开关按钮由主题的 comments.js 自动注入到 #danmuBtn 中 -->
