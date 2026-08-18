import {
    CheckCircle2,
    GripVertical,
    ImagePlus,
    LoaderCircle,
    Plus,
    Save,
    Trash2,
    WandSparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useAppContext } from '@/context/AppContext';
import { createFeature, deleteFeature, fetchFeatures, updateFeature } from '../Features/api';
import { createHero, fetchHeroes, updateHero } from '../Hero/api';
import {
    deleteHomepageImage,
    fetchHomepageCustomizer,
    updateHomepageCustomizer,
} from './homepageCustomizerApi.js';
import {
    createHowWeHelpItem,
    deleteHowWeHelpItem,
    fetchHowWeHelp,
    updateHowWeHelpItem,
    updateHowWeHelpSection,
} from './howWeHelpApi.js';
import {
    createShopByIndustryItem,
    deleteShopByIndustryItem,
    fetchShopByIndustry,
    updateShopByIndustryItem,
    updateShopByIndustrySection,
} from './shopbyeventApi.js';
import { homePageSections } from '../../../frontend/pages/HomePage.jsx';
import {
    createShopByProductItem,
    deleteShopByProductItem,
    fetchShopByProduct,
    updateShopByProductItem,
    updateShopByProductSection,
} from './shpByProductAPI.js';

const defaultHeroForm = {
    title: '',
    ticker_text: '',
    sub_title: '',
    description: '',
    button_enabled: false,
    button_text: '',
};

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';

function toCustomizeImageUrl(path, updatedAt = '') {
    if (!path) return null;
    const url = path.startsWith('uploads/') ? `/${path}` : `/storage/${path}`;
    return updatedAt ? `${url}?v=${encodeURIComponent(updatedAt)}` : url;
}

/* ---------------------------------------------------------------------- *
 * Generic repeater-list state (used by hero slides, features, industry,
 * how-we-help, and shop-by-product items). Handles add/edit/remove/drag
 * reordering + object-URL cleanup so each section doesn't reimplement it.
 * ---------------------------------------------------------------------- */
function useRepeaterItems() {
    const [items, setItems] = useState([]);
    const [removedIds, setRemovedIds] = useState([]);
    const [draggedKey, setDraggedKey] = useState(null);

    const normalize = (list) => list.map((item, index) => ({ ...item, sort_order: index + 1 }));

    function load(list, mapItem) {
        setItems(normalize((list || []).map(mapItem)));
        setRemovedIds([]);
    }

    function add(factory) {
        setItems((previous) => normalize([...previous, factory()]));
    }

    function updateField(key, field, value) {
        setItems((previous) =>
            previous.map((item) => (item.key === key ? { ...item, [field]: value } : item))
        );
    }

    function updateFile(key, file, urlField = 'image_url', fileField = 'imageFile') {
        if (!file) return;
        setItems((previous) =>
            previous.map((item) => {
                if (item.key !== key) return item;
                if (item[urlField]?.startsWith('blob:')) URL.revokeObjectURL(item[urlField]);
                return { ...item, [fileField]: file, [urlField]: URL.createObjectURL(file) };
            })
        );
    }

    function remove(key, urlField = 'image_url') {
        setItems((previous) => {
            const item = previous.find((entry) => entry.key === key);
            if (item?.id) setRemovedIds((ids) => [...ids, item.id]);
            if (item?.[urlField]?.startsWith('blob:')) URL.revokeObjectURL(item[urlField]);
            return normalize(previous.filter((entry) => entry.key !== key));
        });
    }

    function handleDrop(targetKey) {
        if (!draggedKey || draggedKey === targetKey) return;
        setItems((previous) => {
            const next = [...previous];
            const draggedIndex = next.findIndex((item) => item.key === draggedKey);
            const targetIndex = next.findIndex((item) => item.key === targetKey);
            if (draggedIndex < 0 || targetIndex < 0) return previous;
            const [moved] = next.splice(draggedIndex, 1);
            next.splice(targetIndex, 0, moved);
            return normalize(next);
        });
        setDraggedKey(null);
    }

    return { items, removedIds, draggedKey, setDraggedKey, load, add, updateField, updateFile, remove, handleDrop };
}

/** Shared save routine for a "section fields + repeater items" editor. */
async function saveRepeaterSection({
    items,
    removedIds,
    updateSection,
    sectionPayload,
    createItem,
    updateItem,
    deleteItem,
    buildPayload,
}) {
    if (updateSection) {
        await updateSection(sectionPayload);
    }

    if (removedIds.length > 0) {
        await Promise.all(removedIds.map((id) => deleteItem(id)));
    }

    for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const payload = buildPayload(item, index);
        if (item.id) {
            await updateItem(item.id, payload);
        } else {
            await createItem(payload);
        }
    }
}

/* ---------------------------------------------------------------------- *
 * Small presentational building blocks shared across editors.
 * ---------------------------------------------------------------------- */
