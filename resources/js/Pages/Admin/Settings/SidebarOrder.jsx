import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useState } from "react";
import { buildNavGroups } from "@/Config/navConfig";
import { useStoreModules } from "@/Hooks/useStoreModules";
import { useSidebarOrder, applyCustomOrderToItems } from "@/Hooks/useSidebarOrder";
import { ArrowDown, ArrowUp, Check, GripVertical, LayoutList, Lock } from "lucide-react";
import { NavIcons, GroupIcons } from "@/Components/NavIcons";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ─── Drag Handle ────────────────────────────────────── */
function DragHandle({ listeners, attributes }) {
    return (
        <button
            {...listeners}
            {...attributes}
            className="flex h-7 w-7 cursor-grab items-center justify-center rounded-lg text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground active:cursor-grabbing transition-colors"
            title="Drag untuk mengubah urutan"
            tabIndex={-1}
        >
            <GripVertical className="h-4 w-4" strokeWidth={1.8} />
        </button>
    );
}

/* ─── Sortable Row ───────────────────────────────────── */
function SortableFeatureRow({ item, idx, totalUnlocked, onMoveUp, onMoveDown, isDragOverlay }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.itemKey });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <tr
            ref={isDragOverlay ? undefined : setNodeRef}
            style={isDragOverlay ? undefined : style}
            className={`group transition-colors ${
                isDragging ? "bg-primary-50/30" : "hover:bg-muted/50"
            } ${isDragOverlay ? "bg-card shadow-xl ring-1 ring-black/10 rounded-lg" : ""}`}
        >
            <td className="px-4 py-3 w-10">
                <DragHandle listeners={listeners} attributes={attributes} />
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <NavIcons name={item.icon} className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-medium text-foreground">{item.name}</span>
                </div>
            </td>
            <td className="px-4 py-3 hidden sm:table-cell">
                <span className="inline-flex items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground w-6 h-6">
                    {idx + 1}
                </span>
            </td>
            <td className="px-4 py-3 hidden sm:table-cell">
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 ring-1 ring-emerald-200">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    Aktif
                </span>
            </td>
            <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-0.5">
                    <button
                        onClick={onMoveUp}
                        disabled={idx === 0}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Naikkan"
                    >
                        <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={idx >= totalUnlocked - 1}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Turunkan"
                    >
                        <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

/* ─── Locked Row (non-sortable) ──────────────────────── */
function LockedFeatureRow({ item }) {
    return (
        <tr className="bg-muted/30 opacity-50">
            <td className="px-4 py-3 w-10">
                <Lock className="h-3.5 w-3.5 text-muted-foreground/50 mx-auto" strokeWidth={1.8} />
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-200 text-muted-foreground">
                        <NavIcons name={item.icon} className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-medium text-muted-foreground line-through">{item.name}</span>
                </div>
            </td>
            <td className="px-4 py-3 hidden sm:table-cell">
                <span className="inline-flex items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground w-6 h-6">—</span>
            </td>
            <td className="px-4 py-3 hidden sm:table-cell">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600 ring-1 ring-amber-200">
                    <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                    Terkunci
                </span>
            </td>
            <td className="px-4 py-3"></td>
        </tr>
    );
}

