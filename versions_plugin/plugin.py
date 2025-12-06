import os
import shutil
import tempfile
from mkdocs.plugins import BasePlugin
from mkdocs.config import config_options

class MyThemePlugin(BasePlugin):
    config_scheme = (
        ('target_page', config_options.Type(str, default='index.md')),
    )

    def on_config(self, config, **kwargs):
        # Создаем временный каталог
        temp_dir = tempfile.mkdtemp(prefix='mkdocs_my_plugin_')
        
        # Копируем статические файлы в этот временный каталог
        plugin_path = os.path.dirname(__file__)
        static_path = os.path.join(plugin_path, 'extra_files')
        shutil.copytree(static_path, os.path.join(temp_dir, 'extra_files'))

        # Добавляем временный каталог в custom_dir
        if config['theme'].get('custom_dir'):
            if not isinstance(config['theme']['custom_dir'], list):
                config['theme']['custom_dir'] = [config['theme']['custom_dir']]
            config['theme']['custom_dir'].append(temp_dir)
        else:
            config['theme']['custom_dir'] = temp_dir
            
        # Добавляем стили, используя относительный путь
        extra_css_rel_path = 'extra_files/extra_css.css'
        if 'extra_css' not in config:
            config['extra_css'] = []
        config['extra_css'].append(extra_css_rel_path)

        # Сохраняем конфигурацию для on_page_context
        self.config = config

        return config
    
    def on_page_context(self, context, **kwargs):
        # ... (логика остается без изменений) ...
        target_page_path = self.config.get('target_page') 
        target_url = None

        if target_page_path:
            for page in context['nav'].pages:
                if page.file.src_path == target_page_path:
                    target_url = '/' + page.url if not page.url.startswith('/') else page.url
                    break
        
        context['my_button_target_url'] = target_url
        return context
