import { app, api } from './comfy/index.js';
import { emitSmartLLMRegistryChanged } from './smartllm-registry-events.js';

const COMMAND_ID = 'SmartLLM.LMRegistry.Open';
const SIDEBAR_TAB_ID = 'smartllm-lm-registry';
const CSS_ID = 'smartllm-registry-manager-css';
const BACKENDS = ['transformers', 'gguf', 'llamacpp', 'ollama', 'vllm', 'vllm_native', 'sglang', 'wd14'];
const FAMILIES = ['Qwen', 'Mistral', 'Florence', 'LLaVA', 'LLM_TEXT', 'VLM', 'WD14'];
const SERVER_QUANTIZATIONS = {
    vllm: ['auto', 'fp8', 'awq', 'gptq', 'bitsandbytes'],
    vllm_native: ['auto', 'fp8', 'awq', 'gptq', 'bitsandbytes', 'squeezellm'],
    sglang: ['auto', 'fp8', 'awq', 'gptq'],
};

const CSS = `
.smartllm-registry-backdrop{position:fixed;inset:0;z-index:1200;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.68);box-sizing:border-box}
.smartllm-registry-dialog{width:min(1120px,96vw);height:min(780px,92vh);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--border-color,#555);border-radius:10px;background:#3a3a3a;color:var(--input-text,#ddd);box-shadow:0 18px 60px rgba(0,0,0,.55);font:13px sans-serif}
.smartllm-registry-header,.smartllm-registry-footer{display:flex;align-items:center;gap:8px;padding:10px 14px;border-color:var(--border-color,#555);flex:0 0 auto}
.smartllm-registry-header{border-bottom:1px solid}.smartllm-registry-header h2{flex:1;margin:0;font-size:17px}.smartllm-registry-footer{border-top:1px solid;flex-wrap:wrap}
.smartllm-manager-tabs{display:flex;gap:6px;padding:8px 14px;border-bottom:1px solid var(--border-color,#555);background:rgba(0,0,0,.12)}
.smartllm-manager-tab[aria-selected=true]{border-color:#78a9d6;background:var(--comfy-input-bg,#202020);color:#dceeff}
.smartllm-registry-body{display:grid;grid-template-columns:minmax(260px,32%) 1fr;min-height:0;flex:1}
.smartllm-registry-body[hidden],.smartllm-docker-body[hidden]{display:none!important}
.smartllm-registry-sidebar{display:flex;flex-direction:column;min-height:0;border-right:1px solid var(--border-color,#555);padding:10px;gap:8px}
.smartllm-registry-list{overflow:auto;min-height:0;flex:1;border:1px solid var(--border-color,#555);border-radius:6px}
.smartllm-registry-item{display:block;width:100%;padding:8px 10px;border:0;border-bottom:1px solid var(--border-color,#444);background:transparent;color:inherit;text-align:left;cursor:pointer}
.smartllm-registry-item:hover,.smartllm-registry-item[aria-selected=true]{background:var(--comfy-input-bg,#202020)}
.smartllm-registry-item small{display:block;margin-top:3px;color:var(--descrip-text,#aaa)}
.smartllm-registry-form{overflow:auto;padding:14px;display:grid;grid-template-columns:repeat(2,minmax(190px,1fr));gap:11px 14px;align-content:start}
.smartllm-registry-field{display:flex;flex-direction:column;gap:4px;min-width:0}.smartllm-registry-field[hidden]{display:none!important}.smartllm-registry-field--wide{grid-column:1/-1}.smartllm-registry-field--check{flex-direction:row;align-items:center;padding-top:19px}
.smartllm-registry-field label{font-size:11px;color:var(--descrip-text,#aaa);text-transform:uppercase;letter-spacing:.03em}
.smartllm-registry-field input,.smartllm-registry-field select,.smartllm-registry-field textarea,.smartllm-registry-sidebar input{box-sizing:border-box;width:100%;padding:7px 8px;border:1px solid var(--border-color,#555);border-radius:5px;background:var(--comfy-input-bg,#222);color:var(--input-text,#ddd)}
.smartllm-registry-field textarea{min-height:70px;resize:vertical}.smartllm-registry-field--check input{width:auto}.smartllm-registry-field--check label{text-transform:none;font-size:13px;color:inherit}
.smartllm-registry-button{padding:7px 10px;border:1px solid var(--border-color,#666);border-radius:5px;background:var(--comfy-input-bg,#222);color:inherit;cursor:pointer}.smartllm-registry-button:hover{filter:brightness(1.18)}.smartllm-registry-button:disabled{opacity:.45;cursor:default}
.smartllm-registry-danger{border-color:#a44;color:#f1b8b8}.smartllm-registry-status{flex:1;min-width:220px;color:var(--descrip-text,#aaa)}.smartllm-registry-status[data-kind=error]{color:#ffaaaa}.smartllm-registry-status[data-kind=success]{color:#aee6ae}
.smartllm-docker-body{min-height:0;flex:1;overflow:auto;padding:14px;box-sizing:border-box}.smartllm-docker-toolbar{display:flex;align-items:center;gap:8px;margin-bottom:12px}.smartllm-docker-toolbar label{color:var(--descrip-text,#aaa)}
.smartllm-docker-toolbar select{padding:7px 8px;border:1px solid var(--border-color,#555);border-radius:5px;background:var(--comfy-input-bg,#222);color:inherit}
.smartllm-docker-card{padding:12px;margin-bottom:12px;border:1px solid var(--border-color,#555);border-radius:7px;background:rgba(0,0,0,.12)}.smartllm-docker-card h3{margin:0 0 7px;font-size:15px}.smartllm-docker-card p{margin:5px 0;line-height:1.4}
.smartllm-docker-detail{display:grid;grid-template-columns:minmax(120px,auto) 1fr;gap:4px 12px;margin:9px 0}.smartllm-docker-detail dt{color:var(--descrip-text,#aaa)}.smartllm-docker-detail dd{margin:0;min-width:0;overflow-wrap:anywhere}
.smartllm-docker-command{display:flex;align-items:center;gap:8px;margin-top:9px}.smartllm-docker-command code{flex:1;min-width:0;padding:8px;border-radius:5px;background:var(--comfy-input-bg,#202020);overflow:auto;white-space:pre}
.smartllm-docker-guide{display:inline-block;margin-top:8px;color:#9ecbff}.smartllm-docker-note{color:var(--descrip-text,#aaa)}
.smartllm-docker-images{display:grid;grid-template-columns:repeat(2,minmax(260px,1fr));gap:10px}.smartllm-docker-image{display:flex;flex-direction:column;gap:7px;padding:11px;border:1px solid var(--border-color,#555);border-radius:7px;background:rgba(0,0,0,.1)}.smartllm-docker-image h3{margin:0}.smartllm-docker-image code{overflow-wrap:anywhere;color:var(--descrip-text,#bbb)}.smartllm-docker-runtime{display:flex;flex-direction:column;gap:4px}.smartllm-docker-runtime label{font-size:11px;color:var(--descrip-text,#aaa);text-transform:uppercase;letter-spacing:.03em}.smartllm-docker-runtime select{padding:7px 8px;border:1px solid var(--border-color,#555);border-radius:5px;background:var(--comfy-input-bg,#222);color:inherit}.smartllm-docker-image-actions{display:flex;gap:7px;margin-top:auto;padding-top:4px}
.smartllm-registry-classic{width:100%;margin:6px 0;padding:7px;border:1px solid var(--border-color,#555);border-radius:7px;background:var(--comfy-input-bg,#222);color:var(--input-text,#ddd);cursor:pointer}
@media(max-width:760px){.smartllm-registry-body{grid-template-columns:1fr}.smartllm-registry-sidebar{max-height:230px;border-right:0;border-bottom:1px solid var(--border-color,#555)}.smartllm-registry-form{grid-template-columns:1fr}.smartllm-registry-field--wide{grid-column:auto}.smartllm-docker-images{grid-template-columns:1fr}.smartllm-docker-command{align-items:stretch;flex-direction:column}}
`;

function injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
}

async function request(path, body = null) {
    const response = await api.fetchApi(path, body === null ? undefined : {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    let payload;
    try { payload = await response.json(); } catch (_) { payload = {}; }
    if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || `Request failed (${response.status})`);
    }
    return payload;
}

function element(tag, className = '', text = '') {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
}

function field(form, id, labelText, type = 'text', options = {}) {
    const wrap = element('div', `smartllm-registry-field${options.wide ? ' smartllm-registry-field--wide' : ''}${type === 'checkbox' ? ' smartllm-registry-field--check' : ''}`);
    wrap.dataset.field = id;
    if (options.backends) wrap.dataset.backends = options.backends.join(',');
    const label = element('label', '', labelText);
    label.htmlFor = `smartllm-registry-${id}`;
    let input;
    if (type === 'select') {
        input = document.createElement('select');
        for (const value of options.values || []) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            input.appendChild(option);
        }
    } else if (type === 'textarea') {
        input = document.createElement('textarea');
    } else {
        input = document.createElement('input');
        input.type = type;
    }
    input.id = `smartllm-registry-${id}`;
    input.name = id;
    input.dataset.testid = `smartllm-registry-${id}`;
    if (options.placeholder) input.placeholder = options.placeholder;
    if (type === 'checkbox') {
        wrap.append(input, label);
    } else {
        wrap.append(label, input);
    }
    form.appendChild(wrap);
    return input;
}

class RegistryManager {
    constructor() {
        this.models = [];
        this.selected = null;
        this.originalFocus = null;
        this.busy = false;
        this.inputs = {};
        this.activeView = 'models';
        this.dockerLoaded = false;
        this.dockerState = null;
    }

    open() {
        if (this.backdrop?.isConnected) return;
        injectCSS();
        this.originalFocus = document.activeElement;
        this.build();
        document.body.appendChild(this.backdrop);
        if (this.activeView === 'models') this.filter.focus();
        this.refreshActive();
    }

