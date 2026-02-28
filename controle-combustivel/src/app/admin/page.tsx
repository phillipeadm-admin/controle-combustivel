"use client";

import { useEffect, useState, useTransition } from "react";
import { Navigation } from "@/components/Navigation";
import { PlusCircle, Trash2, Users, Wrench, Loader2, Settings, Edit, Save, X } from "lucide-react";
import {
    addPessoa, getPessoas, deletePessoa,
    addEquipamento, getEquipamentos, deleteEquipamento,
    getAbastecimentos, deleteAbastecimento, updateAbastecimento
} from "@/app/actions";

type Pessoa = { id: number, nome: string, equipe: string };
type Equipamento = { id: number, nome: string };
type Abastecimento = {
    id: number, data: Date, quantidade: number, observacoes: string,
    pessoa: Pessoa, equipamento: Equipamento
};

export default function AdminPage() {
    const [equipes, setEquipes] = useState<Pessoa[]>([]);
    const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
    const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);

    const [nomePessoa, setNomePessoa] = useState("");
    const [equipeSelecionada, setEquipeSelecionada] = useState("ALFA");
    const [nomeEquipamento, setNomeEquipamento] = useState("");
    const [isPending, startTransition] = useTransition();

    // Estados para Edição de Abastecimento
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState("");
    const [editQuantidade, setEditQuantidade] = useState("");
    const [editObs, setEditObs] = useState("");

    // Estado da Senha
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [authError, setAuthError] = useState("");

    useEffect(() => {
        // Apenas carrega dados se estiver autenticado
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated]);

    const loadData = () => {
        startTransition(async () => {
            const p = await getPessoas();
            const e = await getEquipamentos();
            const a = await getAbastecimentos();
            setEquipes(p);
            setEquipamentos(e);
            setAbastecimentos(a as any);
        });
    };

    const handleAddPessoa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nomePessoa.trim()) return;

        startTransition(async () => {
            await addPessoa(nomePessoa, equipeSelecionada);
            setNomePessoa("");
            loadData();
        });
    };

    const handleAddEquipamento = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nomeEquipamento.trim()) return;

        startTransition(async () => {
            await addEquipamento(nomeEquipamento);
            setNomeEquipamento("");
            loadData();
        });
    };

    const handleEditClick = (abs: Abastecimento) => {
        setEditingId(abs.id);
        const originalDate = new Date(abs.data);
        const offset = originalDate.getTimezoneOffset();
        const localDate = new Date(originalDate.getTime() - offset * 60 * 1000);
        setEditData(localDate.toISOString().substring(0, 16));

        setEditQuantidade(abs.quantidade.toString());
        setEditObs(abs.observacoes || "");
    };

    const handleSaveEdit = (id: number) => {
        startTransition(async () => {
            await updateAbastecimento(id, editData, Number(editQuantidade), editObs);
            setEditingId(null);
            loadData();
        });
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Senha simples mockada para o protótipo
        if (passwordInput === "admin123") {
            setIsAuthenticated(true);
            setAuthError("");
        } else {
            setAuthError("Senha incorreta. Tente novamente.");
            setPasswordInput("");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="space-y-6">
                <Navigation />
                <div className="flex flex-col items-center justify-center mt-20">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Settings className="w-8 h-8 text-[#006fb3]" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Área Restrita</h2>
                        <p className="text-slate-600 text-sm mb-6">Digite a senha para acessar as configurações.</p>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <input
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="Senha de acesso"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006fb3]/50 text-center tracking-widest"
                                />
                            </div>
                            {authError && <p className="text-red-400 text-sm">{authError}</p>}
                            <button className="w-full bg-[#006fb3] hover:bg-[#005a96] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#006fb3]/30">
                                Entrar
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Navigation />

            <header className="mb-8 text-center pt-4">
                <h1 className="text-4xl font-extrabold text-[#006fb3]">
                    Administração do Sistema
                </h1>
                <p className="text-slate-600 mt-2">
                    Gerencie pessoas, equipes e equipamentos disponíveis
                </p>
            </header>

            <div className="grid md:grid-cols-2 gap-6 relative">
                {isPending && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                        <Loader2 className="w-10 h-10 text-[#006fb3] animate-spin" />
                    </div>
                )}

                {/* Painel de Equipes */}
                <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg relative">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-50 rounded-xl text-[#006fb3]">
                            <Users className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Equipes e Nomes</h2>
                    </div>

                    <form className="flex flex-col gap-3 mb-6" onSubmit={handleAddPessoa}>
                        <input
                            type="text"
                            value={nomePessoa}
                            onChange={(e) => setNomePessoa(e.target.value)}
                            placeholder="Nome da pessoa"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006fb3]/50"
                        />
                        <div className="flex gap-3">
                            <select
                                value={equipeSelecionada}
                                onChange={(e) => setEquipeSelecionada(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006fb3]/50 appearance-none">
                                <option value="ALFA">Equipe Alfa</option>
                                <option value="BRAVO">Equipe Bravo</option>
                            </select>
                            <button
                                disabled={isPending}
                                className="bg-[#006fb3] hover:bg-[#005a96] disabled:opacity-50 text-white px-5 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#006fb3]/25">
                                <PlusCircle className="w-5 h-5" /> Adicionar
                            </button>
                        </div>
                    </form>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {equipes.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Nenhum registro encontrado.</p>}
                        {equipes.map((p) => (
                            <div
                                key={p.id}
                                className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200"
                            >
                                <div>
                                    <p className="font-medium text-slate-900">{p.nome}</p>
                                    <p className="text-xs text-slate-500">Equipe {p.equipe}</p>
                                </div>
                                <button
                                    onClick={() => startTransition(() => { deletePessoa(p.id).then(loadData) })}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Painel de Equipamentos */}
                <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg relative">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-orange-50 rounded-xl text-[#faa954]">
                            <Wrench className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Equipamentos</h2>
                    </div>

                    <form className="flex gap-3 mb-6" onSubmit={handleAddEquipamento}>
                        <input
                            type="text"
                            value={nomeEquipamento}
                            onChange={(e) => setNomeEquipamento(e.target.value)}
                            placeholder="Nome do equipamento"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#faa954]/50"
                        />
                        <button
                            disabled={isPending}
                            className="bg-[#faa954] hover:bg-[#e69843] disabled:opacity-50 text-[#0a132d] px-5 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#faa954]/25">
                            <PlusCircle className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {equipamentos.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Nenhum equipamento cadastrado.</p>}
                        {equipamentos.map((eq) => (
                            <div
                                key={eq.id}
                                className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200"
                            >
                                <p className="font-medium text-slate-900">{eq.nome}</p>
                                <button
                                    onClick={() => startTransition(() => { deleteEquipamento(eq.id).then(loadData) })}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Painel Histórico de Abastecimentos */}
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg relative mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-red-50 rounded-xl text-red-500">
                        <Settings className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Gerenciar Abastecimentos Lançados</h2>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                                <th className="pb-3 pl-2 font-medium">Data</th>
                                <th className="pb-3 font-medium">Responsável</th>
                                <th className="pb-3 font-medium">Equipamento</th>
                                <th className="pb-3 font-medium">Litros</th>
                                <th className="pb-3 font-medium">Observações</th>
                                <th className="pb-3 font-medium text-right pr-2">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {abastecimentos.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500">
                                        Nenhum registro encontrado.
                                    </td>
                                </tr>
                            )}
                            {abastecimentos.map((abs) => (
                                <tr key={abs.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    {editingId === abs.id ? (
                                        <>
                                            <td className="py-3 pl-2">
                                                <input type="datetime-local" value={editData} onChange={e => setEditData(e.target.value)} className="bg-white text-sm text-slate-900 p-2 rounded-lg border border-slate-300" />
                                            </td>
                                            <td className="py-3 text-slate-600 text-sm">{abs.pessoa?.nome}</td>
                                            <td className="py-3 text-slate-600 text-sm">{abs.equipamento?.nome}</td>
                                            <td className="py-3">
                                                <input type="number" step="0.01" value={editQuantidade} onChange={e => setEditQuantidade(e.target.value)} className="bg-white text-sm text-slate-900 p-2 rounded-lg border border-slate-300 w-20" />
                                            </td>
                                            <td className="py-3">
                                                <input type="text" value={editObs} onChange={e => setEditObs(e.target.value)} className="bg-white text-sm text-slate-900 p-2 rounded-lg border border-slate-300 w-full" />
                                            </td>
                                            <td className="py-3 text-right pr-2 flex justify-end gap-2">
                                                <button onClick={() => setEditingId(null)} className="p-2 text-slate-600 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 rounded-lg">
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleSaveEdit(abs.id)} className="p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg">
                                                    <Save className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="py-4 pl-2 text-slate-600">{new Date(abs.data).toLocaleString('pt-BR')}</td>
                                            <td className="py-4 text-slate-900">{abs.pessoa?.nome}</td>
                                            <td className="py-4 text-slate-900">{abs.equipamento?.nome}</td>
                                            <td className="py-4 font-bold text-[#006fb3]">{abs.quantidade.toFixed(2)} L</td>
                                            <td className="py-4 text-slate-500 text-sm truncate max-w-xs">{abs.observacoes || "-"}</td>
                                            <td className="py-4 text-right pr-2">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditClick(abs)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-200 rounded-lg transition-colors">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => startTransition(() => { deleteAbastecimento(abs.id).then(loadData) })} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
