from mkdocs.plugins import BasePlugin
from bs4 import BeautifulSoup
from mkdocs.structure.pages import Page
from mkdocs.config import config_options # Добавьте этот импорт

class MyButtonPlugin(BasePlugin):
    # Добавляем в схему конфигурации плагина, чтобы пользователь мог указать путь к странице
    config_scheme = (
        ('target_page', config_options.Type(str, default='index.md')),
    )

    def on_nav(self, nav, config, files):
        # Сохраняем готовую навигацию в атрибут класса
        self.nav_items = nav.pages
        return nav

    def on_post_page(self, output_content, page, config):
        soup = BeautifulSoup(output_content, 'html.parser')
        
        target_url = None
        # Итерируем по сохранённым элементам навигации
        if hasattr(self, 'nav_items'):
            for nav_page in self.nav_items:
                if nav_page.file.src_path == self.config['target_page']:
                    target_url = nav_page.url
                    break
        
        if target_url:
            js_script = soup.new_tag("script")
            # ... остальная часть JavaScript-кода ...
            js_script.string = f"""
            function addButtonToHeader() {{
                const header = document.querySelector(".md-header");
                if (header) {{
                    // Проверяем, существует ли кнопка, чтобы избежать дублирования
                    if (!header.querySelector('.md-button--custom')) {{
                        const button = document.createElement("a");
                        button.href = "{target_url}"; // Использование переменной Python
                        button.className = "md-button md-button--custom";
                        button.textContent = "Моя кнопка";
                        
                        const searchButton = header.querySelector("[data-md-component='search']");
                        if (searchButton) {{
                            searchButton.insertAdjacentElement('beforebegin', button);
                        }} else {{
                            header.appendChild(button);
                        }}
                    }}
                }}
            }}

            // Выполняем при первой загрузке
            document.addEventListener("DOMContentLoaded", addButtonToHeader);
            
            // Подписываемся на события Instant Loading
            // Используем setTimeout, чтобы убедиться, что все элементы темы Material загружены
            document$.subscribe(() => setTimeout(addButtonToHeader, 0));
        """

            
            style_tag = soup.new_tag("style")
            style_tag.string = """
                .md-header .md-button--custom {
                    margin-left: 1rem;
                    white-space: nowrap;
                }
            """

            head_tag = soup.find('head')
            if head_tag:
                head_tag.append(style_tag)
                head_tag.append(js_script)
        
        return str(soup)

