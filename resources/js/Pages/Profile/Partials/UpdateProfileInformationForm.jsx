import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';

function inputCls(hasError = false) {
    return `block w-full rounded-xl border text-sm shadow-sm transition focus:ring-2 ${
        hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-300 focus:border-primary-500 focus:ring-primary-200'
    }`;
}

export default function UpdateProfileInformation({ className = '' }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Nama Lengkap <span className="ml-1 text-red-500">*</span>
                    </label>
                    <input
                        id="name"
                        className={inputCls(errors.name)}
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />
                    <InputError className="mt-1.5" message={errors.name} />
                </div>

                <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Alamat Email <span className="ml-1 text-red-500">*</span>
                    </label>
                    <input
                        id="email"
                        type="email"
                        className={inputCls(errors.email)}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    <InputError className="mt-1.5" message={errors.email} />
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:from-primary-600 hover:to-primary-700 disabled:opacity-60"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
