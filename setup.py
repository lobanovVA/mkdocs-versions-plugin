from setuptools import setup, find_packages

setup(
    name="mkdocs-versioning",
    version="0.1.0",
    description="MkDocs plugin to add a custom button to the header.",
    packages=find_packages(),
    entry_points={
        "mkdocs.plugins": [
            "header_plugin = versions_plugin.plugin:MyThemePlugin"
        ]
    },
    include_package_data=True,
    package_data={
        "versions_plugin": ["overrides/**/*.html", "static/css/*.css"]
    }
)
