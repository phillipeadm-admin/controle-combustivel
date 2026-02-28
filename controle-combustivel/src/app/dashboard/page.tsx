"use client";

import { useEffect, useState, useTransition } from "react";
import { Navigation } from "@/components/Navigation";
import { AreaChart as AreaChartIcon, BarChart3, Droplet, Users, Loader2 } from "lucide-react";
import { getAbastecimentos, getDashboardMetrics, getChartData } from "@/app/actions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Abastecimento = {
    id: number;
    data: Date;
    quantidade: number;
    equipamento: { nome: string };
    pessoa: { nome: string, equipe: string }
};

export default function DashboardPage() {
    const [data, setData] = useState<Abastecimento[]>([]);
    const [metrics, setMetrics] = useState({ totalLitros: 0, registrosMes: 0 });
    const [chartData, setChartData] = useState<{
        litrosPorEquipamento: { nome: string, litros: number }[]
    }>({
        litrosPorEquipamento: []
    });

    const mesesStr = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const currentMonthIndex = new Date().getMonth();
    const currentYearStr = new Date().getFullYear().toString();

    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        startTransition(async () => {
            const abs = await getAbastecimentos();
            const st = await getDashboardMetrics();
            const charts = await getChartData();
            setData(abs as any);
            setMetrics(st);
            setChartData(charts);
        });
    }, []);

    const filteredTableData = data.filter(row => {
        const rowDate = new Date(row.data);
        return rowDate.getFullYear().toString() === currentYearStr && rowDate.getMonth() === currentMonthIndex;
    });

    const anosDisponiveisGlobal = Array.from(new Set(data.map(d => new Date(d.data).getFullYear()))).sort((a, b) => b - a);
    if (anosDisponiveisGlobal.length === 0) anosDisponiveisGlobal.push(new Date().getFullYear());

    return (
        <div className="space-y-6 relative">
            <Navigation />

            <header className="mb-8 pt-4 text-center md:text-left">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#006fb3] to-[#faa954]">
                    Visão Geral do Mês
                </h1>
            </header>

            {isPending && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
                    <Loader2 className="w-10 h-10 text-[#006fb3] animate-spin" />
                </div>
            )}

            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#006fb3]/5 rounded-full blur-xl group-hover:bg-[#006fb3]/10 transition-all"></div>
                    <div className="flex items-center justify-between relative">
                        <div>
                            <p className="text-slate-500 font-medium mb-1">Total Abastecido</p>
                            <h3 className="text-3xl font-bold text-slate-900">
                                {metrics.totalLitros.toFixed(1)} <span className="text-lg text-slate-500 font-normal">L</span>
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl text-[#006fb3]">
                            <Droplet className="w-8 h-8" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#faa954]/5 rounded-full blur-xl group-hover:bg-[#faa954]/10 transition-all"></div>
                    <div className="flex items-center justify-between relative">
                        <div>
                            <p className="text-slate-500 font-medium mb-1">Total de Registros</p>
                            <h3 className="text-3xl font-bold text-slate-900">
                                {metrics.registrosMes}
                            </h3>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-xl text-[#faa954]">
                            <AreaChartIcon className="w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficos Recharts */}
            <div className="grid grid-cols-1 mt-6">
                {/* Gráfico: Consumo por Equipamento no Mês */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold text-slate-900">Consumo por Equipamento</h2>
                    </div>
                    <div className="h-80 w-full mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.litrosPorEquipamento || []} margin={{ top: 10, right: 10, left: -20, bottom: 80 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis
                                    dataKey="nome"
                                    stroke="#64748b"
                                    tick={{ fill: '#64748b', fontSize: 12, dy: 30, dx: -20 }}
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                    tickMargin={10}
                                />
                                <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                                    itemStyle={{ color: '#faa954', fontWeight: 'bold' }}
                                    cursor={{ fill: '#f1f5f9', opacity: 0.8 }}
                                />
                                <Bar dataKey="litros" name="Total (L)" fill="#faa954" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Histórico Recente */}
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-50 rounded-lg text-[#faa954]">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Lançamentos</h2>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                                <th className="pb-3 pl-2 font-medium">Data</th>
                                <th className="pb-3 font-medium">Equipamento</th>
                                <th className="pb-3 font-medium">Responsável</th>
                                <th className="pb-3 font-medium text-right pr-2">Volume</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTableData.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-slate-500">
                                        Nenhum abastecimento registrado neste período.
                                    </td>
                                </tr>
                            )}
                            {filteredTableData.map((row) => (
                                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-4 pl-2 text-slate-600">
                                        {new Date(row.data).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="py-4 text-slate-900 font-medium">{row.equipamento?.nome}</td>
                                    <td className="py-4 text-slate-500">
                                        {row.pessoa?.nome} <span className="text-xs ml-1 opacity-70">({row.pessoa?.equipe})</span>
                                    </td>
                                    <td className="py-4 text-right pr-2">
                                        <span className="bg-blue-50 text-[#006fb3] font-bold px-3 py-1 rounded-full border border-[#006fb3]/10">
                                            {row.quantidade.toFixed(2)} L
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
