import { onSmartLLMRegistryChanged } from './smartllm-registry-events.js';

// Pack-local request sharing. Entries are shared only while pending; task and
// model lists retain their existing successful-result cache until refresh.
let generation = 0;
const pending = new Map();
const cached = new Map();
let reloadPromise = null;

export function metadataGeneration() { return generation; }

export function invalidateMetadata() {
    generation++;
    pending.clear();
    cached.clear();
}

export function expireMetadataCache() { cached.clear(); }

export function registryNodes(root, type) {
    const nodes = [];
    const visited = new Set();
    const walk = graph => {
        if (!Array.isArray(graph?._nodes) || visited.has(graph)) return;
        visited.add(graph);
        for (const node of graph._nodes) {
            if (node.type === type) nodes.push(node);
            walk(node.subgraph);
        }
    };
    walk(root);
    return nodes;
}

async function request(path, fallback, cache = false) {
    if (cache && cached.has(path)) return cached.get(path);
    if (pending.has(path)) return pending.get(path);
    const started = generation;
    const promise = (async () => {
        try {
            const response = await fetch(path);
            if (!response.ok) return fallback;
            const value = await response.json();
            if (started !== generation) return fallback;
            if (cache) cached.set(path, value);
            return value;
        } catch {
            return fallback;
        }
    })();
    pending.set(path, promise);
    try { return await promise; }
    finally { if (pending.get(path) === promise) pending.delete(path); }
}

export function fetchModelEntry(name) {
    return name ? request(`/smartlml/model_entry?name=${encodeURIComponent(name)}`, null) : Promise.resolve(null);
}

export function fetchTaskList(hasVision, family = '') {
    const familyQuery = family ? `&family=${encodeURIComponent(family)}` : '';
    return request(`/smartlml/task_list?has_vision=${hasVision}${familyQuery}`, [], true);
}

export function fetchModelList() { return request('/smartlml/model_list', [], true); }
export function fetchDetectionModelList() { return request('/smartlml/detection/model_list', []); }

export function reloadRegistry() {
    if (reloadPromise) return reloadPromise;
    invalidateMetadata();
    const promise = fetch('/smartlml/registry/reload', { method: 'POST' }).catch(() => null);
    reloadPromise = promise;
    return promise.finally(() => { if (reloadPromise === promise) reloadPromise = null; });
}

onSmartLLMRegistryChanged(invalidateMetadata);
