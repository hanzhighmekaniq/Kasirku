import { Head, useForm } from '@inertiajs/react';
import UserForm from './UserForm';

export default function Create({ stores }) {
    const { data, setData, post, processing, errors } = useForm({
        name:                  '',
        email:                 '',
        password:              '',
        password_confirmation: '',
        is_developer:          false,
        store_roles:           [], // [{ store_id, role }]
    });

    const submit = (e) => { e.preventDefault(); post(route('developer.users.store')); };

    return (
        <>
            <Head title="Tambah User" />
            <UserForm
                title="Tambah User"
                data={data} setData={setData} errors={errors}
                processing={processing} onSubmit={submit}
                cancelHref={route('developer.users.index')}
                stores={stores}
            />
        </>
    );
}
