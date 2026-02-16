function danmu() {
    if (typeof window === 'undefined' || typeof window.danmakuConfig === 'undefined') return;
    // 如果当前页面不是指定的弹幕页面或屏幕宽度小于 768，则不初始化弹幕
    if (location.pathname !== danmakuConfig.page || document.body.clientWidth < 768) return;

    // 全局状态，避免 PJAX/重复初始化导致的多次轮询与内存泄漏
    window.__danmu_state = window.__danmu_state || { intervalId: null, controller: null, instance: null };
    try { if (window.__danmu_state.intervalId) clearTimeout(window.__danmu_state.intervalId); } catch(_) {}
    try { if (window.__danmu_state.controller) window.__danmu_state.controller.abort(); } catch(_) {}
    try { if (window.__danmu_state.instance && typeof window.__danmu_state.instance.dispose === 'function') window.__danmu_state.instance.dispose(); } catch(_) {}

    console.log("弹幕初始化");

    // 初始化 EasyDanmaku 实例，配置来自 danmakuConfig
    const Danmaku = new EasyDanmaku({
        page: danmakuConfig.page,  // 页面路径
        el: '#danmu',              // 弹幕容器元素
        line: danmakuConfig.line,  // 弹幕行数
        speed: danmakuConfig.speed, // 弹幕速度
        hover: true,                // 强制开启悬停效果
        loop: danmakuConfig.loop,   // 循环播放
        colourful: true             // 启用彩色弹幕
    });
    window.__danmu_state.instance = Danmaku;

    // 兼容不同 Waline 响应结构，提取评论数组
    function extractComments(resp) {
        if (Array.isArray(resp)) return resp;
        if (resp && Array.isArray(resp.data)) return resp.data;
        if (resp && resp.data && Array.isArray(resp.data.data)) return resp.data.data;
        if (resp && Array.isArray(resp.comments)) return resp.comments;
        return [];
    }

    // 定义一个函数获取并更新弹幕数据
    function fetchAndUpdateDanmu(signal) {
        const targetPath = encodeURIComponent(danmakuConfig.page || window.location.pathname || '/comments/');
        return fetch(`https://waline.phlin.cn/api/comment?path=${targetPath}&page=1&pageSize=100&sortBy=insertedAt_asc`, {
            method: "GET",
            headers: { 'Content-Type': 'application/json' },
            signal
        })
        .then(res => res.json())  // 将响应解析为 JSON
        .then(response => {
            const data = extractComments(response);
            if (Array.isArray(data) && data.length > 0) {
                const ls = [];
                data.forEach(i => {
                    const nick = (i && (i.nick || i.nickname || '匿名'));
                    const content = (i && (i.comment || i.content || ''));
                    const avatar = (i && i.avatar) ? i.avatar : 'https://cravatar.cn/avatar/d615d5793929e8c7d70eab5f00f7f5f1?d=mp';
                    const text = nick + '：' + formatDanmaku(String(content || ''));
                    ls.push({ avatar: avatar, content: text, url: window.location.pathname + '#' + (i && i.objectId || '') });
                });
                // 更新 localStorage 中的弹幕数据
                try { localStorage.setItem('danmu', JSON.stringify(ls)); } catch(_) {}
                // 发送弹幕数据
                Danmaku.batchSend(ls, true);
            } else {
                console.log("未找到有效的评论数据，返回的数据结构可能不正确。", response);
            }
        });
    }

    // 首次初始化时从 localStorage 读取并发送弹幕
    let cached = null;
    try {
        const raw = localStorage.getItem('danmu');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                cached = parsed.filter(x => x && typeof x.content === 'string');
            }
        }
    } catch(_) {}
    if (cached && cached.length) {
        Danmaku.batchSend(cached, true);
    }

    // 轮询：从 15s 起，错误指数退避至最多 60s
    let delay = 15000;
    const minDelay = 10000, maxDelay = 60000;
    const scheduleNext = (d) => {
        try { if (window.__danmu_state.intervalId) clearTimeout(window.__danmu_state.intervalId); } catch(_) {}
        window.__danmu_state.intervalId = setTimeout(tick, d);
    };
    const tick = () => {
        try { if (window.__danmu_state.controller) window.__danmu_state.controller.abort(); } catch(_) {}
        const ctl = new AbortController();
        window.__danmu_state.controller = ctl;
        fetchAndUpdateDanmu(ctl.signal)
          .then(() => { delay = Math.max(minDelay, 15000); scheduleNext(delay); })
          .catch(err => {
            if (err && err.name === 'AbortError') { return; }
            console.error('获取评论时发生错误:', err);
            delay = Math.min(maxDelay, Math.floor(delay * 1.6));
            scheduleNext(delay);
          });
    };
    // 立即请求一次，然后进入轮询
    tick();

    // 设置弹幕显示/隐藏按钮功能（容器存在才注入，避免空指针）
    var danmuBtnCtn = document.getElementById('danmuBtn');
    if (danmuBtnCtn) {
        danmuBtnCtn.innerHTML = '';
        var showBtn = document.createElement('button');
        showBtn.className = 'hideBtn';
        showBtn.type = 'button';
        showBtn.textContent = '显示弹幕';
        var hideBtn = document.createElement('button');
        hideBtn.className = 'hideBtn';
        hideBtn.type = 'button';
        hideBtn.textContent = '隐藏弹幕';
        showBtn.addEventListener('click', function(){
          try { document.getElementById('danmu').classList.remove('hidedanmu'); } catch(_) {}
        });
        hideBtn.addEventListener('click', function(){
          try { document.getElementById('danmu').classList.add('hidedanmu'); } catch(_) {}
        });
        danmuBtnCtn.appendChild(showBtn);
        danmuBtnCtn.appendChild(hideBtn);
    }
}

// 格式化评论内容，去除多余的 HTML 标签
function formatDanmaku(str) {
    str = str.replace(/<\/*br>|[\s\uFEFF\xA0]+/g, '');  // 删除不必要的换行符和空格
    str = str.replace(/<img.*?>/g, '[图片]');           // 替换图片
    str = str.replace(/<a.*?>.*?<\/a>/g, '[链接]');      // 替换链接
    str = str.replace(/<pre.*?>.*?<\/pre>/g, '[代码块]'); // 替换代码块
    str = str.replace(/<.*?>/g, '');                    // 删除所有剩余的 HTML 标签
    return str;
}

// 初始化弹幕（仅当配置存在时）
if (typeof window !== 'undefined' && typeof window.danmakuConfig !== 'undefined') {
    danmu();
    // 使用 PJAX 导航时重新初始化弹幕
    document.addEventListener("pjax:complete", danmu);
}
