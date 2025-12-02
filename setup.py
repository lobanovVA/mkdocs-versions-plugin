from setuptools import setup, find_packages

setup(
    name="mkdocs-versioning",
    version="0.1.0",
    description="Simple version selector for MkDocs",
    packages=find_packages(),
    include_package_data=True,
    entry_points={
        "mkdocs.plugins": [
            "header_plugin = test_plugin.plugin:MyButtonPlugin"
        ]
    }
)
