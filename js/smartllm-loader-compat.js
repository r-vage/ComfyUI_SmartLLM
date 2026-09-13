const LEGACY_WIDGET_VALUE_COUNT = 36;
const RETIRED_TRUST_REMOTE_CODE_INDEX = 35;
const EXPANDED_CURRENT_WIDGET_VALUE_COUNT = 40;
const EXPANDED_LEGACY_WIDGET_VALUE_COUNT = 41;
const EXPANDED_BLACKLIST_LEGACY_WIDGET_VALUE_COUNT = 42;
const EXPANDED_EARLY_UI_ONLY_WIDGET_VALUE_COUNT = 37;
const EXPANDED_RETIRED_TRUST_REMOTE_CODE_INDEX = 37;
const EXPANDED_UI_ONLY_INDICES = Object.freeze([0, 3, 37, 38, 39]);
const EXPANDED_LEGACY_UI_ONLY_INDICES = Object.freeze([0, 3, 38, 39, 40]);
const EXPANDED_LEGACY_REMOVED_INDICES = Object.freeze([0, 3, 37, 38, 39, 40]);
const EXPANDED_BLACKLIST_UI_ONLY_INDICES = Object.freeze([0, 3, 39, 40, 41]);
const EXPANDED_EARLY_UI_ONLY_INDICES = Object.freeze([0, 3]);
const RETAINED_BACKING_WIDGET_NAMES = Object.freeze([
    'memory_cleanup',
    'keep_model_loaded',
    'multi_task_mode',
    'show_advanced',
    'use_advanced',
    'use_few_shot_training',
]);
const MODE_CHIP_VALUES = new Set([
    'Cleanup',
    'Keep Loaded',
    'Multi-Task',
    'Training',
    'Advanced',
    'Use Advanced',
    '⚠ Trust Remote Code',
    'Delete',
]);

function hasRetainedBackingWidgetSignature(widgets) {
    if (!Array.isArray(widgets)) return false;
    const serializedNames = widgets
        .filter(widget => widget?.serialize !== false)
        .map(widget => widget?.name);
    if (serializedNames.length !== LEGACY_WIDGET_VALUE_COUNT - 1) return false;
    return RETAINED_BACKING_WIDGET_NAMES.every(
        (name, index) => serializedNames[29 + index] === name,
    );
}

function hasLegacyBackingValueSignature(values) {
    return values
        .slice(29, LEGACY_WIDGET_VALUE_COUNT)
        .every(value => typeof value === 'boolean');
}

function hasExpandedWidgetSignature(widgets) {
    if (!Array.isArray(widgets) || widgets.length !== EXPANDED_CURRENT_WIDGET_VALUE_COUNT) {
        return false;
    }
    if (
        widgets[0]?.name !== '_smartllm_mode_bar'
        || widgets[1]?.name !== 'model'
        || widgets[2]?.name !== 'quantization'
        || widgets[3]?.name !== '🗑️ Delete Model'
        || widgets[30]?.name !== 'seed'
    ) {
        return false;
    }
    if (!RETAINED_BACKING_WIDGET_NAMES.every(
        (name, index) => widgets[31 + index]?.name === name,
    )) {
        return false;
    }
    return EXPANDED_UI_ONLY_INDICES.every(index => widgets[index]?.serialize === false);
}

function hasModeChipValueSignature(value) {
    return Array.isArray(value)
        && value.length <= MODE_CHIP_VALUES.size
        && value.every(chip => typeof chip === 'string' && MODE_CHIP_VALUES.has(chip));
}

function isEmptyUiOnlyValue(value) {
    return value === '' || value == null;
}

function hasExpandedValueSignature(values, legacy) {
    const backingEnd = legacy
        ? EXPANDED_RETIRED_TRUST_REMOTE_CODE_INDEX + 1
        : EXPANDED_RETIRED_TRUST_REMOTE_CODE_INDEX;
    const uiOnlyIndices = legacy
        ? EXPANDED_LEGACY_UI_ONLY_INDICES
        : EXPANDED_UI_ONLY_INDICES;
    return hasModeChipValueSignature(values[0])
        && values.slice(31, backingEnd).every(value => typeof value === 'boolean')
        && uiOnlyIndices.slice(1).every(index => isEmptyUiOnlyValue(values[index]));
}

