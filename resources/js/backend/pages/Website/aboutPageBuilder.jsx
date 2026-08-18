import { CheckCircle2, GripVertical, LoaderCircle, Save, Trash2, WandSparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useAppContext } from '@/context/AppContext';

import {
    deleteAboutPageSection,
    deleteAboutPageSectionImage,
    fetchAboutPageSections,
    updateAboutPageSection,
} from './aboutPageApi.js';

const aboutSections = [
    { key: 'hero', name: 'About Hero', previewId: 'about-hero-section' },
    { key: 'timeless', name: 'About Timeless', previewId: 'about-timeless-section' },
    { key: 'story', name: 'Our Story', previewId: 'about-story-section' },
    { key: 'personalizer', name: 'Personalizer', previewId: 'about-personalizer-section' },
    { key: 'mission', name: 'Our Mission', previewId: 'about-mission-section' },
];

function imageUrl(section) {
    if (!section?.image_url) return null;
    return section.updated_at
        ? `${section.image_url}?v=${encodeURIComponent(section.updated_at)}`
        : section.image_url;
}

export default function AboutPageBuilder() {
    const { setPageTitle } = useAppContext();
    const previewFrameRef = useRef(null);
    const [sections, setSections] = useState([]);
    const [activeKey, setActiveKey] = useState(null);
    const [form, setForm] = useState({ title: '', description: '' });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);
    const [pendingScrollKey, setPendingScrollKey] = useState(null);

    const activeSection = useMemo(
        () => aboutSections.find((section) => section.key === activeKey),
        [activeKey]
    );

    useEffect(() => {
        setPageTitle('About Page Builder');
    }, [setPageTitle]);

    function scrollPreview(sectionKey) {
        const section = aboutSections.find((entry) => entry.key === sectionKey);
        const target = previewFrameRef.current?.contentWindow?.document?.getElementById(section?.previewId);

        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setPendingScrollKey(null);
        } else {
            setPendingScrollKey(sectionKey);
        }
    }

    async function loadSections(sectionKey) {
        setIsLoading(true);
        try {
            const payload = await fetchAboutPageSections();
            const records = Array.isArray(payload) ? payload : [];
            setSections(records);

            const record = records.find((item) => item.section_key === sectionKey);
            setForm({ title: record?.title || '', description: record?.description || '' });
            setImageFile(null);
            setImagePreview(imageUrl(record));
        } catch (error) {
            toast.error(error.message || 'Failed to load About page section.');
        } finally {
            setIsLoading(false);
        }
    }

    async function openEditor(sectionKey) {
        scrollPreview(sectionKey);
        setActiveKey(sectionKey);
        setIsDrawerOpen(true);
        await loadSections(sectionKey);
    }

    function handleImageChange(file) {
        if (!file) return;
        if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    }

    async function handleRemoveImage() {
        if (imageFile) {
            if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
            setImageFile(null);
            setImagePreview(null);
            return;
        }

        try {
            const saved = await deleteAboutPageSectionImage(activeKey);
            setImagePreview(imageUrl(saved));
            setSections((previous) =>
                previous.map((item) => (item.section_key === activeKey ? saved : item))
            );
            setPreviewKey((previous) => previous + 1);
            toast.success('Section image removed.');
        } catch (error) {
            toast.error(error.message || 'Failed to remove section image.');
        }
    }

    async function handleSave(event) {
        event.preventDefault();
        setIsSaving(true);

        try {
            const saved = await updateAboutPageSection(activeKey, {
                ...form,
                image: imageFile,
            });
            if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
            setImageFile(null);
            setImagePreview(imageUrl(saved));
            setSections((previous) =>
                previous.map((item) => (item.section_key === activeKey ? saved : item))
            );
            setPreviewKey((previous) => previous + 1);
            setPendingScrollKey(activeKey);
            toast.success(`${activeSection?.name || 'About section'} updated successfully.`);
        } catch (error) {
            toast.error(error.message || 'Failed to save About page section.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteSection() {
        setIsSaving(true);
        try {
            await deleteAboutPageSection(activeKey);
            setForm({ title: '', description: '' });
            setImageFile(null);
            setImagePreview(null);
            setPreviewKey((previous) => previous + 1);
            setPendingScrollKey(activeKey);
            toast.success(`${activeSection?.name || 'Section'} content deleted.`);
        } catch (error) {
            toast.error(error.message || 'Failed to delete section content.');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <>
            <section className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    Live preview of the About page. Select a section to edit its content and image.
                </p>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
                    <aside className="rounded-xl border border-border bg-card p-4 shadow-sm">
                        <h2 className="mb-3 text-sm font-semibold text-foreground">About Page</h2>
                        <div className="space-y-2">
                            {aboutSections.map((section, index) => (
                                <button
                                    key={section.key}
                                    type="button"
                                    onClick={() => openEditor(section.key)}
                                    className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left transition hover:border-zinc-300"
                                >
                                    <span className="inline-flex items-center gap-2 text-sm text-foreground">
                                        <GripVertical className="size-4 text-muted-foreground" />
                                        <span className="font-medium">{index + 1}. {section.name}</span>
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
                                title="About page live preview"
                                src="/about"
                                onLoad={() => pendingScrollKey && scrollPreview(pendingScrollKey)}
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
                    if (!open) setActiveKey(null);
                }}
            >
                <SheetContent side="right" className="w-full gap-0 border-l bg-background p-0 sm:max-w-[430px]">
                    <SheetHeader className="border-b pb-3">
                        <SheetTitle className="inline-flex items-center gap-2">
                            <WandSparkles className="size-4" />
                            {activeSection?.name || 'About Section'} Editor
                        </SheetTitle>
                        <SheetDescription>
                            {activeKey === 'hero'
                                ? 'Manage the About Hero title and details.'
                                : "Manage this section's title, rich description, and image."}
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
                            {isLoading ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <LoaderCircle className="size-4 animate-spin" />
                                    Loading section...
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="about-section-title">Title</Label>
                                        <Input
                                            id="about-section-title"
                                            value={form.title}
                                            onChange={(event) =>
                                                setForm((previous) => ({ ...previous, title: event.target.value }))
                                            }
                                            placeholder="Section title"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{activeKey === 'hero' ? 'Details' : 'Description'}</Label>
                                        <RichTextEditor
                                            value={form.description}
                                            onChange={(value) =>
                                                setForm((previous) => ({ ...previous, description: value }))
                                            }
                                            placeholder={activeKey === 'hero' ? 'About Hero details' : 'Section description'}
                                            className="relative"
                                        />
                                    </div>

                                    {activeKey !== 'hero' ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="about-section-image">Image</Label>
                                            <Input
                                                id="about-section-image"
                                                type="file"
                                                accept="image/jpeg,image/png,image/gif,image/webp"
                                                onChange={(event) => handleImageChange(event.target.files?.[0])}
                                            />
                                            {imagePreview ? (
                                                <div className="space-y-2">
                                                    <img
                                                        src={imagePreview}
                                                        alt={form.title || 'About section'}
                                                        className="h-40 w-full rounded object-cover"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleRemoveImage}
                                                        className="text-rose-600"
                                                    >
                                                        <Trash2 className="size-4" />
                                                        Remove image
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </div>

                        <SheetFooter className="border-t">
                            {['hero', 'timeless'].includes(activeKey) ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleDeleteSection}
                                    disabled={isLoading || isSaving}
                                    className="text-rose-600"
                                >
                                    <Trash2 className="size-4" />
                                    Delete Content
                                </Button>
                            ) : null}
                            <Button type="submit" disabled={isLoading || isSaving} className="w-full">
                                {isSaving ? (
                                    <><LoaderCircle className="size-4 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="size-4" /> Save Section</>
                                )}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </>
    );
}