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
        # Параметр 'versions_folder' - путь к папке с версиями относительно docs_dir
        ('versions_folder', config_options.Type(str, default='versions')),
        # Параметр 'default_version' - название версии, которую выбирать по умолчанию
        ('default_version', config_options.Type(str, default=None)),
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

    def get_versions_list(self):
        """
        Получает дерево папок и файлов внутри указанной директории версий.

        Возвращает список объектов вида:
        [{ 'name': 'v1.0', 'url': '/versions/v1.0/', 'children': [ ... ] }, ...]
        """
        versions = []
        versions_folder = self.config['versions_folder']

        # Строим путь к папке версий относительно docs_dir
        docs_dir = self.mkdocs_config['docs_dir'] if hasattr(self, 'mkdocs_config') else 'docs'
        versions_path = os.path.join(docs_dir, versions_folder)

        def build_tree(path, rel_url_prefix):
            """Рекурсивно собирает дерево для папки path."""
            items = []
            try:
                for name in sorted(os.listdir(path)):
                    full = os.path.join(path, name)
                    if os.path.isdir(full):
                        node_url = f"{rel_url_prefix}{name}/"
                        items.append({
                            'type': 'dir',
                            'name': name,
                            'url': node_url,
                            'children': build_tree(full, node_url)
                        })
                    else:
                        # Файлы - только markdown
                        if name.lower().endswith('.md'):
                            # Для index.md нам достаточно URL папки
                            if name.lower() == 'index.md':
                                items.append({
                                    'type': 'page',
                                    'name': os.path.basename(path),
                                    'url': rel_url_prefix
                                })
                            else:
                                fname = os.path.splitext(name)[0]
                                items.append({
                                    'type': 'page',
                                    'name': fname,
                                    'url': f"{rel_url_prefix}{fname}/"
                                })
            except Exception:
                return []
            return items

        if os.path.isdir(versions_path):
            try:
                for item in sorted(os.listdir(versions_path)):
                    item_path = os.path.join(versions_path, item)
                    if os.path.isdir(item_path):
                        # Версия отображается как раздел (section) без собственной ссылки
                        # type='section' для правильного отображения в навигации
                        folder_url = f"/{versions_folder}/{item}/"
                        versions.append({
                            'name': item,
                            'type': 'section',
                            'children': build_tree(item_path, folder_url)
                        })
            except Exception as e:
                print(f"Ошибка при чтении папки версий: {e}")

        return versions

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
        
        # Получаем список версий
        versions = self.get_versions_list()
        
        print(f"DEBUG: Найдено версий: {len(versions)}")
        print(f"DEBUG: Данные версий: {versions}")
        print(f"DEBUG: Default version: {self.config['default_version']}")
        
        # Если список версий не пуст, добавляем меню
        if versions:
            # Преобразуем список в JSON для передачи в JavaScript
            versions_json = json.dumps(versions)
            default_version = self.config['default_version']
            
            js_content = files("versions_plugin.extra_files").joinpath("extra_js.js").read_text()
            js_script = soup.new_tag("script")
            js_script.string = f"""
                // Код из extra_js.js
                {js_content}

                // Вызовы функции addDropdownToHeader с данными версий
                var versionsData = {versions_json};
                var defaultVersion = {json.dumps(default_version)};
                
                // Флаг чтобы не инициализировать функцию дважды
                if (!window._dropdownInitialized) {{
                    window._dropdownInitialized = true;
                    
                    // Инициализируем при загрузке
                    if (document.readyState === 'loading') {{
                        document.addEventListener('DOMContentLoaded', function() {{
                            addDropdownToHeader(versionsData, defaultVersion);
                        }});
                    }} else {{
                        addDropdownToHeader(versionsData, defaultVersion);
                    }}
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