    close() {
        this.backdrop?.remove();
        this.backdrop = null;
        if (this.originalFocus instanceof HTMLElement) this.originalFocus.focus();
    }

    build() {
        const backdrop = element('div', 'smartllm-registry-backdrop');
        backdrop.dataset.testid = 'smartllm-registry-manager';
        const dialog = element('section', 'smartllm-registry-dialog');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'smartllm-registry-title');
        backdrop.appendChild(dialog);
        backdrop.addEventListener('mousedown', event => {
            if (event.target === backdrop && !this.busy) this.close();
        });
        backdrop.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !this.busy) this.close();
        });

        const header = element('header', 'smartllm-registry-header');
        const title = element('h2', '', 'Smart LM Manager (Beta)');
        title.id = 'smartllm-registry-title';
        this.refreshButton = this.button('Refresh', () => this.refreshActive(), 'smartllm-registry-refresh');
        this.addButton = this.button('New Model', () => this.newEntry(), 'smartllm-registry-new');
        const close = this.button('Close', () => this.close(), 'smartllm-registry-close');
        header.append(title, this.refreshButton, this.addButton, close);

        const tabs = element('div', 'smartllm-manager-tabs');
        tabs.setAttribute('role', 'tablist');
        this.modelsTab = this.button('Models', () => this.switchView('models'), 'smartllm-manager-tab-models');
        this.modelsTab.classList.add('smartllm-manager-tab');
        this.modelsTab.setAttribute('role', 'tab');
        this.dockerTab = this.button('Docker Images', () => this.switchView('docker'), 'smartllm-manager-tab-docker');
        this.dockerTab.classList.add('smartllm-manager-tab');
        this.dockerTab.setAttribute('role', 'tab');
        tabs.append(this.modelsTab, this.dockerTab);

        const body = element('div', 'smartllm-registry-body');
        this.registryBody = body;
        const sidebar = element('aside', 'smartllm-registry-sidebar');
        this.filter = document.createElement('input');
        this.filter.type = 'search';
        this.filter.placeholder = 'Filter registry models';
        this.filter.setAttribute('aria-label', 'Filter registry models');
        this.filter.addEventListener('input', () => this.renderList());
        this.list = element('div', 'smartllm-registry-list');
        this.list.setAttribute('role', 'listbox');
        sidebar.append(this.filter, this.list);

        this.form = element('form', 'smartllm-registry-form');
        this.form.addEventListener('submit', event => { event.preventDefault(); this.save(); });
        this.inputs.name = field(this.form, 'name', 'Registry name');
        this.inputs.backend = field(this.form, 'backend', 'Backend', 'select', { values: BACKENDS });
        this.inputs.family = field(this.form, 'family', 'Family', 'select', { values: FAMILIES });
        this.inputs.repo_id = field(this.form, 'repo_id', 'Repository / model ID', 'text', { wide: true, placeholder: 'owner/model or ollama/model:tag' });
        this.inputs.source = field(this.form, 'source', 'Download source', 'select', { values: ['huggingface', 'modelscope'] });
        this.inputs.revision = field(this.form, 'revision', 'Revision', 'text', { placeholder: 'Resolved to an immutable commit on Inspect/Save' });
        this.inputs.local_only = field(this.form, 'local_only', 'Use an existing local model only', 'checkbox');
        this.inputs.local_path = field(this.form, 'local_path', 'Local path below configured LLM folder', 'text', { wide: true, placeholder: 'ModelFolder or ModelFolder/model.gguf' });
        this.inputs.has_vision = field(this.form, 'has_vision', 'Vision-capable model', 'checkbox');
        this.inputs.trust_remote_code = field(this.form, 'trust_remote_code', 'Allow pinned repository Python code', 'checkbox');
        this.inputs.file_pattern = field(this.form, 'file_pattern', 'GGUF file pattern', 'text', { backends: ['gguf', 'llamacpp'], placeholder: 'Model.{quant}.gguf' });
        this.inputs.mmproj = field(this.form, 'mmproj', 'Vision mmproj filename', 'text', { backends: ['gguf', 'llamacpp'] });
        this.inputs.quantizations = field(this.form, 'quantizations', 'Quantizations (comma-separated)', 'text', { wide: true, backends: ['gguf', 'llamacpp'] });
        this.inputs.download_quantization = field(this.form, 'download_quantization', 'Download quantization', 'select', { backends: ['gguf', 'llamacpp'], values: [] });
        this.inputs.quantization = field(this.form, 'quantization', 'Server quantization', 'select', { backends: ['vllm', 'vllm_native', 'sglang'], values: ['auto', 'fp8', 'awq', 'gptq', 'bitsandbytes', 'squeezellm'] });
        this.inputs.tensor_parallel = field(this.form, 'tensor_parallel', 'Tensor parallel', 'number', { backends: ['vllm', 'sglang'] });
        this.inputs.data_parallel = field(this.form, 'data_parallel', 'Data parallel', 'number', { backends: ['sglang'] });
        this.inputs.expected_sha256 = field(this.form, 'expected_sha256', 'Expected SHA-256 (one filename=digest per line)', 'textarea', { wide: true });
        this.inputs.description = field(this.form, 'description', 'Description', 'textarea', { wide: true });
        this.inputs.backend.addEventListener('change', () => this.updateVisibility());
        this.inputs.local_only.addEventListener('change', () => this.updateVisibility());
        this.inputs.quantizations.addEventListener('input', () => this.syncDownloadQuantizations());
        body.append(sidebar, this.form);

        this.dockerBody = element('section', 'smartllm-docker-body');
        this.dockerBody.dataset.testid = 'smartllm-docker-manager';
        const dockerToolbar = element('div', 'smartllm-docker-toolbar');
        const vendorLabel = element('label', '', 'Image platform');
        this.dockerVendor = document.createElement('select');
        this.dockerVendor.dataset.testid = 'smartllm-docker-vendor';
        for (const [value, label] of [['auto', 'Auto-detect'], ['nvidia', 'NVIDIA / CUDA'], ['amd', 'AMD / ROCm'], ['cpu', 'CPU only']]) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            this.dockerVendor.appendChild(option);
        }
        vendorLabel.htmlFor = 'smartllm-docker-vendor';
        this.dockerVendor.id = 'smartllm-docker-vendor';
        this.dockerVendor.addEventListener('change', () => this.refreshDocker());
        dockerToolbar.append(vendorLabel, this.dockerVendor);
        this.dockerContent = element('div', 'smartllm-docker-content');
        this.dockerBody.append(dockerToolbar, this.dockerContent);

        const footer = element('footer', 'smartllm-registry-footer');
        this.status = element('div', 'smartllm-registry-status', 'Select a model or create a new entry.');
        this.inspectButton = this.button('Inspect', () => this.inspect(), 'smartllm-registry-inspect');
        this.saveButton = this.button('Save Entry', () => this.save(), 'smartllm-registry-save');
        this.downloadButton = this.button('Download', () => this.download(), 'smartllm-registry-download');
        this.verifyButton = this.button('Verify Local Files', () => this.verify(), 'smartllm-registry-verify');
        this.deleteButton = this.button('Delete Local Files', () => this.deleteLocal(), 'smartllm-registry-delete-local', true);
        this.removeButton = this.button('Remove Registry Entry', () => this.removeEntry(), 'smartllm-registry-remove-entry', true);
        footer.append(this.status, this.inspectButton, this.saveButton, this.downloadButton, this.verifyButton, this.deleteButton, this.removeButton);
        this.registryActionButtons = [this.inspectButton, this.saveButton, this.downloadButton, this.verifyButton, this.deleteButton, this.removeButton];
        dialog.append(header, tabs, body, this.dockerBody, footer);
        this.backdrop = backdrop;
        this.setForm({});
        this.updateView();
    }

    button(label, handler, testid, danger = false) {
        const button = element('button', `smartllm-registry-button${danger ? ' smartllm-registry-danger' : ''}`, label);
        button.type = 'button';
        button.dataset.testid = testid;
        button.addEventListener('click', handler);
        return button;
    }

    switchView(view) {
        if (!['models', 'docker'].includes(view) || this.busy) return;
        this.activeView = view;
        this.updateView();
        if (view === 'docker' && !this.dockerLoaded) this.refreshDocker();
        else if (view === 'models') this.filter.focus();
    }

    updateView() {
        const showModels = this.activeView === 'models';
        this.registryBody.hidden = !showModels;
        this.dockerBody.hidden = showModels;
        this.addButton.hidden = !showModels;
        this.modelsTab.setAttribute('aria-selected', String(showModels));
        this.dockerTab.setAttribute('aria-selected', String(!showModels));
        for (const button of this.registryActionButtons) button.hidden = !showModels;
    }

    refreshActive() {
        return this.activeView === 'docker' ? this.refreshDocker() : this.refresh();
    }

    async copyText(value, label = 'Command') {
        try {
            await navigator.clipboard.writeText(value);
            this.setStatus(`${label} copied to the clipboard.`, 'success');
        } catch (_) {
            this.setStatus(`Could not copy automatically. Select and copy the ${label.toLowerCase()} manually.`, 'error');
        }
    }

    dockerDetail(list, label, value) {
        list.append(element('dt', '', label), element('dd', '', value || '—'));
    }

    renderDocker() {
        this.dockerContent.replaceChildren();
        if (!this.dockerState) {
            this.dockerContent.appendChild(element('p', 'smartllm-docker-note', 'Loading Docker status…'));
            return;
        }

        const installation = this.dockerState.installation || {};
        const docker = installation.docker || {};
        const setup = installation.setup || {};
        const gpu = installation.gpu || {};
        const platform = installation.platform || {};
        const setupCard = element('section', 'smartllm-docker-card');
        setupCard.dataset.testid = 'smartllm-docker-setup';
        setupCard.appendChild(element('h3', '', docker.daemon_accessible ? 'Docker Engine · Ready' : 'Docker Engine · Setup Required'));
        setupCard.appendChild(element('p', '', setup.message || 'Docker setup status is unavailable.'));
        const details = element('dl', 'smartllm-docker-detail');
        this.dockerDetail(details, 'Platform', [platform.system, platform.release, platform.machine].filter(Boolean).join(' '));
        this.dockerDetail(details, 'Docker CLI', docker.installed ? (docker.version || 'Installed') : 'Not installed');
        this.dockerDetail(details, 'Docker daemon', docker.daemon_accessible ? `Accessible${docker.daemon_version ? ` · ${docker.daemon_version}` : ''}` : 'Not accessible');
        this.dockerDetail(details, 'Selected images', this.dockerState.selected_vendor || 'auto');
        this.dockerDetail(details, 'Detected GPU', gpu.vendor || 'unknown');
        if (gpu.vendor === 'nvidia') {
            this.dockerDetail(details, 'NVIDIA toolkit', gpu.nvidia_container_toolkit ? 'Installed' : 'Not detected');
            this.dockerDetail(details, 'NVIDIA driver', gpu.driver_accessible ? (gpu.devices || []).join('; ') || 'Accessible' : 'Not accessible');
        } else if (gpu.vendor === 'amd') {
            this.dockerDetail(details, 'ROCm devices', gpu.kfd_available && gpu.dri_available ? 'Available' : 'Incomplete');
        }
        setupCard.appendChild(details);

        if (setup.installer_command) {
            const command = element('div', 'smartllm-docker-command');
            command.appendChild(element('code', '', setup.installer_command));
            command.appendChild(this.button(setup.command_label || 'Copy command', () => this.copyText(setup.installer_command, 'Command'), 'smartllm-docker-copy-command'));
            setupCard.appendChild(command);
        }
        if (setup.restart_required) {
            setupCard.appendChild(element('p', 'smartllm-docker-note', 'After changing group membership, log out or reboot and then restart ComfyUI.'));
        }
        if (setup.guide_url) {
            const guide = element('a', 'smartllm-docker-guide', 'Open Linux Docker installation guide');
            guide.href = setup.guide_url;
            guide.target = '_blank';
            guide.rel = 'noopener noreferrer';
            setupCard.appendChild(guide);
        }
        setupCard.appendChild(element('p', 'smartllm-docker-note', 'Installation remains terminal-only. SmartLLM never requests or stores sudo credentials.'));
        this.dockerContent.appendChild(setupCard);

        this.dockerContent.appendChild(element('h3', '', `Managed images · ${this.dockerState.selected_vendor || 'auto'}`));
        const imageGrid = element('div', 'smartllm-docker-images');
        for (const image of this.dockerState.images || []) {
            const card = element('article', 'smartllm-docker-image');
            card.dataset.backend = image.backend;
            card.appendChild(element('h3', '', `${image.label} · ${image.installed ? 'Installed' : 'Missing'}`));
            card.appendChild(element('p', 'smartllm-docker-note', image.description));
            const imageReference = element('code', '', image.image);
            card.appendChild(imageReference);
            let runtimeVersion = '';
            let runtimeSelect = null;
            let removeButton = null;
            if (image.backend === 'ollama' && (image.runtime_versions || []).length) {
                const runtime = element('div', 'smartllm-docker-runtime');
                const runtimeLabel = element('label', '', 'Ollama runtime version');
                runtimeSelect = document.createElement('select');
                runtimeSelect.dataset.testid = 'smartllm-docker-ollama-version';
                runtimeLabel.htmlFor = 'smartllm-docker-ollama-version';
                runtimeSelect.id = 'smartllm-docker-ollama-version';
                if (!image.runtime_version) {
                    const customOption = document.createElement('option');
                    customOption.value = '';
                    customOption.textContent = 'Custom configured pin';
                    runtimeSelect.appendChild(customOption);
                }
                for (const option of image.runtime_versions) {
                    const versionOption = document.createElement('option');
                    versionOption.value = option.version;
                    versionOption.textContent = option.label;
                    versionOption.dataset.image = option.image;
                    runtimeSelect.appendChild(versionOption);
                }
                runtimeSelect.value = image.runtime_version || '';
                runtimeVersion = runtimeSelect.value;
                runtimeSelect.addEventListener('change', () => {
                    runtimeVersion = runtimeSelect.value;
                    const selected = Array.from(runtimeSelect.children).find(option => option.value === runtimeVersion);
                    imageReference.textContent = selected?.dataset?.image || image.image;
                    if (removeButton) removeButton.disabled = runtimeVersion !== (image.runtime_version || '') || !docker.daemon_accessible || this.busy;
                });
                runtime.append(runtimeLabel, runtimeSelect);
                card.appendChild(runtime);
                card.appendChild(element('small', 'smartllm-docker-note', 'Install & Select stores the immutable version pin. The managed Ollama container is recreated on its next start; model data remains in its persistent store.'));
            }
            const metadata = [image.size, image.short_id ? `ID ${image.short_id}` : '', image.created ? image.created.slice(0, 10) : ''].filter(Boolean).join(' · ');
            if (metadata) card.appendChild(element('small', 'smartllm-docker-note', metadata));
            const actions = element('div', 'smartllm-docker-image-actions');
            const installLabel = runtimeSelect ? 'Install & Select' : (image.installed ? 'Update / Repair' : 'Install');
            const install = this.button(installLabel, () => this.dockerImageAction('pull', image, runtimeVersion), `smartllm-docker-pull-${image.backend}`);
            install.disabled = !docker.daemon_accessible || this.busy;
            actions.appendChild(install);
            const stop = this.button('Stop', () => this.dockerImageAction('stop', image), `smartllm-docker-stop-${image.backend}`, true);
            stop.disabled = !docker.daemon_accessible || this.busy;
            actions.appendChild(stop);
            if (image.installed) {
                removeButton = this.button('Remove', () => this.dockerImageAction('remove', image), `smartllm-docker-remove-${image.backend}`, true);
                removeButton.disabled = !docker.daemon_accessible || this.busy;
                actions.appendChild(removeButton);
            }
            card.appendChild(actions);
            imageGrid.appendChild(card);
        }
        if (!imageGrid.childElementCount) imageGrid.appendChild(element('p', '', 'No managed images are available for this platform.'));
        this.dockerContent.appendChild(imageGrid);
    }

    async refreshDocker() {
        const vendor = this.dockerVendor.value || 'auto';
        const result = await this.action('Refreshing Docker overview', () => request(`/smartlml/docker/images?vendor=${encodeURIComponent(vendor)}`));
        if (!result) return;
        this.dockerState = result;
        this.dockerLoaded = true;
        this.renderDocker();
        this.setStatus('Docker overview refreshed.', 'success');
    }

    async dockerImageAction(action, image, runtimeVersion = '') {
        if (action === 'remove' && !window.confirm(`Remove the managed Docker image for ${image.label}?\n\nSmartLLM will refuse if any container still uses it.`)) return;
        if (action === 'stop' && !window.confirm(`Stop SmartLLM-managed ${image.label} container(s)?\n\nSmartLLM will refuse while a model execution is active.`)) return;
        const verb = action === 'pull' ? 'Installing' : (action === 'stop' ? 'Stopping' : 'Removing');
        const payload = {
            backend: image.backend,
            vendor: this.dockerVendor.value || 'auto',
        };
        if (action === 'pull' && runtimeVersion) payload.runtime_version = runtimeVersion;
        const target = action === 'stop' ? 'container(s)' : 'image';
        const result = await this.action(`${verb} ${image.label} ${target}`, () => request(`/smartlml/docker/images/${action}`, {
            ...payload,
        }));
        if (result) await this.refreshDocker();
    }

    setStatus(message, kind = '') {
        this.status.textContent = message;
        this.status.dataset.kind = kind;
    }

    setBusy(value) {
        this.busy = value;
        for (const button of this.backdrop.querySelectorAll('button')) button.disabled = value;
        if (!value) {
            this.updateVisibility();
            this.updateView();
            if (this.activeView === 'docker') this.renderDocker();
        }
    }

    async action(label, callback) {
        if (this.busy) return;
        this.setBusy(true);
        this.setStatus(label);
        try {
            const result = await callback();
            this.setStatus(`${label} complete.`, 'success');
            return result;
        } catch (error) {
            this.setStatus(error?.message || `${label} failed.`, 'error');
            return null;
        } finally {
            this.setBusy(false);
        }
    }

    async refresh(preferred = this.selected) {
        const result = await this.action('Refreshing registry', () => request('/smartlml/model_list'));
        if (!result) return;
        this.models = Array.isArray(result) ? result : [];
        this.renderList();
        if (preferred && this.models.some(model => model.display_name === preferred)) {
            await this.select(preferred);
        } else if (!this.selected && this.models.length) {
            await this.select(this.models[0].display_name);
        }
    }

    renderList() {
        const filter = this.filter.value.trim().toLowerCase();
        this.list.replaceChildren();
        for (const model of this.models) {
            if (filter && !`${model.display_name} ${model.backend} ${model.family}`.toLowerCase().includes(filter)) continue;
            const item = element('button', 'smartllm-registry-item', model.display_name);
            item.type = 'button';
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', String(model.display_name === this.selected));
            item.dataset.testid = 'smartllm-registry-list-item';
            const detail = element('small', '', `${model.backend} · ${model.origin} · ${model.local_status}`);
            item.appendChild(detail);
            item.addEventListener('click', () => this.select(model.display_name));
            this.list.appendChild(item);
        }
        if (!this.list.childElementCount) this.list.appendChild(element('p', '', 'No matching models.'));
    }

    async select(displayName) {
        const entry = await this.action('Loading registry entry', () => request(`/smartlml/model_entry?name=${encodeURIComponent(displayName)}`));
        if (!entry) return;
        this.selected = displayName;
        this.setForm(entry);
        this.renderList();
        this.setStatus(`Editing ${displayName}.`, 'success');
    }

    newEntry() {
        this.selected = null;
        this.setForm({ backend: 'transformers', family: 'Qwen', source: 'huggingface', quantization: 'auto', tensor_parallel: 1, data_parallel: 1 });
        this.renderList();
        this.inputs.name.focus();
        this.setStatus('Creating a user registry entry.');
    }

    setForm(entry) {
        for (const [name, input] of Object.entries(this.inputs)) {
            let value = entry[name];
            if (name === 'expected_sha256') {
                value = Object.entries(value || {}).map(([file, digest]) => `${file}=${digest}`).join('\n');
            } else if (name === 'quantizations') {
                value = Array.isArray(value) ? value.join(', ') : '';
            } else if (name === 'download_quantization') {
                continue;
            }
            if (input.type === 'checkbox') input.checked = Boolean(value);
            else input.value = value ?? (name === 'source' ? 'huggingface' : '');
        }
        this.inputs.backend.disabled = Boolean(this.selected);
        this.syncDownloadQuantizations();
        this.updateVisibility();
    }

    syncDownloadQuantizations() {
        const select = this.inputs.download_quantization;
        const previous = select.value;
        const values = this.inputs.quantizations.value.split(',').map(value => value.trim()).filter(Boolean);
        select.replaceChildren();
        for (const value of values) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        }
        if (values.includes(previous)) select.value = previous;
    }

    syncServerQuantizations() {
        const select = this.inputs.quantization;
        const values = SERVER_QUANTIZATIONS[this.inputs.backend.value] || ['auto'];
        const previous = select.value;
        select.replaceChildren();
        for (const value of values) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        }
        select.value = values.includes(previous) ? previous : 'auto';
    }

    updateVisibility() {
        const backend = this.inputs.backend.value;
        const localOnly = this.inputs.local_only.checked;
        const ollama = backend === 'ollama';
        this.syncServerQuantizations();
        for (const wrap of this.form.querySelectorAll('[data-backends]')) {
            wrap.hidden = !wrap.dataset.backends.split(',').includes(backend);
        }
        this.inputs.repo_id.closest('.smartllm-registry-field').hidden = localOnly;
        for (const name of ['source', 'revision', 'trust_remote_code', 'expected_sha256']) {
            this.inputs[name].closest('.smartllm-registry-field').hidden = localOnly || ollama;
        }
        this.inputs.local_path.closest('.smartllm-registry-field').hidden = !localOnly;
        if (backend === 'wd14') {
            this.inputs.family.value = 'WD14';
            this.inputs.has_vision.checked = true;
        }
        this.downloadButton.disabled = localOnly || this.busy || !this.selected;
        // Ollama owns and verifies its content-addressed model store; there are
        // no registry-managed local files for this endpoint to verify.
        this.verifyButton.disabled = !this.selected || this.busy || ollama;
        this.deleteButton.disabled = !this.selected || this.busy;
        this.removeButton.disabled = !this.selected || this.busy;
    }

    collect() {
        const hashes = {};
        for (const line of this.inputs.expected_sha256.value.split(/\r?\n/)) {
            if (!line.trim()) continue;
            const index = line.indexOf('=');
            if (index < 1) throw new Error('Expected hashes must use filename=digest lines.');
            hashes[line.slice(0, index).trim()] = line.slice(index + 1).trim();
        }
        const entry = {
            name: this.inputs.name.value.trim(), backend: this.inputs.backend.value,
            family: this.inputs.family.value, repo_id: this.inputs.repo_id.value.trim(),
            source: this.inputs.source.value, revision: this.inputs.revision.value.trim(),
            local_only: this.inputs.local_only.checked, local_path: this.inputs.local_path.value.trim(),
            has_vision: this.inputs.has_vision.checked, trust_remote_code: this.inputs.trust_remote_code.checked,
            file_pattern: this.inputs.file_pattern.value.trim(), mmproj: this.inputs.mmproj.value.trim(),
            quantizations: this.inputs.quantizations.value.split(',').map(value => value.trim()).filter(Boolean),
            quantization: this.inputs.quantization.value,
            tensor_parallel: Number(this.inputs.tensor_parallel.value || 1), data_parallel: Number(this.inputs.data_parallel.value || 1),
            expected_sha256: hashes, description: this.inputs.description.value.trim(),
        };
        if (entry.backend === 'ollama') {
            delete entry.source;
            delete entry.revision;
            delete entry.expected_sha256;
            entry.trust_remote_code = false;
        }
        return entry;
    }

    async inspect() {
        let entry;
        try { entry = this.collect(); } catch (error) { this.setStatus(error.message, 'error'); return; }
        const result = await this.action('Inspecting model source', () => request('/smartlml/registry/inspect', { entry, original_display_name: this.selected }));
        if (result?.entry) {
            const selected = this.selected;
            this.setForm(result.entry);
            this.selected = selected;
            this.inputs.backend.disabled = Boolean(selected);
            this.setStatus(`Validated as ${result.entry.display_name}.`, 'success');
        }
    }

    async save() {
        let entry;
        try { entry = this.collect(); } catch (error) { this.setStatus(error.message, 'error'); return; }
        const result = await this.action('Saving registry entry', () => request('/smartlml/registry/upsert', { entry, original_display_name: this.selected }));
        const displayName = result?.entry?.display_name;
        if (!displayName) return;
        this.selected = displayName;
        emitSmartLLMRegistryChanged();
        await this.refresh(displayName);
    }

    selectedQuantization() {
        return this.inputs.download_quantization.value || null;
    }

    async download() {
        if (!this.selected) return;
        const result = await this.action('Downloading model', () => request('/smartlml/model/download', { display_name: this.selected, quantization: this.selectedQuantization() }));
        if (result) await this.refresh(this.selected);
    }

    async verify() {
        if (!this.selected) return;
        await this.action('Verifying local model files', () => request('/smartlml/model/verify', { display_name: this.selected, quantization: this.selectedQuantization() }));
    }

    async deleteLocal() {
        if (!this.selected) return;
        if (!window.confirm(`Delete local model files for "${this.selected}"?\n\nThe registry entry will remain. This cannot be undone.`)) return;
        const result = await this.action('Deleting local model files', () => request('/smartlml/model/delete', { display_name: this.selected }));
        if (result) await this.refresh(this.selected);
    }

    async removeEntry() {
        if (!this.selected) return;
        const selected = this.selected;
        if (!window.confirm(`Remove registry entry "${selected}"?\n\nLocal model files will not be deleted. This cannot be undone.`)) return;
        const result = await this.action('Removing registry entry', () => request('/smartlml/registry/remove', { display_name: selected }));
        if (!result) return;
        this.selected = null;
        emitSmartLLMRegistryChanged();
        this.newEntry();
        await this.refresh();
    }
}

