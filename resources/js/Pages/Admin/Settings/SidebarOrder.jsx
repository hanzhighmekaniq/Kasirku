import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import Select from "@/Components/ui/Select";
import Button from "@/Components/ui/Button";
import { Head } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { buildNavGroups } from "@/Config/navConfig";
import { useStoreModules } from "@/Hooks/useStoreModules";
import { useSidebarOrder, applyCustomLayout } from "@/Hooks/useSidebarOrder";
import {
    ArrowDown,
    ArrowUp,
    Check,
    FolderInput,
    GripVertical,
    Lock,
    Pencil,
    RotateCcw,
    Undo2,
    X,
} from "lucide-react";
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
function DragHandle({ listeners, attributes, title }) {
    return (
        <button
            {...listeners}
            {...attributes}
            className="flex h-7 w-7 cursor-grab items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing transition-colors"
            title={title}
            tabIndex={-1}
        >
            <GripVertical className="h-4 w-4" strokeWidth={1.8} />
        </button>
    );
}

/* ─── Sortable Feature Row ───────────────────────────── */
function SortableFeatureRow({
    item,
    idx,
    totalUnlocked,
    groupOptions,
    onMoveUp,
    onMoveDown,
    onMoveToGroup,
    isDragOverlay,
}) {
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
            className={`group transition-colors ${isDragging ? "bg-primary/10" : "hover:bg-[rgb(var(--color-table-hover))]"
                } ${isDragOverlay ? "bg-card shadow-xl ring-1 ring-border rounded-lg" : ""}`}
        >
            <td className="px-4 py-3 w-10">
                <DragHandle
                    listeners={listeners}
                    attributes={attributes}
                    title="Drag untuk mengubah urutan"
                />
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
            <td className="px-4 py-3 hidden md:table-cell">
                <div className="flex items-center gap-1.5 max-w-[220px]">
                    <FolderInput className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                    <Select
                        options={groupOptions}
                        value={item.groupKey}
                        onChange={(v) => onMoveToGroup(v)}
                        className="text-xs"
                    />
                </div>
            </td>
            <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-0.5">
                    <button
                        onClick={onMoveUp}
                        disabled={idx === 0}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Naikkan"
                    >
                        <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={idx >= totalUnlocked - 1}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition"
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
        <tr className="bg-warning/10">
            <td className="px-4 py-3 w-10">
                <Lock className="h-3.5 w-3.5 text-muted-foreground mx-auto" strokeWidth={1.8} />
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <NavIcons name={item.icon} className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-medium text-muted-foreground">{item.name}</span>
                </div>
            </td>
            <td className="px-4 py-3 hidden sm:table-cell">
                <span className="inline-flex items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground w-6 h-6">—</span>
            </td>
            <td className="px-4 py-3 hidden md:table-cell" />
            <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning ring-1 ring-warning/20">
                    <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                    Terkunci
                </span>
            </td>
        </tr>
    );
}

/* ─── Nama grup yang bisa diedit — klik pensil untuk ganti nama, ─────
   kosongkan/klik reset untuk kembali ke nama bawaan sistem. ──────── */
function EditableGroupLabel({ group, onSaveLabel }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(group.label);
    const isCustom = group.label !== group.defaultLabel;

    const startEdit = () => {
        setValue(group.label);
        setEditing(true);
    };

    const commit = () => {
        onSaveLabel(value);
        setEditing(false);
    };

    const cancel = () => {
        setValue(group.label);
        setEditing(false);
    };

    const resetToDefault = () => {
        onSaveLabel("");
        setEditing(false);
    };

    if (editing) {
        return (
            <div className="flex items-center gap-1.5">
                <input
                    autoFocus
                    type="text"
                    value={value}
                    maxLength={50}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") commit();
                        if (e.key === "Escape") cancel();
                    }}
                    placeholder={group.defaultLabel}
                    className="h-7 w-40 rounded-lg border border-input bg-background px-2 text-sm text-foreground shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 sm:w-52"
                />
                <button
                    onClick={commit}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-success hover:bg-success/10"
                    title="Simpan nama"
                >
                    <Check className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                <button
                    onClick={cancel}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                    title="Batal"
                >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
            {isCustom && (
                <span
                    className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary"
                    title={`Nama bawaan: ${group.defaultLabel}`}
                >
                    Custom
                </span>
            )}
            <button
                onClick={startEdit}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Ganti nama grup"
            >
                <Pencil className="h-3 w-3" strokeWidth={1.8} />
            </button>
            {isCustom && (
                <button
                    onClick={resetToDefault}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    title={`Kembalikan ke nama bawaan: ${group.defaultLabel}`}
                >
                    <Undo2 className="h-3 w-3" strokeWidth={1.8} />
                </button>
            )}
        </div>
    );
}

