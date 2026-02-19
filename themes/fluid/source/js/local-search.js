/* global CONFIG */

(function() {
  'use strict';

  function setInputState(input, state) {
    input.classList.remove('valid');
    input.classList.remove('invalid');
    if (state) {
      input.classList.add(state);
    }
  }

  function parseEntries(xmlText) {
    var parser = new window.DOMParser();
    var xml = parser.parseFromString(xmlText, 'text/xml');
    var entries = xml.querySelectorAll('entry');
    return Array.prototype.map.call(entries, function(entry) {
      return {
        title  : (entry.querySelector('title') || {}).textContent || '',
        content: (entry.querySelector('content') || {}).textContent || '',
        url    : (entry.querySelector('url') || {}).textContent || ''
      };
    });
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function localSearchReset(input, result) {
    input.value = '';
    setInputState(input, '');
    result.innerHTML = '';
  }

  function bindSearchInput(input, result, dataList) {
    if (input.dataset.localSearchBound === '1') {
      return;
    }
    input.dataset.localSearchBound = '1';

    input.addEventListener('input', function() {
      var content = input.value || '';
      var keywords = content.trim().toLowerCase().split(/[\s-]+/).filter(Boolean);

      result.innerHTML = '';
      if (keywords.length === 0) {
        setInputState(input, '');
        return;
      }

      var resultHTML = '';

      dataList.forEach(function(data) {
        var isMatch = true;
        var dataTitle = (data.title || 'Untitled').trim();
        var titleLower = dataTitle.toLowerCase();
        var contentRaw = (data.content || '').trim().replace(/<[^>]+>/g, '');
        var contentLower = contentRaw.toLowerCase();
        var dataUrl = data.url;
        var firstOccur = -1;

        if (CONFIG.include_content_in_search && contentLower === '') {
          isMatch = false;
        } else {
          keywords.forEach(function(keyword, index) {
            var indexTitle = titleLower.indexOf(keyword);
            var indexContent = contentLower.indexOf(keyword);
            if (indexTitle < 0 && indexContent < 0) {
              isMatch = false;
            } else {
              if (indexContent < 0) {
                indexContent = 0;
              }
              if (index === 0) {
                firstOccur = indexContent;
              }
            }
          });
        }

        if (!isMatch) {
          return;
        }

        resultHTML += '<a href="' + dataUrl + '" class="list-group-item list-group-item-action font-weight-bolder search-list-title">' + dataTitle + '</a>';

        if (firstOccur >= 0) {
          var start = firstOccur - 20;
          var end = firstOccur + 80;
          if (start < 0) {
            start = 0;
          }
          if (start === 0) {
            end = 100;
          }
          if (end > contentRaw.length) {
            end = contentRaw.length;
          }

          var matchContent = contentRaw.substring(start, end);
          keywords.forEach(function(keyword) {
            var pattern = new RegExp(escapeRegExp(keyword), 'gi');
            matchContent = matchContent.replace(pattern, '<span class="search-word">' + keyword + '</span>');
          });

          resultHTML += '<p class="search-list-content">' + matchContent + '...</p>';
        }
      });

      if (resultHTML.indexOf('list-group-item') === -1) {
        setInputState(input, 'invalid');
        return;
      }

      setInputState(input, 'valid');
      result.innerHTML = resultHTML;
    });
  }

  function setupLocalSearch(path, input, result) {
    if (result.className.indexOf('list-group-item') === -1) {
      result.innerHTML = '<div class="m-auto text-center"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div><br/>Loading...</div>';
    }

    return fetch(path, { method: 'GET', credentials: 'same-origin' })
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Search data request failed: ' + response.status);
        }
        return response.text();
      })
      .then(function(xmlText) {
        var dataList = parseEntries(xmlText);
        if (result.innerHTML.indexOf('list-group-item') === -1) {
          result.innerHTML = '';
        }
        bindSearchInput(input, result, dataList);
      })
      .catch(function(error) {
        // eslint-disable-next-line no-console
        console.error(error);
        result.innerHTML = '';
        throw error;
      });
  }

  var modal = document.getElementById('modalSearch');
  var input = document.getElementById('local-search-input');
  var result = document.getElementById('local-search-result');
  if (!modal || !input || !result) {
    return;
  }

  var loadPromise = null;
  modal.addEventListener('show.bs.modal', function() {
    if (loadPromise) return;
    var path = CONFIG.search_path || '/local-search.xml';
    loadPromise = setupLocalSearch(path, input, result).catch(function() {
      loadPromise = null;
    });
  });

  modal.addEventListener('shown.bs.modal', function() {
    input.focus();
  });

  modal.addEventListener('hidden.bs.modal', function() {
    localSearchReset(input, result);
  });
})();
