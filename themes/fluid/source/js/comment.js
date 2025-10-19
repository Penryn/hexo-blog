function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sanitizeURL(url) {
  try {
    const u = new URL(url, window.location.origin);
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return u.href;
    }
  } catch (_) {}
  return '';
}

class EasyDanmaku {
    constructor(t) {
        this.container = this.checkParams(t);
        this.pathname = t.page || null;
        this.wrapperStyle = t.wrapperStyle || null;
        this.line = t.line || 10; // 弹幕行数
        this.speed = t.speed || 5; // 弹幕速度
        this.runtime = t.runtime || 10; // 弹幕持续时间
        this.colourful = t.colourful || false; // 是否启用彩色弹幕
        this.loop = t.loop || false; // 是否循环播放
        this.hover = t.hover || false; // 是否启用悬停功能
        this.coefficient = t.coefficient || 1.38; // 弹幕显示间隔系数
        this.originIndex = 0; // 弹幕初始索引
        this.offsetValue = this.container.offsetHeight / this.line; // 每行高度偏移
        this.aisle = []; // 存储每行状态
        this.overflowArr = []; // 用于存储溢出的弹幕
        this.sentComments = new Set(); // 存储已经发送过的弹幕评论
        this.clearIng = false; // 标记是否正在清理弹幕
        this.init();
        this.handleEvents(t);
    }

    handleEvents(t) {
        this.onComplete = t.onComplete || null;
        this.onHover = t.onHover || null;
    }

    // 初始化弹幕通道
    init() {
        this.runstatus = 1;
        this.container.style.overflow = "hidden";
        if (this.hover) this.handleMouseHover();
        if (Utils.getStyle(this.container, "position") !== "relative" &&
            Utils.getStyle(this.container, "position") !== "fixed") {
            this.container.style.position = "relative";
        }
        for (let i = 0; i < this.line; i++) {
            this.aisle.push({ normalRow: true });
        }
    }

    // 检查参数
    checkParams(t) {
        if (!document.querySelector(t.el)) throw `Could not find the ${t.el} element`;
        return document.querySelector(t.el);
    }

    // 发送单条弹幕
    send(contentObj, style = null, callback = null) {
        const contentKey = contentObj.content; // 获取内容的标识（例如内容文本）

        if (this.sentComments.has(contentKey)) {
            return;
        }

        this.sentComments.add(contentKey);

        let danmu = document.createElement("div");
        let row = 0;
        let speed = this.speed;

        // 设置弹幕内容及样式
        danmu.innerHTML = contentObj.content;
        danmu.style.display = "inline-flex";
        danmu.style.alignItems = "center";
        danmu.style.whiteSpace = "nowrap";
        danmu.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
        danmu.classList.add("default-style");
        if (style || this.wrapperStyle) danmu.classList.add(style || this.wrapperStyle);

        const placeDanmu = () => {
            row = Math.round(Math.random() * (this.line - 1)); // 随机选择一行
            if (this.aisle[row].normalRow) {
                this.aisle[row].normalRow = false;
                this.container.appendChild(danmu);

                // 设置弹幕的滚动动画
                danmu.style.cssText += `
                    position: absolute;
                    right: -${danmu.offsetWidth + 130}px;
                    transition: transform ${speed}s linear;
                    transform: translateX(-${danmu.parentNode.offsetWidth + danmu.offsetWidth + 130}px);
                    top: ${row * this.offsetValue}px;
                    line-height: ${this.offsetValue}px;
                    color: ${this.colourful ? "#" + ("00000" + (16777216 * Math.random() << 0).toString(16)).substr(-6) : ""};
                `;

                // 动画结束时的处理
                setTimeout(() => {
                    this.aisle[row].normalRow = true;
                    this.sentComments.delete(contentKey);
                    if (callback) callback({ runtime: speed, target: danmu });
                    danmu.remove();
                }, speed * 1000);
            } else {
                if (this.aisle.some(row => row.normalRow)) {
                    placeDanmu();
                } else {
                    this.overflowArr.push({ content: contentObj, normalClass: style });
                    if (!this.clearIng) this.clearOverflowDanmakuArray();
                }
            }
        };

        placeDanmu(); // 开始放置弹幕
    }

