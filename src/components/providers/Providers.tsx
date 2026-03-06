"use client";

import React from "react";
import { UpdateProvider, useUpdate } from "@/contexts/UpdateContext";
import UpdateConfirmationModal from "@/components/features/UpdateConfirmationModal";
import { Toaster } from "react-hot-toast";

function UpdateModalContainer() {
    const { showConfirmDialog, hideConfirmDialog, updateInfo, executeUpdate } =
        useUpdate();

    if (!updateInfo?.hasUpdate) return null;

    return (
        <UpdateConfirmationModal
            isOpen={showConfirmDialog}
            onClose={hideConfirmDialog}
            onConfirm={executeUpdate}
            updateInfo={updateInfo}
        />
    );
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <UpdateProvider>
            {children}
            <UpdateModalContainer />
            <Toaster position="bottom-right" />
        </UpdateProvider>
    );
}
