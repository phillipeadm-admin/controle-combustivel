"use client";

import { useEffect, useState, useTransition } from "react";
import { Navigation } from "@/components/Navigation";
import { PlusCircle, Trash2, Users, Wrench, Loader2, Settings, Edit, Save, X } from "lucide-react";
import {
    addPessoa, getPessoas, deletePessoa,
    addEquipamento, getEquipamentos, deleteEquipamento,
    getAbastecimentos, deleteAbastecimento, updateAbastecimento,
    verifyAdminPassword, changeAdminPassword, verifyPinAndResetPassword
} from "@/app/actions";

type Pessoa = { id: number, nome: string, equipe: string };
type Equipamento = { id: number, nome: string };
type Abastecimento = {
    id: number, data: Date, quantidade: number, observacoes: string,
    pessoa: Pessoa, equipamento: Equipamento, imagemUrl?: string | null
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
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Estado da Senha
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [authError, setAuthError] = useState("");
    const [isCheckingAuth, setIsCheckingAuth] = useState(false);

    // Estados de Recuperação
    const [showRecovery, setShowRecovery] = useState(false);
    const [recoveryPin, setRecoveryPin] = useState("");
    const [recoveryNewPass, setRecoveryNewPass] = useState("");
    const [recoveryStatus, setRecoveryStatus] = useState({ error: "", success: "" });

    // Estados de Alteração de Senha (dentro do painel)
    const [changePassStatus, setChangePassStatus] = useState({ error: "", success: "" });
    const [passForm, setPassForm] = useState({ atual: "", nova: "", pin: "" });

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
        setIsCheckingAuth(true);
        startTransition(async () => {
            const valid = await verifyAdminPassword(passwordInput);
            if (valid) {
                setIsAuthenticated(true);
                setAuthError("");
            } else {
                setAuthError("Senha incorreta. Tente novamente.");
                setPasswordInput("");
            }
            setIsCheckingAuth(false);
        });
    };

    const handleRecovery = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await verifyPinAndResetPassword(recoveryPin, recoveryNewPass);
            if (res.error) {
                setRecoveryStatus({ error: res.error, success: "" });
            } else {
                setRecoveryStatus({ error: "", success: "Senha redefinida com sucesso! Faça o login." });
                setTimeout(() => { setShowRecovery(false); setRecoveryStatus({ error: "", success: "" }); }, 2000);
            }
        });
    };

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await changeAdminPassword(passForm.atual, passForm.nova, passForm.pin);
            if (res.error) {
                setChangePassStatus({ error: res.error, success: "" });
            } else {
                setChangePassStatus({ error: "", success: "Configurações atualizadas com sucesso!" });
                setPassForm({ atual: "", nova: "", pin: "" });
                setTimeout(() => setChangePassStatus({ error: "", success: "" }), 3000);
            }
        });
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

                        {showRecovery ? (
                            <form onSubmit={handleRecovery} className="space-y-4">
                                <div>
                                    <input type="text" value={recoveryPin} onChange={(e) => setRecoveryPin(e.target.value)} placeholder="PIN de Recuperação (ex: 0000)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006fb3]/50 text-center tracking-widest mb-3" />
                                    <input type="password" value={recoveryNewPass} onChange={(e) => setRecoveryNewPass(e.target.value)} placeholder="Criar Nova Senha" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006fb3]/50 text-center tracking-widest" />
                                </div>
                                {recoveryStatus.error && <p className="text-red-400 text-sm">{recoveryStatus.error}</p>}
                                {recoveryStatus.success && <p className="text-emerald-500 text-sm font-bold">{recoveryStatus.success}</p>}
                                <button disabled={isPending} className="w-full bg-[#006fb3] hover:bg-[#005a96] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#006fb3]/30">
                                    {isPending ? "Processando..." : "Redefinir Senha"}
                                </button>
                                <button type="button" onClick={() => setShowRecovery(false)} className="mx-auto block text-sm text-slate-500 hover:text-slate-700 mt-4 transition-colors">Voltar para o Login</button>
                            </form>
                        ) : (
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
                                <button disabled={isCheckingAuth} className="w-full bg-[#006fb3] hover:bg-[#005a96] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#006fb3]/30">
                                    {isCheckingAuth ? "Verificando..." : "Entrar"}
                                </button>
                                <button type="button" onClick={() => setShowRecovery(true)} className="mx-auto block text-sm text-slate-500 hover:text-slate-700 mt-4 transition-colors">Esqueci a Senha</button>
                            </form>
                        )}
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

            {/* Painel de Configurações de Segurança */}
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg relative mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                        <Settings className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Configurações de Segurança</h2>
                </div>

                <form onSubmit={handleChangePassword} className="grid md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Senha Atual</label>
                        <input type="password" value={passForm.atual} onChange={e => setPassForm({ ...passForm, atual: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                        <input type="password" value={passForm.nova} onChange={e => setPassForm({ ...passForm, nova: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Novo PIN (Recuperação)</label>
                        <input type="text" value={passForm.pin} onChange={e => setPassForm({ ...passForm, pin: e.target.value })} placeholder="Padrão: 0000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900" />
                    </div>
                    <button disabled={isPending} className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-5 py-2 rounded-xl font-medium transition-colors h-[42px]">
                        {isPending ? "Salvando..." : "Salvar Alterações"}
                    </button>
                    {changePassStatus.error && <p className="text-red-500 text-sm md:col-span-4">{changePassStatus.error}</p>}
                    {changePassStatus.success && <p className="text-emerald-500 text-sm md:col-span-4 font-bold">{changePassStatus.success}</p>}
                </form>
            </section>

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
                                <th className="pb-3 font-medium text-center">Comprovante</th>
                                <th className="pb-3 font-medium text-right pr-2">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {abastecimentos.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500">
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
                                            <td className="py-3 text-center text-slate-400 text-sm">-</td>
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
                                            <td className="py-4 text-center">
                                                {abs.imagemUrl ? (
                                                    <div className="relative group/img inline-block cursor-pointer">
                                                        <button
                                                            onClick={() => setSelectedImage(abs.imagemUrl!)}
                                                            className="text-[#006fb3] hover:text-[#faa954] hover:underline transition-colors text-sm font-medium flex items-center gap-1 justify-center"
                                                        >
                                                            Ver Foto
                                                        </button>
                                                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover/img:block z-[60] pointer-events-none">
                                                            <div className="bg-white p-2 rounded-xl shadow-2xl border border-slate-200">
                                                                <img src={abs.imagemUrl} alt="Comprovante" className="max-w-[250px] max-h-[250px] object-cover rounded-lg" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 text-sm">-</span>
                                                )}
                                            </td>
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

            {/* Modal de Imagem Ampliada */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute -top-12 right-0 bg-white/10 hover:bg-white/30 text-white rounded-full p-2 backdrop-blur-md transition-colors"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Comprovante Ampliado"
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
