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
    // 仅允许 https，避免混合内容与降级攻击
    if (u.protocol === 'https:') {
      return u.href;
    }
  } catch (_) {}
  return '';
}

function truncateText(text, maxLen) {
  const s = String(text || '');
  if (!maxLen || s.length <= maxLen) return s;
  return s.slice(0, maxLen) + '…';
}

class EasyDanmaku {
    constructor(config) {
        this.container = this.checkParams(config);
        this.wrapperStyle = config.wrapperStyle || null;
        this.line = config.line || 10;
        this.speed = config.speed || 5;
        this.runtime = config.runtime || 10;
        this.colourful = config.colourful || false;
        this.loop = config.loop || false;
        this.hover = config.hover || false;
        this.offsetValue = this.container.offsetHeight / this.line;
        this.aisle = [];
        this.overflowArr = [];
        this.sentComments = new Set();
        this.clearIng = false;
        this._batchTimer = null;
        
        // 优化的配色方案 (柔和的 Material/Pastel 色系)
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
            '#F7DC6F', '#BB8FCE', '#82E0AA', '#F1948A', '#85C1E9',
            '#F0B27A', '#D7BDE2', '#A9DFBF', '#F5CBA7', '#AED6F1'
        ];

        this.init();
        this.handleEvents(config);
    }

    handleEvents(config) {
        this.onComplete = config.onComplete || null;
        // hover 事件由 CSS 处理
    }

    init() {
        this.container.style.overflow = "hidden";
        const pos = window.getComputedStyle(this.container).position;
        if (pos !== "relative" && pos !== "fixed" && pos !== "absolute") {
            this.container.style.position = "relative";
        }
        
        // 初始化轨道状态
        for (let i = 0; i < this.line; i++) {
            this.aisle.push({
                occupied: false,
                lastItemTime: 0 // 记录最后一次该轨道有弹幕进入的时间
            });
        }
    }

    checkParams(config) {
        const el = document.querySelector(config.el);
        if (!el) throw `Could not find the ${config.el} element`;
        return el;
    }

    // 获取可用轨道 (优先选择空闲时间最长的轨道，避免重叠)
    getAvailableRow() {
        const now = Date.now();
        let bestRow = -1;
        let maxIdleTime = -1;

        // 随机打乱检查顺序，避免总是偏向前面的轨道
        const indexes = Array.from({ length: this.line }, (_, i) => i);
        // Fisher-Yates shuffle
        for (let i = indexes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
        }

        for (const idx of indexes) {
            if (!this.aisle[idx].occupied) {
                return idx;
            }
        }
        return -1;
    }

    send(contentObj, style = null, callback = null) {
        const contentKey = typeof contentObj === 'object' ? JSON.stringify(contentObj) : contentObj; // 简单去重

        // 这里不再强制去重，因为循环播放需要重复发送
        // if (this.sentComments.has(contentKey)) return;
        // this.sentComments.add(contentKey);

        const row = this.getAvailableRow();

        if (row !== -1) {
            this.createDanmaku(contentObj, style, row, callback, contentKey);
        } else {
            // 所有轨道都被占用，放入等待队列
            // console.log('Overflow, adding to queue');
            this.overflowArr.push({ content: contentObj, normalClass: style, key: contentKey });
            if (!this.clearIng) this.processOverflow();
        }
    }

    createDanmaku(contentObj, style, row, callback, key) {
        const danmu = document.createElement("div");
        // 处理内容，如果是纯文本对象
        if (typeof contentObj === 'string') {
             danmu.innerHTML = contentObj;
        } else if (contentObj.content) {
             danmu.innerHTML = contentObj.content;
        }

        danmu.classList.add("danmaku-item");
        if (style || this.wrapperStyle) danmu.classList.add(style || this.wrapperStyle);

        // 标记轨道被占用
        this.aisle[row].occupied = true;
        this.aisle[row].lastItemTime = Date.now();

        // 设置垂直位置，稍微随机偏移一点点，让每一行不那么死板
        const randomYOffset = (Math.random() - 0.5) * 4; 
        const topPos = row * this.offsetValue + (this.offsetValue - 30) / 2 + randomYOffset; // 假设高度约30px
        danmu.style.top = `${topPos}px`;
        
        // 设置颜色
        if (this.colourful) {
            const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            danmu.style.color = randomColor;
            // 稍作透明处理的背景
            danmu.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            danmu.style.border = `1px solid ${randomColor}`;
        }

        this.container.appendChild(danmu);

        // 必须等到下一帧才能准确获取宽度
        requestAnimationFrame(() => {
            const containerWidth = this.container.offsetWidth;
            const itemWidth = danmu.offsetWidth;
            
            // 设定CSS变量用于动画
            // 移动距离 = 容器宽 + 自身宽 + 50px缓冲
            const distance = containerWidth + itemWidth + 50; 
            danmu.style.setProperty('--d-translate-x', `-${distance}px`);
            
            // 随机速度差异：基准速度 * (0.8 ~ 1.2)
            const speed = this.speed * (0.8 + Math.random() * 0.4); 
            danmu.style.animationDuration = `${speed}s`;
            
            // 开始动画
            danmu.style.animationPlayState = 'running';

            danmu.addEventListener('animationend', () => {
                // this.sentComments.delete(key);
                danmu.remove();
                if (callback) callback({ runtime: speed, target: danmu });
            });
            
            // 计算何时释放轨道
            // 核心逻辑：当弹幕完全进入可视区域 + 一个安全间距后，轨道即可释放
            // itemWidth + safeGap (e.g. 50px)
            // 移动这么多距离需要的时间 = (itemWidth + 80) / distance * speed
            const safeGap = 80 + Math.random() * 50; // 随机间距 80-130px
            const occupyTime = ((itemWidth + safeGap) / distance) * speed * 1000;
            
            setTimeout(() => {
                this.aisle[row].occupied = false;
                // 尝试处理积压
                if (this.overflowArr.length > 0) {
                     this.processOverflow();
                 }
            }, occupyTime);
        });
    }

    processOverflow() {
        if (this.overflowArr.length === 0) {
            this.clearIng = false;
            return;
        }
        
        // 尝试非阻塞处理
        requestAnimationFrame(() => {
            const row = this.getAvailableRow();
            if (row !== -1) {
                const item = this.overflowArr.shift();
                this.createDanmaku(item.content, item.normalClass, row, null, item.key);
                this.clearIng = true; // 继续保持清理状态
                
                // 给一点小延迟避免瞬间占满
                if (this.overflowArr.length > 0) {
                     setTimeout(() => this.processOverflow(), 100);
                }
            } else {
                // 依然没有轨道，稍后再试
                this.clearIng = true;
                setTimeout(() => this.processOverflow(), 500);
            }
        });
    }

    batchSend(contentList, hasAvatar = false, style = null) {
        if (this._batchTimer) {
            clearTimeout(this._batchTimer);
            this._batchTimer = null;
        }
        
        this.originList = contentList;
        this.originIndex = 0;
        
        // 调整批量发送的间隔
        // 我们不依赖固定间隔，而是尽可能填满轨道
        // 使用一个循环检查器
        
        const sendNext = () => {
            if (this.originIndex >= this.originList.length) {
                if (this.loop) {
                    this.originIndex = 0;
                     // 循环时，稍微休息一下再重头开始，避免首尾相接太紧
                    this._batchTimer = setTimeout(sendNext, 2000);
                    return;
                } else {
                    this.onComplete && this.onComplete();
                    return;
                }
            }

            // 尝试发送，如果成功（有轨道），则继续下一个，间隔很短
            // 如果失败（无轨道，进入overflow），也继续下一个，交给 overflow 处理
            // 但是为了避免瞬间把 overflow 塞满，我们还是控制一下速率
            
            const raw = this.originList[this.originIndex];
            let contentHtml = '';

            if (hasAvatar) {
                const safeAvatar = escapeAttr(
                  sanitizeURL(raw.avatar) || 'https://cravatar.cn/avatar/d615d5793929e8c7d70eab5f00f7f5f1?d=mp'
                );
                // 限制长度，太长不好看
                const safeText = escapeHTML(truncateText(raw.content || '', 30)); 
                
                // 构建更好看的 HTML 结构
                contentHtml = `<img src="${safeAvatar}" referrerpolicy="no-referrer">` +
                              `<span>${safeText}</span>`;
            } else {
                contentHtml = `<span>${escapeHTML(truncateText(raw.content || '', 30))}</span>`;
            }
            
            // 尝试发送
            // 注意：这里 send 会处理 overflow
            this.send({ content: contentHtml }, style || this.wrapperStyle);
            
            this.originIndex++;
            
            // 动态间隔：如果 overflow 太多，就慢一点
            let delay = 300;
            if (this.overflowArr.length > 5) delay = 800;
            if (this.overflowArr.length > 10) delay = 1500;
            
            // 随机波动
            delay = delay * (0.8 + Math.random() * 0.4);
            
            this._batchTimer = setTimeout(sendNext, delay);
        };

        sendNext();
    }

    dispose() {
        if (this._batchTimer) clearTimeout(this._batchTimer);
        this.sentComments.clear();
        this.overflowArr = [];
        this.container.innerHTML = '';
    }
}

class Utils {
    static getStyle(element, styleProp) {
        return window.getComputedStyle(element, null)[styleProp];
    }
    // eventDelegation 不再需要，CSS处理 Hover
}
