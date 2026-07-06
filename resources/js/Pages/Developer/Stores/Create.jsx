import { Head, useForm } from "@inertiajs/react";
import StoreForm from "./StoreForm";

export default function Create({
    availableOwners = [],
    storeTypes,
    plans = [],
}) {
    const { data, setData, post, processing, errors } = useForm({
        // ── Informasi Toko ──────────────────────
        code: "",
        name: "",
        phone: "",
        email: "",
        address: "",
        is_active: true,
        // ── Tipe & Plan ─────────────────────────
        store_type_id: null,
        plan_id: null,
        // ── Cabang (create only) ────────────────
        branches: [{ code: "", name: "", phone: "", address: "" }],
        // ── Owner (create only) ─────────────────
        owner_ids: [],
        new_owner: { name: "", email: "", password: "" },
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("developer.stores.store"));
    };

    // ── Branch handlers ──────────────────────
    const addBranch = () =>
        setData("branches", [
            ...data.branches,
            { code: "", name: "", phone: "", address: "" },
        ]);
    const removeBranch = (i) =>
        setData(
            "branches",
            data.branches.filter((_, idx) => idx !== i),
        );
    const updateBranch = (i, field, val) => {
        const branches = [...data.branches];
        branches[i] = { ...branches[i], [field]: val };
        setData("branches", branches);
    };

    // ── Owner handlers ───────────────────────
    const toggleOwner = (id) => {
        const ids = data.owner_ids.includes(id)
            ? data.owner_ids.filter((x) => x !== id)
            : [...data.owner_ids, id];
        setData("owner_ids", ids);
    };
    const updateNewOwner = (field, val) =>
        setData("new_owner", { ...data.new_owner, [field]: val });

    return (
        <>
            <Head title="Buat Toko Baru" />
            <StoreForm
                title="Buat Toko Baru"
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={submit}
                cancelHref={route("developer.stores.index")}
                plans={plans}
                storeTypes={storeTypes}
                availableOwners={availableOwners}
                onAddBranch={addBranch}
                onRemoveBranch={removeBranch}
                onUpdateBranch={updateBranch}
                onToggleOwner={toggleOwner}
                onUpdateNewOwner={updateNewOwner}
            />
        </>
    );
}
