/**
 * Функция для добавления выплывающего списка версий в хедер.
 * @param {Array} versionsData - Массив объектов с данными о версиях
 * @param {string} defaultVersion - Название версии по умолчанию (опционально)
 */
function addDropdownToHeader(versionsData, defaultVersion) {
    const header = document.querySelector(".md-header");

    // Скрываем стандартную навигацию, чтобы избежать мерцания
    const navNode = document.querySelector('.md-nav') || document.querySelector('.md-sidebar');
    if (navNode) {
        navNode.style.transition = navNode.style.transition || 'opacity 0.15s ease';
        navNode.style.opacity = '0';
    }

    if (header && !header.querySelector('.md-dropdown--custom')) {
        // Определяем текущую версию
        let currentVersion = null;
        {
            let saved = sessionStorage.getItem('selectedVersion');
            if (saved) {
                try {
                    currentVersion = JSON.parse(saved);
                } catch (e) {
                    currentVersion = null;
                }
            }
            
            
            if (!currentVersion && versionsData && versionsData.length > 0) {
                if (defaultVersion) {
                    currentVersion = versionsData.find(v => v.name === defaultVersion);
                }
                if (!currentVersion) {
                    currentVersion = versionsData[0];
                }
                if (currentVersion) {
                    sessionStorage.setItem('selectedVersion', JSON.stringify(currentVersion));
                }
            }
        }

        // Функция для построения HTML навигации
        function buildNavHtml(items, currentPath = '') {
            if (!items || !items.length) return '';
            let html = '';
            items.forEach(function(it) {
                if (it.type === 'section' || it.type === 'dir') {
                    const itemPath = currentPath + '/' + it.name;
                    const storageKey = 'navCollapsed_' + itemPath;
                    const isCollapsed = sessionStorage.getItem(storageKey) === 'true';
                    const expandedAttr = isCollapsed ? 'false' : 'true';
                    const collapsedClass = isCollapsed ? ' collapsed' : '';

                    html += '<li class="md-nav__item' + collapsedClass + '" data-path="' + itemPath + '">';
                    html += '<div class="md-nav__link md-nav__section-toggle" data-collapsible="true" aria-expanded="' + expandedAttr + '"><strong>' + escapeHtml(it.name) + '</strong></div>';
                    html += '<ul class="md-nav__list">' + buildNavHtml(it.children, itemPath) + '</ul>';
                    html += '</li>';
                } else if (it.type === 'page') {
                    html += '<li class="md-nav__item">';
                    html += '<a class="md-nav__link" href="' + escapeHtml(it.url) + '"><span class="md-ellipsis">' + escapeHtml(it.name) + '</span></a>';
                    html += '</li>';
                }
            });
            return html;
        }

        function initCollapsibles(container) {
            const toggles = (container || document).querySelectorAll('.md-nav__section-toggle');
            toggles.forEach(function(toggle) {
                const item = toggle.closest('.md-nav__item');
                if (!item) return;

                // Если уже инициализировано, пропускаем
                if (toggle.dataset._collapsibleInit) return;
                toggle.dataset._collapsibleInit = '1';

                toggle.style.cursor = 'pointer';
                toggle.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const isCollapsed = item.classList.toggle('collapsed');
                    toggle.setAttribute('aria-expanded', (!isCollapsed).toString());
                    const path = item.dataset.path;
                    const storageKey = 'navCollapsed_' + path;
                    sessionStorage.setItem(storageKey, isCollapsed.toString());
                });
            });
        }

        function escapeHtml(text) {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return text.replace(/[&<>"']/g, m => map[m]);
        }

        // Функция для восстановления навигации
        function restoreNavigation() {
            let savedVersion = sessionStorage.getItem('selectedVersion');
            
            if (!savedVersion && versionsData && versionsData.length > 0) {
                let versionToUse = defaultVersion ? versionsData.find(v => v.name === defaultVersion) : null;
                if (!versionToUse) versionToUse = versionsData[0];
                savedVersion = JSON.stringify(versionToUse);
                sessionStorage.setItem('selectedVersion', savedVersion);
            }
            
            if (savedVersion && versionsData && Array.isArray(versionsData)) {
                try {
                    const version = JSON.parse(savedVersion);
                    const found = versionsData.find(v => v.name === version.name);
                    
                    if (found) {
                        const navList = document.querySelector('.md-nav__list');
                        if (navList) {
                            const newHtml = buildNavHtml(found.children || [], '');
                            navList.innerHTML = newHtml;
                            initCollapsibles(navList);
                        }

                        // Показываем навигацию после подстановки, чтобы убрать мерцание
                        if (navNode) {
                            navNode.style.opacity = '';
                        }
                    }
                } catch (e) {
                    console.error('Ошибка восстановления версии:', e);
                }
            }
        }

        const observer = new MutationObserver((mutations, obs) => {
            const searchButton = header.querySelector("[data-md-component='search']");
            if (searchButton && !header.querySelector('.md-dropdown--custom')) {
                const dropdownContainer = document.createElement("div");
                dropdownContainer.className = "md-dropdown--custom";

                const button = document.createElement("button");
                button.className = "md-dropdown-button";
                button.setAttribute("aria-haspopup", "true");
                button.setAttribute("aria-expanded", "false");
                button.textContent = currentVersion ? currentVersion.name : "Версии";

                const dropdown = document.createElement("ul");
                dropdown.className = "md-dropdown-menu";

                if (versionsData && Array.isArray(versionsData)) {
                    versionsData.forEach(function(version) {
                        const menuItem = document.createElement("li");
                        const link = document.createElement("a");
                        link.href = "#";
                        link.textContent = version.name;

                        link.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            currentVersion = version;
                            sessionStorage.setItem('selectedVersion', JSON.stringify(version));
                            button.textContent = version.name;
                            button.setAttribute('aria-expanded', 'false');
                            dropdown.classList.remove('open');

                            // Обновляем навигацию только при выборе версии
                            restoreNavigation();
                        });

                        menuItem.appendChild(link);
                        dropdown.appendChild(menuItem);
                    });
                }

                dropdownContainer.appendChild(button);
                dropdownContainer.appendChild(dropdown);

                button.addEventListener("click", function(e) {
                    e.stopPropagation();
                    const isExpanded = button.getAttribute("aria-expanded") === "true";
                    button.setAttribute("aria-expanded", !isExpanded);
                    dropdown.classList.toggle("open");
                });

                document.addEventListener("click", function(e) {
                    if (!dropdownContainer.contains(e.target)) {
                        button.setAttribute("aria-expanded", "false");
                        dropdown.classList.remove("open");
                    }
                });

                searchButton.insertAdjacentElement('beforebegin', dropdownContainer);
                
                // Восстанавливаем навигацию один раз после создания кнопки
                restoreNavigation();
                
                obs.disconnect();
            }
        });

        observer.observe(header, { childList: true, subtree: true });
    }
}
