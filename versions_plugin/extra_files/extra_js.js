/**
 * Функция для добавления кнопки в хедер, принимающая URL как аргумент.
 */
function addButtonToHeader() {
    const header = document.querySelector(".md-header");

    if (header && !header.querySelector('.md-button--custom')) {
        const observer = new MutationObserver((mutations, obs) => {
            const searchButton = header.querySelector("[data-md-component='search']");
            if (searchButton) {
                const button = document.createElement("a");
                button.href = __TARGET_URL__;
                button.className = "md-button md-button--custom";
                button.textContent = "Моя кнопка";
                searchButton.insertAdjacentElement('beforebegin', button);
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
