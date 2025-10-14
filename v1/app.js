const listEl = document.querySelector('#list');
const emptyEl = document.querySelector('#empty');

// Store data globally for language switching
window.currentData = null;
window.renderWithLanguage = renderWithLanguage;

// Get current language from URL params or default to 'zh'
const urlParams = new URLSearchParams(location.search);
window.currentLang = urlParams.get('lang') || 'zh';

init();
async function init() {
  try {
    // 构建data.json的URL，确保在GitHub Pages环境下正确工作
    let dataUrl;
    if (window.location.pathname.includes('/curated-gems/')) {
        // GitHub Pages环境
        dataUrl = window.location.origin + '/curated-gems/data.json';
    } else {
        // 本地开发环境
        dataUrl = './data.json';
    }
    const res = await fetch(dataUrl + '?_=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('load fail');
    const items = await res.json();
    window.currentData = items;
    render(items);
    // 【新增】调用 bind 函数，以监听新的交互事件
    bind();
  } catch (e) {
    listEl.innerHTML = '';
    const errorTexts = {
      zh: '数据加载失败',
      en: 'Failed to load data'
    };
    emptyEl.textContent = errorTexts[window.currentLang || 'zh'];
    emptyEl.classList.remove('hidden');
  }
}

// 【新增】交互事件绑定函数
function bind() {
    // 使用事件委托，监听列表区域内所有 critique-toggle 按钮的点击事件
    listEl.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.critique-toggle');
        
        if (toggleBtn) {
            e.preventDefault();
            const itemId = toggleBtn.dataset.id;
            // 通过 data-id 找到对应的分析内容容器
            const contentEl = document.getElementById(`critique-${itemId}`);
            
            if (contentEl) {
                // 切换 'hidden' 类，实现显示/隐藏效果
                contentEl.classList.toggle('hidden');
                
                // 更新按钮文本，提示用户当前状态
                const isHidden = contentEl.classList.contains('hidden');
                const lang = window.currentLang || 'zh';
                
                if (lang === 'zh') {
                    toggleBtn.textContent = isHidden ? '👓 深度分析' : '▲ 收起分析';
                } else {
                    toggleBtn.textContent = isHidden ? '👓 Critical Analysis' : '▲ Collapse Analysis';
                }
            }
        }
    });
}

function render(items) {
  if (!items?.length) { 
    const emptyTexts = {
      zh: '暂无内容',
      en: 'No content available'
    };
    emptyEl.textContent = emptyTexts[window.currentLang || 'zh'];
    emptyEl.classList.remove('hidden'); 
    return; 
  }
  emptyEl.classList.add('hidden');
  // 【修改】在 map 中传入索引 i，作为生成唯一 ID 的基础
  listEl.innerHTML = items.map((item, i) => card(item, i, window.currentLang || 'zh')).join('');
}

function renderWithLanguage(items, lang) {
  if (!items?.length) { 
    const emptyTexts = {
      zh: '暂无内容',
      en: 'No content available'
    };
    emptyEl.textContent = emptyTexts[lang];
    emptyEl.classList.remove('hidden'); 
    return; 
  }
  emptyEl.classList.add('hidden');
  // 【修改】在 map 中传入索引 i
  listEl.innerHTML = items.map((item, i) => card(item, i, lang)).join('');
}

// 【修改】card 函数：增加第二个参数 i，并增加深度分析的 HTML 结构
function card(item, i, lang = 'zh'){
  const tagsArray = lang === 'zh' ? (item.tags_zh || item.tags || []) : (item.tags || []);
  const tags = tagsArray.join(', ');
  const title = lang === 'zh' ? (item.title_zh || item.title) : item.title;
  const desc = lang === 'zh' ? (item.summary_zh || '') : (item.summary_en || '');
  const quote = lang === 'zh' ? (item.best_quote_zh || '') : (item.best_quote_en || '');
  const quoteWrapper = lang === 'zh' ? '「」' : '""';
  const aiSummaryLabel = lang === 'zh' ? 'AI总结：' : 'AI Summary: ';
  
  // --- 【新增代码】深度分析逻辑 ---
  const critiqueField = lang === 'zh' ? 'critique_zh' : 'critique_en';
  // 从数据中获取批判性分析文本
  const critique = item[critiqueField] || '';
  const critiqueButtonText = lang === 'zh' ? '👓 深度分析' : '👓 Critical Analysis';
  
  // 使用索引 i 生成一个唯一的 ID
  const uniqueId = `v1-${i}`; 

  const critiqueHtml = critique ? `
    <div class="critique-container">
      <button class="critique-toggle" data-id="${uniqueId}">${critiqueButtonText}</button>
      <div id="critique-${uniqueId}" class="critique-content hidden">
        <p>${esc(critique)}</p>
      </div>
    </div>
  ` : '';
  // --- 【新增代码结束】 ---

  return `
    <article class="card">
      <h3><a href="${item.link}" target="_blank" rel="noopener">${esc(title)}</a></h3>
      ${desc ? `<p><span class="ai-label">${aiSummaryLabel}</span>${esc(desc)}</p>` : ''}
      ${quote ? `<blockquote>${quoteWrapper[0]}${esc(quote)}${quoteWrapper[1]}</blockquote>` : ''}
      ${critiqueHtml} <div class="meta">${esc(item.source)} · ${esc(tags)} · ${esc(item.date||'')}</div>
    </article>
  `;
}

function esc(s) { return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
