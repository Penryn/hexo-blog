/* global Fluid, CONFIG */

if (!HTMLElement.prototype.wrap) {
  HTMLElement.prototype.wrap = function(wrapper) {
    this.parentNode.insertBefore(wrapper, this);
    this.parentNode.removeChild(this);
    wrapper.appendChild(this);
  };
}

Fluid.plugins = {

  typing: function(text) {
    if (!('Typed' in window)) { return; }

    var typed = new window.Typed('#subtitle', {
      strings: [
        '  ',
        text
      ],
      cursorChar: CONFIG.typing.cursorChar,
      typeSpeed : CONFIG.typing.typeSpeed,
      loop      : CONFIG.typing.loop
    });
    typed.stop();
    var subtitle = document.getElementById('subtitle');
    if (subtitle) {
      subtitle.innerText = '';
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        typed.start();
      }, { once: true });
    } else {
      typed.start();
    }
  },

  fancyBox: function(selector) {
    var jq = window.jQuery;
    if (!CONFIG.image_zoom.enable || !jq || !jq.fancybox) { return; }

    jq(selector || '.markdown-body :not(a) > img, .markdown-body > img').each(function() {
      var $image = jq(this);
      var imageUrl = $image.attr('data-src') || $image.attr('src') || '';
      if (CONFIG.image_zoom.img_url_replace) {
        var rep = CONFIG.image_zoom.img_url_replace;
        var r1 = rep[0] || '';
        var r2 = rep[1] || '';
        if (r1) {
          if (/^re:/.test(r1)) {
            r1 = r1.replace(/^re:/, '');
            var reg = new RegExp(r1, 'gi');
            imageUrl = imageUrl.replace(reg, r2);
          } else {
            imageUrl = imageUrl.replace(r1, r2);
          }
        }
      }
      var $imageWrap = $image.wrap(`
        <a class="fancybox fancybox.image" href="${imageUrl}"
          itemscope itemtype="http://schema.org/ImageObject" itemprop="url"></a>`
      ).parent('a');
      if ($imageWrap.length !== 0) {
        if ($image.is('.group-image-container img')) {
          $imageWrap.attr('data-fancybox', 'group').attr('rel', 'group');
        } else {
          $imageWrap.attr('data-fancybox', 'default').attr('rel', 'default');
        }

        var imageTitle = $image.attr('title') || $image.attr('alt');
        if (imageTitle) {
          $imageWrap.attr('title', imageTitle).attr('data-caption', imageTitle);
        }
      }
    });

    jq.fancybox.defaults.hash = false;
    jq('.fancybox').fancybox({
      loop   : true,
      helpers: {
        overlay: {
          locked: false
        }
      }
    });
  },

  imageCaption: function(selector) {
    if (!CONFIG.image_caption.enable) { return; }

    var imageSelector = selector || `.markdown-body > p > img, .markdown-body > figure > img,
      .markdown-body > p > a.fancybox, .markdown-body > figure > a.fancybox`;
    var targets = document.querySelectorAll(imageSelector);

    for (const target of targets) {
      var figcaption = target.nextElementSibling;
      if (figcaption && figcaption.tagName === 'FIGCAPTION') {
        figcaption.classList.add('image-caption');
        continue;
      }

      var imageTitle = '';
      if (target.tagName === 'A') {
        imageTitle = target.getAttribute('title') || target.getAttribute('data-caption') || '';
        if (!imageTitle) {
          var childImg = target.querySelector('img');
          if (childImg) {
            imageTitle = childImg.getAttribute('title') || childImg.getAttribute('alt') || '';
          }
        }
      } else {
        imageTitle = target.getAttribute('title') || target.getAttribute('alt') || '';
      }

      if (imageTitle && target.parentNode) {
        var caption = document.createElement('figcaption');
        caption.setAttribute('aria-hidden', 'true');
        caption.className = 'image-caption';
        caption.textContent = imageTitle;
        target.parentNode.insertBefore(caption, target.nextSibling);
      }
    }
  },

  codeWidget() {
    var enableLang = CONFIG.code_language.enable && CONFIG.code_language.default;
    var enableCopy = CONFIG.copy_btn && 'ClipboardJS' in window;
    if (!enableLang && !enableCopy) {
      return;
    }

    function getBgClass(ele) {
      return Fluid.utils.getBackgroundLightness(ele) >= 0 ? 'code-widget-light' : 'code-widget-dark';
    }

    document.querySelectorAll('.markdown-body pre').forEach(function(pre) {
      if (pre.querySelector('code.mermaid')) {
        return;
      }
      if (pre.querySelector('span.line')) {
        return;
      }
      if (pre.querySelector('.code-widget')) {
        return;
      }

      var lang = '';

      if (enableLang) {
        lang = CONFIG.code_language.default;
        var firstChild = pre.children.length > 0 ? pre.children[0] : null;
        if (firstChild && firstChild.classList.length >= 2 && firstChild.classList.contains('hljs')) {
          lang = firstChild.classList[1];
        } else if (pre.getAttribute('data-language')) {
          lang = pre.getAttribute('data-language');
        } else if (pre.parentElement && pre.parentElement.classList.contains('sourceCode') && firstChild && firstChild.classList.length >= 2) {
          lang = firstChild.classList[1];
          pre.parentElement.classList.add('code-wrapper');
        } else if (pre.parentElement && pre.parentElement.classList.contains('markdown-body') && pre.classList.length === 0) {
          var wrapper = document.createElement('div');
          wrapper.className = 'code-wrapper';
          pre.wrap(wrapper);
        }
        lang = lang.toUpperCase().replace('NONE', CONFIG.code_language.default);
      }

      var widget = document.createElement('div');
      widget.className = getBgClass(pre) + (enableCopy ? ' code-widget copy-btn' : ' code-widget');

      if (enableCopy) {
        widget.setAttribute('data-clipboard-snippet', '');
        var icon = document.createElement('i');
        icon.className = 'iconfont icon-copy';
        widget.appendChild(icon);
      }

      widget.appendChild(document.createTextNode(lang));
      pre.appendChild(widget);
    });

    if (enableCopy && !Fluid.plugins._clipboard) {
      Fluid.plugins._clipboard = new ClipboardJS('.copy-btn', {
        target: function(trigger) {
          var nodes = trigger.parentNode ? trigger.parentNode.childNodes : [];
          for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].tagName === 'CODE') {
              return nodes[i];
            }
          }
        }
      });
      Fluid.plugins._clipboard.on('success', function(e) {
        e.clearSelection();
        var icon = e.trigger.querySelector('i.iconfont');
        if (!icon) return;
        icon.classList.remove('icon-copy');
        icon.classList.add('icon-success');
        setTimeout(function() {
          icon.classList.remove('icon-success');
          icon.classList.add('icon-copy');
        }, 2000);
      });
    }
  }
};