function FieldInput({ label, ...props }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={props.id}>{label}</Label>
            <Input {...props} />
        </div>
    );
}

function FieldTextarea({ label, rows = 3, ...props }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={props.id}>{label}</Label>
            <textarea
                rows={rows}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                {...props}
            />
        </div>
    );
}

function FieldImage({ label, value, alt, onChange, imgClassName = 'h-24 w-full rounded object-cover' }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input type="file" accept={IMAGE_ACCEPT} onChange={(event) => onChange(event.target.files?.[0])} />
            {value ? <img src={value} alt={alt} className={imgClassName} /> : null}
        </div>
    );
}

function RepeaterCard({ index, onDragStart, onDrop, onRemove, children }) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            className="space-y-3 rounded-lg border border-border bg-card p-3"
        >
            <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-sm font-semibold">
                    <GripVertical className="size-4 text-muted-foreground" />
                    Item {index + 1}
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove item">
                    <Trash2 className="size-4 text-rose-600" />
                </Button>
            </div>
            {children}
        </div>
    );
}

function RepeaterList({ items, emptyLabel, hint, onAdd, renderItem }) {
    return (
        <>
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">{hint}</p>
                <Button type="button" size="sm" onClick={onAdd}>
                    <Plus className="size-4" />
                    Add item
                </Button>
            </div>
            <div className="space-y-3">
                {items.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                        {emptyLabel}
                    </div>
                ) : (
                    items.map((item, index) => renderItem(item, index))
                )}
            </div>
        </>
    );
}

function LoadingRow({ label }) {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            {label}
        </div>
    );
}

function SaveFooterButton({ label, isSaving, disabled }) {
    return (
        <SheetFooter className="border-t">
            <Button type="submit" disabled={isSaving || disabled} className="w-full">
                {isSaving ? (
                    <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        <Save className="size-4" />
                        {label}
                    </>
                )}
            </Button>
        </SheetFooter>
    );
}