const manager = new RegistryManager();
let sidebarLauncherRegistered = false;

function isNewMenuActive() {
    try {
        return app.ui?.settings?.getSettingValue?.('Comfy.UseNewMenu') !== 'Disabled';
    } catch (_) { return true; }
}

function injectClassicButton() {
    const existing = document.querySelector('[data-smartllm-registry-classic]');
    if (isNewMenuActive()) { existing?.remove(); return; }
    if (existing?.isConnected) return;
    const host = app.ui?.menuContainer;
    if (!host) return;
    const button = element('button', 'smartllm-registry-classic', 'Open Smart LM Manager (Beta)');
    button.type = 'button';
    button.dataset.smartllmRegistryClassic = 'true';
    button.addEventListener('click', () => manager.open());
    host.appendChild(button);
}

function registerSidebarLauncher() {
    if (sidebarLauncherRegistered) return true;
    const extensionManager = app.extensionManager;
    if (!extensionManager || typeof extensionManager.registerSidebarTab !== 'function') return false;
    extensionManager.registerSidebarTab({
        id: SIDEBAR_TAB_ID,
        icon: 'pi pi-database',
        title: 'Smart LM Manager (Beta)',
        tooltip: 'Manage Smart LM models and Docker images (Beta)',
        type: 'custom',
        render: (host) => {
            host.replaceChildren();
            manager.open();
            // This tab is a left-toolbar launcher, not a persistent panel.
            // Close the empty sidebar immediately while leaving the modal open.
            queueMicrotask(() => {
                try {
                    const closeRequest = extensionManager.command?.execute?.(
                        `Workspace.ToggleSidebarTab.${SIDEBAR_TAB_ID}`
                    );
                    Promise.resolve(closeRequest).catch(() => {});
                } catch (_) { /* noop */ }
            });
        },
    });
    sidebarLauncherRegistered = true;
    return true;
}

app.registerExtension({
    name: 'SmartLLM.RegistryManager',
    commands: [{
        id: COMMAND_ID,
        label: 'Open Smart LM Manager (Beta)',
        icon: 'pi pi-database',
        tooltip: 'Manage Smart LM registry models, Docker setup, and backend images (Beta)',
        function: () => manager.open(),
    }],
    menuCommands: [{ path: ['SmartLLM'], commands: [COMMAND_ID] }],
    async init() { injectCSS(); },
    async setup() {
        if (!registerSidebarLauncher()) {
            let tries = 0;
            const timer = setInterval(() => {
                tries += 1;
                if (registerSidebarLauncher() || tries > 20) clearInterval(timer);
            }, 100);
        }
        injectClassicButton();
        queueMicrotask(injectClassicButton);
        setTimeout(injectClassicButton, 250);
        const observer = new MutationObserver(injectClassicButton);
        observer.observe(document.body, { childList: true, subtree: true });
    },
});
