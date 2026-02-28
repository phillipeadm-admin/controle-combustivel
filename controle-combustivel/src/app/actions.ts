"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// --- Pessoas ---
export async function addPessoa(nome: string, equipe: string) {
    if (!nome || !equipe) return { error: "Dados inválidos" };
    await prisma.pessoa.create({
        data: { nome, equipe },
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
}

export async function deletePessoa(id: number) {
    await prisma.pessoa.delete({ where: { id } });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
}

export async function getPessoas() {
    return await prisma.pessoa.findMany({ orderBy: { nome: "asc" } });
}

// --- Equipamentos ---
export async function addEquipamento(nome: string) {
    if (!nome) return { error: "O nome não pode ser vazio" };
    await prisma.equipamento.create({ data: { nome } });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
}

export async function deleteEquipamento(id: number) {
    await prisma.equipamento.delete({ where: { id } });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
}

export async function getEquipamentos() {
    return await prisma.equipamento.findMany({ orderBy: { nome: "asc" } });
}

// --- Abastecimentos ---
export async function addAbastecimento(formData: FormData) {
    const pessoaId = Number(formData.get("pessoaId"));
    const equipamentoId = Number(formData.get("equipamentoId"));
    const quantidade = Number(formData.get("quantidade"));
    const observacoes = formData.get("observacoes") as string | null;
    const file = formData.get("imagem") as File | null;
    const dataString = formData.get("data") as string;

    if (!pessoaId || !equipamentoId || quantidade <= 0 || !dataString) {
        return { error: "Campos obrigatórios estão faltando ou são inválidos" };
    }

    const customDate = new Date(dataString);

    let imagemUrl = null;

    if (file && file.size > 0) {
        const fs = await import('fs-extra');
        const path = await import('path');

        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.ensureDir(uploadDir);

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        const filePath = path.join(uploadDir, fileName);

        await fs.writeFile(filePath, buffer);
        imagemUrl = `/uploads/${fileName}`;
    }

    await prisma.abastecimento.create({
        data: {
            data: customDate,
            quantidade,
            observacoes,
            pessoaId,
            equipamentoId,
            imagemUrl: imagemUrl
        },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function getAbastecimentos() {
    return await prisma.abastecimento.findMany({
        include: {
            pessoa: true,
            equipamento: true,
        },
        orderBy: { data: "desc" },
    });
}

export async function deleteAbastecimento(id: number) {
    await prisma.abastecimento.delete({ where: { id } });
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
}

export async function updateAbastecimento(id: number, dataStr: string, quantidade: number, observacoes: string | null) {
    if (quantidade <= 0 || !dataStr) {
        return { error: "Dados inválidos." };
    }
    await prisma.abastecimento.update({
        where: { id },
        data: {
            data: new Date(dataStr),
            quantidade,
            observacoes
        }
    });
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
}

export async function getDashboardMetrics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    startOfMonth.setHours(0, 0, 0, 0);
    startOfNextMonth.setHours(0, 0, 0, 0);

    const totalAbastecidoMes = await prisma.abastecimento.aggregate({
        _sum: { quantidade: true },
        where: {
            data: {
                gte: startOfMonth,
                lt: startOfNextMonth,
            },
        },
    });

    const countMes = await prisma.abastecimento.count({
        where: {
            data: {
                gte: startOfMonth,
                lt: startOfNextMonth,
            },
        },
    });

    return {
        totalLitros: totalAbastecidoMes._sum.quantidade || 0,
        registrosMes: countMes,
    };
}

export async function getChartData() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    startOfMonth.setHours(0, 0, 0, 0);
    startOfNextMonth.setHours(0, 0, 0, 0);

    const allRecordsMes = await prisma.abastecimento.findMany({
        where: {
            data: {
                gte: startOfMonth,
                lt: startOfNextMonth,
            }
        },
        select: { quantidade: true, equipamento: { select: { nome: true } } }
    });

    const equipamentosMap: Record<string, number> = {};
    allRecordsMes.forEach(abs => {
        const eqName = abs.equipamento?.nome || "Desconhecido";
        equipamentosMap[eqName] = (equipamentosMap[eqName] || 0) + abs.quantidade;
    });

    const chartEquipamentos = Object.entries(equipamentosMap)
        .map(([nome, litros]) => ({ nome, litros }))
        .sort((a, b) => b.litros - a.litros); // Maior consumo primeiro

    return {
        litrosPorEquipamento: chartEquipamentos
    };
}

// --- Auth / Config ---
export async function verifyAdminPassword(senhaAberta: string) {
    let configSenha = await prisma.config.findUnique({ where: { chave: 'admin_pass' } });
    if (!configSenha) {
        // Inicializa se não existir com "admin123"
        configSenha = await prisma.config.create({ data: { chave: 'admin_pass', valor: 'admin123' } });
        await prisma.config.create({ data: { chave: 'admin_pin', valor: '0000' } }); // PIN de recuperação padrão
    }
    return configSenha.valor === senhaAberta;
}

export async function changeAdminPassword(senhaAtual: string, novaSenha: string, novoPin?: string) {
    if (!novaSenha || novaSenha.length < 4) return { error: "Nova senha muito curta." };

    const configSenha = await prisma.config.findUnique({ where: { chave: 'admin_pass' } });
    if (configSenha?.valor !== senhaAtual && configSenha?.valor !== undefined) {
        return { error: "Senha atual incorreta." };
    }

    await prisma.config.upsert({
        where: { chave: 'admin_pass' },
        update: { valor: novaSenha },
        create: { chave: 'admin_pass', valor: novaSenha }
    });

    if (novoPin && novoPin.length >= 4) {
        await prisma.config.upsert({
            where: { chave: 'admin_pin' },
            update: { valor: novoPin },
            create: { chave: 'admin_pin', valor: novoPin }
        });
    }

    return { success: true };
}

export async function verifyPinAndResetPassword(pin: string, novaSenha: string) {
    if (!novaSenha || novaSenha.length < 4) return { error: "Nova senha muito curta." };
    const configPin = await prisma.config.findUnique({ where: { chave: 'admin_pin' } });

    // Se não existir o pino, consideramos '0000'
    const currentPin = configPin ? configPin.valor : '0000';
    if (currentPin !== pin) {
        return { error: "PIN de recuperação incorreto." };
    }

    await prisma.config.upsert({
        where: { chave: 'admin_pass' },
        update: { valor: novaSenha },
        create: { chave: 'admin_pass', valor: novaSenha }
    });

    return { success: true };
}
