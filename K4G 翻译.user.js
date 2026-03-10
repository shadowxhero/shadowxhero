// ==UserScript==
// @name         K4G 本地词典翻译
// @namespace    k4g-local-cn
// @version      3.4.4
// @description  本地词典翻译；长词优先；英文大小写不敏感可开关；跳过商品标题/图片区；支持导入导出；支持动态“xx Keys/Amount: xx Keys”；补充Key/Keys复数短语；修复状态标签中文被截断；已内置用户词典；修复弹窗h1不翻译；修复分段中文空格；右下角仅在有替换时显示；修复CI下KEY/Key冲突；去重精简词典；新增通知弹窗动态翻译
// @match        https://k4g.com/*
// @match        https://www.k4g.com/*
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
    GM_setValue(SETTINGS_KEY, 设置);
  }

  const defaultDict = {
    // ==================== 1. 导航与界面 ====================
    // 通用导航
    'Search': '搜索',
    'Dashboard': '仪表盘',
    'Library': '库',
    'Orders': '订单',
    'Wallet': '钱包',
    'Affiliate': '联盟',
    'Feedback': '反馈',
    'Account': '账户',
    'Support': '支持',
    'Notifications': '通知',
    'Check all as read': '全部标记为已读',
    'View all notifications': '查看全部通知',
    'Logout': '退出登录',
    'Current balance': '当前余额',
    'Current position': '当前排名',
    
    // 面板/仪表板
    'Overview': '概览',
    '+ New Offer': '+ 新建报价',
    'New Offer': '新建报价',
    'Merchant Services': '商家服务',
    'Merchant News': '商家新闻',
    'Merchant Support': '商家支持',
    'My Balance': '我的余额',
    'Operations History': '操作记录',
    'Payouts': '提现',
    'Invoices': '发票',
    'Reports': '报表',
    'Account details': '账户详情',
    'Support Center': '支持中心',
    'Tickets': '工单',
    'Support Tickets': '支持工单',
    'Start listing': '开始上架',
    'Become an Affiliate': '成为联盟伙伴',
    'Earn with us': '与我们一起赚钱',

    // ==================== 2. 商家与报价管理 ====================
    // 商家相关
    'Merchant': '商家',
    'MY OFFERS': '我的报价',
    
    // 报价操作
    'Add offer': '新增报价',
    'Sold offers': '已售报价',
    'Edit': '编辑',
    'Edit Offer': '编辑报价',
    'Promote offer': '推广报价',
    'Boost offer': '提升报价',
    'View Stock': '查看库存',
    'Preview': '预览',
    'Deactivate': '停用',
    'Go to next step': '下一步',
    
    // 报价状态
    'Active': '启用中',
    'Denied': '已拒绝',
    'Sold': '已售完',
    'Active to': '有效期至',
    'Days left': '剩余天数',
    'Position': '排名',
    'Title': '标题'，
    
    // 报价筛选与导出
    'Show Filters': '显示筛选',
    'Hide Filters': '隐藏筛选',
    'Offers for export (max. 5000)': '待导出报价（最多5000）',
    'Export': '导出',
    
    // 新建报价页面
    'MERCHANT': '商家',
    'NEW OFFER': '新建报价',
    'INSTANT DELIVERY': '即时发货',
    'Choose Existing Product': '选择已有商品',
    'Create Brand New Product': '创建全新商品',
    'Visit Product Page': '访问商品页面',
    'Change Product': '更换商品',
    'Enter product name': '输入商品名称',
    'PLATFORM': '平台',
    'REGION': '地区',
    'KEY': '密钥类型',
    'Key': '密钥',
    'Keys': '密钥',
    'No keys found': '未找到密钥',
    'No key found': '未找到密钥',
    'ACCOUNT': '账号',
    'LANGUAGES': '语言',
    'Platform': '平台',
    'Region': '地区',
    'Delivery type': '交付类型',
    'Instant Delivery': '即时发货',
    'Choose option': '选择选项',
    'Hide my offers': '隐藏我的报价',
    
    // 库存管理
    'Stock Details': '库存详情',
    'Files .csv/.txt': '文件 .csv/.txt',
    'Manual': '手动',
    'Amount:': '数量：',
    'Drop file here': '将文件拖拽到此处',
    'or': '或',
    'Upload from computer': '从电脑上传',
    'Stock': '库存',
    'Pending': '待处理',
    'No offers': '暂无报价',
    
    // 价格管理
    'Price Details': '价格详情',
    'I want to receive': '我希望到账',
    'Customer price': '客户价格',
    'Check the price range on K4G.com': '查看 K4G.com 上的价格区间',
    'Lowest price': '最低价格',
    'Highest price': '最高价格',
    'Dynamic pricing': '动态定价',
    'Allow manual pricing': '允许人工调价',
    'My minimum price': '我的最低价格',
    'Apply global dynamic pricing': '应用全局动态定价',
    'Apply dynamic pricing for offers:': '应用动态定价到报价：',
    
    // 报价详情
    'Offer Details': '报价详情',
    'Sale duration': '销售时长',
    '30 days': '30天',
    '90 天之前': '90天',
    '365 days': '365天',
    'Automatically reactivate when expired': '过期后自动重新上架',

    // ==================== 3. 账户与设置 ====================
    'Fragments': '碎片',
    'Rewards': '奖励',

    // ==================== 4. 客服与支持 ====================
    // 客服相关
    'LiveChat availability': '在线客服可用性',
    'Dear Partner,': '尊敬的合作伙伴：',
    'To establish a quick and direct communication with our Suppliers Team, please add us on Microsoft Teams at':
      '为了与我们的供应商团队建立快速直接的沟通，请在 Microsoft Teams 添加我们：',
    'Contact e-mail for wholesale inquiries:': '批发咨询邮箱：',
    'Thank you for your continued partnership!': '感谢您一直以来的合作！',
    
    // 工单管理
    'Create Ticket': '创建工单',
    'All': '全部',
    'Ongoing': '进行中',
    'Open': '待处理',
    'Closed': '已关闭',
    'Solved': '已解决',
    'On Hold': '挂起',
    'No tickets found': '未找到工单',

    // ==================== 5. 营销与推广 ====================
    'Offer exposure': '报价曝光',
    'Sales insights': '销售洞察',
    'Additional Services': '附加服务',
    'Recommended Offer': '推荐报价',
    'Level your offer to the Recommended ones, making it the most visible and sticky on the offer list.':
      '将你的报价升级为推荐报价，使其在报价列表中更显眼并置顶展示。',
    'Only one Supplier can promote the particular offer per day': '每个商品每天仅允许 1 位供应商进行此推广。',
    'Buy now': '立即购买',
    'Promotion Details': '推广详情',

    'Search bar': '搜索栏',
    'Add your offer to the search bar to enhance the visibility of your products':
      '将你的报价加入搜索栏，提升商品曝光度。',
    'Only two offers can be promoted during the day': '每天最多仅可推广 2 个报价。',

    'Highlighted Offer': '高亮报价',
    'Focus attention on your offer by highlighting it with a brighter color.':
      '通过更亮的颜色高亮你的报价，吸引更多关注。',
    'Only two Suppliers can promote the particular offer per day':
      '每个商品每天最多仅允许 2 位供应商进行此推广。',

    'Offer for you': '专属报价位',
    'Put your offer at the top place and merge with buy button of the product page..':
      '将你的报价置于顶部，并与商品页购买按钮联动展示。',
    'Only for Software offers': '仅适用于软件类报价',

    'Quests': '任务',
    'Want to earn more or boost your sales?': '想赚得更多或提升销量吗？',
    'Check available Quests!': '查看可用任务！',

    'Things to do': '待办事项',
    'offers low on stock': '库存不足的报价',
    'offers with low position': '排名靠后的报价',
    'inactive offers': '未激活的报价',
    'offers with unchanged price': '价格未变更的报价',
    'Ongoing cases': '进行中的工单',

    'Rating': '评分',
    'Positive feedback': '好评数',
    'Completed orders': '已完成订单',
    'Complaint ratio': '投诉率',
    'Feedback Received': '收到的反馈',
    'You have no feedback yet': '你还没有收到反馈',

    'Items count': '商品数量',
    'This week': '本周',
    'From': '从',
    'Bestsellers': '畅销商品',
    'Show': '显示',
    'Sort by': '排序方式',
    'Product': '商品',
    'Count': '数量',
    'Revenue': '营收',

    // ==================== 6. 长句与复杂文案 ====================
    // 提示文案（分段）
    'If you have more products to add at once, please contact our': '如果你有更多商品需要一次性添加，请联系',
    'Suppliers Team': '供应商团队',

    // 底部文案
    'By creating this offer you agree to': '创建该报价即表示你同意',
    'Add and create another offer': '添加并创建另一个报价',
    'Add my Offer': '添加我的报价',

    // 长句
    'This is the exact amount that will be transferred to you after all platform fees have been deducted. (customer price minus platform fees and services). Note that if there are VAT rates applied on your account, this amount will change according to the VAT table in use:':
      '这是在扣除所有平台费用后将实际转给你的金额（客户价格减去平台费用和服务费）。请注意，如果你的账户适用了增值税税率，该金额会根据当前使用的增值税表发生变化：',
    'This amount represents your gross sales price to end customers before platform fees are deducted.':
      '该金额表示在扣除平台费用之前，你面向终端客户的含税销售价格。',
    'Note that if there are VAT rates applied on your account, this sales price will change according to the VAT table in use:':
      '请注意，如果你的账户适用了增值税税率，该销售价格会根据当前使用的增值税表发生变化：',
    'The sales price for the end customers also depends on additional services that the customer may choose during the purchase.':
      '终端客户的销售价格也会受到客户在购买时选择的附加服务影响。',
    'A complete list of gross sales prices can be found in the monthly sales report.':
      '完整的含税销售价格列表可在每月销售报表中查看。',
    'Set your Minimum Price (Customer price) for which you are willing to sell the key.':
      '设置你愿意出售该 Key 的最低价格（客户价）。',
    "Turn on the 'Decreasing Price Automatically' to keep your offer on the 1 position as long as possible.":
      '开启"自动降价"可让你的报价尽可能长时间保持在第1位。',
    "Turn on the 'Decreasing Price Automatically' to keep your offer on the 1 position for as long as possible.":
      '开启"自动降价"可让你的报价尽可能长时间保持在第1位。',
    "Turn on the 'Allow manual pricing' to have our Team track and adjust the price dynamically to maximize your sales, revenue and profit based on other markets.":
      '开启"允许人工定价"后，我们的团队将根据其他市场动态跟踪并调整价格，以最大化你的销量、营收和利润。',
    'This option allows us to manually adjust the price of your offer, above the set Minimal Price.':
      '此选项允许我们在你设定的最低价格之上，手动调整你的报价价格。',
    'Our Team will raise or lower the price to optimize your revenue and profit based on the market conditions.':
      '我们的团队会根据市场情况上调或下调价格，以优化你的营收和利润。',
    'Especially important for new releases and bestsellers.':
      '这对新品和畅销商品尤为重要。',
    'If you want to add new keys into your stock, please go to':
      '如果你想向库存添加新的密钥，请前往',
    'Preferable key format: Login: XXXX  Password: XXXXX, Email Login: XXXX Email Password: XXXX, Domain: XXXX':
      '建议密钥格式：登录账号：XXXX  登录密码：XXXXX，邮箱账号：XXXX 邮箱密码：XXXX，域名：XXXX',
    'minimalPrice - This value should be less than or equal to': '最低价格 - 该值应小于或等于',
      'Login from different location detected. Please, check your email address and enter verification code in below to log in.':
      '检测到来自异地的登录。请检查您的邮箱，并在下方输入验证码以登录。',
    'Please, check your mobile 2FA application and enter the code below to log in.':
      '请检查您手机上的双重身份验证 (2FA) 应用，并输入下方验证码进行登录。',
  };

  const embeddedUserDict = {
    'About us': '关于我们',
    'Active': '已上架',
    'Active from / to': '生效起止时间',
    'Add date': '添加日期',
    'Added at': '添加时间',
    'Attract more Customers by promoting your offer and getting additional exposure!': '通过推广你的报价并获得额外曝光，吸引更多客户！',
    'Available for sale:': '可售数量：',
    'Awaiting': '待处理',
    'Batch Id': '批次号',
    'Blog': '博客',
    'COPY': '复制',
    'Clear': '清除',
    'Contact us': '联系我们',
    'Copied to clipboard': '已复制到剪贴板',
    'Created date': '创建日期',
    'Creation time': '创建时间',
    'Custom': '自定义',
    'Date': '日期',
    'Disable': '禁用',
    'Dispatched': '已发货',
    'Do you want to additionally promote your offer': '你想额外推广你的报价吗',
    "Don't wait": '别再等',
    "Don't wait anymore!": '别再等了！',
    'Download': '下载',
    'Download and remove': '下载并移除',
    'E-mail Address': '邮箱地址',
    'Edit offer': '编辑报价',
    'Filter': '筛选',
    'Get Cheap AAA Game': '领取低价 3A 游戏',
    'Get K4G news to your inbox': '将 K4G 最新资讯发送到你的邮箱',
    'Get more sales': '获得更多销量',
    'REGION': '区域',
    'Received': '已收到',
    'Remove': '移除',
    'Reserved': '已预留',
    'SALES': '销售',
    'Save offer': '保存报价',
    'Select all': '全选',
    'Select all visible': '选择当前可见项',
    'Selected keys': '已选密钥',
    'Sold at': '售出时间',
    'Sold date': '售出日期',
    'Status': '状态',
    'Submitted': '已提交',
    'Subscribe': '订阅',
    'Subscribe us': '订阅我们',
    'Terms & Conditions': '条款与条件',
    'Unchanged price since': '自以下时间起价格未变',
    'VIP Terms & Conditions': 'VIP 条款与条件',
    'Want to generate more sales?': '想获得更多销量吗？',
    'Want to list?': '想上架商品？',
    'You have no awaiting feedbacks': '你暂无待处理反馈',
    'You have no orders yet': '你还没有订单',
    'You have no products yet': '你还没有商品',
    'You have no tickets yet': '你还没有工单',
    'Your search phrase': '你的搜索词',
    'Please check your spelling or': '请检查拼写或',
    'anymore!': '了！',
    'cannot be found': '未找到',
    'price - This value should not be blank.': '价格 - 此值不能为空。',
    'reset the filters.': '重置筛选条件。',
    'reset the filters': '重置筛选条件',
    'Yes': '是',
    'No': '否',
    // 交易记录筛选面板补充
    'Transaction amount': '交易金额',
    'Process date': '处理日期',
    'Schedule date': '计划日期',
    'Type': '类型',
    'Credit memo': '贷项通知单',
    'Payout': '提现',
    'Payout fee': '提现手续费',
    'Manual K4G balance': '手动K4G余额调整',
    'Offer activation': '报价激活',
    'Offer reactivation external': '报价重新激活（外部）',
    'Price change': '价格变更',
    'Order refund': '订单退款',
    'Order spent': '订单支出',
    'K4G commission': 'K4G佣金',
    'Dispute fee': '争议处理费',
    'Refund fee': '退款手续费',
    'Undelivered key fee': '未交付密钥费用',
    'Bad review fee': '差评费用',
    'Refund for resold key': '转售密钥退款',
    'Reward for review': '评价奖励',
    'Refund for undelivered key': '未交付密钥退款',
    'Offer promotions and extra services': '报价推广与附加服务',
    'Other adjustments': '其他调整',
    'K4G Coin': 'K4G币',
    'PayPal Account Fee': 'PayPal账户费用',
    'Balance Expiration': '余额过期',
    'Fragment Sale': '碎片售出',
    'Currency Conversion (out)': '货币转换（转出）',
    'Currency Conversion (in)': '货币转换（转入）',
    'Voucher': '代金券',
    'Completed': '已完成',
    'Canceled': '已取消',
    'No operations found': '未找到交易记录',
    'Expand all': '展开全部',
    'Show less': '收起',
    'Create date': '创建日期',
    // 枚举兜底（先这样，后续知道真实含义再改）
    'enum.transaction_type.33': '交易类型33',
    'enum.transaction_type.34': '交易类型34',
    'enum.transaction_type.35': '交易类型35',
    'enum.transaction_type.36': '交易类型36',

    // 你新提供并整合的词条
    'Help': '帮助',
    'How to activate keys': '如何激活密钥',
    'How to buy': '如何购买',
    'K4G Purchase Protection': 'K4G 购买保障',
    'K4G Wholesale': 'K4G 批发',
    'Like TOP deals?': '喜欢超值优惠吗？',
    'Need extra money?': '需要额外收入吗？',
    'Our mission': '我们的使命',
    'Privacy Policy': '隐私政策',
    'Product list': '商品列表',
    'KYC verification completed successfully. Your account is verified.': 'KYC 验证已成功完成。你的账户已通过验证。',
    'You made a sale!': '你成交了一笔！',
    'Operation': '交易',
    'Operations for export (max. 5000)': '待导出交易记录（最多5000条）',
    'Operations History': '交易历史',
    'Created at': '创建时间',
    'Operation Type': '交易类型',
    'Amount': '金额',
    'Sale': '售出',
    'Complete': '完成',
    'Order ID': '订单ID',
    'Offer ID': '报价ID',
    'Scheduled at': '交易时间',
    'Qty': '数量',
    'Buyer Country': '买家国家/地区',
    'Amount paid (Sales price)': '实付金额（销售价）',
    "It's your sales price for customer.": '这是你面向客户的销售价格。',
    'Service Fee': '服务费',
    'KPP Fee': 'KPP费用',
    'Extra Services Fee': '附加服务费',
    'Discount Fee': '折扣费用',
    'No offers found': '未找到报价',
    'Inactive': '未激活',
    'Reactivate': '重新激活',
    'Archived': '已归档',
    'Archive': '归档',
    'Offer activated successfully.': '报价已成功激活。',
    'Delete All Keys': '删除所有密钥',
    'Delete Keys': '删除密钥',
    'Offer saved successfully': '报价已成功保存',
    'Complaint regarding sold product': '关于已售商品的投诉',
    'Question regarding sold product': '关于已售商品的问题',
    'Last reply': '最后回复',
    'Ticket ID': '工单编号',
    'View all': '查看全部',
    'Select template': '选择模板',
    'Refund_approved': '退款已批准',
    'Replacement': '补发',
    'Send message': '发送消息',
    'Write your message': '请输入消息',
    'Price': '价格',
    'Profit': '利润',
    'Sold Out at': '售完时间',
    'duration - This value should not be null.': '时长 - 该值不能为空。',
    'You have no offers yet': '你还没有任何报价',
    'Reason': '原因',
    'Duplicated offer': '重复报价',
    'Expired': '过期时间',
    'Create Account': '创建账户',
    'Connect via': '连接方式',
    'Not a member yet': '还不是会员',
    'Forgot Password': '忘记密码',
    'Log in to your account': '登录您的账户',
    'Remember me': '记住我',
    'Back to Homepage': '返回首页',
    'Log In': '登录',
    'Submit': '提交',
    'Are you sure you want to continue': '您确定要继续吗？',
    'Download and remove': '下载并移除',
    'Confirm': '确认',
    'Cancel': '取消',
    'It seems that you\'ve been lost': '页面好像走丢了',
    'Oooups, no such page has been found': '哎呀，找不到该页面',
    'Not logged in or token expired.': '未登录或登录凭证已过期。',
    'Active from / to': '有效期限：从 / 至',
    'Register': '注册',
    'FROM:': '来自：'
  };

  let userDict = GM_getValue(DICT_KEY, {});
  let dict = { ...defaultDict, ...embeddedUserDict, ...userDict };
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

  const escapeRegExp = s => s.替换(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const isAsciiWordLike = s => /^[A-Za-z0-9 ]+$/.test(s);

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
    dict = { ...defaultDict, ...embeddedUserDict, ...userDict };
    compiledRules = compileRulesFromDict(dict);
  }

  function injectFixStyles() {
    if (document.getElementById('k4g-cn-style-fix-status')) return;

    const css = `
      [data-testid="TABLE_ROW_TEST_ID"] .Label_label__BvA9S,
      [class*="ResultRow_"] .Label_label__BvA9S {
        display: inline-flex !important;
        align-items: center !important;
        white-space: nowrap !important;
        overflow: visible !important;
        text-overflow: clip !important;
        max-width: none !important;
        min-width: 0 !important;
        width: auto !important;
      }

      [data-testid="TABLE_ROW_TEST_ID"] .Table_tableRowItem__d7v3y.column-1,
      [data-testid="TABLE_ROW_TEST_ID"] .Table_tableRowItem__d7v3y.column-2,
      [data-testid="TABLE_ROW_TEST_ID"] .Table_tableRowItem__d7v3y.column-3 {
        overflow: visible !important;
        min-width: 110px !important;
      }

      [data-testid="TABLE_ROW_TEST_ID"] .Label_label__BvA9S .Label_iconWrapper__BxbbR,
      [class*="ResultRow_"] .Label_label__BvA9S .Label_iconWrapper__BxbbR {
        flex: 0 0 auto !important;
      }

      [data-testid="TABLE_ROW_TEST_ID"] .Label_label__BvA9S > *:not(.Label_iconWrapper__BxbbR),
      [class*="ResultRow_"] .Label_label__BvA9S > *:not(.Label_iconWrapper__BxbbR) {
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
    const merged = { ...defaultDict, ...embeddedUserDict, ...userDict };
    prompt('复制下面JSON：', JSON.stringify(merged, null, 2));
  });

  GM_registerMenuCommand('🧹 清空本地用户词典(GM_setValue)', () => {
    if (!confirm('确定清空本地用户词典吗？此操作不可撤销。')) return;
    userDict = {};
    GM_setValue(DICT_KEY, userDict);
    refreshAfterDictChange();
    alert('已清空本地用户词典，仅保留脚本内置 defaultDict + embeddedUserDict。');
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
