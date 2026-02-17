/**
 * Функция для добавления выплывающего списка версий в хедер.
 * @param {Array} versionsData - Массив объектов с данными о версиях
 * Пример: [{name: 'v1.0', url: '/versions/v1.0/'}, ...]
 */
function addDropdownToHeader(versionsData) {
    const header = document.querySelector(".md-header");

    if (header && !header.querySelector('.md-dropdown--custom')) {
        const observer = new MutationObserver((mutations, obs) => {
            const searchButton = header.querySelector("[data-md-component='search']");
            if (searchButton) {
                // Создаем контейнер для dropdown
                const dropdownContainer = document.createElement("div");
                dropdownContainer.className = "md-dropdown--custom";

                // Создаем кнопку для открытия dropdown
                const button = document.createElement("button");
                button.className = "md-dropdown-button";
                button.textContent = "Версии";
                button.setAttribute("aria-haspopup", "true");
                button.setAttribute("aria-expanded", "false");

                // Создаем список опций
                const dropdown = document.createElement("ul");
                dropdown.className = "md-dropdown-menu";

                // Утилита: попытка найти навигацию в документе
                function findNavNode(doc) {
                    const selectors = ['.md-nav', 'nav.md-nav', '.md-sidebar', 'nav[aria-label]'];
                    for (const sel of selectors) {
                        const node = doc.querySelector(sel);
                        if (node) return node;
                    }
                    return null;
                }

                // Функция замены сайдбара на структуру выбранной версии
                function replaceSidebarWithHtml(htmlText) {
                    try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(htmlText, 'text/html');
                        const newNav = findNavNode(doc);
                        if (!newNav) return;

                        // Пытаемся заменить наиболее подходящий контейнер
                        const currentNav = findNavNode(document) || document.querySelector('.md-sidebar');
                        if (currentNav) {
                            // Заменяем содержимое
                            currentNav.innerHTML = newNav.innerHTML;
                        }
                    } catch (err) {
                        console.error('replaceSidebarWithHtml error', err);
                    }
                }

                // Функция для построения HTML списка навигации из дерева
                function buildNavHtml(items) {
                    if (!items || !items.length) return '';
                    let html = '';
                    items.forEach(function(it) {
                        if (it.type === 'dir') {
                            html += '<li class="md-nav__item">';
                            html += '<a class="md-nav__link" href="' + it.url + '"><span class="md-ellipsis">' + it.name + '</span></a>';
                            html += '<ul class="md-nav__list">' + buildNavHtml(it.children) + '</ul>';
                            html += '</li>';
                        } else if (it.type === 'page') {
                            html += '<li class="md-nav__item">';
                            html += '<a class="md-nav__link" href="' + it.url + '"><span class="md-ellipsis">' + it.name + '</span></a>';
                            html += '</li>';
                        }
                    });
                    return html;
                }

                // При клике — подставляем структуру версии в сайдбар
                if (versionsData && Array.isArray(versionsData)) {
                    versionsData.forEach(function(version) {
                        const menuItem = document.createElement("li");
                        const link = document.createElement("a");
                        link.href = version.url;
                        link.textContent = version.name;

                        link.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            // Закрываем меню
                            button.setAttribute('aria-expanded', 'false');
                            dropdown.classList.remove('open');

                            // Строим HTML навигации и вставляем в левый сайдбар
                            try {
                                const navList = document.querySelector('.md-nav__list');
                                if (navList) {
                                    const newHtml = buildNavHtml(version.children || []);
                                    navList.innerHTML = newHtml;
                                }
                                try { history.pushState({}, '', version.url); } catch (e) {}
                            } catch (err) {
                                console.error('Ошибка при подстановке структуры версии:', err);
                            }
                        });

                        menuItem.appendChild(link);
                        dropdown.appendChild(menuItem);
                    });
                }

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

                // Закрываем dropdown при клике вне него
                document.addEventListener("click", function(e) {
                    if (!dropdownContainer.contains(e.target)) {
                        button.setAttribute("aria-expanded", "false");
                        dropdown.classList.remove("open");
                    }
                });

                searchButton.insertAdjacentElement('beforebegin', dropdownContainer);
                obs.disconnect(); // Отключаем наблюдатель, чтобы не тратить ресурсы
            }
        });

        observer.observe(header, { childList: true, subtree: true });
    }

    // Обрабатываем навигацию истории — подгружаем структуру при возврате назад/вперед
    window.addEventListener('popstate', function() {
        const url = location.pathname;
        fetch(url, { credentials: 'same-origin' })
            .then(r => r.text())
            .then(html => {
                // Заменяем сайдбар на страницу, соответствующую URL
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const selectors = ['.md-nav', 'nav.md-nav', '.md-sidebar', 'nav[aria-label]'];
                for (const sel of selectors) {
                    const node = doc.querySelector(sel);
                    if (node) {
                        const current = document.querySelector(sel) || document.querySelector('.md-sidebar');
                        if (current) current.innerHTML = node.innerHTML;
                        break;
                    }
                }
            })
            .catch(() => {});
    });
}
