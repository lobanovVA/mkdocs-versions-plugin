/**
 * Функция для добавления выплывающего списка версий в хедер.
 * @param {Array} versionsData - Массив объектов с данными о версиях
 * @param {string} defaultVersion - Название версии по умолчанию (опционально)
 */
function addDropdownToHeader(versionsData, defaultVersion) {
    const header = document.querySelector(".md-header");

    if (header && !header.querySelector('.md-dropdown--custom')) {
        // Глобальные функции для использования везде
        window.escapeHtml = function(text) {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return text.replace(/[&<>"']/g, m => map[m]);
        };

        window.buildNavHtml = function(items) {
            if (!items || !items.length) return '';
            let html = '';
            items.forEach(function(it) {
                if (it.type === 'section' || it.type === 'dir') {
                    html += '<li class="md-nav__item">';
                    html += '<div class="md-nav__link"><strong>' + window.escapeHtml(it.name) + '</strong></div>';
                    html += '<ul class="md-nav__list">' + window.buildNavHtml(it.children) + '</ul>';
                    html += '</li>';
                } else if (it.type === 'page') {
                    html += '<li class="md-nav__item">';
                    html += '<a class="md-nav__link" href="' + window.escapeHtml(it.url) + '"><span class="md-ellipsis">' + window.escapeHtml(it.name) + '</span></a>';
                    html += '</li>';
                }
            });
            return html;
        };

        // Инициализируем currentVersion
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

                            // Обновляем навигацию только когда пользователь явно выбрал версию
                            const navList = document.querySelector('.md-nav__list');
                            if (navList) {
                                const newHtml = window.buildNavHtml(version.children || []);
                                navList.innerHTML = newHtml;
                            }
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
                obs.disconnect();
            }
        });

        observer.observe(header, { childList: true, subtree: true });
    }

    // Функция для восстановления навигации - вызывается только при загрузке
    window.restoreNavigation = function() {
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
                    // Обновляем кнопку
                    const button = document.querySelector('.md-dropdown-button');
                    if (button) {
                        button.textContent = found.name;
                    }
                    
                    // Обновляем навигацию один раз при загрузке
                    const navList = document.querySelector('.md-nav__list');
                    if (navList) {
                        const newHtml = window.buildNavHtml(found.children || []);
                        navList.innerHTML = newHtml;
                    }
                }
            } catch (e) {
                console.error('Ошибка восстановления версии:', e);
            }
        }
    };

    // Восстанавливаем навигацию при загрузке страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(window.restoreNavigation, 100);
        });
    } else {
        // Если документ уже загружен
        setTimeout(window.restoreNavigation, 100);
    }
}
