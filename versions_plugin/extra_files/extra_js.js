/**
 * Функция для добавления кнопки в хедер, принимающая URL как аргумент.
 */
function addButtonToHeader() {
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
                obs.disconnect(); // Отключаем наблюдатель, чтобы не тратить ресурсы
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
