# utilities/__init__.py

import os
from .chronicler import init_chronicler

# Singleton pattern - initialize once
_chronicler_instance = None

def get_chronicler():
    global _chronicler_instance
    if _chronicler_instance is None:
        _chronicler_instance = init_chronicler()
    return _chronicler_instance
