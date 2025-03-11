function danmu() {
    // 如果当前页面不是指定的弹幕页面或屏幕宽度小于 768，则不初始化弹幕
    if (location.pathname !== danmakuConfig.page || document.body.clientWidth < 768) return;

    console.log("弹幕初始化");

    // 初始化 EasyDanmaku 实例，配置来自 danmakuConfig
    const Danmaku = new EasyDanmaku({
        page: danmakuConfig.page,  // 页面路径
        el: '#danmu',              // 弹幕容器元素
        line: danmakuConfig.line,  // 弹幕行数
        speed: danmakuConfig.speed, // 弹幕速度
        hover: danmakuConfig.hover, // 悬停效果
        loop: danmakuConfig.loop   // 循环播放
    });

    // 定义一个函数获取并更新弹幕数据
    function fetchAndUpdateDanmu() {
        fetch(`https://waline.phlin.cn/api/comment?path=/comments/&page=1&pageSize=100&sortBy=insertedAt_asc`, {
            method: "GET",
            headers: { 'Content-Type': 'application/json' }
        })
        .then(res => res.json())  // 将响应解析为 JSON
        .then(response => {

            // 检查 response.data.data 是否存在并且是数组
            if (response && response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                const data = response.data.data;  // 获取评论数据
                let ls = [];

                // 遍历评论数据并格式化为弹幕
                data.forEach(i => {
                    if (!i.avatar) {
                        i.avatar = 'https://cravatar.cn/avatar/d615d5793929e8c7d70eab5f00f7f5f1?d=mp'; // 设置默认头像
                    }
                    ls.push({ 
                        avatar: i.avatar, 
                        content: i.nick + '：' + formatDanmaku(i.comment), 
                        url: window.location.pathname + '#' + i.objectId // 拼接评论链接
                    });
                });


                // 更新 localStorage 中的弹幕数据
                localStorage.setItem('danmu', JSON.stringify(ls));  

                // 发送弹幕数据
                Danmaku.batchSend(ls, true);
            } else {
                console.log("未找到有效的评论数据，返回的数据结构可能不正确。");  // 数据结构不符合预期
            }
        })
        .catch(err => {
            console.error("获取评论时发生错误:", err);  // 捕获并输出错误
        });
    }

    // 首次初始化时从 localStorage 读取并发送弹幕
    let data = localStorage.getItem('danmu');
    if (data) {
        Danmaku.batchSend(JSON.parse(data), true);
    } else {
        // 如果 localStorage 没有数据，立即发送请求获取弹幕数据
        fetchAndUpdateDanmu();
    }

    // 每5秒重新发送请求并更新弹幕数据
    setInterval(() => {
        fetchAndUpdateDanmu();  // 定时每5秒请求一次数据
    }, 5000);

    // 设置弹幕显示/隐藏按钮功能
    document.getElementById('danmuBtn').innerHTML = `
        <button class="hideBtn" onclick="document.getElementById('danmu').classList.remove('hidedanmu')">显示弹幕</button> 
        <button class="hideBtn" onclick="document.getElementById('danmu').classList.add('hidedanmu')">隐藏弹幕</button>`;
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

// 初始化弹幕
danmu();

// 使用 PJAX 导航时重新初始化弹幕
document.addEventListener("pjax:complete", danmu);