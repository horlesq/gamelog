"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { User as UserIcon, Shield, Plus, UserPlus, Trash2 } from "lucide-react";
import { User, UserWithGameLogCount, CreateUserData } from "@/types/user";
import { getUsers, createUser, deleteUser } from "@/lib/client/admin";

interface UserManagementProps {
    currentUser: User | null;
}

export default function UserManagement({ currentUser }: UserManagementProps) {
    const [users, setUsers] = useState<UserWithGameLogCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [createUserModalOpen, setCreateUserModalOpen] = useState(false);

    // Create user form state
    const [createUserData, setCreateUserData] = useState<CreateUserData>({
        email: "",
        password: "",
        name: "",
        isAdmin: false,
    });
    const [createUserLoading, setCreateUserLoading] = useState(false);
    const [createUserError, setCreateUserError] = useState("");

    // Delete user state
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
    const [deleteUserLoading, setDeleteUserLoading] = useState(false);
    const [deleteUserError, setDeleteUserError] = useState("");

    useEffect(() => {
        if (currentUser?.isAdmin) {
            fetchUsers();
        }
    }, [currentUser]);

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data.users);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateUserLoading(true);
        setCreateUserError("");

        try {
            await createUser(createUserData);

            // Reset form and close modal
            setCreateUserData({
                email: "",
                password: "",
                name: "",
                isAdmin: false,
            });
            setCreateUserModalOpen(false);

            // Refresh users list
            fetchUsers();
        } catch (err) {
            setCreateUserError(
                err instanceof Error ? err.message : "Failed to create user",
            );
        } finally {
            setCreateUserLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const canDeleteUser = (user: UserWithGameLogCount) => {
        // Can't delete yourself
        if (user.id === currentUser?.id) return false;

        // Can't delete last admin
        if (user.isAdmin) {
            const adminCount = users.filter((u) => u.isAdmin).length;
            if (adminCount <= 1) return false;
        }

        return true;
    };

    const handleDeleteUser = async (userId: string) => {
        setDeleteUserLoading(true);
        setDeleteUserError("");

        try {
            await deleteUser(userId);

            // Close modal and refresh users list
            setDeleteUserId(null);
            fetchUsers();
        } catch (err) {
            setDeleteUserError(
                err instanceof Error ? err.message : "Failed to delete user",
            );
        } finally {
            setDeleteUserLoading(false);
        }
    };

    if (loading) {
        return <div>Loading users...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">
                        User Management
                    </h2>
                    <p className="text-muted-foreground">
                        Manage users and their permissions
                    </p>
                </div>

                <Dialog
                    open={createUserModalOpen}
                    onOpenChange={setCreateUserModalOpen}
                >
                    <DialogTrigger asChild>
                        <Button className="flex items-center space-x-2 w-full sm:w-auto">
                            <Plus className="h-4 w-4" />
                            <span>Create User</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="border-2 border-border/50">
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>
                                Add a new user to the system
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="user-email">Email</Label>
                                <Input
                                    id="user-email"
                                    type="email"
                                    value={createUserData.email}
                                    onChange={(e) =>
                                        setCreateUserData((prev) => ({
                                            ...prev,
                                            email: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="user-password">Password</Label>
                                <Input
                                    id="user-password"
                                    type="password"
                                    value={createUserData.password}
                                    onChange={(e) =>
                                        setCreateUserData((prev) => ({
                                            ...prev,
                                            password: e.target.value,
                                        }))
                                    }
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="user-name">Name</Label>
                                <Input
                                    id="user-name"
                                    type="text"
                                    value={createUserData.name}
                                    onChange={(e) =>
                                        setCreateUserData((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    id="user-admin"
                                    type="checkbox"
                                    checked={createUserData.isAdmin}
                                    onChange={(e) =>
                                        setCreateUserData((prev) => ({
                                            ...prev,
                                            isAdmin: e.target.checked,
                                        }))
                                    }
                                    className="rounded"
                                />
                                <Label htmlFor="user-admin">Admin user</Label>
                            </div>

                            {createUserError && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                                    {createUserError}
                                </div>
                            )}

                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setCreateUserModalOpen(false)
                                    }
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createUserLoading}
                                >
                                    {createUserLoading
                                        ? "Creating..."
                                        : "Create User"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {users.map((user) => (
                    <Card
                        key={user.id}
                        className="hover:shadow-md transition-shadow"
                    >
                        <CardHeader className="pb-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    <div className="flex-shrink-0">
                                        {user.isAdmin ? (
                                            <Shield className="h-8 w-8 text-blue-600" />
                                        ) : (
                                            <UserIcon className="h-8 w-8 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg leading-tight break-words">
                                            {user.name || "Unnamed User"}
                                        </CardTitle>
                                        <p className="text-sm text-gray-600 break-words">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant={
                                        user.isAdmin ? "default" : "secondary"
                                    }
                                    className="shrink-0 self-start"
                                >
                                    {user.isAdmin ? "Admin" : "User"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Game Logs:
                                    </span>
                                    <span className="font-medium">
                                        {user._count.gameLogs}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Joined:
                                    </span>
                                    <span className="font-medium">
                                        {formatDate(user.createdAt)}
                                    </span>
                                </div>
                                <div className="pt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDeleteUserId(user.id)}
                                        disabled={!canDeleteUser(user)}
                                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2 shrink-0" />
                                        <span className="truncate">
                                            {user.id === currentUser?.id
                                                ? "Cannot delete yourself"
                                                : user.isAdmin &&
                                                    users.filter(
                                                        (u) => u.isAdmin,
                                                    ).length <= 1
                                                  ? "Last admin"
                                                  : "Delete"}
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {users.length === 0 && (
                <div className="text-center py-12">
                    <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No users
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Get started by creating a new user.
                    </p>
                </div>
            )}

            {/* Delete User Confirmation Modal */}
            <Dialog
                open={!!deleteUserId}
                onOpenChange={() => setDeleteUserId(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? This
                            action cannot be undone and will also delete all
                            their game logs.
                        </DialogDescription>
                    </DialogHeader>

                    {deleteUserError && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                            {deleteUserError}
                        </div>
                    )}

                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteUserId(null)}
                            disabled={deleteUserLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() =>
                                deleteUserId && handleDeleteUser(deleteUserId)
                            }
                            disabled={deleteUserLoading}
                        >
                            {deleteUserLoading ? "Deleting..." : "Delete User"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