export default function HomePageBuilder() {
    const { setPageTitle } = useAppContext();

    const previewFrameRef = useRef(null);

    const [previewKey, setPreviewKey] = useState(0);
    const [pendingScrollSection, setPendingScrollSection] = useState(null);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeEditor, setActiveEditor] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [isLoadingHero, setIsLoadingHero] = useState(false);
    const [heroId, setHeroId] = useState(null);
    const [heroForm, setHeroForm] = useState(defaultHeroForm);
    const heroSlides = useRepeaterItems();

    const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
    const features = useRepeaterItems();

    const [isLoadingIndustry, setIsLoadingIndustry] = useState(false);
    const [industryForm, setIndustryForm] = useState({ title: '', subtitle: '' });
    const industry = useRepeaterItems();

    const [isLoadingHowWeHelp, setIsLoadingHowWeHelp] = useState(false);
    const [howWeHelpForm, setHowWeHelpForm] = useState({ title: '', description: '' });
    const howWeHelp = useRepeaterItems();

    const [isLoadingShopByProduct, setIsLoadingShopByProduct] = useState(false);
    const [shopByProductForm, setShopByProductForm] = useState({ title: '', subtitle: '' });
    const shopByProduct = useRepeaterItems();

    const [isLoadingCustomizeHome, setIsLoadingCustomizeHome] = useState(false);
    const [customizeHomeForm, setCustomizeHomeForm] = useState({ title: '', description: '' });
    const [customizeHomeImageUrl, setCustomizeHomeImageUrl] = useState(null);
    const [customizeHomeImageFile, setCustomizeHomeImageFile] = useState(null);

    useEffect(() => {
        setPageTitle('Home Page Builder');
    }, [setPageTitle]);

    const activeSection = useMemo(
        () => homePageSections.find((section) => section.id === activeEditor),
        [activeEditor]
    );

    async function loadHeroForEditor() {
        setIsLoadingHero(true);
        try {
            const heroes = await fetchHeroes();
            const latestHero = Array.isArray(heroes) && heroes.length > 0 ? heroes[0] : null;

            if (!latestHero) {
                setHeroId(null);
                setHeroForm(defaultHeroForm);
                heroSlides.load([], (slide) => slide);
                return;
            }

            setHeroId(latestHero.id);
            setHeroForm({
                title: latestHero.title || '',
                ticker_text: latestHero.ticker_text || '',
                sub_title: latestHero.sub_title || '',
                description: latestHero.description || '',
                button_enabled:
                    typeof latestHero.button_enabled === 'boolean'
                        ? latestHero.button_enabled
                        : defaultHeroForm.button_enabled,
                button_text: latestHero.button_text || '',
            });
            heroSlides.load(latestHero.slides || [], (slide) => ({
                key: `existing-${slide.id}`,
                type: 'existing',
                id: slide.id,
                image_url: slide.image_url,
            }));
        } catch (error) {
            toast.error(error.message || 'Failed to load hero section.');
        } finally {
            setIsLoadingHero(false);
        }
    }

    async function loadFeaturesForEditor() {
        setIsLoadingFeatures(true);
        try {
            const records = await fetchFeatures();
            features.load(Array.isArray(records) ? records : [], (feature) => ({
                key: `existing-feature-${feature.id}`,
                id: feature.id,
                title: feature.title || '',
                description: feature.description || '',
                icon_url: feature.icon_url || null,
                iconFile: null,
            }));
        } catch (error) {
            toast.error(error.message || 'Failed to load features section.');
        } finally {
            setIsLoadingFeatures(false);
        }
    }

    async function loadShopByIndustryForEditor() {
        setIsLoadingIndustry(true);
        try {
            const payload = await fetchShopByIndustry();
            setIndustryForm({ title: payload?.title || '', subtitle: payload?.subtitle || '' });
            industry.load(Array.isArray(payload?.items) ? payload.items : [], (item) => ({
                key: `existing-industry-${item.id}`,
                id: item.id,
                title: item.title || '',
                image_url: item.image_url || null,
                imageFile: null,
            }));
        } catch (error) {
            toast.error(error.message || 'Failed to load shop by industry section.');
        } finally {
            setIsLoadingIndustry(false);
        }
    }

    async function loadHowWeHelpForEditor() {
        setIsLoadingHowWeHelp(true);
        try {
            const payload = await fetchHowWeHelp();
            setHowWeHelpForm({ title: payload?.title || '', description: payload?.description || '' });
            howWeHelp.load(Array.isArray(payload?.items) ? payload.items : [], (item) => ({
                key: `existing-help-${item.id}`,
                id: item.id,
                title: item.title || '',
                description: item.description || '',
                image_url: item.image_url || null,
                imageFile: null,
            }));
        } catch (error) {
            toast.error(error.message || 'Failed to load How We Help section.');
        } finally {
            setIsLoadingHowWeHelp(false);
        }
    }

    async function loadShopByProductForEditor() {
        setIsLoadingShopByProduct(true);
        try {
            const payload = await fetchShopByProduct();
            setShopByProductForm({ title: payload?.title || '', subtitle: payload?.subtitle || '' });
            shopByProduct.load(Array.isArray(payload?.items) ? payload.items : [], (item) => ({
                key: `existing-product-${item.id}`,
                id: item.id,
                title: item.title || '',
                image_url: item.image_url || null,
                imageFile: null,
            }));
        } catch (error) {
            toast.error(error.message || 'Failed to load shop by product section.');
        } finally {
            setIsLoadingShopByProduct(false);
        }
    }

    async function loadCustomizeHomeForEditor() {
        setIsLoadingCustomizeHome(true);
        try {
            const payload = await fetchHomepageCustomizer();
            setCustomizeHomeForm({ title: payload?.title || '', description: payload?.description || '' });
            if (customizeHomeImageUrl?.startsWith('blob:')) URL.revokeObjectURL(customizeHomeImageUrl);
            setCustomizeHomeImageUrl(toCustomizeImageUrl(payload?.image, payload?.updated_at));
            setCustomizeHomeImageFile(null);
        } catch (error) {
            toast.error(error.message || 'Failed to load Customize Home section.');
        } finally {
            setIsLoadingCustomizeHome(false);
        }
    }

    const sectionMeta = {
        hero: {
            previewId: 'home-hero-section',
            load: loadHeroForEditor,
            description: 'Update hero content and media repeater.',
        },
        features: {
            previewId: 'home-features-section',
            load: loadFeaturesForEditor,
            description: 'Manage feature repeater items with title, description, icon, and drag-drop order.',
        },
        'shop-by-event': {
            previewId: 'home-shop-by-industry-section',
            load: loadShopByIndustryForEditor,
            description: 'Manage section title, subtitle, and repeater cards with image + title ordering.',
        },
        'how-we-help': {
            previewId: 'home-how-we-help-section',
            load: loadHowWeHelpForEditor,
            description: 'Manage the section title, description, and repeater cards with image, title, and description.',
        },
        'shop-by-product': {
            previewId: 'home-shop-by-product-section',
            load: loadShopByProductForEditor,
            description: 'Manage section title, subtitle, and product cards with image and title ordering.',
        },
        customizer: {
            previewId: 'home-customize-section',
            load: loadCustomizeHomeForEditor,
            description: 'Manage the Customize Home title, description, and featured image.',
        },
    };

    function scrollPreviewToSection(sectionId) {
        const previewSectionId = sectionMeta[sectionId]?.previewId;
        if (!previewSectionId) return;

        const frame = previewFrameRef.current;
        const documentRef = frame?.contentWindow?.document;
        const target = documentRef?.getElementById(previewSectionId);

        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setPendingScrollSection(null);
        } else {
            setPendingScrollSection(sectionId);
        }
    }

    async function openEditor(editorType) {
        setActiveEditor(editorType);
        setIsDrawerOpen(true);
        await sectionMeta[editorType]?.load?.();
    }

    function handleSectionClick(sectionId) {
        scrollPreviewToSection(sectionId);

        if (sectionMeta[sectionId]) {
            openEditor(sectionId);
        } else {
            toast.info('Editor for this section will be added soon.');
        }
    }

    function handleHeroFieldChange(event) {
        const { name, value } = event.target;
        setHeroForm((previous) => ({ ...previous, [name]: value }));
    }

    function handleHeroSlideUpload(event) {
        const files = Array.from(event.target.files || []);
        files.forEach((file) => {
            heroSlides.add(() => ({
                key: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                type: 'new',
                file,
                image_url: URL.createObjectURL(file),
            }));
        });
        event.target.value = '';
    }

    function addFeatureItem() {
        features.add(() => ({
            key: `new-feature-${Date.now()}`,
            id: null,
            title: '',
            description: '',
            icon_url: null,
            iconFile: null,
        }));
    }

    function addIndustryItem() {
        industry.add(() => ({
            key: `new-industry-${Date.now()}`,
            id: null,
            title: '',
            image_url: null,
            imageFile: null,
        }));
    }

    function addHowWeHelpItem() {
        howWeHelp.add(() => ({
            key: `new-help-${Date.now()}`,
            id: null,
            title: '',
            description: '',
            image_url: null,
            imageFile: null,
        }));
    }

    function addShopByProductItem() {
        shopByProduct.add(() => ({
            key: `new-product-${Date.now()}`,
            id: null,
            title: '',
            image_url: null,
            imageFile: null,
        }));
    }

    function handleCustomizeHomeImageChange(file) {
        if (!file) return;
        if (customizeHomeImageUrl?.startsWith('blob:')) URL.revokeObjectURL(customizeHomeImageUrl);
        setCustomizeHomeImageFile(file);
        setCustomizeHomeImageUrl(URL.createObjectURL(file));
    }

    async function handleRemoveCustomizeHomeImage() {
        // A newly-selected, not-yet-saved image: just clear the pending selection.
        if (customizeHomeImageFile) {
            if (customizeHomeImageUrl?.startsWith('blob:')) URL.revokeObjectURL(customizeHomeImageUrl);
            setCustomizeHomeImageFile(null);
            setCustomizeHomeImageUrl(null);
            return;
        }

        try {
            const saved = await deleteHomepageImage();
            setCustomizeHomeImageUrl(toCustomizeImageUrl(saved?.image, saved?.updated_at));
            setPreviewKey((previous) => previous + 1);
            toast.success('Image removed.');
        } catch (error) {
            toast.error(error.message || 'Failed to remove image.');
        }
    }

    async function handleSaveCustomizeHome(event) {
        event.preventDefault();
        setIsSaving(true);
        try {
            const saved = await updateHomepageCustomizer({
                title: customizeHomeForm.title || '',
                description: customizeHomeForm.description || '',
                image: customizeHomeImageFile,
            });

            if (customizeHomeImageUrl?.startsWith('blob:')) URL.revokeObjectURL(customizeHomeImageUrl);
            setCustomizeHomeImageFile(null);
            setCustomizeHomeImageUrl(toCustomizeImageUrl(saved?.image, saved?.updated_at));
            setPreviewKey((previous) => previous + 1);
            toast.success('Customize Home section updated successfully.');
        } catch (error) {
            toast.error(error.message || 'Failed to save Customize Home section.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSaveHero(event) {
        event.preventDefault();
        setIsSaving(true);
        try {
            const existingSlides = heroSlides.items
                .filter((slide) => slide.type === 'existing' && slide.id)
                .map((slide, index) => ({ id: slide.id, sort_order: index + 1 }));

            const newSlides = heroSlides.items
                .filter((slide) => slide.type === 'new' && slide.file instanceof File)
                .map((slide, index) => ({ file: slide.file, sort_order: index + 1 }));

            const payload = {
                title: heroForm.title || '',
                description: heroForm.description || '',
                ticker_text: heroForm.ticker_text || '',
                sub_title: heroForm.sub_title || '',
                button_enabled: Boolean(heroForm.button_enabled),
                button_text: heroForm.button_text || '',
                existingSlides,
                newSlides,
            };

            const saved = heroId ? await updateHero(heroId, payload) : await createHero(payload);

            setHeroId(saved?.id || heroId);
            heroSlides.load(saved?.slides || [], (slide) => ({
                key: `existing-${slide.id}`,
                type: 'existing',
                id: slide.id,
                image_url: slide.image_url,
            }));
            setPreviewKey((previous) => previous + 1);
            toast.success('Hero section updated successfully.');
        } catch (error) {
            toast.error(error.message || 'Failed to save hero section.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSaveFeatures(event) {
        event.preventDefault();
        setIsSaving(true);
        try {
            await saveRepeaterSection({
                items: features.items,
                removedIds: features.removedIds,
                createItem: createFeature,
                updateItem: updateFeature,
                deleteItem: deleteFeature,
                buildPayload: (item, index) => ({
                    title: item.title || '',
                    description: item.description || '',
                    icon: item.iconFile instanceof File ? item.iconFile : null,
                    sort_order: index + 1,
                }),
            });
            await loadFeaturesForEditor();
            setPreviewKey((previous) => previous + 1);
            toast.success('Features section updated successfully.');
        } catch (error) {
            toast.error(error.message || 'Failed to save features section.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSaveShopByIndustry(event) {
        event.preventDefault();
        setIsSaving(true);
        try {
            await saveRepeaterSection({
                items: industry.items,
                removedIds: industry.removedIds,
                updateSection: updateShopByIndustrySection,
                sectionPayload: { title: industryForm.title || '', subtitle: industryForm.subtitle || '' },
                createItem: createShopByIndustryItem,
                updateItem: updateShopByIndustryItem,
                deleteItem: deleteShopByIndustryItem,
                buildPayload: (item, index) => ({
                    title: item.title || '',
                    image: item.imageFile instanceof File ? item.imageFile : null,
                    sort_order: index + 1,
                }),
            });
            await loadShopByIndustryForEditor();
            setPreviewKey((previous) => previous + 1);
            toast.success('Shop By Industry section updated successfully.');
        } catch (error) {
            toast.error(error.message || 'Failed to save shop by industry section.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSaveShopByProduct(event) {
        event.preventDefault();
        setIsSaving(true);
        try {
            await saveRepeaterSection({
                items: shopByProduct.items,
                removedIds: shopByProduct.removedIds,
                updateSection: updateShopByProductSection,
                sectionPayload: { title: shopByProductForm.title || '', subtitle: shopByProductForm.subtitle || '' },
                createItem: createShopByProductItem,
                updateItem: updateShopByProductItem,
                deleteItem: deleteShopByProductItem,
                buildPayload: (item, index) => ({
                    title: item.title || '',
                    image: item.imageFile instanceof File ? item.imageFile : null,
                    sort_order: index + 1,
                }),
            });
            await loadShopByProductForEditor();
            setPreviewKey((previous) => previous + 1);
            toast.success('Shop By Product section updated successfully.');
        } catch (error) {
            toast.error(error.message || 'Failed to save shop by product section.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSaveHowWeHelp(event) {
        event.preventDefault();
        setIsSaving(true);
        try {
            await saveRepeaterSection({
                items: howWeHelp.items,
                removedIds: howWeHelp.removedIds,
                updateSection: updateHowWeHelpSection,
                sectionPayload: howWeHelpForm,
                createItem: createHowWeHelpItem,
                updateItem: updateHowWeHelpItem,
                deleteItem: deleteHowWeHelpItem,
                buildPayload: (item, index) => ({
                    title: item.title || '',
                    description: item.description || '',
                    image: item.imageFile instanceof File ? item.imageFile : null,
                    sort_order: index + 1,
                }),
            });
            await loadHowWeHelpForEditor();
            setPreviewKey((previous) => previous + 1);
            toast.success('How We Help section updated successfully.');
        } catch (error) {
            toast.error(error.message || 'Failed to save How We Help section.');
        } finally {
            setIsSaving(false);
        }
    }

    function renderHeroEditor() {
        return (
            <form onSubmit={handleSaveHero} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
                    {isLoadingHero ? (
                        <LoadingRow label="Loading hero data..." />
                    ) : (
                        <>
                            <FieldInput
                                id="hero-title"
                                label="Hero title"
                                name="title"
                                value={heroForm.title}
                                onChange={handleHeroFieldChange}
                                placeholder="Enter hero title"
                            />
                            <FieldInput
                                id="ticker-text"
                                label="Ticker text"
                                name="ticker_text"
                                value={heroForm.ticker_text}
                                onChange={handleHeroFieldChange}
                                placeholder="Top announcement text"
                            />
                            <FieldInput
                                id="sub-title"
                                label="Sub title"
                                name="sub_title"
                                value={heroForm.sub_title}
                                onChange={handleHeroFieldChange}
                                placeholder="Pill subtitle"
                            />

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <RichTextEditor
                                    value={heroForm.description}
                                    onChange={(value) =>
                                        setHeroForm((previous) => ({ ...previous, description: value }))
                                    }
                                    placeholder="Describe your hero section"
                                    className="relative"
                                />
                            </div>

                            <div className="space-y-3 rounded-lg border border-border p-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="button-enabled">Show button</Label>
                                    <Checkbox
                                        id="button-enabled"
                                        checked={heroForm.button_enabled}
                                        onCheckedChange={(checked) =>
                                            setHeroForm((previous) => ({
                                                ...previous,
                                                button_enabled: Boolean(checked),
                                            }))
                                        }
                                    />
                                </div>
                                <FieldInput
                                    id="button-text"
                                    label="Button text"
                                    name="button_text"
                                    value={heroForm.button_text}
                                    onChange={handleHeroFieldChange}
                                    placeholder="CTA button text"
                                    disabled={!heroForm.button_enabled}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="hero-slides" className="inline-flex items-center gap-2">
                                    <ImagePlus className="size-4" />
                                    Repeater images
                                </Label>
                                <Input
                                    id="hero-slides"
                                    type="file"
                                    accept={IMAGE_ACCEPT}
                                    multiple
                                    onChange={handleHeroSlideUpload}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Upload multiple images. Drag and drop cards below to reorder.
                                </p>
                            </div>

                            <div className="space-y-2">
                                {heroSlides.items.length === 0 ? (
                                    <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                                        No repeater images yet.
                                    </div>
                                ) : (
                                    heroSlides.items.map((slide, index) => (
                                        <div
                                            key={slide.key}
                                            draggable
                                            onDragStart={() => heroSlides.setDraggedKey(slide.key)}
                                            onDragOver={(event) => event.preventDefault()}
                                            onDrop={() => heroSlides.handleDrop(slide.key)}
                                            className="flex items-center gap-3 rounded-lg border border-border bg-card p-2"
                                        >
                                            <button
                                                type="button"
                                                className="cursor-grab text-muted-foreground active:cursor-grabbing"
                                                aria-label="Drag to reorder slide"
                                            >
                                                <GripVertical className="size-4" />
                                            </button>

                                            <img
                                                src={slide.image_url}
                                                alt={`Hero slide ${index + 1}`}
                                                className="h-16 w-24 rounded object-cover"
                                            />

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-medium text-foreground">
                                                    {slide.type === 'existing' ? 'Existing image' : slide.file?.name}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Position: {index + 1}
                                                </p>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => heroSlides.remove(slide.key)}
                                                aria-label="Remove slide"
                                            >
                                                <Trash2 className="size-4 text-rose-600" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
                <SaveFooterButton label="Save Hero" isSaving={isSaving} disabled={isLoadingHero} />
            </form>
        );
    }

    function renderFeaturesEditor() {
        return (
            <form onSubmit={handleSaveFeatures} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
                    {isLoadingFeatures ? (
                        <LoadingRow label="Loading features data..." />
                    ) : (
                        <RepeaterList
                            items={features.items}
                            emptyLabel="No feature items yet. Click Add item."
                            hint="Reorder cards by dragging. Each card supports title, description, and icon."
                            onAdd={addFeatureItem}
                            renderItem={(item, index) => (
                                <RepeaterCard
                                    key={item.key}
                                    index={index}
                                    onDragStart={() => features.setDraggedKey(item.key)}
                                    onDrop={() => features.handleDrop(item.key)}
                                    onRemove={() => features.remove(item.key, 'icon_url')}
                                >
                                    <FieldInput
                                        label="Title"
                                        value={item.title}
                                        onChange={(event) => features.updateField(item.key, 'title', event.target.value)}
                                        placeholder="Feature title"
                                    />
                                    <FieldInput
                                        label="Description"
                                        value={item.description}
                                        onChange={(event) =>
                                            features.updateField(item.key, 'description', event.target.value)
                                        }
                                        placeholder="Feature description"
                                    />
                                    <FieldImage
                                        label="Icon"
                                        value={item.icon_url}
                                        alt={item.title || 'Feature icon'}
                                        onChange={(file) => features.updateFile(item.key, file, 'icon_url', 'iconFile')}
                                        imgClassName="h-10 w-10 rounded object-contain"
                                    />
                                </RepeaterCard>
                            )}
                        />
                    )}
                </div>
                <SaveFooterButton label="Save Features" isSaving={isSaving} disabled={isLoadingFeatures} />
            </form>
        );
    }

    function renderShopByIndustryEditor() {
        return (
            <form onSubmit={handleSaveShopByIndustry} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
                    {isLoadingIndustry ? (
                        <LoadingRow label="Loading shop by industry data..." />
                    ) : (
                        <>
                            <FieldInput
                                id="industry-section-title"
                                label="Section title"
                                value={industryForm.title}
                                onChange={(event) =>
                                    setIndustryForm((previous) => ({ ...previous, title: event.target.value }))
                                }
                                placeholder="e.g. Shop By Industry"
                            />
                            <FieldInput
                                id="industry-section-subtitle"
                                label="Section subtitle"
                                value={industryForm.subtitle}
                                onChange={(event) =>
                                    setIndustryForm((previous) => ({ ...previous, subtitle: event.target.value }))
                                }
                                placeholder="e.g. Top picks loved for their comfort..."
                            />
                            <RepeaterList
                                items={industry.items}
                                emptyLabel="No industry items yet. Click Add item."
                                hint="Reorder cards by dragging. Each item has image + title."
                                onAdd={addIndustryItem}
                                renderItem={(item, index) => (
                                    <RepeaterCard
                                        key={item.key}
                                        index={index}
                                        onDragStart={() => industry.setDraggedKey(item.key)}
                                        onDrop={() => industry.handleDrop(item.key)}
                                        onRemove={() => industry.remove(item.key)}
                                    >
                                        <FieldInput
                                            label="Card title"
                                            value={item.title}
                                            onChange={(event) =>
                                                industry.updateField(item.key, 'title', event.target.value)
                                            }
                                            placeholder="e.g. Uniforms & Sports Event"
                                        />
                                        <FieldImage
                                            label="Card image"
                                            value={item.image_url}
                                            alt={item.title || 'Industry item'}
                                            onChange={(file) => industry.updateFile(item.key, file)}
                                        />
                                    </RepeaterCard>
                                )}
                            />
                        </>
                    )}
                </div>
                <SaveFooterButton label="Save Shop By Industry" isSaving={isSaving} disabled={isLoadingIndustry} />
            </form>
        );
    }

    function renderShopByProductEditor() {
        return (
            <form onSubmit={handleSaveShopByProduct} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
                    {isLoadingShopByProduct ? (
                        <LoadingRow label="Loading shop by product data..." />
                    ) : (
                        <>
                            <FieldInput
                                id="product-section-title"
                                label="Section title"
                                value={shopByProductForm.title}
                                onChange={(event) =>
                                    setShopByProductForm((previous) => ({ ...previous, title: event.target.value }))
                                }
                                placeholder="e.g. Shop By Product"
                            />
                            <FieldInput
                                id="product-section-subtitle"
                                label="Section subtitle"
                                value={shopByProductForm.subtitle}
                                onChange={(event) =>
                                    setShopByProductForm((previous) => ({ ...previous, subtitle: event.target.value }))
                                }
                                placeholder="e.g. Explore products by category"
                            />
                            <RepeaterList
                                items={shopByProduct.items}
                                emptyLabel="No product items yet. Click Add item."
                                hint="Reorder cards by dragging. Each item has an image and title."
                                onAdd={addShopByProductItem}
                                renderItem={(item, index) => (
                                    <RepeaterCard
                                        key={item.key}
                                        index={index}
                                        onDragStart={() => shopByProduct.setDraggedKey(item.key)}
                                        onDrop={() => shopByProduct.handleDrop(item.key)}
                                        onRemove={() => shopByProduct.remove(item.key)}
                                    >
                                        <FieldInput
                                            label="Card title"
                                            value={item.title}
                                            onChange={(event) =>
                                                shopByProduct.updateField(item.key, 'title', event.target.value)
                                            }
                                            placeholder="e.g. T-Shirts"
                                        />
                                        <FieldImage
                                            label="Card image"
                                            value={item.image_url}
                                            alt={item.title || 'Product item'}
                                            onChange={(file) => shopByProduct.updateFile(item.key, file)}
                                        />
                                    </RepeaterCard>
                                )}
                            />
                        </>
                    )}
                </div>
                <SaveFooterButton
                    label="Save Shop By Product"
                    isSaving={isSaving}
                    disabled={isLoadingShopByProduct}
                />
            </form>
        );
    }

    function renderHowWeHelpEditor() {
        return (
            <form onSubmit={handleSaveHowWeHelp} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
                    {isLoadingHowWeHelp ? (
                        <LoadingRow label="Loading How We Help data..." />
                    ) : (
                        <>
                            <FieldInput
                                id="help-section-title"
                                label="Section title"
                                value={howWeHelpForm.title}
                                onChange={(event) =>
                                    setHowWeHelpForm((previous) => ({ ...previous, title: event.target.value }))
                                }
                                placeholder="e.g. How we help"
                            />
                            <FieldTextarea
                                id="help-section-description"
                                label="Section description"
                                rows={4}
                                value={howWeHelpForm.description}
                                onChange={(event) =>
                                    setHowWeHelpForm((previous) => ({ ...previous, description: event.target.value }))
                                }
                                placeholder="Describe how your business helps customers"
                            />
                            <RepeaterList
                                items={howWeHelp.items}
                                emptyLabel="No help items yet. Click Add item."
                                hint="Drag cards to reorder them."
                                onAdd={addHowWeHelpItem}
                                renderItem={(item, index) => (
                                    <RepeaterCard
                                        key={item.key}
                                        index={index}
                                        onDragStart={() => howWeHelp.setDraggedKey(item.key)}
                                        onDrop={() => howWeHelp.handleDrop(item.key)}
                                        onRemove={() => howWeHelp.remove(item.key)}
                                    >
                                        <FieldInput
                                            label="Title"
                                            value={item.title}
                                            onChange={(event) =>
                                                howWeHelp.updateField(item.key, 'title', event.target.value)
                                            }
                                            placeholder="e.g. Consultation & Advice"
                                        />
                                        <FieldTextarea
                                            label="Description"
                                            value={item.description}
                                            onChange={(event) =>
                                                howWeHelp.updateField(item.key, 'description', event.target.value)
                                            }
                                            placeholder="Describe this service"
                                        />
                                        <FieldImage
                                            label="Image"
                                            value={item.image_url}
                                            alt={item.title || 'How We Help item'}
                                            onChange={(file) => howWeHelp.updateFile(item.key, file)}
                                        />
                                    </RepeaterCard>
                                )}
                            />
                        </>
                    )}
                </div>
                <SaveFooterButton label="Save How We Help" isSaving={isSaving} disabled={isLoadingHowWeHelp} />
            </form>
        );
    }

    function renderCustomizeHomeEditor() {
        return (
            <form onSubmit={handleSaveCustomizeHome} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
                    {isLoadingCustomizeHome ? (
                        <LoadingRow label="Loading Customize Home data..." />
                    ) : (
                        <>
                            <FieldInput
                                id="customize-home-title"
                                label="Title"
                                value={customizeHomeForm.title}
                                onChange={(event) =>
                                    setCustomizeHomeForm((previous) => ({ ...previous, title: event.target.value }))
                                }
                                placeholder="e.g. Customize Your Home"
                            />
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <RichTextEditor
                                value={customizeHomeForm.description}
                                    onChange={(value) =>
                                    setCustomizeHomeForm((previous) => ({
                                        ...previous,
                                            description: value,
                                    }))
                                }
                                    placeholder="Describe this section"
                                    className="relative"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="customize-home-image">Image</Label>
                                <Input
                                    id="customize-home-image"
                                    type="file"
                                    accept={IMAGE_ACCEPT}
                                    onChange={(event) => handleCustomizeHomeImageChange(event.target.files?.[0])}
                                />
                                {customizeHomeImageUrl ? (
                                    <div className="space-y-2">
                                        <img
                                            src={customizeHomeImageUrl}
                                            alt={customizeHomeForm.title || 'Customize Home image'}
                                            className="h-40 w-full rounded object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRemoveCustomizeHomeImage}
                                            className="text-rose-600"
                                        >
                                            <Trash2 className="size-4" />
                                            Remove image
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        </>
                    )}
                </div>
                <SaveFooterButton label="Save Customize Home" isSaving={isSaving} disabled={isLoadingCustomizeHome} />
            </form>
        );
    }

    const editorRenderers = {
        hero: renderHeroEditor,
        features: renderFeaturesEditor,
        'shop-by-event': renderShopByIndustryEditor,
        'how-we-help': renderHowWeHelpEditor,
        'shop-by-product': renderShopByProductEditor,
        customizer: renderCustomizeHomeEditor,
    };

    return (
        <>
            <section className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    Live preview of the full frontend home page used by your page builder.
                </p>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
                    <aside className="rounded-xl border border-border bg-card p-4 shadow-sm">
                        <h2 className="mb-3 text-sm font-semibold text-foreground">Home Page </h2>
                        <div className="space-y-2">
                            {homePageSections.map((section, index) => (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => handleSectionClick(section.id)}
                                    className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left transition hover:border-zinc-300"
                                >
                                    <span className="inline-flex items-center gap-2 text-sm text-foreground">
                                        <GripVertical className="size-4 text-muted-foreground" />
                                        <span className="font-medium">
                                            {index + 1}. {section.name}
                                        </span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                        <CheckCircle2 className="size-3.5" />
                                        Active
                                    </span>
                                </button>
                            ))}
                        </div>
                    </aside>

                    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                            <iframe
                                ref={previewFrameRef}
                                key={previewKey}
                                title="Home page live preview"
                                src="/"
                                onLoad={() => {
                                    if (pendingScrollSection) {
                                        scrollPreviewToSection(pendingScrollSection);
                                    }
                                }}
                                className="h-[72vh] min-h-[560px] w-full"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <Sheet
                open={isDrawerOpen}
                onOpenChange={(open) => {
                    setIsDrawerOpen(open);
                    if (!open) setActiveEditor(null);
                }}
            >
                <SheetContent side="right" className="w-full gap-0 border-l bg-background p-0 sm:max-w-[430px]">
                    <SheetHeader className="border-b pb-3">
                        <SheetTitle className="inline-flex items-center gap-2">
                            <WandSparkles className="size-4" />
                            {activeSection?.name || 'Section'} Component Editor
                        </SheetTitle>
                        <SheetDescription>
                            {sectionMeta[activeEditor]?.description || 'Update hero content and media repeater.'}
                        </SheetDescription>
                    </SheetHeader>

                    {(editorRenderers[activeEditor] || renderHeroEditor)()}
                </SheetContent>
            </Sheet>
        </>
    );
}
