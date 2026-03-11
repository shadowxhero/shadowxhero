// ==UserScript==
// @name         K4G 本地词典翻译 - 外部词库（非常用）
// @namespace    k4g-local-cn-external
// @version      1.0
// @description  供 K4G 主翻译脚本调用的外部词典，用于存放长句和非常用提示
// @updateTime   2026/3/12 03:18:40
// ==/UserScript==

  window.K4G_EXTERNAL_DICT = {
    // ==================== 0. 常用但归类到外部的词条 (以后新词条优先往这放) ====================
    // 'English': '中文',

    // ==================== 1. 长句、复杂文案与规则说明 ====================
  'If you have more products to add at once, please contact our': '如果你有更多商品需要一次性添加，请联系',
  'By creating this offer you agree to': '创建该报价即表示你同意',
  'This is the exact amount that will be transferred to you after all platform fees have been deducted. (customer price minus platform fees and services). Note that if there are VAT rates applied on your account, this amount will change according to the VAT table in use:': '这是在扣除所有平台费用后将实际转给你的金额（客户价格减去平台费用和服务费）。请注意，如果你的账户适用了增值税税率，该金额会根据当前使用的增值税表发生变化：',
  'This amount represents your gross sales price to end customers before platform fees are deducted.': '该金额表示在扣除平台费用之前，你面向终端客户的含税销售价格。',
  'Note that if there are VAT rates applied on your account, this sales price will change according to the VAT table in use:': '请注意，如果你的账户适用了增值税税率，该销售价格会根据当前使用的增值税表发生变化：',
  'The sales price for the end customers also depends on additional services that the customer may choose during the purchase.': '终端客户的销售价格也会受到客户在购买时选择的附加服务影响。',
  'A complete list of gross sales prices can be found in the monthly sales report.': '完整的含税销售价格列表可在每月销售报表中查看。',
  'Set your Minimum Price (Customer price) for which you are willing to sell the key.': '设置你愿意出售该 Key 的最低价格（客户价）。',
  "Turn on the 'Decreasing Price Automatically' to keep your offer on the 1 position as long as possible.": '开启"自动降价"可让你的报价尽可能长时间保持在第1位。',
  "Turn on the 'Decreasing Price Automatically' to keep your offer on the 1 position for as long as possible.": '开启"自动降价"可让你的报价尽可能长时间保持在第1位。',
  "Turn on the 'Allow manual pricing' to have our Team track and adjust the price dynamically to maximize your sales, revenue and profit based on other markets.": '开启"允许人工定价"后，我们的团队将根据其他市场动态跟踪并调整价格，以最大化你的销量、营收和利润。',
  'This option allows us to manually adjust the price of your offer, above the set Minimal Price.': '此选项允许我们在你设定的最低价格之上，手动调整你的报价价格。',
  'Our Team will raise or lower the price to optimize your revenue and profit based on the market conditions.': '我们的团队会根据市场情况上调或下调价格，以优化你的营收和利润。',
  'Especially important for new releases and bestsellers.': '这对新品和畅销商品尤为重要。',
  'If you want to add new keys into your stock, please go to': '如果你想向库存添加新的密钥，请前往',
  'Preferable key format: Login: XXXX  Password: XXXXX, Email Login: XXXX Email Password: XXXX, Domain: XXXX': '建议密钥格式：登录账号：XXXX  登录密码：XXXXX，邮箱账号：XXXX 邮箱密码：XXXX，域名：XXXX',
  'minimalPrice - This value should be less than or equal to': '最低价格 - 该值应小于或等于',
  'Login from different location detected. Please, check your email address and enter verification code in below to log in.': '检测到来自异地的登录。请检查您的邮箱，并在下方输入验证码以登录。',
  'Please, check your mobile 2FA application and enter the code below to log in.': '请检查您手机上的双重身份验证 (2FA) 应用，并输入下方验证码进行登录。',
  'Make sure each key is in separate line and contains at least 5 characters.': '请确保每个 Key 独立成行，且长度至少为 5 个字符。',
  'To establish a quick and direct communication with our Suppliers Team, please add us on Microsoft Teams at': '为了与我们的供应商团队建立快速直接的沟通，请在 Microsoft Teams 添加我们：',
  'Contact e-mail for wholesale inquiries:': '批发咨询邮箱：',
  'Thank you for your continued partnership!': '感谢您一直以来的合作！',
  'Level your offer to the Recommended ones, making it the most visible and sticky on the offer list.': '将你的报价升级为推荐报价，使其在报价列表中更显眼并置顶展示。',
  'Only one Supplier can promote the particular offer per day': '每个商品每天仅允许 1 位供应商进行此推广。',
  'Add your offer to the search bar to enhance the visibility of your products': '将你的报价加入搜索栏，提升商品曝光度。',
  'Only two offers can be promoted during the day': '每天最多仅可推广 2 个报价。',
  'Focus attention on your offer by highlighting it with a brighter color.': '通过更亮的颜色高亮你的报价，吸引更多关注。',
  'Only two Suppliers can promote the particular offer per day': '每个商品每天最多仅允许 2 位供应商进行此推广。',
  'Put your offer at the top place and merge with buy button of the product page..': '将你的报价置于顶部，并与商品页购买按钮联动展示。',
  'Only for Software offers': '仅适用于软件类报价',
  'Attract more Customers by promoting your offer and getting additional exposure!': '通过推广你的报价并获得额外曝光，吸引更多客户！',
  'Do you want to additionally promote your offer': '你想额外推广你的报价吗',
  'Want to earn more or boost your sales?': '想赚得更多或提升销量吗？',
  'Check available Quests!': '查看可用任务！',
  'Get K4G news to your inbox': '将 K4G 最新资讯发送到你的邮箱',
  'KYC verification completed successfully. Your account is verified.': 'KYC 验证已成功完成。你的账户已通过验证。',

  // ==================== 2. 边缘提示文案与状态兜底 ====================
  "It's your sales price for customer.": '这是你面向客户的销售价格。',
  'price - This value should not be blank.': '价格 - 此值不能为空。',
  'duration - This value should not be null.': '时长 - 该值不能为空。',
  'Are you sure you want to continue': '您确定要继续吗？',
  'It seems that you\'ve been lost': '页面好像走丢了',
  'Oooups, no such page has been found': '哎呀，找不到该页面',
  'Not logged in or token expired.': '未登录或登录凭证已过期。',
  'You have no awaiting feedbacks': '你暂无待处理反馈',
  'You have no orders yet': '你还没有订单',
  'You have no products yet': '你还没有商品',
  'You have no tickets yet': '你还没有工单',
  'You have no offers yet': '你还没有任何报价',
  'Please check your spelling or': '请检查拼写或',
  'cannot be found': '未找到',
  'reset the filters.': '重置筛选条件。',

  // ==================== 3. 不常用指南与底部链接 ====================
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
  'About us': '关于我们',
  'Blog': '博客',
  'Contact us': '联系我们',
  'Terms & Conditions': '条款与条件',
  'VIP Terms & Conditions': 'VIP 条款与条件',

  // ==================== 4. 其他兜底类枚举 ====================
  'enum.transaction_type.33': '交易类型33',
  'enum.transaction_type.34': '交易类型34',
  'enum.transaction_type.35': '交易类型35',
  'enum.transaction_type.36': '交易类型36'
};
