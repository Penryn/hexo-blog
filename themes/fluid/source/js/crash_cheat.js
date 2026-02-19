// 崩溃欺骗
var originTitle = document.title;
var titleTime;
var faviconHref = "https://qiuniu.phlin.cn/bucket/icon.png";

function setFavicon(href) {
  var icons = document.querySelectorAll('link[rel~="icon"]');
  if (!icons.length) {
    var icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
    icons = [icon];
  }
  for (var i = 0; i < icons.length; i++) {
    icons[i].setAttribute("href", href);
  }
}

document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    setFavicon(faviconHref);
    document.title = "╭(°A°`)╮ 页面崩溃啦 ~";
    clearTimeout(titleTime);
    return;
  }

  setFavicon(faviconHref);
  document.title = "(ฅ>ω<*ฅ) 噫又好啦 ~" + originTitle;
  titleTime = setTimeout(function () {
    document.title = originTitle;
  }, 2000);
});
