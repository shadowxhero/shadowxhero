// ==UserScript==
// @name         Gamivo 商品类型与ID
// @namespace    http://tampermonkey.net/
// @version      1.10
// @description  在 Gamivo 卖家报价表的商品名旁显示商品类型（Gift / Account）与商品 ID
// @author       Codex
// @match        https://www.gamivo.com/seller/offers*
// @match        https://gamivo.com/seller/offers*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const STYLE_ID = 'gamivo-product-id-extractor-style';
    const BADGE_CLASS = 'gamivo-product-id-badge';
    // 商品类型单独一个元素（不再与 ID 共用一个括号），样式与内容都可独立控制。
    // 注意 BADGE_CLASS 必须保持不变：它是外部识别「这一行已打过标签」的依据。
    const TYPE_BADGE_CLASS = 'gamivo-product-type-badge';
    // 行上挂的类型属性：把判定结果留在行上，便于按类型筛选或做其他处理
    const PRODUCT_TYPE_ATTR = 'data-gamivo-product-type';
    /**
     * 承载标签的容器：类型标签与 ID 标签按 **[类型][ID]** 固定在容器内摆放。
     * 用容器而非直接插在商品名后面，是为了让顺序与谁先扫描无关，
     * 避免「改 DOM → 对方 observer → 再改 DOM」的写入竞争。
     */
    const SLOT_CLASS = 'gamivo-id-with-sync';
    // 容器可能被其他脚本追加元素，用这个 class 判断容器是否已被占用，避免误删别人的内容
    const SYNC_BTN_CLASS = 'dd-sync-btn';

    // ========== 标签配色 ==========
    // 约束：ID 的浅灰(#9ca3af) 必须比未标注的灰(#6b7280) 更浅，
    // 否则 (ID: xxx) 与 [未标注类型] 两块会糊在一起。
    const BADGE_COLORS = {
        id: '#9ca3af',      // 浅灰：ID 只是编号，不抢注意力
        gift: '#7c3aed',    // 紫
        account: '#0b62d6', // 蓝
        unknown: '#6b7280'  // 灰：比 ID 更深，两者可区分
    };

    /**
     * 生成标签样式。色值只在 BADGE_COLORS 一处定义，
     * 保证「测试里断言的色值」与「页面实际用的色值」不可能跑偏。
     */
    function buildStyleText() {
        return `
            .${BADGE_CLASS}, .${TYPE_BADGE_CLASS} {
                display: inline-block !important;
                font-size: 14px !important;
                font-weight: 700 !important;
                line-height: 1.4 !important;
                white-space: nowrap !important;
                vertical-align: middle !important;
                cursor: default !important;
            }
            /* 类型在左、ID 在右，两者各自成块，中间留出间距 */
            .${TYPE_BADGE_CLASS} { margin-left: 10px !important; }
            .${BADGE_CLASS} { margin-left: 8px !important; }
            /* 配色（不使用绿色） */
            .${BADGE_CLASS} { color: ${BADGE_COLORS.id} !important; }
            .${TYPE_BADGE_CLASS}[data-type="gift"] { color: ${BADGE_COLORS.gift} !important; }
            .${TYPE_BADGE_CLASS}[data-type="account"] { color: ${BADGE_COLORS.account} !important; }
            .${TYPE_BADGE_CLASS}[data-type="unknown"] { color: ${BADGE_COLORS.unknown} !important; }
        `;
    }

    const PRODUCT_LINK_SELECTOR = [
        'table.table tbody tr .product-name-title > a[data-testid="offer__product-name-title"]',
        'table.table tbody tr .product-name-title > a[href*="/seller/offers/edit/"]'
    ].join(', ');
    // 每行「Show」按钮指向的商品页；商品类型只写在这个 URL 的 slug 里
    const PRODUCT_PAGE_LINK_SELECTOR = 'a[href*="/product/"]';

    /**
     * 从商品页 slug 判定商品类型（Gift / Account）。
     *
     * 不能用商品名判定：同一个游戏的 Gift 与 Account 商品名可能只差一个横杠，
     * 无法可靠区分。可靠来源是每行「Show」链接指向的商品页 URL：
     *   …/steam-gift…  → Gift
     *   …/steam-account… → Account
     *
     * slug 里两种写法都存在，所以先去掉所有非字母数字再匹配：
     *   steamgift（无横杠）/ steam-gift（有横杠）都要识别为 Gift。
     *
     * 两种标记都没有的老商品返回 'unknown'，由调用方决定如何处理。
     */
    function detectProductType(href) {
        const slug = String(href || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
        if (slug.includes('steamaccount')) return 'account';
        if (slug.includes('steamgift')) return 'gift';
        return 'unknown';
    }

    /** 商品类型的中文展示文案 */
    function formatProductType(type) {
        if (type === 'gift') return 'Gift';
        if (type === 'account') return 'Account';
        return '未标注类型';
    }

    /** 取所在行里「Show」链接的商品页 URL（判定的唯一依据） */
    function getProductHref(link) {
        const row = typeof link.closest === 'function' ? link.closest('tr') : null;
        if (!row || typeof row.querySelector !== 'function') return '';
        const productLink = row.querySelector(PRODUCT_PAGE_LINK_SELECTOR);
        if (!productLink) return '';
        return (typeof productLink.getAttribute === 'function'
            ? productLink.getAttribute('href')
            : '') || productLink.href || '';
    }

    function isOffersPage() {
        return /^\/seller\/offers\/?$/i.test(window.location.pathname);
    }

    function parseProductIdFromHref(href, baseHref) {
        if (!href) return '';

        try {
            const url = new URL(href, baseHref || window.location.href);
            const match = url.pathname.match(/\/seller\/offers\/edit\/(\d+)(?:\/)?$/i);
            return match ? match[1] : '';
        } catch (error) {
            return '';
        }
    }

    /** 写入（必要时创建）标签样式；内容没变就不赋值，避免无谓的 DOM 写入 */
    function ensureStyle() {
        let style = document.getElementById(STYLE_ID);
        if (!style) {
            style = document.createElement('style');
            style.id = STYLE_ID;
            document.head.appendChild(style);
        }
        const css = buildStyleText();
        if (style.textContent !== css) style.textContent = css;
        return style;
    }

    function removeBadges() {
        document.querySelectorAll(`.${BADGE_CLASS}, .${TYPE_BADGE_CLASS}`).forEach((badge) => badge.remove());
        document.querySelectorAll(`.${SLOT_CLASS}`).forEach((slot) => {
            // 容器里若还留着别人的元素，就整个保留，不要连别人的内容一起删掉
            if (!slot.querySelector(`.${SYNC_BTN_CLASS}`)) slot.remove();
        });
    }

    /** 取得（尚未挂进 DOM 的）容器 */
    function ensureSlot() {
        const slot = document.createElement('span');
        slot.className = SLOT_CLASS;
        slot.style.cssText = 'display:inline-flex;align-items:center;flex:none;';
        return slot;
    }

    /** 在链接旁找已有的容器（本脚本把容器放在链接之后） */
    function findSlot(link) {
        const adjacent = link.nextElementSibling;
        return adjacent && adjacent.classList && adjacent.classList.contains(SLOT_CLASS)
            ? adjacent
            : null;
    }

    /**
     * 找到（必要时创建）这一行的容器。
     * 已存在但不在链接紧后面时也要沿用：另建新容器会让同一行出现两个容器、标签被拆到两处。
     */
    function getOrCreateSlot(link) {
        const adjacent = findSlot(link);
        if (adjacent) return adjacent;

        // 兜底：同一行里（父元素内）已经有被占用的容器时复用，避免出现两个容器
        const parent = link.parentElement;
        if (parent) {
            const existing = Array.from(parent.querySelectorAll(`.${SLOT_CLASS}`))
                .find((slot) => slot.querySelector(`.${SYNC_BTN_CLASS}`));
            if (existing) return existing;
        }

        const slot = ensureSlot();
        link.after(slot);
        return slot;
    }

    function findProductLinks() {
        return Array.from(document.querySelectorAll(PRODUCT_LINK_SELECTOR));
    }

    /** 扫描所有报价行，刷新类型标签与 ID 标签 */
    function syncProductIds() {
        if (!isOffersPage()) {
            removeBadges();
            const style = document.getElementById(STYLE_ID);
            if (style) style.remove();
            return;
        }

        ensureStyle();
        const activeBadges = new Set();
        const activeSlots = new Set();

        findProductLinks().forEach((link) => {
            const rawHref = typeof link.getAttribute === 'function'
                ? link.getAttribute('href')
                : '';
            const productId = parseProductIdFromHref(
                rawHref || link.href,
                window.location.href
            );
            const type = detectProductType(getProductHref(link));
            const typeLabel = formatProductType(type);
            const slot = getOrCreateSlot(link);
            const oldTypeBadge = slot.querySelector(`.${TYPE_BADGE_CLASS}`);
            const oldBadge = slot.querySelector(`.${BADGE_CLASS}`);

            // 把类型挂到「Show」链接所在的行上，方便按类型定位或筛选
            const row = typeof link.closest === 'function' ? link.closest('tr') : null;
            if (row && typeof row.setAttribute === 'function' && row.getAttribute(PRODUCT_TYPE_ATTR) !== type) {
                row.setAttribute(PRODUCT_TYPE_ATTR, type);
            }

            if (!productId) {
                if (oldTypeBadge) oldTypeBadge.remove();
                if (oldBadge) oldBadge.remove();
                return;
            }

            // 类型标签：独立元素，内容形如 [Gift]
            const typeBadge = oldTypeBadge || document.createElement('span');
            const typeText = `[${typeLabel}]`;
            typeBadge.className = TYPE_BADGE_CLASS;
            if (typeBadge.dataset.type !== type) typeBadge.dataset.type = type;
            // 不重复替换文本节点，否则页面刷新扫描时会清掉用户当前的文字选区。
            if (typeBadge.textContent !== typeText) typeBadge.textContent = typeText;
            if (typeBadge.title !== `Gamivo 商品类型：${typeLabel}`) {
                typeBadge.title = `Gamivo 商品类型：${typeLabel}`;
            }
            if (typeBadge.getAttribute('aria-label') !== `Gamivo 商品类型 ${typeLabel}`) {
                typeBadge.setAttribute('aria-label', `Gamivo 商品类型 ${typeLabel}`);
            }

            // ID 标签：独立元素，内容形如 (ID: 3485402)
            const badge = oldBadge || document.createElement('span');
            const badgeText = `(ID: ${productId})`;
            badge.className = BADGE_CLASS;
            if (badge.dataset.id !== productId) badge.dataset.id = productId;
            if (badge.textContent !== badgeText) badge.textContent = badgeText;
            if (badge.title !== `Gamivo 商品 ID: ${productId}`) {
                badge.title = `Gamivo 商品 ID: ${productId}`;
            }
            if (badge.getAttribute('aria-label') !== `Gamivo 商品 ID ${productId}`) {
                badge.setAttribute('aria-label', `Gamivo 商品 ID ${productId}`);
            }

            // 顺序固定为 [类型][ID]：两者都插到容器前部，别人 append 的元素自然排在后面。
            //
            // 守卫用 previousElementSibling 判断 ID 是否已紧跟类型，绝不能拿 nextSibling 去比对：
            // 容器尾部可能还有别人 append 的元素，那时类型标签的下一个兄弟并不是 ID，
            // 按 nextSibling 判断会永远为真 → 每次扫描都重写 DOM → observer 反馈环。
            // 每次插入都带守卫，重复扫描才不会产生任何 DOM 写入。
            if (slot.firstChild !== typeBadge) {
                slot.insertBefore(typeBadge, slot.firstChild);
            }
            if (badge.previousElementSibling !== typeBadge) {
                slot.insertBefore(badge, typeBadge.nextElementSibling);
            }
            activeBadges.add(typeBadge);
            activeBadges.add(badge);
            activeSlots.add(slot);
        });

        document.querySelectorAll(`.${BADGE_CLASS}, .${TYPE_BADGE_CLASS}`).forEach((badge) => {
            if (!activeBadges.has(badge)) badge.remove();
        });
        // 清理空壳容器：既没有本脚本的标签、也没有别人的内容时才移除
        document.querySelectorAll(`.${SLOT_CLASS}`).forEach((slot) => {
            if (!activeSlots.has(slot) && !slot.querySelector(`.${SYNC_BTN_CLASS}`)) slot.remove();
        });
    }

    // 合并短时间内的多次触发，避免 DOM 变动时反复全表扫描
    let syncTimer = null;
    function scheduleSync() {
        if (syncTimer !== null) return;
        syncTimer = window.setTimeout(() => {
            syncTimer = null;
            syncProductIds();
        }, 50);
    }

    function patchHistoryMethod(methodName) {
        const original = window.history && window.history[methodName];
        if (typeof original !== 'function') return;

        window.history[methodName] = function (...args) {
            const result = original.apply(this, args);
            scheduleSync();
            return result;
        };
    }

    ensureStyle();
    syncProductIds();

    window.addEventListener('popstate', scheduleSync);
    window.addEventListener('hashchange', scheduleSync);
    patchHistoryMethod('pushState');
    patchHistoryMethod('replaceState');

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    console.log('[Gamivo ID Extractor] v1.10 已启动');
})();
