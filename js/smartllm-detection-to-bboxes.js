import { app } from './comfy/index.js';
import {
    createWidgetVisibilityManager,
    debounce,
    isConfiguringGraph,
    smartResize,
} from './smartllm-widget-performance-utils.js';
const NODE_NAME = 'Detection to Bboxes [Eclipse]';
app.registerExtension({
    name: 'SmartLLM.DetectionToBboxes',
    async beforeRegisterNodeDef(nodeType, nodeData, _app) {
        if (nodeData.name !== NODE_NAME) return;
        const origOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const ret = origOnNodeCreated ? origOnNodeCreated.apply(this, arguments) : undefined;
            const node = this;
            const vis = createWidgetVisibilityManager(node);
            const updateVisibility = () => {
                if (node.id === -1) return;
                const getMask = vis.getValue('get_mask_from_image');
                const combineMasks = vis.getValue('combine_masks');
                vis.setVisible('detect_color', getMask);
                vis.setVisible('threshold', getMask);
                vis.setVisible('min_area', getMask);
                vis.setVisible('indices', !combineMasks);
                smartResize(node);
            };
            const debouncedUpdate = debounce(updateVisibility, 100);
            const getMaskW = node.widgets?.find((w) => w.name === 'get_mask_from_image');
            if (getMaskW) {
                const origCb = getMaskW.callback;
                getMaskW.callback = function () {
                    if (origCb) origCb.apply(this, arguments);
                    vis.markUserDriven();
                    debouncedUpdate();
                };
            }
            const combineMasksW = node.widgets?.find((w) => w.name === 'combine_masks');
            if (combineMasksW) {
                const origCb = combineMasksW.callback;
                combineMasksW.callback = function () {
                    if (origCb) origCb.apply(this, arguments);
                    vis.markUserDriven();
                    debouncedUpdate();
                };
            }

            vis.hideInitially(['detect_color', 'threshold', 'min_area', 'indices']);
            if (!node._SmartLLMDetectionToBboxes_initialized && !isConfiguringGraph()) {
                node._SmartLLMDetectionToBboxes_initialized = true;
                requestAnimationFrame(() => {
                    updateVisibility();
                    const oldHeight = node.size[1];
                    node.size[1] = 0;
                    const computed = node.computeSize();
                    if (computed[1] !== oldHeight) {
                        node.setSize?.([node.size[0], computed[1]]);
                    } else {
                        node.size[1] = oldHeight;
                    }
                });
            }
            const origConfigure = node.onConfigure;
            node.onConfigure = function () {
                origConfigure?.apply(this, arguments);
                updateVisibility();
            };
            return ret;
        };
    },
});
