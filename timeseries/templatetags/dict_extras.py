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
    
    if not isinstance(dictionary, dict):
        return None
    
    # First try direct key lookup (handles symbols like "NEM.US")
    if key in dictionary:
        return dictionary[key]
    
    # If direct lookup fails and key contains dots, try nested access
    # This is for actual nested structures, not symbol names with dots
    if hasattr(key, 'split') and '.' in str(key):
        keys = str(key).split('.')
        result = dictionary
        for k in keys:
            if isinstance(result, dict) and k in result:
                result = result[k]
            else:
                return None
        return result
    
    # Return None if key not found
    return None

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


@register.filter
def index(indexable, i):
    """
    Template filter to get an item from a list/array by index.
    
    Usage in template: {{ my_list|index:0 }} or {{ my_list|index:forloop.counter0 }}
    
    Args:
        indexable: The list, tuple, or other indexable object
        i: The index to access
        
    Returns:
        The item at the given index, or None if index is invalid
    """
    try:
        return indexable[int(i)]
    except (IndexError, TypeError, ValueError, KeyError):
        return None


@register.filter  
def getattr(obj, attr):
    """
    Template filter to get an attribute from an object.
    
    Usage in template: {{ my_object|getattr:"attribute_name" }}
    
    Args:
        obj: The object to get the attribute from
        attr: The attribute name
        
    Returns:
        The attribute value, or None if attribute doesn't exist
    """
    try:
        return getattr(obj, str(attr), None)
    except (AttributeError, TypeError):
        return None

@register.filter
def replace_underscore(value):
    """Replace underscores with spaces for display labels."""
    if isinstance(value, str):
        return value.replace('_', ' ')
    return value