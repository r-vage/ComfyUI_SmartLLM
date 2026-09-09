const LEGACY_TASK_ALIASES = Object.freeze({
    'MiniMax H3 Scene 5s': 'MiniMax H3 Scene',
    'MiniMax H3 T2VA Timeline 15s': 'MiniMax H3 T2VA Timeline',
    'MiniMax H3 I2VA Timeline 15s': 'MiniMax H3 I2VA Timeline',
    'MiniMax H3 FL2VA Timeline 15s': 'MiniMax H3 FL2VA Timeline',
    'MiniMax H3 L2VA Timeline 15s': 'MiniMax H3 L2VA Timeline',
});

export function canonicalizeTaskName(value) {
    return LEGACY_TASK_ALIASES[value] ?? value;
}

export function migrateLegacyTaskWidget(widget) {
    if (!widget) return false;
    const canonical = canonicalizeTaskName(widget.value);
    if (canonical === widget.value) return false;
    widget.value = canonical;
    return true;
}
