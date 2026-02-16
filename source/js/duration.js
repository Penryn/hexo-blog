(function() {
  function createTime() {
    var now = new Date(); // 每次调用都获取当前时间
    var grt = new Date("2023/11/03 00:00:00"); // 建站时间
    var days = (now - grt) / 1000 / 60 / 60 / 24;
    var dnum = Math.floor(days);
    var hours = (now - grt) / 1000 / 60 / 60 - (24 * dnum);
    var hnum = Math.floor(hours);
    if (String(hnum).length === 1) { hnum = "0" + hnum; }
    var minutes = (now - grt) / 1000 / 60 - (24 * 60 * dnum) - (60 * hnum);
    var mnum = Math.floor(minutes);
    if (String(mnum).length === 1) { mnum = "0" + mnum; }
    var seconds = (now - grt) / 1000 - (24 * 60 * 60 * dnum) - (60 * 60 * hnum) - (60 * mnum);
    var snum = Math.round(seconds);
    if (String(snum).length === 1) { snum = "0" + snum; }

    var timeDateElement = document.getElementById("timeDate");
    var timesElement = document.getElementById("times");

    if (timeDateElement && timesElement) {
        timeDateElement.innerHTML = "本站已安全运行 " + dnum + " 天 ";
        timesElement.innerHTML = hnum + " 小时 " + mnum + " 分 " + snum + " 秒";
    }
  }

  // 立即执行一次，避免延迟显示
  createTime();
  // 每秒更新
  setInterval(createTime, 1000);
})();