/* ─── Group Section ──────────────────────────────────── */
function FeatureGroup({ group, items, customOrder, saveGroupOrder }) {
    const unlockedItems = items.filter((i) => !i.locked);
    const lockedItems = items.filter((i) => i.locked);
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const handleDragStart = ({ active }) => {
        setActiveId(active.id);
    };

    const handleDragEnd = ({ active, over }) => {
        setActiveId(null);
        if (!over || active.id === over.id) return;

        const oldIdx = unlockedItems.findIndex((i) => i.itemKey === active.id);
        const newIdx = unlockedItems.findIndex((i) => i.itemKey === over.id);

        const newOrder = arrayMove(
            unlockedItems.map((i) => i.itemKey),
            oldIdx,
            newIdx,
        );
        saveGroupOrder(group.key, newOrder);
    };

    const moveUp = (itemKey) => {
        const idx = unlockedItems.findIndex((i) => i.itemKey === itemKey);
        if (idx <= 0) return;
        const newOrder = arrayMove(unlockedItems.map((i) => i.itemKey), idx, idx - 1);
        saveGroupOrder(group.key, newOrder);
    };

    const moveDown = (itemKey) => {
        const idx = unlockedItems.findIndex((i) => i.itemKey === itemKey);
        if (idx >= unlockedItems.length - 1) return;
        const newOrder = arrayMove(unlockedItems.map((i) => i.itemKey), idx, idx + 1);
        saveGroupOrder(group.key, newOrder);
    };

    const activeItem = activeId ? unlockedItems.find((i) => i.itemKey === activeId) : null;

    if (items.length === 0) return null;

    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {/* Group Header */}
            <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-slate-50/80 to-white px-5 py-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <GroupIcons name={group.icon} className="h-4 w-4" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
                    <p className="text-xs text-muted-foreground">
                        {unlockedItems.length} fitur
                        {lockedItems.length > 0 ? ` • ${lockedItems.length} terkunci` : ""}
                    </p>
                </div>
            </div>

            {/* Table */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <th className="w-10 px-4 py-3"></th>
                                <th className="px-4 py-3">Fitur</th>
                                <th className="px-4 py-3 hidden sm:table-cell">Urutan</th>
                                <th className="px-4 py-3 hidden sm:table-cell">Status</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <SortableContext
                            items={unlockedItems.map((i) => i.itemKey)}
                            strategy={verticalListSortingStrategy}
                        >
                            <tbody className="divide-y divide-border">
                                {unlockedItems.map((item, idx) => (
                                    <SortableFeatureRow
                                        key={item.itemKey}
                                        item={item}
                                        idx={idx}
                                        totalUnlocked={unlockedItems.length}
                                        onMoveUp={() => moveUp(item.itemKey)}
                                        onMoveDown={() => moveDown(item.itemKey)}
                                    />
                                ))}

                                {/* Locked divider */}
                                {lockedItems.length > 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-px flex-1 bg-slate-200" />
                                                <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                                    <Lock className="h-3 w-3" strokeWidth={1.8} />
                                                    Fitur Terkunci (Upgrade Plan)
                                                </span>
                                                <div className="h-px flex-1 bg-slate-200" />
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* Locked items */}
                                {lockedItems.map((item) => (
                                    <LockedFeatureRow key={item.itemKey} item={item} />
                                ))}
                            </tbody>
                        </SortableContext>
                    </table>
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeItem ? (
                        <table className="text-sm">
                            <tbody>
                                <SortableFeatureRow
                                    item={activeItem}
                                    idx={unlockedItems.findIndex((i) => i.itemKey === activeItem.itemKey)}
                                    totalUnlocked={unlockedItems.length}
                                    onMoveUp={() => {}}
                                    onMoveDown={() => {}}
                                    isDragOverlay
                                />
                            </tbody>
                        </table>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

/* ─── Page ─────────────────────────────────────────────── */
export default function Index() {
    const modules = useStoreModules();
    const groups = buildNavGroups(modules);
    const { customOrder, saveGroupOrder } = useSidebarOrder();

    // Build grouped items with custom order applied
    const groupedItems = {};
    groups.forEach((group) => {
        const ordered = applyCustomOrderToItems(
            group.items,
            customOrder[group.key] || [],
        );
        groupedItems[group.key] = ordered.map((item) => ({
            ...item,
            groupKey: group.key,
            itemKey: item.key,
        }));
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                            <LayoutList className="h-5 w-5" strokeWidth={1.8} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Urutan Fitur</h2>
                            <p className="text-xs text-muted-foreground">
                                Atur urutan tampilan menu di sidebar
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Urutan Fitur" />

            <div className="space-y-5">
                {/* Info */}
                <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
                    Drag & drop baris untuk mengatur urutan, atau gunakan tombol ↑ ↓. Urutan akan otomatis tersimpan dan diterapkan di sidebar.
                </div>

                {/* Groups */}
                {groups.map((group) => (
                    <FeatureGroup
                        key={group.key}
                        group={group}
                        items={groupedItems[group.key] || []}
                        customOrder={customOrder}
                        saveGroupOrder={saveGroupOrder}
                    />
                ))}
            </div>
        </AuthenticatedLayout>
    );
}
