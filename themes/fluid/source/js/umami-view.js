(function () {
  var umamiCfg = (((window.CONFIG || {}).web_analytics || {}).umami) || {};
  var websiteId = String(umamiCfg.website_id || "").trim();
  var apiServer = String(umamiCfg.api_server || "").trim().replace(/\/+$/, "");
  var startAt = new Date(umamiCfg.start_time).getTime();
  var endAt = Date.now();
  var token = String(umamiCfg.token || "").trim();

  function hasRequiredConfig() {
    if (!websiteId || !apiServer || !startAt || !token) {
      console && console.warn && console.warn("[Umami] Skip stats view: missing required config");
      return false;
    }
    return true;
  }

  if (!hasRequiredConfig()) return;

  var requestUrl = apiServer + "/websites/" + websiteId + "/stats";
  var params = new URLSearchParams({
    startAt: String(startAt),
    endAt: String(endAt)
  });
  var requestHeader = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    }
  };

  function showValue(containerSelector, valueSelector, value) {
    var container = document.querySelector(containerSelector);
    if (!container) return;

    var element = document.querySelector(valueSelector);
    if (!element) return;

    element.textContent = value;
    container.style.display = "inline";
  }

  async function fetchStats(path) {
    var url = requestUrl + "?" + params.toString();
    if (path) {
      url += "&url=" + encodeURIComponent(path);
    }

    var response = await fetch(url, requestHeader);
    if (!response.ok) {
      throw new Error("[Umami] API request failed with status " + response.status);
    }
    return response.json();
  }

  async function siteStats() {
    try {
      var data = await fetchStats("");
      showValue("#umami-site-pv-container", "#umami-site-pv", data.pageviews.value);
      showValue("#umami-site-uv-container", "#umami-site-uv", data.uniques.value);
    } catch (error) {
      console && console.error && console.error(error);
    }
  }

  async function pageStats(path) {
    try {
      var data = await fetchStats(path);
      showValue("#umami-page-views-container", "#umami-page-views", data.pageviews.value);
    } catch (error) {
      console && console.error && console.error(error);
    }
  }

  siteStats();

  var viewContainer = document.querySelector("#umami-page-views-container");
  if (viewContainer) {
    var path = window.location.pathname;
    var target = decodeURI(path.replace(/\/*(index.html)?$/, "/"));
    pageStats(target);
  }
})();
