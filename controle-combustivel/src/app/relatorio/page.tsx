"use client";

import { useEffect, useState, useTransition } from "react";
import { Navigation } from "@/components/Navigation";
import { BarChart3, Download, Loader2 } from "lucide-react";
import { getAbastecimentos } from "@/app/actions";

type Abastecimento = {
    id: number;
    data: Date;
    quantidade: number;
    observacoes: string | null;
    equipamento: { nome: string };
    pessoa: { nome: string, equipe: string }
};

export default function RelatorioPage() {
    const [data, setData] = useState<Abastecimento[]>([]);

    // Filtros de Relatório
    const [filterMes, setFilterMes] = useState("TODOS");
    const [filterAno, setFilterAno] = useState("TODOS");
    const [filterEquipamento, setFilterEquipamento] = useState("TODOS");
    const [filterResponsavel, setFilterResponsavel] = useState("TODOS");

    const mesesStr = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        startTransition(async () => {
            const abs = await getAbastecimentos();
            setData(abs as any);
        });
    }, []);

    const hasActiveFilters =
        filterAno !== "TODOS" ||
        filterMes !== "TODOS" ||
        filterEquipamento !== "TODOS" ||
        filterResponsavel !== "TODOS";

    const filteredData = hasActiveFilters ? data.filter(row => {
        const rowDate = new Date(row.data);

        let matchDate = true;
        if (filterAno !== "TODOS") {
            matchDate = matchDate && rowDate.getFullYear().toString() === filterAno;
        }
        if (filterMes !== "TODOS") {
            const mesIndex = mesesStr.indexOf(filterMes);
            matchDate = matchDate && rowDate.getMonth() === mesIndex;
        }

        const matchEq = filterEquipamento === "TODOS" || row.equipamento?.nome === filterEquipamento;
        const matchResp = filterResponsavel === "TODOS" || row.pessoa?.nome === filterResponsavel;

        return matchDate && matchEq && matchResp;
    }) : [];

    const anosDisponiveis = Array.from(new Set(data.map(d => new Date(d.data).getFullYear()))).sort((a, b) => b - a);

    const totalLitros = filteredData.reduce((acc, curr) => acc + curr.quantidade, 0);

    return (
        <div className="space-y-6 relative">
            <Navigation />

            <header className="mb-8 pt-4 text-center md:text-left">
                <h1 className="text-4xl font-extrabold text-[#006fb3]">
                    Relatório Avançado
                </h1>
                <p className="text-slate-400 mt-2">
                    Filtre e exporte todo o histórico de lançamentos.
                </p>
            </header>

            {isPending && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
                    <Loader2 className="w-10 h-10 text-[#006fb3] animate-spin" />
                </div>
            )}

            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg mt-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg text-[#faa954]">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Relatório de Lançamentos</h2>
                    </div>
                    <button
                        onClick={async () => {
                            const jsPDF = (await import("jspdf")).default;
                            const autoTable = (await import("jspdf-autotable")).default;

                            const doc = new jsPDF();
                            doc.text("Relatório de Abastecimentos - PMDF", 14, 15);
                            doc.setFontSize(9);
                            let subtitulo = `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`;
                            if (filterMes !== "TODOS") subtitulo += ` | Mês: ${filterMes}`;
                            if (filterAno !== "TODOS") subtitulo += ` | Ano: ${filterAno}`;
                            if (filterEquipamento !== "TODOS") subtitulo += ` | Equip: ${filterEquipamento}`;
                            if (filterResponsavel !== "TODOS") subtitulo += ` | Resp: ${filterResponsavel}`;
                            doc.text(subtitulo, 14, 22);

                            const colunas = ["Data", "Responsável", "Equipe", "Equipamento", "Litros", "Obs"];
                            const linhas = filteredData.map(d => [
                                new Date(d.data).toLocaleDateString('pt-BR'),
                                d.pessoa?.nome || "-",
                                d.pessoa?.equipe || "-",
                                d.equipamento?.nome || "-",
                                `${d.quantidade.toFixed(2)} L`,
                                d.observacoes || "-"
                            ]);

                            if (linhas.length > 0) {
                                linhas.push([
                                    "TOTAL",
                                    "",
                                    "",
                                    "",
                                    `${totalLitros.toFixed(2)} L`,
                                    ""
                                ]);
                            }

                            autoTable(doc, {
                                head: [colunas],
                                body: linhas,
                                startY: 26,
                                theme: 'striped',
                                headStyles: { fillColor: [0, 111, 179] }
                            });

                            doc.save("relatorio_abastecimentos.pdf");
                        }}
                        className="bg-[#006fb3] hover:bg-[#005a96] text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        Exportar PDF
                    </button>
                </div>

                {/* Filtros */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-600 font-medium">Ano</label>
                        <select
                            value={filterAno}
                            onChange={e => setFilterAno(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#006fb3]/50"
                        >
                            <option value="TODOS">Todos</option>
                            {anosDisponiveis.map(ano => (
                                <option key={ano} value={ano.toString()}>{ano}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-600 font-medium">Mês</label>
                        <select
                            value={filterMes}
                            onChange={e => setFilterMes(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#006fb3]/50"
                        >
                            <option value="TODOS">Todos</option>
                            {mesesStr.map(mes => (
                                <option key={mes} value={mes}>{mes}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-600 font-medium">Equipamento</label>
                        <select
                            value={filterEquipamento}
                            onChange={e => setFilterEquipamento(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#006fb3]/50"
                        >
                            <option value="TODOS">Todos</option>
                            {Array.from(new Set(data.map(d => d.equipamento?.nome).filter(Boolean))).map(eq => (
                                <option key={eq} value={eq}>{eq}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-600 font-medium">Responsável</label>
                        <select
                            value={filterResponsavel}
                            onChange={e => setFilterResponsavel(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#006fb3]/50"
                        >
                            <option value="TODOS">Todos</option>
                            {Array.from(new Set(data.map(d => d.pessoa?.nome).filter(Boolean))).map(resp => (
                                <option key={resp} value={resp}>{resp}</option>
                            ))}
                        </select>
                    </div>
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
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-slate-500">
                                        {!hasActiveFilters
                                            ? "Por favor, selecione pelo menos um filtro (Ano, Mês, Equipamento ou Responsável) para gerar o relatório."
                                            : "Nenhum abastecimento encontrado para os filtros atuais."}
                                    </td>
                                </tr>
                            )}
                            {filteredData.map((row) => (
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
                        {filteredData.length > 0 && (
                            <tfoot>
                                <tr className="border-t-2 border-slate-200 bg-slate-50">
                                    <td colSpan={3} className="py-4 pl-2 text-right font-bold text-slate-900">
                                        TOTAL:
                                    </td>
                                    <td className="py-4 text-right pr-2">
                                        <span className="bg-orange-50 text-orange-600 font-bold px-3 py-1 rounded-full border border-orange-200">
                                            {totalLitros.toFixed(2)} L
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </section>
        </div>
    );
}