    // 批量发送弹幕（对内容进行转义，头像 URL 校验）
    batchSend(contentList, hasAvatar = false, style = null) {
        const intervalTime = this.runtime || 1.23 * contentList.length;
        this.originList = contentList;
        this.originIndex = 0;

        const sendNextDanmu = () => {
            if (this.originIndex >= contentList.length) {
                if (this.loop) {
                    this.originIndex = 0;
                    sendNextDanmu();
                } else {
                    this.onComplete && this.onComplete();
                    return;
                }
            }

            if (hasAvatar) {
                const raw = contentList[this.originIndex] || {};
                const safeAvatar = escapeAttr(
                  sanitizeURL(raw.avatar) || 'https://cravatar.cn/avatar/d615d5793929e8c7d70eab5f00f7f5f1?d=mp'
                );
                const safeText = escapeHTML(raw.content || '');
                const html = `<img src="${safeAvatar}" style="height: 30px; width: 30px; border-radius: 50%; margin-right: 5px;">` +
                             `<p style="margin: 0;">${safeText}</p>`;
                this.send({ content: html }, style || this.wrapperStyle);
            } else {
                const safeText = escapeHTML((contentList[this.originIndex] || {}).content || '');
                this.send({ content: safeText }, style || this.wrapperStyle);
            }

            this.originIndex++;
            setTimeout(sendNextDanmu, intervalTime / contentList.length * 1000);
        };

        sendNextDanmu();
    }

    // 清理溢出弹幕
    clearOverflowDanmakuArray() {
        clearInterval(this.cleartimer);
        this.clearIng = true;

        this.cleartimer = setInterval(() => {
            if (this.overflowArr.length === 0) {
                clearInterval(this.cleartimer);
                this.clearIng = false;
            } else {
                const overflowDanmu = this.overflowArr.shift();
                this.send(overflowDanmu.content, overflowDanmu.normalClass || this.wrapperStyle);
            }
        }, 500);
    }

    // 处理悬停事件
    handleMouseHover() {
        Utils.eventDelegation(this.container, "default-style", "mouseover", danmu => {
            const computedStyle = window.getComputedStyle(danmu);
            const transformMatrix = new DOMMatrix(computedStyle.transform);
            const translateX = transformMatrix.m41; // 获取当前的X轴偏移量

            danmu.style.transition = "none"; // 停止动画
            danmu.style.transform = `translateX(${translateX}px)`; // 保持当前位置
        });

        Utils.eventDelegation(this.container, "default-style", "mouseout", danmu => {
            const computedStyle = window.getComputedStyle(danmu);
            const transformMatrix = new DOMMatrix(computedStyle.transform);
            const translateX = transformMatrix.m41; // 获取当前的X轴偏移量

            const remainingDistance = danmu.parentNode.offsetWidth + danmu.offsetWidth + 130 + translateX; // 剩余距离
            const remainingTime = (remainingDistance / (danmu.parentNode.offsetWidth + danmu.offsetWidth + 130)) * this.speed; // 剩余时间

            danmu.style.transition = `transform ${remainingTime}s linear`;
            danmu.style.transform = `translateX(-${danmu.parentNode.offsetWidth + danmu.offsetWidth + 130}px)`; // 继续滚动
        });
    }
}

// 工具类
class Utils {
    static getStyle(element, styleProp) {
        return window.getComputedStyle(element, null)[styleProp];
    }

    static eventDelegation(parent, childClassName, eventType, callback) {
        parent.addEventListener(eventType, event => {
            try {
                if (event.target.className.includes(childClassName)) {
                    callback(event.target);
                } else if (event.target.parentNode.className.includes(childClassName)) {
                    callback(event.target.parentNode);
                }
            } catch (error) {
                console.error("事件委托错误:", error);
            }
        });
    }
}
