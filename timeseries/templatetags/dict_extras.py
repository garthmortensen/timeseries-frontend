#!/usr/bin/env python3
# timeseries/templatetags/dict_extras.py

"""
Custom template filters for dictionary operations.
"""

from django import template

register = template.Library()

@register.filter
def lookup(dictionary, key):
    """
    Template filter to look up a key in a dictionary.
    
    Usage in template: {{ my_dict|lookup:my_key }}
    
    Args:
        dictionary: The dictionary to look up in
        key: The key to look up
        
    Returns:
        The value for the key, or None if key doesn't exist
    """
    if dictionary is None:
        return None
    
    # Handle nested key access (e.g., 'symbol.to_others')
    if hasattr(key, 'split') and '.' in str(key):
        keys = str(key).split('.')
        result = dictionary
        for k in keys:
            if isinstance(result, dict) and k in result:
                result = result[k]
            else:
                return None
        return result
    
    # Simple key lookup
    return dictionary.get(key, None) if isinstance(dictionary, dict) else None

@register.filter
def abs(value):
    """
    Template filter to get the absolute value of a number.
    
    Usage in template: {{ my_number|abs }}
    
    Args:
        value: The number to get absolute value of
        
    Returns:
        The absolute value of the number, or 0 if invalid
    """
    try:
        return abs(float(value))
    except (ValueError, TypeError):
        return 0