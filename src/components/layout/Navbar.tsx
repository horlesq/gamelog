"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Settings, Menu, X, LayoutDashboard } from "lucide-react";
import { useUpdate } from "@/contexts/UpdateContext";
import { logoutUser } from "@/lib/auth/client";

interface NavbarProps {
    onAddGame?: () => void;
}

export interface NavbarRef {
    openAddModal: () => void;
}

const Navbar = forwardRef<NavbarRef, NavbarProps>(({ onAddGame }, ref) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { showNavbarDot, dismissNavbarDot } = useUpdate();

    useImperativeHandle(ref, () => ({
        openAddModal: () => onAddGame?.(),
    }));

    const handleLogout = async () => {
        try {
            await logoutUser();
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleSettingsClick = () => {
        if (showNavbarDot) {
            dismissNavbarDot();
        }
        router.push("/dashboard/settings");
    };

    return (
        <header className="z-50 pt-4 sm:pt-6 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative rounded-xl bg-card shadow-sm backdrop-blur-md overflow-hidden border border-border/40">
                    <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                        <div
                            className="flex items-center space-x-2 cursor-pointer group"
                            onClick={() => router.push("/dashboard")}
                        >
                            <Image
                                src="/3d/next.png"
                                alt="GameLog"
                                width={40}
                                height={40}
                                priority
                                className="w-9 h-9 sm:w-10 sm:h-10 object-contain group-hover:rotate-4 group-hover:scale-110 transition-all duration-300"
                            />
                            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                                Game<span className="text-accent">Log</span>
                            </h1>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
                            {pathname === "/dashboard" ? (
                                <Button
                                    onClick={() => onAddGame?.()}
                                    variant="default"
                                    className="space-x-2"
                                    size="sm"
                                >
                                    <Plus className="size-4" />
                                    <span className="hidden md:inline">
                                        Add Game
                                    </span>
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => router.push("/dashboard")}
                                    variant="default"
                                    className="space-x-2"
                                    size="sm"
                                >
                                    <LayoutDashboard className="size-4" />
                                    <span className="hidden md:inline">
                                        Dashboard
                                    </span>
                                </Button>
                            )}

                            <div className="h-6 w-px bg-white/10 mx-1"></div>

                            <Button
                                variant="ghost"
                                onClick={handleSettingsClick}
                                className="space-x-2"
                                size="sm"
                            >
                                <Settings className="size-4" />
                                <span className="hidden md:inline">
                                    Settings
                                </span>
                                {showNavbarDot && (
                                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="space-x-2 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                                size="sm"
                            >
                                <LogOut className="size-4" />
                                <span className="hidden md:inline">Logout</span>
                            </Button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <Button
                                variant="ghost"
                                onClick={() =>
                                    setMobileMenuOpen(!mobileMenuOpen)
                                }
                                aria-label="Toggle mobile menu"
                                className="h-10 w-10 p-0 hover:bg-white/10"
                            >
                                {mobileMenuOpen ? (
                                    <X className="size-5" />
                                ) : (
                                    <Menu className="size-5" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Menu Dropdown */}
                    <div
                        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
                            mobileMenuOpen
                                ? "max-h-80 opacity-100 border-t border-white/10 bg-card/50 backdrop-blur-xl"
                                : "max-h-0 opacity-0"
                        }`}
                    >
                        <div className="px-4 py-4 space-y-2">
                            {pathname === "/dashboard" ? (
                                <Button
                                    onClick={() => {
                                        onAddGame?.();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center justify-start space-x-2 bg-secondary hover:bg-primary/80 text-white font-semibold"
                                >
                                    <Plus className="size-4" />
                                    <span>Add Game</span>
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => {
                                        router.push("/dashboard");
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center justify-start space-x-2 bg-secondary hover:bg-primary/80 text-white font-semibold"
                                >
                                    <LayoutDashboard className="size-4" />
                                    <span>Dashboard</span>
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                onClick={() => {
                                    handleSettingsClick();
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center justify-start space-x-2 relative border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                            >
                                <Settings className="size-4" />
                                <span>Settings</span>
                                {showNavbarDot && (
                                    <span className="absolute left-8 top-2 h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    handleLogout();
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center justify-start space-x-2 border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                            >
                                <LogOut className="size-4" />
                                <span>Logout</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
});

Navbar.displayName = "Navbar";

export default Navbar;
