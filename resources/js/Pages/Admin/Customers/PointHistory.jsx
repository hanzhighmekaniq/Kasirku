import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link } from "@inertiajs/react";
import Button from "@/Components/ui/Button";
import { ArrowLeft } from "lucide-react";
import SectionCard from "@/Components/ui/SectionCard";

export default function PointHistory({ customer, pointLogs }) {
    return (
        <AuthenticatedLayout>
            <Head title={`Riwayat Poin - ${customer.name}`} />

            <PageHeader
                title="Riwayat Poin Pelanggan"
                breadcrumbs={[
                    { label: "Pelanggan", href: route("admin.customers.index") },
                    { label: customer.name, href: route("admin.customers.show", customer.id) },
                    { label: "Riwayat Poin" },
                ]}
                heading={`Riwayat Poin: ${customer.name}`}
                description="Laporan keluar masuk poin pelanggan."
                action={
                    <Button variant="outline" size="sm" asChild>
                        <Link href={route("admin.customers.show", customer.id)}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                        </Link>
                    </Button>
                }
            />

            <div className="mt-6">
                <SectionCard 
                    title="Daftar Riwayat" 
                    subtitle={`Saldo saat ini: ${customer.points} Poin`}
                >
                    <div className="overflow-x-auto pt-4">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Tanggal</th>
                                    <th className="px-4 py-3 font-medium">Tipe</th>
                                    <th className="px-4 py-3 font-medium text-right">Poin</th>
                                    <th className="px-4 py-3 font-medium text-right">Saldo Setelah</th>
                                    <th className="px-4 py-3 font-medium">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y border-border">
                                {pointLogs.data.length > 0 ? (
                                    pointLogs.data.map((log, i) => (
                                        <tr key={i} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                {new Date(log.created_at).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                                                    ${log.type === 'earn' ? 'bg-success/10 text-success' : 
                                                      log.type === 'redeem' ? 'bg-destructive/10 text-destructive' : 
                                                      'bg-warning/10 text-warning'}`}
                                                >
                                                    {log.type === 'earn' ? 'Dapat' : log.type === 'redeem' ? 'Pakai' : 'Penyesuaian'}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 text-right font-bold ${log.points > 0 ? 'text-success' : 'text-destructive'}`}>
                                                {log.points > 0 ? `+${log.points}` : log.points}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {log.balance_after}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                                                {log.notes || '-'}
                                                {log.sale && <span className="ml-1 text-xs opacity-70">({log.sale.sale_no})</span>}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            Belum ada riwayat poin.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}