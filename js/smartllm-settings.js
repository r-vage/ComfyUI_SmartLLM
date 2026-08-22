import { app } from './comfy/index.js';
import {
    applyComboChipColor,
    DEFAULT_COMBO_CHIP_COLOR,
    normalizeComboChipColor,
} from './smartllm-combo-chip.js';

const SETTINGS_CATEGORY = ['Smart LM Loader', 'Configuration'];
const TOKEN_MASK = '••••••••';

async function updateConfig(values) {
    const response = await fetch('/smartlml/config/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Configuration update failed');
    return data;
}

function afterInitialChange(handler) {
    let initialized = false;
    return async function (value) {
        if (!initialized) {
            initialized = true;
            return;
        }
        return handler.call(this, value);
    };
}

function registerCredentialSetting({ id, name, key, configured, tooltip, sortOrder }) {
    app.ui.settings.addSetting({
        id,
        category: [...SETTINGS_CATEGORY, key],
        name,
        type: 'text',
        tooltip,
        defaultValue: configured ? TOKEN_MASK : '',
        sortOrder,
        onChange: afterInitialChange(async (value) => {
            if (value === TOKEN_MASK) return;
            try {
                await updateConfig({ [key]: value });
                app.ui.settings.setSettingValue?.(id, value ? TOKEN_MASK : '');
            } catch (error) {
                console.error(`[SmartLLM] Failed to update ${name}:`, error);
            }
        }),
    });
    app.ui.settings.setSettingValue?.(id, configured ? TOKEN_MASK : '');
}

app.registerExtension({
    name: 'SmartLLM.Settings',
    async init() {
        let config = {
            log_level: 'warning',
            llm_models_path: 'LLM',
            retry_download_attempts: 2,
            chip_color: DEFAULT_COMBO_CHIP_COLOR,
            hf_token_configured: false,
            modelscope_token_configured: false,
        };
        try {
            const response = await fetch('/smartlml/config/all');
            if (response.ok) config = { ...config, ...(await response.json()) };
        } catch (error) {
            console.error('[SmartLLM] Failed to fetch configuration:', error);
        }
        const chipColor = applyComboChipColor(config.chip_color);

        app.ui.settings.addSetting({
            id: 'SmartLLM.ModelsPath',
            category: [...SETTINGS_CATEGORY, 'ModelsPath'],
            name: '📁 LLM Models Path',
            type: 'text',
            tooltip: 'Path to the LLM model folder, relative to ComfyUI models or absolute.',
            defaultValue: config.llm_models_path || 'LLM',
            sortOrder: 400,
            onChange: afterInitialChange(async (value) => {
                try { await updateConfig({ llm_models_path: value }); }
                catch (error) { console.error('[SmartLLM] Failed to update model path:', error); }
            }),
        });
        app.ui.settings.addSetting({
            id: 'SmartLLM.ChipColor',
            category: [...SETTINGS_CATEGORY, 'ChipColor'],
            name: '🎨 Chip Color',
            type: 'color',
            tooltip: 'Accent color for SmartLLM chip bars and selected chips.',
            defaultValue: `#${chipColor}`,
            sortOrder: 250,
            onChange: afterInitialChange(async (value) => {
                const normalized = normalizeComboChipColor(value);
                try {
                    await updateConfig({ chip_color: normalized });
                    applyComboChipColor(normalized);
                } catch (error) {
                    console.error('[SmartLLM] Failed to update chip color:', error);
                }
            }),
        });
        app.ui.settings.addSetting({
            id: 'SmartLLM.RetryDownloadAttempts',
            category: [...SETTINGS_CATEGORY, 'RetryDownloadAttempts'],
            name: '🔄 Retry Download Attempts',
            type: 'number',
            tooltip: 'Retries after a failed integrity verification (0-20).',
            defaultValue: config.retry_download_attempts ?? 2,
            sortOrder: 300,
            onChange: afterInitialChange(async (value) => {
                const attempts = Number.parseInt(value, 10);
                if (!Number.isInteger(attempts) || attempts < 0 || attempts > 20) return;
                try { await updateConfig({ retry_download_attempts: attempts }); }
                catch (error) { console.error('[SmartLLM] Failed to update retries:', error); }
            }),
        });
        app.ui.settings.addSetting({
            id: 'SmartLLM.LogLevel',
            category: [...SETTINGS_CATEGORY, 'LogLevel'],
            name: 'Log Level',
            type: 'combo',
            options: ['error', 'warning', 'info', 'debug'],
            defaultValue: config.log_level || 'warning',
            sortOrder: 200,
            onChange: afterInitialChange(async (value) => {
                try {
                    const response = await fetch('/smartlml/config/log_level', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ log_level: value }),
                    });
                    if (!response.ok) throw new Error('Log-level update failed');
                } catch (error) { console.error('[SmartLLM] Failed to update log level:', error); }
            }),
        });
        registerCredentialSetting({
            id: 'SmartLLM.HFToken',
            name: '🔑 Hugging Face Token',
            key: 'hf_token',
            configured: config.hf_token_configured === true,
            tooltip: 'Write-only Hugging Face credential. The server never returns token bytes.',
            sortOrder: 100,
        });
        registerCredentialSetting({
            id: 'SmartLLM.ModelScopeToken',
            name: '🔑 ModelScope Token',
            key: 'modelscope_token',
            configured: config.modelscope_token_configured === true,
            tooltip: 'Write-only ModelScope credential. The server never returns token bytes.',
            sortOrder: 90,
        });
    },
});
