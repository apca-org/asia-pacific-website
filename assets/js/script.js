// =========================================================
// 1. Swiper 初始化
// =========================================================
const swiperContainer = document.querySelector('.swiper');
if (swiperContainer) {
    const swiper = new Swiper('.swiper', {
        loop: true,
        autoplay: {
            delay: 10000,
            disableOnInteraction: false,
        },
        speed: 2000,
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    });
}


// =========================================================
// 2. 自动加载 Header/Footer (主逻辑)
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    // 加载 Header，成功后执行 headerInit 函数
    loadFragment("header", "/assets/html/header.html", headerInit);
    
    // 加载 Footer
    loadFragment("footer", "/assets/html/footer.html"); 

    // ======== 新闻内容加载逻辑 ========
    
    const newsIndexPath = "/assets/data/news-index.json"; // 数据源指向索引文件
    
    // 检查当前页面是否是新闻详情页模板
    if (window.location.pathname.includes('/news/detail.html')) {
        loadNewsDetailMD(newsIndexPath); // 传入路径
    }
    
    // 尝试渲染首页最新新闻 (只显示 3 条)
    if (document.getElementById('latest-news-cards')) {
        renderNewsCards('latest-news-cards', newsIndexPath, 3);
    }
    
    // 尝试渲染完整新闻列表 (显示全部)
    if (document.getElementById('full-news-list')) {
        renderNewsCards('full-news-list', newsIndexPath);
    }
    
    // 示例：在 sjcaa 子网站渲染 sjcaa 类别的新闻
    if (document.getElementById('sjcaa-news-cards')) {
        renderNewsCards('sjcaa-news-cards', newsIndexPath, 4, 'sjcaa'); 
    }
    
    // 示例：在 eihua-juku 子网站渲染 eihua 类别的新闻
    if (document.getElementById('eihua-juku-news-cards')) {
        renderNewsCards('eihua-juku-news-cards', newsIndexPath, 4, 'eihua'); 
    }
    
    // =========================================
});


// =========================================================
// 3. 核心加载函数
// =========================================================
function loadFragment(id, filePath, callback = () => {}) {
    const container = document.getElementById(id);
    if (!container) return;

    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error(`${filePath} 加载失败 (Status: ${response.status})`);
            return response.text();
        })
        .then(html => {
            container.innerHTML = html;
            callback(); 
        })
        .catch(err => console.error(err));
}


// =========================================================
// 4. Header 初始化函数（包含依赖 Header DOM 的代码）
// =========================================================
function headerInit() {
    // 移动端下拉脚本
    const trigger = document.querySelector('.dropdown-trigger');
    const dropdownParent = document.querySelector('.has-dropdown');
    
    if (trigger && dropdownParent) {
        trigger.addEventListener('click', e => {
            e.preventDefault(); 
            e.stopPropagation();
            dropdownParent.classList.toggle('active');
        });
        
        document.addEventListener('click', () => dropdownParent.classList.remove('active'));
        
        const dropdownMenu = document.querySelector('.dropdown');
        if(dropdownMenu){
             dropdownMenu.addEventListener('click', e => e.stopPropagation());
        }
    } else {
        console.warn("Header 元素加载成功，但未找到导航元素");
    }
    
    // 导航高亮
    highlightCurrentNav();
}

/**
 * 导航栏高亮函数
 */
function highlightCurrentNav() {
    const currentPath = window.location.pathname.replace(/(\/index\.html|\/)$/i, '');
    const navLinks = document.querySelectorAll('header nav ul a');

    navLinks.forEach(link => {
        let linkPath = link.getAttribute('href');
        if (!linkPath) return;

        // 将相对路径转换为绝对路径并标准化
        const tempA = document.createElement('a');
        tempA.href = linkPath;
        let normalizedLinkPath = tempA.pathname.replace(/(\/index\.html|\/)$/i, '');
        
        // 精确匹配或子路径匹配
        if (normalizedLinkPath === currentPath || (currentPath.startsWith(normalizedLinkPath) && normalizedLinkPath.length > 1)) {
            link.classList.add('active');
            
            // 如果是子路径匹配，确保父级也高亮
            const parentLi = link.closest('.has-dropdown');
            if (parentLi) {
                parentLi.classList.add('active');
                const trigger = parentLi.querySelector('.dropdown-trigger');
                if (trigger) {
                    trigger.classList.add('active');
                }
            }
        }
    });
}


// =========================================================
// 5. 新闻卡片动态渲染函数 (支持类别筛选)
// =========================================================
/**
 * @param {string} containerId - 目标容器ID
 * @param {string} dataPath - 索引文件路径 (/assets/data/news-index.json)
 * @param {number|null} limit - 限制展示数量
 * @param {string|null} filterCategory - 按类别筛选 (e.g., 'sjcaa')
 */
function renderNewsCards(containerId, dataPath, limit = null, filterCategory = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    fetch(dataPath)
        .then(response => {
            if (!response.ok) throw new Error(`新闻索引加载失败 (Status: ${response.status})`);
            return response.json();
        })
        .then(newsData => {
            
            let filteredData = newsData;
            // 1. 筛选数据
            if (filterCategory) {
                // category 字段在 JSON 中是小写字母，确保匹配
                filteredData = newsData.filter(item => item.category === filterCategory);
            }
            
            // 2. 应用数量限制
            const dataToRender = limit ? filteredData.slice(0, limit) : filteredData;
            
            let cardsHTML = '';
            
            dataToRender.forEach(item => {
                // 修正日期格式为 YYYY年MM月DD日
                const formattedDate = item.date.replace(/-/g, '/').replace(/^(\d{4})\/(\d{2})\/(\d{2})$/, '$1年$2月$3日');
                
                cardsHTML += `
                    <a href="${item.link}" class="news-card">
                        <img src="${item.image}" alt="${item.title}"> 
                        <div class="news-card-content">
                            <time datetime="${item.date}">${formattedDate}</time>
                            <h3>${item.title}</h3>
                            ${item.summary ? `<p class="news-summary">${item.summary}</p>` : ''}
                        </div>
                    </a>
                `;
            });

            container.innerHTML = cardsHTML;
        })
        .catch(err => console.error("新闻卡片渲染失败:", err));
}


