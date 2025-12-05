"""
Плагин для MkDocs, добавляющий кастомную кнопку в заголовок сайта.
Кнопка ведет на указанную в конфигурации целевую страницу.
"""

from importlib.resources import files
from mkdocs.plugins import BasePlugin
from bs4 import BeautifulSoup
from mkdocs.structure.pages import Page
from mkdocs.config import config_options


class MyButtonPlugin(BasePlugin):
    """
    Плагин добавляет кнопку в шапку документации MkDocs.
    
    Особенности:
    - Кнопка появляется на всех страницах
    - Ведет на целевую страницу, указанную в конфигурации
    - Совместим с Material for MkDocs темой
    - Поддерживает Instant Loading (SPA-режим)
    """
    
    # Схема конфигурации плагина - определяем допустимые параметры
    config_scheme = (
        # Параметр 'target_page' - путь к целевой странице относительно docs_dir
        ('target_page', config_options.Type(str, default='index.md')),
    )

    def on_nav(self, nav, config, files):
        """
        Обработчик события построения навигации.
        
        Args:
            nav: Объект навигации MkDocs
            config: Конфигурация MkDocs
            files: Список файлов проекта
            
        Returns:
            Модифицированная навигация
        """
        # Сохраняем элементы навигации для последующего использования
        # Это нужно, чтобы позже найти URL целевой страницы
        self.nav_items = nav.pages
        return nav

    def on_post_page(self, output_content, page, config):
        """
        Обработчик, вызываемый после генерации HTML страницы.
        Добавляет кнопку в заголовок каждой страницы.
        
        Args:
            output_content: Сгенерированный HTML-код страницы
            page: Объект текущей страницы
            config: Конфигурация MkDocs
            
        Returns:
            Модифицированный HTML-код с добавленной кнопкой
        """
        # Парсим HTML для удобного манипулирования
        soup = BeautifulSoup(output_content, 'html.parser')
        
        # Ищем URL целевой страницы в ранее сохраненной навигации
        target_url = None
        if hasattr(self, 'nav_items'):
            # Проходим по всем страницам в навигации
            for nav_page in self.nav_items:
                # Сравниваем путь к исходному файлу с целевым путем из конфигурации
                if nav_page.file.src_path == self.config['target_page']:
                    target_url = "/" + nav_page.url  # Получаем относительный URL
                    break
        
        # Если нашли целевую страницу, добавляем кнопку
        if target_url:
            js_content = files("versions_plugin.extra_files").joinpath("extra_js.js").read_text()
            js_content = js_content.replace("__TARGET_URL__", f"'{target_url}'")
            js_script = soup.new_tag("script")
            js_script.string = f"""
                // Код из extra_js.js
                {js_content}

                // Вызовы функции addButtonToHeader с правильным URL
                window.addEventListener('DOMContentLoaded', function() {{
                    addButtonToHeader('{target_url}');
                }});
                
                if (window.document$ && window.document$.subscribe) {{
                    document$.subscribe(function() {{
                        addButtonToHeader('{target_url}');
                    }});
                }}
            """
            
            # Создаем стили для кастомной кнопки
            css_content = files("versions_plugin.extra_files").joinpath("extra_css.css").read_text()
            style_tag = soup.new_tag("style")
            style_tag.string = css_content
            
            # Добавляем стили и скрипт в <head> документа
            head_tag = soup.find('head')
            if head_tag:
                head_tag.append(style_tag)   # Сначала стили
                head_tag.append(js_script)   # Затем JavaScript
        
        print(f"Target URL: {target_url}")
        
        # Возвращаем модифицированный HTML в виде строки
        return str(soup)