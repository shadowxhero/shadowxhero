// ==UserScript==
// @name         K4G汉化
// @namespace    k4g-local-cn
// @version      4.0.0
// @description  K4G网站汉化翻译脚本，支持词典管理、动态翻译、导入导出等功能
// @match        https://k4g.com/*
// @match        https://www.k4g.com/*
// @require      https://raw.githubusercontent.com/shadowxhero/shadowxhero/refs/heads/main/K4G/K4G_CN.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const DICT_KEY = 'k4g_local_dict_v3';
  const SETTINGS_KEY = 'k4g_local_settings_v1';

  let settings = Object.assign(
    { caseInsensitiveEnglish: true },
    GM_getValue(SETTINGS_KEY, {})
  );

  function saveSettings() {
    GM_setValue(SETTINGS_KEY, settings);
  }

  let userDict = GM_getValue(DICT_KEY, {});
  let externalDict = window.K4G_EXTERNAL_DICT || {};
  let defaultDict = {}; // 内置默认词典（当前为空）
  let embeddedUserDict = {}; // 嵌入的用户词典（当前为空）
  let dict = { ...defaultDict, ...embeddedUserDict, ...externalDict, ...userDict };
  let compiledRules = [];

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'SVG', 'CANVAS', 'IFRAME'
  ]);

  const SKIP_SELECTORS = [
    '[class*="RowResult_title__"]',
    '[class*="CoverWithTitle_"]',
    '[data-testid="TABLE_ROW_TEST_ID"] [class*="column-5"]',
    'a[href^="/product/"]',
    '[class*="ProductTitle"]',
    '[class*="product-title"]',

    // 排除商品标题本体，但不再整体排除 tooltip，避免功能提示文案无法翻译

    '[class*="PanelCard_titleNameContainer__"]',
    '[class*="PanelCard_title__"]',
    '[class*="PanelCard_name__"]',

    '[class*="FloatingHeader_image__"]',
    '[class*="FloatingHeader_"]',
    '[class*="ResultRow_title__"]',
    '[class*="ResultRow_coverWithTitle__"]',
    '[class*="NewOffer_imageAndTitleContainer__"]',
    '[class*="NewOffer_title__"]',
    '[class*="NewOffer_image__"]',
    '[class*="NewOffer_productId__"]',
    '[class*="MenuDesktop_"]',
    '[class*="MenuMobile_"]',
    '[data-testid="MENU_SPOT"]',
    '.section-affiliate',
    '.section-affiliate *',
    '[data-testid="SINGLE_TICKET_CONTENT"]',
    '[data-testid="SINGLE_TICKET_CONTENT"] *'
  ];
  const SKIP_SELECTOR_JOINED = SKIP_SELECTORS.join(',');

  const STOCK_COUNTER_CONTEXT_SELECTORS = [
    '[class*="viewstock_keysCount__"]',
    '[class*="ViewStock"]',
    '[data-testid="PANEL_RESULTS_CONTAINER_TESTID"]',
    '[data-testid="TABLE_ROW_TEST_ID"]',
    '[class*="Stock"]',
    '[class*="stock"]'
  ];
  const STOCK_CONTEXT_JOINED = STOCK_COUNTER_CONTEXT_SELECTORS.join(',');

  const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const isAsciiWordLike = s => /^[A-Za-z0-9 ]+$/.test(s);

  function isProductTitleTooltip(el) {
    if (!el || !el.closest) return false;

    const tooltip = el.closest('[role="tooltip"]');
    if (!tooltip) return false;

    const text = (tooltip.textContent || '').trim();
    if (!text) return false;

    // 商品名 tooltip 常见特征：包含平台/版本词，且通常不带句号的说明性长句
    const looksLikeProductTitle = /\b(Steam|Xbox|PlayStation|PS4|PS5|Epic|Origin|EA App|Battle\.net|Ubisoft|Standard Edition|Ultimate Edition|Deluxe Edition|Complete Edition|Account|Altergift|Gift|Key|GLOBAL|Global)\b/i.test(text);
    const looksLikeDescription = /[.!?]|\b(Turn on|Set your|This option|allows us|for which you are willing|maximize your sales|revenue|profit)\b/i.test(text);

    return looksLikeProductTitle && !looksLikeDescription;
  }

  function inSkipArea(el) {
    if (!el || !el.closest) return false;
    try { return !!el.closest(SKIP_SELECTOR_JOINED); } catch { return false; }
  }

  function inStockCounterContext(el) {
    if (!el || !el.closest) return false;
    try { return !!el.closest(STOCK_CONTEXT_JOINED); } catch { return false; }
  }

  function compileRulesFromDict(mergedDict) {
    const entries = Object.entries(mergedDict)
      .filter(([k, v]) => !!k && typeof v === 'string')
      .sort((a, b) => b[0].length - a[0].length);

    const rules = [];

    if (!settings.caseInsensitiveEnglish) {
      for (const [k, v] of entries) {
        if (isAsciiWordLike(k)) {
          rules.push({ re: new RegExp(`\\b${escapeRegExp(k)}\\b`, 'g'), to: v });
        } else {
          rules.push({ re: new RegExp(escapeRegExp(k), 'g'), to: v });
        }
      }
      return rules;
    }

    const ciBuckets = new Map();
    const nonAsciiEntries = [];

    for (const [k, v] of entries) {
      if (isAsciiWordLike(k)) {
        const lower = k.toLowerCase();
        if (!ciBuckets.has(lower)) ciBuckets.set(lower, []);
        ciBuckets.get(lower).push({ k, v });
      } else {
        nonAsciiEntries.push([k, v]);
      }
    }

    for (const [k, v] of nonAsciiEntries) {
      rules.push({ re: new RegExp(escapeRegExp(k), 'g'), to: v });
    }

    for (const [, items] of ciBuckets) {
      const toSet = new Set(items.map(it => it.v));

      if (toSet.size === 1) {
        const rep = items[0];
        rules.push({ re: new RegExp(`\\b${escapeRegExp(rep.k)}\\b`, 'gi'), to: rep.v });
      } else {
        items.sort((a, b) => b.k.length - a.k.length);
        for (const it of items) {
          rules.push({ re: new RegExp(`\\b${escapeRegExp(it.k)}\\b`, 'g'), to: it.v });
        }
      }
    }

    rules.sort((a, b) => b.re.source.length - a.re.source.length);
    return rules;
  }

  function rebuildDictAndRules() {
    userDict = GM_getValue(DICT_KEY, {});
    externalDict = window.K4G_EXTERNAL_DICT || {};
    dict = { ...defaultDict, ...embeddedUserDict, ...externalDict, ...userDict };
    compiledRules = compileRulesFromDict(dict);
  }

  function injectFixStyles() {
    if (document.getElementById('k4g-cn-style-fix-status')) return;

    const css = `
      [data-testid="TABLE_ROW_TEST_ID"] [class*="Label_label__"],
      [class*="ResultRow_"] [class*="Label_label__"] {
        display: inline-flex !important;
        align-items: center !important;
        white-space: nowrap !important;
        overflow: visible !important;
        text-overflow: clip !important;
        max-width: none !important;
        min-width: 0 !important;
        width: auto !important;
      }

      [data-testid="TABLE_ROW_TEST_ID"] [class*="Table_tableRowItem__"].column-1,
      [data-testid="TABLE_ROW_TEST_ID"] [class*="Table_tableRowItem__"].column-2,
      [data-testid="TABLE_ROW_TEST_ID"] [class*="Table_tableRowItem__"].column-3 {
        overflow: visible !important;
        min-width: 110px !important;
      }

      [data-testid="TABLE_ROW_TEST_ID"] [class*="Label_label__"] [class*="Label_iconWrapper__"],
      [class*="ResultRow_"] [class*="Label_label__"] [class*="Label_iconWrapper__"] {
        flex: 0 0 auto !important;
      }

      [data-testid="TABLE_ROW_TEST_ID"] [class*="Label_label__"] > *:not([class*="Label_iconWrapper__"]),
      [class*="ResultRow_"] [class*="Label_label__"] > *:not([class*="Label_iconWrapper__"]) {
        flex-shrink: 0 !important;
      }
    `;

    const style = document.createElement('style');
    style.id = 'k4g-cn-style-fix-status';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function translateDynamicCounters(str, ctxEl) {
    if (!str || typeof str !== 'string') return str;
    let out = str;

    out = out.replace(/^(\s*)(\d+)\s+Keys?(\s*)$/i, '$1$2 个密钥$3');

    if (inStockCounterContext(ctxEl)) {
      out = out.replace(/(\bAmount:\s*)(\d+)\s+Keys?\b/gi, '$1$2 个密钥');
    }

    return out;
  }

  function translateKeyPluralPhrases(str, ctxEl) {
    if (!str || typeof str !== 'string') return str;
    let out = str;

    out = out.replace(/\bNo\s+keys?\s+found\b/gi, '未找到密钥');
    out = out.replace(/\b(\d+)\s+keys?\s+found\b/gi, '找到 $1 个密钥');

    if (inStockCounterContext(ctxEl)) {
      out = out.replace(/\b(\d+)\s+keys?\s+left\b/gi, '剩余 $1 个密钥');
      out = out.replace(/\b(\d+)\s+keys?\s+available\b/gi, '可用 $1 个密钥');
    }

    return out;
  }

  // 通知弹窗动态短语
  function translateNotificationPhrases(str) {
    if (!str || typeof str !== 'string') return str;
    let out = str;

    // 时间
    out = out.replace(/\ba minute ago\b/gi, '1 分钟前');
    out = out.replace(/\b(\d+)\s+minutes?\s+ago\b/gi, '$1 分钟前');

    // Offer XXX fell from position 1 to 2
    out = out.replace(
      /\bOffer\s+(.+?)\s+fell from position\s+(\d+)\s+to\s+(\d+)\b/gi,
      '报价 $1 从第 $2 名下降到第 $3 名'
    );

    return out;
  }

  function normalizeMixedOutput(str) {
    if (!str || typeof str !== 'string') return str;
    let out = str;

    out = out.replace(/支持\s+工单/g, '支持工单');
    out = out.replace(/已售\s+offers/gi, '已售报价');
    out = out.replace(/支持\s+Tickets/gi, '支持工单');
    out = out.replace(/support\s+工单/gi, '支持工单');

    return out;
  }

  function fixChineseSpacing(root = document.body) {
    if (!root) return 0;
    let changed = 0;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (!n || !n.nodeValue || !n.parentElement) continue;
      if (shouldSkipTextNode(n)) continue;

      let t = n.nodeValue;
      const old = t;

      t = t
        .replace(/\s+([，。！？：；、）】》])/g, '$1')
        .replace(/([（【《])\s+/g, '$1')
        .replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, '$1$2')
        .replace(/([\u4e00-\u9fff])\s+([！？。])/g, '$1$2');

      if (/^\s+[\u4e00-\u9fff]/.test(t)) {
        let p = n.previousSibling;
        let prevChar = '';

        while (p) {
          if (p.nodeType === Node.TEXT_NODE) {
            const s = (p.nodeValue || '').trim();
            if (s) { prevChar = s.slice(-1); break; }
          } else if (p.nodeType === Node.ELEMENT_NODE) {
            const s = (p.textContent || '').trim();
            if (s) { prevChar = s.slice(-1); break; }
          }
          p = p.previousSibling;
        }

        if (/[\u4e00-\u9fff]/.test(prevChar)) {
          t = t.replace(/^\s+/, '');
        }
      }

      if (t !== old) {
        n.nodeValue = t;
        changed++;
      }
    }

    return changed;
  }

  function translateString(str, ctxEl = null) {
    if (!str || typeof str !== 'string') return str;
    let out = str;

    out = translateDynamicCounters(out, ctxEl);
    out = translateKeyPluralPhrases(out, ctxEl);
    out = translateNotificationPhrases(out);

    for (const r of compiledRules) {
      out = out.replace(r.re, r.to);
    }

    return normalizeMixedOutput(out);
  }

  function shouldSkipTextNode(node) {
    if (!node || !node.parentElement) return true;
    const el = node.parentElement;
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (inSkipArea(el)) return true;
    if (isProductTitleTooltip(el)) return true;
    if (el.isContentEditable) return true;

    const t = node.nodeValue;
    if (!t || !t.trim()) return true;
    return false;
  }

  function scanTextNodes(root = document.body) {
    let changed = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (shouldSkipTextNode(n)) continue;
      const raw = n.nodeValue;
      const next = translateString(raw, n.parentElement);
      if (next !== raw) {
        n.nodeValue = next;
        changed++;
      }
    }
    return changed;
  }

  function scanAttributes(root = document.body) {
    let changed = 0;
    const elems = root.querySelectorAll?.('[placeholder],[title],[aria-label]');
    if (!elems) return 0;

    for (const el of elems) {
      if (inSkipArea(el)) continue;
      if (isProductTitleTooltip(el)) continue;
      for (const attr of ['placeholder', 'title', 'aria-label']) {
        if (!el.hasAttribute(attr)) continue;
        const raw = el.getAttribute(attr);
        if (!raw || !raw.trim()) continue;
        const next = translateString(raw, el);
        if (next !== raw) {
          el.setAttribute(attr, next);
          changed++;
        }
      }
    }
    return changed;
  }

  function scan(root = document.body) {
    if (!root) return;
    const c1 = scanTextNodes(root);
    const c2 = scanAttributes(root);
    const c3 = fixChineseSpacing(root);
    const total = c1 + c2 + c3;

    if (total > 0) {
      showBadge(`替换 ${total} 处｜CI:${settings.caseInsensitiveEnglish ? '开' : '关'}`);
    } else {
      hideBadge();
    }
  }

  let timer = null;
  function scheduleScan(root = document.body) {
    clearTimeout(timer);
    timer = setTimeout(() => scan(root), 180);
  }

  function hookHistory() {
    const _push = history.pushState;
    const _replace = history.replaceState;

    history.pushState = function (...args) {
      const ret = _push.apply(this, args);
      setTimeout(() => scan(document.body), 320);
      return ret;
    };
    history.replaceState = function (...args) {
      const ret = _replace.apply(this, args);
      setTimeout(() => scan(document.body), 320);
      return ret;
    };
    window.addEventListener('popstate', () => setTimeout(() => scan(document.body), 320));
  }

  function showBadge(text) {
    let el = document.getElementById('k4g-cn-badge');
    if (!el) {
      el = document.createElement('div');
      el.id = 'k4g-cn-badge';
      Object.assign(el.style, {
        position: 'fixed',
        right: '12px',
        bottom: '12px',
        zIndex: '999999',
        background: 'rgba(0,0,0,.72)',
        color: '#fff',
        fontSize: '12px',
        padding: '6px 10px',
        borderRadius: '8px',
        cursor: 'pointer',
        userSelect: 'none'
      });
      el.title = '点击手动重扫';
      el.onclick = () => scan(document.body);
      document.body.appendChild(el);
    }
    el.style.display = 'block';
    el.textContent = `K4G翻译：${text}`;
  }

  function hideBadge() {
    const el = document.getElementById('k4g-cn-badge');
    if (el) el.style.display = 'none';
  }

  function refreshAfterDictChange() {
    rebuildDictAndRules();
    scan(document.body);
  }

  GM_registerMenuCommand('➕ 添加词条（先选中英文）', () => {
    const selected = (window.getSelection()?.toString() || '').trim();
    const src = prompt('英文原文', selected || '');
    if (!src) return;
    const dst = prompt('中文译文', dict[src] || '');
    if (!dst) return;

    userDict[src] = dst;
    GM_setValue(DICT_KEY, userDict);
    refreshAfterDictChange();
    alert(`已保存：${src} => ${dst}`);
  });

  GM_registerMenuCommand('🗑️ 删除词条', () => {
    const key = prompt('输入要删除的英文词条');
    if (!key) return;
    if (key in userDict) {
      delete userDict[key];
      GM_setValue(DICT_KEY, userDict);
      refreshAfterDictChange();
      alert(`已删除：${key}`);
    } else {
      alert('该词条不在用户词典中');
    }
  });

  GM_registerMenuCommand('📤 导出词典(仅用户词典)', () => {
    prompt('复制JSON', JSON.stringify(userDict, null, 2));
  });

  GM_registerMenuCommand('📥 导入词典', () => {
    const txt = prompt('粘贴JSON');
    if (!txt) return;
    try {
      const obj = JSON.parse(txt);
      if (Object.prototype.toString.call(obj) !== '[object Object]') {
        alert('JSON必须是对象格式，如 {"Hello":"你好"}');
        return;
      }
      userDict = { ...userDict, ...obj };
      GM_setValue(DICT_KEY, userDict);
      refreshAfterDictChange();
      alert('导入成功');
    } catch {
      alert('JSON格式错误');
    }
  });

  GM_registerMenuCommand('🧩 导出“合并后词典”(用于写入defaultDict)', () => {
    const merged = { ...defaultDict, ...embeddedUserDict, ...externalDict, ...userDict };
    prompt('复制下面JSON：', JSON.stringify(merged, null, 2));
  });

  GM_registerMenuCommand('🧹 清空本地用户词典(GM_setValue)', () => {
    if (!confirm('确定清空本地用户词典吗？此操作不可撤销。')) return;
    userDict = {};
    GM_setValue(DICT_KEY, userDict);
    refreshAfterDictChange();
    alert('已清空本地用户词典，仅保留脚本内置及外部词典。');
  });

  GM_registerMenuCommand(`🔤 切换英文大小写不敏感（当前：${settings.caseInsensitiveEnglish ? '开' : '关'}）`, () => {
    settings.caseInsensitiveEnglish = !settings.caseInsensitiveEnglish;
    saveSettings();
    refreshAfterDictChange();
    alert(`英文大小写不敏感：${settings.caseInsensitiveEnglish ? '已开启' : '已关闭'}`);
  });

  GM_registerMenuCommand('🔄 手动重扫页面', () => scan(document.body));

  function start() {
    injectFixStyles();
    rebuildDictAndRules();

    showBadge('启动中...');
    setTimeout(() => scan(document.body), 700);
    setTimeout(() => scan(document.body), 2000);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList' || m.type === 'characterData') {
          scheduleScan(document.body);
          return;
        }
      }
    });

    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });

    hookHistory();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