/* ─── Group Card (isinya sortable item + dropdown pindah grup) ─── */
function FeatureGroup({
    group,
    allGroups,
    dragHandleListeners,
    dragHandleAttributes,
    isGroupDragging,
    saveGroupOrder,
    moveItemToGroup,
    saveGroupLabel,
}) {
    const unlockedItems = group.items.filter((i) => !i.locked);
    const lockedItems = group.items.filter((i) => i.locked);
    const [activeId, setActiveId] = useState(null);

    const groupOptions = useMemo(
        () => allGroups.map((g) => ({ value: g.key, label: g.label })),
        [allGroups],
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const handleDragStart = ({ active }) => setActiveId(active.id);

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

    if (group.items.length === 0) return null;

    return (
        <div
            className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow ${isGroupDragging ? "border-primary shadow-lg" : "border-border"
                }`}
        >
            {/* Group Header — drag handle grup ada di sini */}
            <div className="flex items-center gap-3 border-b border-border bg-muted px-3 py-3.5">
                <DragHandle
                    listeners={dragHandleListeners}
                    attributes={dragHandleAttributes}
                    title="Drag untuk mengubah urutan grup"
                />
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                    <GroupIcons name={group.icon} className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <EditableGroupLabel
                        group={group}
                        onSaveLabel={(label) => saveGroupLabel(group.key, label)}
                    />
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
                        <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                            <tr>
                                <th className="w-10 px-4 py-3"></th>
                                <th className="px-4 py-3 text-left font-semibold">Fitur</th>
                                <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Urutan</th>
                                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Grup</th>
                                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <SortableContext
                            items={unlockedItems.map((i) => i.itemKey)}
                            strategy={verticalListSortingStrategy}
                        >
                            <tbody className="divide-y divide-border bg-background ">
                                {unlockedItems.map((item, idx) => (
                                    <SortableFeatureRow
                                        key={item.itemKey}
                                        item={item}
                                        idx={idx}
                                        totalUnlocked={unlockedItems.length}
                                        groupOptions={groupOptions}
                                        onMoveUp={() => moveUp(item.itemKey)}
                                        onMoveDown={() => moveDown(item.itemKey)}
                                        onMoveToGroup={(targetGroupKey) =>
                                            moveItemToGroup(item.itemKey, targetGroupKey)
                                        }
                                    />
                                ))}

                                {lockedItems.length > 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-px flex-1 bg-border" />
                                                <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                                    <Lock className="h-3 w-3" strokeWidth={1.8} />
                                                    Fitur Terkunci (Upgrade Plan)
                                                </span>
                                                <div className="h-px flex-1 bg-border" />
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {lockedItems.map((item) => (
                                    <LockedFeatureRow key={item.itemKey} item={item} />
                                ))}
                            </tbody>
                        </SortableContext>
                    </table>
                </div>

                <DragOverlay>
                    {activeItem ? (
                        <table className="text-sm">
                            <tbody>
                                <SortableFeatureRow
                                    item={activeItem}
                                    idx={unlockedItems.findIndex((i) => i.itemKey === activeItem.itemKey)}
                                    totalUnlocked={unlockedItems.length}
                                    groupOptions={groupOptions}
                                    onMoveUp={() => { }}
                                    onMoveDown={() => { }}
                                    onMoveToGroup={() => { }}
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

/* ─── Sortable wrapper untuk grup di level teratas ───── */
function SortableGroupCard({ group, allGroups, saveGroupOrder, moveItemToGroup, saveGroupLabel }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: group.key });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <FeatureGroup
                group={group}
                allGroups={allGroups}
                dragHandleListeners={listeners}
                dragHandleAttributes={attributes}
                isGroupDragging={isDragging}
                saveGroupOrder={saveGroupOrder}
                moveItemToGroup={moveItemToGroup}
                saveGroupLabel={saveGroupLabel}
            />
        </div>
    );
}

/* ─── Page ─────────────────────────────────────────────── */
export default function Index() {
    const modules = useStoreModules();
    const defaultGroups = buildNavGroups(modules);
    const {
        prefs,
        saveStatus,
        saveGroupOrder,
        saveGroupsOrder,
        moveItemToGroup,
        saveGroupLabel,
        resetAll,
    } = useSidebarOrder();
    const [activeGroupId, setActiveGroupId] = useState(null);

    // Grup yang sudah tersusun sesuai preferensi user: urutan grup, urutan
    // item dalam grup, dan item yang sudah dipindah ke grup lain.
    // Grup pinned (Pengaturan) dikeluarkan — tidak bisa diatur oleh user.
    const orderedGroups = useMemo(
        () => applyCustomLayout(defaultGroups, prefs).filter((g) => !g.pinned),
        [defaultGroups, prefs],
    );

    // groupKey tiap item ditandai di sini supaya dropdown "Grup" di baris
    // tabel tahu nilai yang sedang aktif.
    const groupedItems = useMemo(() => {
        const result = {};
        orderedGroups.forEach((group) => {
            result[group.key] = group.items.map((item) => ({
                ...item,
                groupKey: group.key,
                itemKey: item.key,
            }));
        });
        return result;
    }, [orderedGroups]);

    const groupSensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const handleGroupDragStart = ({ active }) => setActiveGroupId(active.id);

    const handleGroupDragEnd = ({ active, over }) => {
        setActiveGroupId(null);
        if (!over || active.id === over.id) return;

        const oldIdx = orderedGroups.findIndex((g) => g.key === active.id);
        const newIdx = orderedGroups.findIndex((g) => g.key === over.id);
        const newOrder = arrayMove(
            orderedGroups.map((g) => g.key),
            oldIdx,
            newIdx,
        );
        saveGroupsOrder(newOrder);
    };

    const activeGroup = activeGroupId
        ? orderedGroups.find((g) => g.key === activeGroupId)
        : null;

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Urutan  Sidebar
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Atur urutan tampilan menu di sidebar
                    </div>
                </div>
            }
        >
            <Head title="Urutan Fitur" />

            <PageHeader
                title="Urutan Sidebar"
                breadcrumbs={["Admin", "Sistem", "Urutan Sidebar"]}
                heading={
                    <>
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Urutan Sidebar
                        </span>
                    </>
                }
                description="Atur urutan grup, urutan fitur di dalam grup, atau pindahkan fitur ke grup lain."
                action={
                    <div className="flex items-center gap-2">
                        {saveStatus === "saving" && (
                            <span className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                Menyimpan...
                            </span>
                        )}
                        {saveStatus === "saved" && (
                            <span className="flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-2 text-xs font-medium text-success">
                                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                Tersimpan
                            </span>
                        )}
                        {saveStatus === "error" && (
                            <span className="flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                                Gagal disimpan ke server
                            </span>
                        )}
                        <Button variant="outline" icon={RotateCcw} onClick={resetAll}>
                            Reset ke Default
                        </Button>
                    </div>
                }
            />

            <div className="space-y-5">
                {/* Info */}
                <div className="rounded-xl border border-border bg-muted px-6 py-3 text-sm text-muted-foreground">
                    Drag & drop <strong>header kartu</strong> untuk mengurutkan grup. Drag & drop
                    <strong> baris fitur</strong> untuk mengurutkan di dalam grup, atau gunakan
                    dropdown &quot;Grup&quot; untuk memindahkan fitur ke grup lain.
                </div>

                {/* Groups — sortable di level teratas */}
                <DndContext
                    sensors={groupSensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleGroupDragStart}
                    onDragEnd={handleGroupDragEnd}
                >
                    <SortableContext
                        items={orderedGroups.map((g) => g.key)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-5">
                            {orderedGroups.map((group) => (
                                <SortableGroupCard
                                    key={group.key}
                                    group={{ ...group, items: groupedItems[group.key] || [] }}
                                    allGroups={orderedGroups}
                                    saveGroupOrder={saveGroupOrder}
                                    moveItemToGroup={moveItemToGroup}
                                    saveGroupLabel={saveGroupLabel}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    <DragOverlay>
                        {activeGroup ? (
                            <div className="rounded-2xl border border-primary bg-card shadow-xl">
                                <div className="flex items-center gap-3 px-3 py-3.5">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                                    <GroupIcons name={activeGroup.icon} className="h-4 w-4" />
                                    <h3 className="text-sm font-semibold text-foreground">
                                        {activeGroup.label}
                                    </h3>
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </AuthenticatedLayout>
    );
}
