/**
 * Функция для добавления кнопки в хедер, принимающая URL как аргумент.
 */
function addButtonToHeader() {
    const header = document.querySelector(".md-header");

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
        function buildNavHtml(items) {
            if (!items || !items.length) return '';
            let html = '';
            items.forEach(function(it) {
                if (it.type === 'section' || it.type === 'dir') {
                    html += '<li class="md-nav__item">';
                    html += '<div class="md-nav__link"><strong>' + escapeHtml(it.name) + '</strong></div>';
                    html += '<ul class="md-nav__list">' + buildNavHtml(it.children) + '</ul>';
                    html += '</li>';
                } else if (it.type === 'page') {
                    html += '<li class="md-nav__item">';
                    html += '<a class="md-nav__link" href="' + escapeHtml(it.url) + '"><span class="md-ellipsis">' + escapeHtml(it.name) + '</span></a>';
                    html += '</li>';
                }
            });
            return html;
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
                            const newHtml = buildNavHtml(found.children || []);
                            navList.innerHTML = newHtml;
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
                
                // Создаем кнопку для открытия dropdown
                const button = document.createElement("button");
                button.className = "md-dropdown-button";
                button.textContent = "Меню";
                button.setAttribute("aria-haspopup", "true");
                button.setAttribute("aria-expanded", "false");
                
                // Создаем список опций
                const dropdown = document.createElement("ul");
                dropdown.className = "md-dropdown-menu";
                
                // Добавляем пункт меню
                const menuItem = document.createElement("li");
                const link = document.createElement("a");
                link.href = __TARGET_URL__;
                link.textContent = "Перейти на целевую страницу";
                menuItem.appendChild(link);
                dropdown.appendChild(menuItem);
                
                // Собираем dropdown
                dropdownContainer.appendChild(button);
                dropdownContainer.appendChild(dropdown);
                
                // Добавляем обработчик клика для открытия/закрытия
                button.addEventListener("click", function(e) {
                    e.stopPropagation();
                    const isExpanded = button.getAttribute("aria-expanded") === "true";
                    button.setAttribute("aria-expanded", !isExpanded);
                    dropdown.classList.toggle("open");
                });
                
                // Закрываем dropdown при клике вне его
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

// Запускаем функцию при первой загрузке и при мгновенных переходах
// Используем setTimeout, чтобы убедиться, что Material-скрипты загружены
if (window.document$ && window.document$.subscribe) {
    document$.subscribe(() => {
        // Вызов функции будет добавлен Python-скриптом
    });
}

window.addEventListener('DOMContentLoaded', () => {
    // Вызов функции будет добавлен Python-скриптом
});
