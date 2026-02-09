import { useI18n } from 'vue-i18n';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SettingsOutline, DownloadOutline } from '@vicons/ionicons5';
const { t } = useI18n();
const props = defineProps();
const emit = defineEmits();
const canvasRef = ref(null);
const pointSize = ref(0.08);
const autoRotate = ref(true);
const confThreshold = ref(0);
const zCropEnabled = ref(true);
const pointCount = ref(0);
const showSettings = ref(true);
const hasConfidence = computed(() => props.data.conf && props.data.conf.length > 0);
// Three.js state (non-reactive, managed imperatively)
let renderer = null;
let scene = null;
let camera = null;
let controls = null;
let points = null;
let animationId = null;
function parsePointCloudData(data, threshold, zCrop) {
    const lines = data.txt.split('\n').filter(Boolean);
    const confidenceArray = data.conf || [];
    const filteredIndices = [];
    for (let i = 0; i < lines.length; i++) {
        const conf = confidenceArray[i] ?? 1;
        if (conf >= threshold) {
            filteredIndices.push(i);
        }
    }
    const count = filteredIndices.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    let validCount = 0;
    for (const originalIndex of filteredIndices) {
        const line = lines[originalIndex];
        const parts = line.split(',');
        if (parts.length >= 7) {
            const x = parseFloat(parts[1]);
            const y = parseFloat(parts[2]);
            const z = parseFloat(parts[3]);
            const r = parseInt(parts[4], 10);
            const g = parseInt(parts[5], 10);
            const b = parseInt(parts[6], 10);
            if (isNaN(x) || isNaN(y) || isNaN(z))
                continue;
            if (zCrop && z > 0)
                continue;
            positions[validCount * 3] = x;
            positions[validCount * 3 + 1] = y;
            positions[validCount * 3 + 2] = z;
            colors[validCount * 3] = Math.max(0, Math.min(255, isNaN(r) ? 0 : r)) / 255;
            colors[validCount * 3 + 1] = Math.max(0, Math.min(255, isNaN(g) ? 0 : g)) / 255;
            colors[validCount * 3 + 2] = Math.max(0, Math.min(255, isNaN(b) ? 0 : b)) / 255;
            validCount++;
        }
    }
    return {
        positions: positions.subarray(0, validCount * 3),
        colors: colors.subarray(0, validCount * 3),
        pointCount: validCount,
    };
}
function buildPointCloud() {
    if (!scene)
        return;
    // Remove old points
    if (points) {
        scene.remove(points);
        points.geometry.dispose();
        points.material.dispose();
        points = null;
    }
    const result = parsePointCloudData(props.data, confThreshold.value, zCropEnabled.value);
    pointCount.value = result.pointCount;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(result.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(result.colors, 3));
    const material = new THREE.PointsMaterial({
        size: pointSize.value,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
    });
    points = new THREE.Points(geometry, material);
    scene.add(points);
}
function initThree() {
    const canvas = canvasRef.value;
    if (!canvas)
        return;
    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x18181b); // zinc-900
    const rect = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    // Scene
    scene = new THREE.Scene();
    // Camera
    camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.1, 1000);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);
    // Controls
    controls = new OrbitControls(camera, canvas);
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.minDistance = 5;
    controls.maxDistance = 100;
    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);
    // Grid + Axes
    scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x222222));
    scene.add(new THREE.AxesHelper(5));
    // Build point cloud
    buildPointCloud();
    // Animation loop
    function animate() {
        animationId = requestAnimationFrame(animate);
        if (autoRotate.value && points) {
            points.rotation.y += 0.003;
        }
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}
function handleResize() {
    if (!renderer || !camera || !canvasRef.value)
        return;
    const rect = canvasRef.value.parentElement.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
}
function getFilteredLines() {
    const lines = props.data.txt.split('\n').filter(Boolean);
    const confidenceArray = props.data.conf || [];
    const filteredLines = [];
    for (let i = 0; i < lines.length; i++) {
        const conf = confidenceArray[i] ?? 1;
        if (conf < confThreshold.value)
            continue;
        const parts = lines[i].split(',');
        if (parts.length >= 7) {
            const z = parseFloat(parts[3]);
            if (isNaN(z))
                continue;
            if (zCropEnabled.value && z > 0)
                continue;
            filteredLines.push(lines[i]);
        }
    }
    return filteredLines;
}
function handleDownloadPLY() {
    const filteredLines = getFilteredLines();
    const plyHeader = [
        'ply',
        'format ascii 1.0',
        `element vertex ${filteredLines.length}`,
        'property float x',
        'property float y',
        'property float z',
        'property uchar red',
        'property uchar green',
        'property uchar blue',
        'end_header',
    ].join('\n');
    const plyData = filteredLines
        .map((line) => {
        const [, x, y, z, r, g, b] = line.split(',');
        return `${x} ${y} ${z} ${r} ${g} ${b}`;
    })
        .join('\n');
    const blob = new Blob([plyHeader + '\n' + plyData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `point_cloud_${Date.now()}.ply`;
    a.click();
    URL.revokeObjectURL(url);
}
function handleDownloadTXT() {
    const filteredLines = getFilteredLines();
    const blob = new Blob([filteredLines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `point_cloud_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}
const downloadOptions = computed(() => [
    { label: 'PLY', key: 'ply' },
    { label: 'TXT', key: 'txt' },
]);
function handleDownloadSelect(key) {
    if (key === 'ply')
        handleDownloadPLY();
    else if (key === 'txt')
        handleDownloadTXT();
}
function cleanupThree() {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (points) {
        points.geometry.dispose();
        points.material.dispose();
    }
    if (controls) {
        controls.dispose();
    }
    if (renderer) {
        renderer.dispose();
    }
    scene = null;
    camera = null;
    controls = null;
    points = null;
    renderer = null;
}
// Watch for filter/size changes — rebuild point cloud
watch([confThreshold, zCropEnabled], () => {
    buildPointCloud();
});
watch(pointSize, (newSize) => {
    if (points) {
        ;
        points.material.size = newSize;
    }
});
onMounted(() => {
    initThree();
    window.addEventListener('resize', handleResize);
});
onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    cleanupThree();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col lg:flex-row gap-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-1 relative" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rounded-lg overflow-hidden bg-zinc-900" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.canvas)({
    ref: "canvasRef",
    ...{ class: "w-full h-full block" },
    ...{ style: {} },
});
/** @type {typeof __VLS_ctx.canvasRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showSettings = !__VLS_ctx.showSettings;
        } },
    ...{ class: "absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-md bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer border-0" },
    title: (__VLS_ctx.showSettings ? 'Hide settings' : 'Show settings'),
});
const __VLS_0 = {}.NIcon;
/** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    size: (18),
}));
const __VLS_2 = __VLS_1({
    size: (18),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.SettingsOutline;
/** @type {[typeof __VLS_components.SettingsOutline, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({}));
const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "absolute bottom-3 left-3 text-xs text-zinc-400 bg-zinc-800/80 px-2 py-1 rounded" },
});
(__VLS_ctx.t('tools.pointCloud.points'));
(__VLS_ctx.pointCount.toLocaleString());
const __VLS_8 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    enterActiveClass: "transition-all duration-200 ease-out",
    enterFromClass: "opacity-0 lg:w-0 lg:opacity-0",
    enterToClass: "opacity-100 lg:w-72 lg:opacity-100",
    leaveActiveClass: "transition-all duration-150 ease-in",
    leaveFromClass: "opacity-100 lg:w-72 lg:opacity-100",
    leaveToClass: "opacity-0 lg:w-0 lg:opacity-0",
}));
const __VLS_10 = __VLS_9({
    enterActiveClass: "transition-all duration-200 ease-out",
    enterFromClass: "opacity-0 lg:w-0 lg:opacity-0",
    enterToClass: "opacity-100 lg:w-72 lg:opacity-100",
    leaveActiveClass: "transition-all duration-150 ease-in",
    leaveFromClass: "opacity-100 lg:w-72 lg:opacity-100",
    leaveToClass: "opacity-0 lg:w-0 lg:opacity-0",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
if (__VLS_ctx.showSettings) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "lg:w-72 shrink-0 rounded-lg bg-muted p-4 space-y-5" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
        ...{ class: "text-sm font-semibold text-foreground" },
    });
    (__VLS_ctx.t('tools.pointCloud.settings'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "flex items-center gap-2 cursor-pointer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "checkbox",
        ...{ class: "rounded" },
    });
    (__VLS_ctx.autoRotate);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm text-foreground" },
    });
    (__VLS_ctx.t('tools.pointCloud.autoRotate'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "text-sm text-muted-foreground" },
    });
    (__VLS_ctx.t('tools.pointCloud.pointSize'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm text-muted-foreground tabular-nums" },
    });
    (__VLS_ctx.pointSize.toFixed(2));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "range",
        min: "0.01",
        max: "0.3",
        step: "0.01",
        ...{ class: "w-full" },
    });
    (__VLS_ctx.pointSize);
    if (__VLS_ctx.hasConfidence) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center justify-between" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "text-sm text-muted-foreground" },
        });
        (__VLS_ctx.t('tools.pointCloud.confidence'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "text-sm text-muted-foreground tabular-nums" },
        });
        ((__VLS_ctx.confThreshold * 100).toFixed(0));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "range",
            min: "0",
            max: "1",
            step: "0.05",
            ...{ class: "w-full" },
        });
        (__VLS_ctx.confThreshold);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "flex items-center gap-2 cursor-pointer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "checkbox",
        ...{ class: "rounded" },
    });
    (__VLS_ctx.zCropEnabled);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm text-foreground" },
    });
    (__VLS_ctx.t('tools.pointCloud.zCrop'));
}
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-wrap gap-3" },
});
const __VLS_12 = {}.NDropdown;
/** @type {[typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onSelect': {} },
    options: (__VLS_ctx.downloadOptions),
}));
const __VLS_14 = __VLS_13({
    ...{ 'onSelect': {} },
    options: (__VLS_ctx.downloadOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onSelect: (__VLS_ctx.handleDownloadSelect)
};
__VLS_15.slots.default;
const __VLS_20 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    type: "primary",
}));
const __VLS_22 = __VLS_21({
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_23.slots;
    const __VLS_24 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({}));
    const __VLS_26 = __VLS_25({}, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_27.slots.default;
    const __VLS_28 = {}.DownloadOutline;
    /** @type {[typeof __VLS_components.DownloadOutline, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({}));
    const __VLS_30 = __VLS_29({}, ...__VLS_functionalComponentArgsRest(__VLS_29));
    var __VLS_27;
}
(__VLS_ctx.t('tools.download'));
var __VLS_23;
var __VLS_15;
const __VLS_32 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    ...{ 'onClick': {} },
}));
const __VLS_34 = __VLS_33({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
let __VLS_36;
let __VLS_37;
let __VLS_38;
const __VLS_39 = {
    onClick: (...[$event]) => {
        __VLS_ctx.emit('reset');
    }
};
__VLS_35.slots.default;
(__VLS_ctx.t('tools.processAnother'));
var __VLS_35;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-900']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['top-3']} */ ;
/** @type {__VLS_StyleScopedClasses['right-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-800/80']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-300']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-zinc-700']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['border-0']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-3']} */ ;
/** @type {__VLS_StyleScopedClasses['left-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-400']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-800/80']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:w-72']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            SettingsOutline: SettingsOutline,
            DownloadOutline: DownloadOutline,
            t: t,
            emit: emit,
            canvasRef: canvasRef,
            pointSize: pointSize,
            autoRotate: autoRotate,
            confThreshold: confThreshold,
            zCropEnabled: zCropEnabled,
            pointCount: pointCount,
            showSettings: showSettings,
            hasConfidence: hasConfidence,
            downloadOptions: downloadOptions,
            handleDownloadSelect: handleDownloadSelect,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
