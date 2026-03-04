"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { User, UpdateProfileFormData } from "@/types/user";
import { updateProfile } from "@/lib/auth/client";

interface ProfileSettingsProps {
    currentUser: User | null;
    onUserUpdate: (updatedUser: User) => void;
}

export default function ProfileSettings({
    currentUser,
    onUserUpdate,
}: ProfileSettingsProps) {
    const [profileData, setProfileData] = useState<UpdateProfileFormData>({
        currentPassword: "",
        email: "",
        newPassword: "",
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [profileSuccess, setProfileSuccess] = useState("");

    // Initialize/Update form data when currentUser changes
    useEffect(() => {
        if (currentUser) {
            setProfileData((prev) => ({ ...prev, email: currentUser.email }));
        }
    }, [currentUser]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileError("");
        setProfileSuccess("");

        try {
            await updateProfile(profileData);

            setProfileSuccess("Profile updated successfully");
            setProfileData((prev) => ({
                ...prev,
                currentPassword: "",
                newPassword: "",
            }));

            // Notify parent if relevant fields changed
            if (
                currentUser &&
                profileData.email &&
                profileData.email !== currentUser.email
            ) {
                onUserUpdate({ ...currentUser, email: profileData.email });
            }
        } catch (err) {
            setProfileError(
                err instanceof Error ? err.message : "Failed to update profile",
            );
        } finally {
            setProfileLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-foreground">
                    Profile Settings
                </h2>
                <p className="text-muted-foreground mt-1">
                    Update your email and password
                </p>
            </div>

            <Card>
                <CardContent>
                    <form
                        onSubmit={handleProfileUpdate}
                        className="space-y-4 max-w-full sm:max-w-md"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="current-password">
                                Current Password
                            </Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={profileData.currentPassword}
                                onChange={(e) =>
                                    setProfileData((prev) => ({
                                        ...prev,
                                        currentPassword: e.target.value,
                                    }))
                                }
                                required
                                className="bg-muted"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={profileData.email}
                                onChange={(e) =>
                                    setProfileData((prev) => ({
                                        ...prev,
                                        email: e.target.value,
                                    }))
                                }
                                className="bg-muted"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password">
                                New Password (optional)
                            </Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={profileData.newPassword}
                                onChange={(e) =>
                                    setProfileData((prev) => ({
                                        ...prev,
                                        newPassword: e.target.value,
                                    }))
                                }
                                minLength={6}
                                className="bg-muted"
                            />
                        </div>

                        {profileError && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                                {profileError}
                            </div>
                        )}

                        {profileSuccess && (
                            <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                                {profileSuccess}
                            </div>
                        )}

                        <Button type="submit" disabled={profileLoading}>
                            {profileLoading ? "Updating..." : "Update Profile"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
