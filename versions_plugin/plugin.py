"""
Плагин для MkDocs, добавляющий выплывающее меню с версиями в заголовок сайта.
Меню содержит все папки из указанной директории.
"""

import os
import json
from importlib.resources import files
from mkdocs.plugins import BasePlugin
from bs4 import BeautifulSoup
from mkdocs.structure.pages import Page
from mkdocs.config import config_options


class MyButtonPlugin(BasePlugin):
    """
    Плагин добавляет выплывающее меню в шапку документации MkDocs.
    
    Особенности:
    - Меню появляется на всех страницах
    - Содержит список всех папок из указанной директории
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
        Сохраняем конфигурацию для последующего использования.
        
        Args:
            nav: Объект навигации MkDocs
            config: Конфигурация MkDocs
            files: Список файлов проекта
            
        Returns:
            Модифицированная навигация
        """
        # Сохраняем конфигурацию MkDocs
        self.mkdocs_config = config
        # Сохраняем элементы навигации для последующего использования
        self.nav_items = nav.pages
        return nav

    def on_post_page(self, output_content, page, config):
        """
        Обработчик, вызываемый после генерации HTML страницы.
        Добавляет выплывающее меню в заголовок каждой страницы.
        
        Args:
            output_content: Сгенерированный HTML-код страницы
            page: Объект текущей страницы
            config: Конфигурация MkDocs
            
        Returns:
            Модифицированный HTML-код с добавленным меню
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
            
            # Создаем стили для dropdown меню
            css_content = files("versions_plugin.extra_files").joinpath("extra_css.css").read_text()
            style_tag = soup.new_tag("style")
            style_tag.string = css_content
            
            # Добавляем стили и скрипт в <head> документа
            head_tag = soup.find('head')
            if head_tag:
                head_tag.append(style_tag)   # Сначала стили
                head_tag.append(js_script)   # Затем JavaScript
        
        # Возвращаем модифицированный HTML в виде строки
        return str(soup)