import { Head, useForm } from "@inertiajs/react";
import StoreForm from "./StoreForm";

export default function Create({
    availableOwners = [],
    storeTypes,
    plans = [],
}) {
    const { data, setData, post, processing, errors } = useForm({
        code: "",
        name: "",
        store_type: "retail",
        phone: "",
        email: "",
        address: "",
        is_active: true,
        branches: [{ code: "", name: "", phone: "", address: "" }],
        owner_ids: [],
        new_owner: { name: "", email: "", password: "" },
        plan: "free",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("developer.stores.store"));
    };

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
                availableOwners={availableOwners}
                onAddBranch={addBranch}
                onRemoveBranch={removeBranch}
                onUpdateBranch={updateBranch}
                onToggleOwner={toggleOwner}
                onUpdateNewOwner={updateNewOwner}
                plans={plans}
            />
        </>
    );
}