function removeIndices(values, indices) {
    const removed = new Set(indices);
    return values.filter((_value, index) => !removed.has(index));
}

function hasExpandedBlacklistLegacyValueSignature(values) {
    return hasModeChipValueSignature(values[0])
        && EXPANDED_BLACKLIST_UI_ONLY_INDICES.slice(1)
            .every(index => isEmptyUiOnlyValue(values[index]))
        && values.slice(32, 39).every(value => typeof value === 'boolean')
        && typeof values[27] === 'number'
        && typeof values[28] === 'number'
        && typeof values[29] === 'number'
        && typeof values[30] === 'string'
        && typeof values[31] === 'boolean';
}

function migrateExpandedBlacklistLegacyValues(values) {
    const legacy = removeIndices(values, EXPANDED_BLACKLIST_UI_ONLY_INDICES);
    return [
        ...legacy.slice(0, 25),
        legacy[26],
        legacy[27],
        legacy[29],
        legacy[25],
        ...legacy.slice(30, 36),
    ];
}

function hasExpandedEarlyUiOnlyValueSignature(values) {
    return isEmptyUiOnlyValue(values[0])
        && isEmptyUiOnlyValue(values[3])
        && values.slice(31, 37).every(value => typeof value === 'boolean');
}

export function migrateRetiredTrustRemoteCodeWidget(info, widgets) {
    if (!info || typeof info !== 'object' || Array.isArray(info)) return info;

    let migrated = info;
    const values = info.widgets_values;
    if (
        Array.isArray(values)
        && values.length === LEGACY_WIDGET_VALUE_COUNT
        && hasRetainedBackingWidgetSignature(widgets)
        && hasLegacyBackingValueSignature(values)
    ) {
        migrated = { ...migrated, widgets_values: values.slice() };
        migrated.widgets_values.splice(RETIRED_TRUST_REMOTE_CODE_INDEX, 1);
    } else if (
        Array.isArray(values)
        && values.length === EXPANDED_BLACKLIST_LEGACY_WIDGET_VALUE_COUNT
        && hasExpandedWidgetSignature(widgets)
        && hasExpandedBlacklistLegacyValueSignature(values)
    ) {
        migrated = {
            ...migrated,
            widgets_values: migrateExpandedBlacklistLegacyValues(values),
        };
    } else if (
        Array.isArray(values)
        && values.length === EXPANDED_LEGACY_WIDGET_VALUE_COUNT
        && hasExpandedWidgetSignature(widgets)
        && hasExpandedValueSignature(values, true)
    ) {
        migrated = {
            ...migrated,
            widgets_values: removeIndices(values, EXPANDED_LEGACY_REMOVED_INDICES),
        };
    } else if (
        Array.isArray(values)
        && values.length === EXPANDED_CURRENT_WIDGET_VALUE_COUNT
        && hasExpandedWidgetSignature(widgets)
        && hasExpandedValueSignature(values, false)
    ) {
        migrated = {
            ...migrated,
            widgets_values: removeIndices(values, EXPANDED_UI_ONLY_INDICES),
        };
    } else if (
        Array.isArray(values)
        && values.length === EXPANDED_EARLY_UI_ONLY_WIDGET_VALUE_COUNT
        && hasExpandedWidgetSignature(widgets)
        && hasExpandedEarlyUiOnlyValueSignature(values)
    ) {
        migrated = {
            ...migrated,
            widgets_values: removeIndices(values, EXPANDED_EARLY_UI_ONLY_INDICES),
        };
    }

    const named = info.widgets_values_named;
    if (
        named
        && typeof named === 'object'
        && !Array.isArray(named)
        && Object.prototype.hasOwnProperty.call(named, 'trust_remote_code')
    ) {
        if (migrated === info) migrated = { ...migrated };
        migrated.widgets_values_named = { ...named };
        delete migrated.widgets_values_named.trust_remote_code;
    }

    return migrated;
}

export function installRetiredTrustRemoteCodeMigration(nodeType) {
    const originalConfigure = nodeType.prototype.configure;
    nodeType.prototype.configure = function(info) {
        const args = [...arguments];
        args[0] = migrateRetiredTrustRemoteCodeWidget(info, this.widgets);
        return originalConfigure ? originalConfigure.apply(this, args) : undefined;
    };
}