// =========================================================
// 6. 详情页内容加载函数 (Markdown 方案 - 包含分页逻辑)
// =========================================================
function loadNewsDetailMD(newsIndexPath) {
    if (typeof marked === 'undefined') {
        console.error("Marked.js 库未加载！请确保在 script.js 之前引用 marked.min.js。");
        return;
    }
    
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');

    if (!articleId) return;

    let articleMeta;
    let nextArticle = null;
    let prevArticle = null;

    fetch(newsIndexPath)
        .then(res => {
            if (!res.ok) throw new Error("无法加载新闻索引文件。");
            return res.json();
        })
        .then(indexData => {
            // 1. 查找元数据和索引位置
            const currentIndex = indexData.findIndex(item => item.id === articleId);
            
            if (currentIndex === -1) throw new Error(`找不到 ID 为 ${articleId} 的文章元数据。`);
            
            articleMeta = indexData[currentIndex];
            
            // 2. 确定上一篇和下一篇文章
            // 假设 indexData 是按照时间降序（新->旧）排列的
            // 下一篇 (Next Article) 是更新的文章，对应 indexData[currentIndex - 1]
            if (currentIndex > 0) {
                nextArticle = indexData[currentIndex - 1]; 
            }
            // 上一篇 (Previous Article) 是更旧的文章，对应 indexData[currentIndex + 1]
            if (currentIndex < indexData.length - 1) {
                prevArticle = indexData[currentIndex + 1]; 
            }
            
            // 3. 填充元数据到页面头部
            const formattedDate = articleMeta.date.replace(/-/g, '/').replace(/^(\d{4})\/(\d{2})\/(\d{2})$/, '$1年$2月$3日');

            document.title = articleMeta.title + " | 株式会社アジア太平洋協力会";
            
            const articleTitleEl = document.getElementById('article-title');
            if(articleTitleEl) articleTitleEl.textContent = articleMeta.title;
            
            const articleDateEl = document.getElementById('article-date');
            if(articleDateEl) {
                articleDateEl.textContent = formattedDate;
                articleDateEl.setAttribute('datetime', articleMeta.date);
            }
            
            const categoryDisplay = articleMeta.category.toUpperCase() + '関連'; 
            const articleCategoryEl = document.getElementById('article-category');
            if(articleCategoryEl) articleCategoryEl.textContent = categoryDisplay;
            
            const breadcrumbTitleEl = document.getElementById('breadcrumb-article-title');
            if(breadcrumbTitleEl) breadcrumbTitleEl.textContent = articleMeta.title;

            // 4. 读取 Markdown 文件内容
            return fetch(articleMeta.markdownPath);
        })
        .then(res => {
            if (!res.ok) throw new Error(`Markdown 文件加载失败: ${articleMeta.markdownPath}`);
            return res.text();
        })
        .then(markdownText => {
            // 5. 解析并移除 Frontmatter (元数据)
            const contentOnly = markdownText.replace(/---[\s\S]*?---/, '').trim(); 
            
            // 6. 转换 Markdown 为 HTML
            const htmlContent = marked.parse(contentOnly);

            // 7. 插入内容
            const contentContainer = document.getElementById('article-body-content');
            if(contentContainer) {
                 contentContainer.innerHTML = htmlContent;
            }
            
            // 8. 调用新函数来生成 上一篇/下一篇 导航
            renderPaginationNav(prevArticle, nextArticle);
        })
        .catch(err => console.error("加载文章详情失败:", err));
}

// =========================================================
// 7. 新增：分页导航渲染函数
// =========================================================
/**
 * 动态渲染上一篇和下一篇文章的导航链接
 * @param {object|null} prevArticle - 上一篇 (更旧) 文章的元数据
 * @param {object|null} nextArticle - 下一篇 (更新) 文章的元数据
 */
function renderPaginationNav(prevArticle, nextArticle) {
    const navContainer = document.getElementById('pagination-nav-container');
    if (!navContainer) return;

    let navHTML = '';

    // 上一篇按钮 (对应更旧的文章，索引更大)
    if (prevArticle) {
        // 使用 class="prev"
        navHTML += `<a href="${prevArticle.link}" class="prev"> &lt; 前の記事へ</a>`;
    } else {
        // 如果没有上一篇，添加一个占位符或空链接（保持布局完整性）
        // 这里我们添加一个占位符div，或者您可以根据CSS移除它
        navHTML += `<div class="prev-placeholder"></div>`; 
    }
    
    // 返回列表按钮 (始终存在)
    navHTML += `<a href="/news/news-list.html" class="all-news">ニュース一覧へ戻る</a>`;

    // 下一篇按钮 (对应更新的文章，索引更小)
    if (nextArticle) {
        // 使用 class="next"
        navHTML += `<a href="${nextArticle.link}" class="next">次の記事へ &gt; </a>`;
    } else {
         // 如果没有下一篇，添加一个占位符（保持布局完整性）
        navHTML += `<div class="next-placeholder"></div>`; 
    }
    
    // 覆盖 detail.html 模板中原本的 <a href="../../news-list.html" class="all-news"> 及其相邻的静态链接
    navContainer.innerHTML = navHTML;
}