from setuptools import setup, find_packages

setup(
    name="mkdocs-versioning",
    version="0.1.1",
    description="Simple version selector for MkDocs",
    packages=find_packages(),
    include_package_data=True,
    entry_points={
        "mkdocs.plugins": [
            "header_plugin = versions_plugin.plugin:MyButtonPlugin"
        ]
    },
    package_data={
        'versions_plugin': [
            'extra_files/*.css', 
            'extra_files/*.js'
            ]
        }
    )
