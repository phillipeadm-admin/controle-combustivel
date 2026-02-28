"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fuel, LayoutDashboard, Settings, FileText } from "lucide-react";

export function Navigation() {
    const pathname = usePathname();

    const links = [
        { href: "/", label: "Lançamento", icon: Fuel },
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/relatorio", label: "Relatório", icon: FileText },
        { href: "/admin", label: "Admin", icon: Settings },
    ];

    return (
        <nav className="flex items-center justify-center gap-2 mb-8 bg-white/80 p-2 rounded-2xl backdrop-blur-md border border-slate-200 shadow-lg shadow-slate-200/50 max-w-fit mx-auto">
            {links.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${isActive
                            ? "bg-[#006fb3] text-white shadow-md shadow-[#006fb3]/30"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
