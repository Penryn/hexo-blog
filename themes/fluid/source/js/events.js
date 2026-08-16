/* global Fluid */

if (!HTMLElement.prototype.wrap) {
  HTMLElement.prototype.wrap = function(wrapper) {
    this.parentNode.insertBefore(wrapper, this);
    this.parentNode.removeChild(this);
    wrapper.appendChild(this);
  };
}

function setStyle(element, styles) {
  if (!element) return;
  for (var key in styles) {
    if (Object.prototype.hasOwnProperty.call(styles, key)) {
      element.style[key] = styles[key];
    }
  }
}

Fluid.events = {

  registerNavbarEvent: function() {
    var navbar = document.getElementById('navbar');
    if (!navbar) {
      return;
    }
    var submenu = document.querySelectorAll('#navbar .dropdown-menu');

    Fluid.utils.listenScroll(function() {
      var top = window.pageYOffset || document.documentElement.scrollTop || 0;
      navbar.classList[top > 50 ? 'add' : 'remove']('top-nav-collapse');
      for (const item of submenu) {
        item.classList[top > 50 ? 'add' : 'remove']('dropdown-collapse');
      }
      if (top > 0) {
        navbar.classList.remove('navbar-dark');
        for (const item of submenu) item.classList.remove('navbar-dark');
      } else {
        navbar.classList.add('navbar-dark');
        for (const item of submenu) item.classList.remove('navbar-dark');
      }
    });

    var mobileGridMenu = document.getElementById('mobile-grid-menu');
    var navToggler = document.getElementById('navbar-toggler-btn');
    if (navToggler) {
      navToggler.addEventListener('click', function() {
        if (navToggler.dataset.animating === 'true') {
          return;
        }
        navToggler.dataset.animating = 'true';
        for (const icon of document.querySelectorAll('.animated-icon')) {
          icon.classList.toggle('open');
        }

        if (window.innerWidth < 992 && mobileGridMenu) {
          navbar.classList.add('top-nav-collapse');
          mobileGridMenu.classList.toggle('show');
          if (mobileGridMenu.classList.contains('show')) {
            var cells = mobileGridMenu.querySelectorAll('.mobile-grid-cell, .mobile-grid-group-header');
            cells.forEach(function(cell, index) {
              cell.style.animationDelay = (index * 20) + 'ms';
            });
          }
          document.body.classList.toggle('mobile-menu-open', mobileGridMenu.classList.contains('show'));
        } else {
          navbar.classList.toggle('navbar-col-show');
        }

        setTimeout(function() {
          navToggler.dataset.animating = 'false';
        }, 300);
      });
    }

    if (mobileGridMenu) {
      mobileGridMenu.addEventListener('click', function(event) {
        var link = event.target.closest('a[href]');
        if (!link || link.getAttribute('href') === 'javascript:;') {
          return;
        }
        mobileGridMenu.classList.remove('show');
        for (const icon of document.querySelectorAll('.animated-icon')) {
          icon.classList.remove('open');
        }
        document.body.classList.remove('mobile-menu-open');
        navbar.classList.remove('top-nav-collapse');
        if (navToggler) {
          navToggler.dataset.animating = 'false';
        }
      });

      window.addEventListener('resize', function() {
        if (window.innerWidth >= 992 && mobileGridMenu.classList.contains('show')) {
          mobileGridMenu.classList.remove('show');
          for (const icon of document.querySelectorAll('.animated-icon')) {
            icon.classList.remove('open');
          }
          document.body.classList.remove('mobile-menu-open');
        }
      });
    }

    document.addEventListener('hidden.bs.modal', function() {
      navbar.classList.remove('navbar-col-show');
      for (const icon of document.querySelectorAll('.animated-icon')) {
        icon.classList.remove('open');
      }
    });
  },

  registerParallaxEvent: function() {
    var ph = document.querySelector('#banner[parallax="true"]');
    if (!ph) {
      return;
    }
    var board = document.getElementById('board');
    if (!board) {
      return;
    }
    var sideCols = document.querySelectorAll('.side-col');
    var maxParallaxOffset = 96;
    var lastOffset = null;

    var refreshParallaxLimit = function() {
      var offset = parseInt(window.getComputedStyle(board).marginTop, 10) || 0;
      maxParallaxOffset = 96 + offset;
    };

    var parallax = function() {
      var pxv = (window.pageYOffset || document.documentElement.scrollTop || 0) / 5;
      if (pxv > maxParallaxOffset) {
        pxv = maxParallaxOffset;
      }
      if (pxv === lastOffset) {
        return;
      }
      lastOffset = pxv;
      ph.style.transform = 'translate3d(0,' + pxv + 'px,0)';
      if (sideCols.length > 0) {
        var paddingTop = pxv + 'px';
        for (const col of sideCols) {
          if (col.style.paddingTop !== paddingTop) {
            col.style.paddingTop = paddingTop;
          }
        }
      }
    };

    refreshParallaxLimit();
    window.addEventListener('resize', refreshParallaxLimit);
    Fluid.utils.listenScroll(parallax);
  },

  registerScrollDownArrowEvent: function() {
    var scrollbar = document.querySelector('.scroll-down-bar');
    if (!scrollbar) {
      return;
    }
    scrollbar.addEventListener('click', function(event) {
      event.preventDefault();
      var navbar = document.getElementById('navbar');
      Fluid.utils.scrollToElement('#board', -(navbar ? navbar.offsetHeight : 0));
    });
  },

  registerScrollTopArrowEvent: function() {
    var topArrow = document.getElementById('scroll-top-button');
    if (!topArrow) {
      return;
    }
    var board = document.getElementById('board');
    if (!board) {
      return;
    }
    var arrowUpIcon = topArrow.querySelector('i');
    if (!arrowUpIcon) {
      return;
    }

    var posDisplay = false;
    var scrollDisplay = false;
    var mobileMaxWidth = 767;
    var isNarrowScreen = window.matchMedia
      ? window.matchMedia('(max-width: ' + mobileMaxWidth + 'px)').matches
      : ((window.innerWidth || document.documentElement.clientWidth || 0) <= mobileMaxWidth);
    // Position
    if (isNarrowScreen) {
      setStyle(topArrow, {
        right    : '8px',
        minWidth : '28px',
        minHeight: '28px'
      });
      setStyle(arrowUpIcon, {
        fontSize: '20px'
      });
    } else {
      var setTopArrowPos = function() {
        var rect = board.getBoundingClientRect();
        var boardRight = rect.right;
        var viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        var right = Math.max(0, viewportWidth - boardRight);
        posDisplay = right >= 50;
        setStyle(topArrow, {
          bottom   : scrollDisplay ? '20px' : '-60px',
          right    : posDisplay ? (right - 64) + 'px' : '8px',
          minWidth : posDisplay ? '40px' : '28px',
          minHeight: posDisplay ? '40px' : '28px'
        });
        setStyle(arrowUpIcon, {
          fontSize: posDisplay ? '32px' : '20px'
        });
      };

      setTopArrowPos();
      window.addEventListener('resize', setTopArrowPos);
    }
    // Display
    var headerHeight = board.getBoundingClientRect().top + window.pageYOffset;
    Fluid.utils.listenScroll(function() {
      var scrollHeight = window.pageYOffset || document.documentElement.scrollTop || 0;
      scrollDisplay = scrollHeight >= headerHeight;
      setStyle(topArrow, {
        bottom: scrollDisplay ? '20px' : '-60px'
      });
    });

    // Click
    topArrow.addEventListener('click', function(event) {
      event.preventDefault();
      try {
        window.scrollTo({
          top     : 0,
          behavior: 'smooth'
        });
      } catch (_) {
        window.scrollTo(0, 0);
      }
    });
  },

  registerImageLoadedEvent: function() {
    if (!('NProgress' in window)) { return; }

    var bg = document.getElementById('banner');
    if (bg) {
      var src = bg.style.backgroundImage;
      var url = src.match(/\((.*?)\)/)[1].replace(/(['"])/g, '');
      var img = new Image();
      img.onload = function() {
        window.NProgress && window.NProgress.status !== null && window.NProgress.inc(0.2);
      };
      img.src = url;
      if (img.complete) { img.onload(); }
    }

    var notLazyImages = document.querySelectorAll('main img:not([lazyload])');
    var total = notLazyImages.length;
    for (const img of notLazyImages) {
      const old = img.onload;
      img.onload = function() {
        old && old();
        window.NProgress && window.NProgress.status !== null && window.NProgress.inc(0.5 / total);
      };
      if (img.complete) { img.onload(); }
    }
  },

  registerRefreshCallback: function(callback) {
    if (!Array.isArray(Fluid.events._refreshCallbacks)) {
      Fluid.events._refreshCallbacks = [];
    }
    Fluid.events._refreshCallbacks.push(callback);
  },

  refresh: function() {
    if (Array.isArray(Fluid.events._refreshCallbacks)) {
      for (var callback of Fluid.events._refreshCallbacks) {
        if (callback instanceof Function) {
          callback();
        }
      }
    }
  },

  billboard: function() {
    if (!('console' in window)) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log(`
-------------------------------------------------
|                                               |
|      ________  __            _        __      |
|     |_   __  |[  |          (_)      |  ]     |
|       | |_ \\_| | | __   _   __   .--.| |      |
|       |  _|    | |[  | | | [  |/ /'\`\\' |      |
|      _| |_     | | | \\_/ |, | || \\__/  |      |
|     |_____|   [___]'.__.'_/[___]'.__.;__]     |
|                                               |
|            Powered by Hexo x Fluid            |
| https://github.com/fluid-dev/hexo-theme-fluid |
|                                               |
-------------------------------------------------
    `);
  }
};
