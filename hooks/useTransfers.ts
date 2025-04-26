/**
 * Custom hook for managing transfers
 * Created: 2025-04-25 02:50:14 UTC
 * Author: OldStager01
 */

import { useState, useEffect, useCallback } from "react";
import {
  getUserTransfers,
  createTransfer,
  updateTransfer,
  deleteTransfer,
  deactivateTransfer,
  extendTransferExpiry,
  getTransferByCode,
} from "../lib/supabase/transfers";
import { useAuth } from "./useAuth";
import { FileData } from "../types";

interface TransfersState {
  transfers: any[];
  activeTransfers: any[];
  expiredTransfers: any[];
  currentTransfer: any | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  error: Error | null;
}

interface TransferOptions {
  title: string;
  description?: string;
  isPublic: boolean;
  expiryDate?: Date | null;
  emails?: string[];
  files: FileData[];
}

export function useTransfers() {
  const { user } = useAuth();
  const [state, setState] = useState<TransfersState>({
    transfers: [],
    activeTransfers: [],
    expiredTransfers: [],
    currentTransfer: null,
    loading: false,
    creating: false,
    updating: false,
    deleting: false,
    error: null,
  });

  // Load user's transfers
  const loadTransfers = useCallback(async () => {
    if (!user) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Get all transfers
      const { data, error } = await getUserTransfers();

      if (error) {
        throw error;
      }

      // Sort transfers by active vs expired
      const active: any[] = [];
      const expired: any[] = [];

      data.forEach((transfer) => {
        const isExpired =
          !transfer.is_active ||
          (transfer.expires_at && new Date(transfer.expires_at) < new Date());

        if (isExpired) {
          expired.push(transfer);
        } else {
          active.push(transfer);
        }
      });

      setState((prev) => ({
        ...prev,
        transfers: data,
        activeTransfers: active,
        expiredTransfers: expired,
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error("Load transfers error:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
    }
  }, [user]);

  // Create a new transfer
  const createNewTransfer = async (options: TransferOptions) => {
    if (!user) {
      throw new Error("User must be logged in to create a transfer");
    }

    setState((prev) => ({ ...prev, creating: true, error: null }));

    try {
      const { data, error } = await createTransfer(options);

      if (error) {
        throw error;
      }

      setState((prev) => ({
        ...prev,
        creating: false,
        currentTransfer: data,
        error: null,
      }));

      // Reload transfers list
      loadTransfers();

      return data;
    } catch (error) {
      console.error("Create transfer error:", error);
      setState((prev) => ({
        ...prev,
        creating: false,
        error: error as Error,
      }));
      throw error;
    }
  };

  // Update an existing transfer
  const updateExistingTransfer = async (
    transferId: string,
    updates: {
      title?: string;
      description?: string;
      isPublic?: boolean;
      expiryDate?: Date | null;
      isActive?: boolean;
      emails?: string[];
    }
  ) => {
    if (!user) {
      throw new Error("User must be logged in to update a transfer");
    }

    setState((prev) => ({ ...prev, updating: true, error: null }));

    try {
      const { data, error } = await updateTransfer({
        id: transferId,
        ...updates,
      });

      if (error) {
        throw error;
      }

      setState((prev) => {
        // Update the current transfer if it's the one being edited
        const updatedCurrentTransfer =
          prev.currentTransfer && prev.currentTransfer.id === transferId
            ? data
            : prev.currentTransfer;

        return {
          ...prev,
          updating: false,
          currentTransfer: updatedCurrentTransfer,
          error: null,
        };
      });

      // Reload transfers list
      loadTransfers();

      return data;
    } catch (error) {
      console.error("Update transfer error:", error);
      setState((prev) => ({
        ...prev,
        updating: false,
        error: error as Error,
      }));
      throw error;
    }
  };

  // Delete a transfer
  const removeTransfer = async (transferId: string) => {
    if (!user) {
      throw new Error("User must be logged in to delete a transfer");
    }

    setState((prev) => ({ ...prev, deleting: true, error: null }));

    try {
      const { success, error } = await deleteTransfer(transferId);

      if (error) {
        throw error;
      }

      if (!success) {
        throw new Error("Failed to delete transfer");
      }

      setState((prev) => {
        // Clear current transfer if it's the one being deleted
        const updatedCurrentTransfer =
          prev.currentTransfer && prev.currentTransfer.id === transferId
            ? null
            : prev.currentTransfer;

        // Remove from transfers lists
        const updatedTransfers = prev.transfers.filter(
          (t) => t.id !== transferId
        );
        const updatedActiveTransfers = prev.activeTransfers.filter(
          (t) => t.id !== transferId
        );
        const updatedExpiredTransfers = prev.expiredTransfers.filter(
          (t) => t.id !== transferId
        );

        return {
          ...prev,
          deleting: false,
          currentTransfer: updatedCurrentTransfer,
          transfers: updatedTransfers,
          activeTransfers: updatedActiveTransfers,
          expiredTransfers: updatedExpiredTransfers,
          error: null,
        };
      });

      return { success: true };
    } catch (error) {
      console.error("Delete transfer error:", error);
      setState((prev) => ({
        ...prev,
        deleting: false,
        error: error as Error,
      }));
      throw error;
    }
  };

  // Deactivate a transfer (soft delete)
  const deactivateExistingTransfer = async (transferId: string) => {
    if (!user) {
      throw new Error("User must be logged in to deactivate a transfer");
    }

    setState((prev) => ({ ...prev, updating: true, error: null }));

    try {
      const { success, error } = await deactivateTransfer(transferId);

      if (error) {
        throw error;
      }

      if (!success) {
        throw new Error("Failed to deactivate transfer");
      }

      setState((prev) => {
        // Update current transfer if it's the one being deactivated
        const updatedCurrentTransfer =
          prev.currentTransfer && prev.currentTransfer.id === transferId
            ? { ...prev.currentTransfer, is_active: false }
            : prev.currentTransfer;

        // Update transfer in lists
        const updatedTransfers = prev.transfers.map((t) =>
          t.id === transferId ? { ...t, is_active: false } : t
        );

        // Move from active to expired
        const updatedActiveTransfers = prev.activeTransfers.filter(
          (t) => t.id !== transferId
        );
        const deactivatedTransfer = prev.transfers.find(
          (t) => t.id === transferId
        );
        const updatedExpiredTransfers = deactivatedTransfer
          ? [
              ...prev.expiredTransfers,
              { ...deactivatedTransfer, is_active: false },
            ]
          : prev.expiredTransfers;

        return {
          ...prev,
          updating: false,
          currentTransfer: updatedCurrentTransfer,
          transfers: updatedTransfers,
          activeTransfers: updatedActiveTransfers,
          expiredTransfers: updatedExpiredTransfers,
          error: null,
        };
      });

      return { success: true };
    } catch (error) {
      console.error("Deactivate transfer error:", error);
      setState((prev) => ({
        ...prev,
        updating: false,
        error: error as Error,
      }));
      throw error;
    }
  };

  // Extend transfer expiry
  const extendTransfer = async (transferId: string, days: number = 7) => {
    if (!user) {
      throw new Error("User must be logged in to extend a transfer");
    }

    setState((prev) => ({ ...prev, updating: true, error: null }));

    try {
      const { data, error } = await extendTransferExpiry(transferId, days);

      if (error) {
        throw error;
      }

      setState((prev) => {
        // Update current transfer if it's the one being extended
        const updatedCurrentTransfer =
          prev.currentTransfer && prev.currentTransfer.id === transferId
            ? data
            : prev.currentTransfer;

        return {
          ...prev,
          updating: false,
          currentTransfer: updatedCurrentTransfer,
          error: null,
        };
      });

      // Reload transfers to update lists
      loadTransfers();

      return data;
    } catch (error) {
      console.error("Extend transfer error:", error);
      setState((prev) => ({
        ...prev,
        updating: false,
        error: error as Error,
      }));
      throw error;
    }
  };

  // Get transfer by connection code
  const getTransfer = async (code: string, email?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await getTransferByCode(code, email);

      if (error) {
        throw error;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        currentTransfer: data,
        error: null,
      }));

      return data;
    } catch (error) {
      console.error("Get transfer error:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
      throw error;
    }
  };

  // Clear current transfer
  const clearCurrentTransfer = () => {
    setState((prev) => ({
      ...prev,
      currentTransfer: null,
    }));
  };

  // Load transfers when user changes
  useEffect(() => {
    if (user) {
      loadTransfers();
    } else {
      // Clear state when user logs out
      setState({
        transfers: [],
        activeTransfers: [],
        expiredTransfers: [],
        currentTransfer: null,
        loading: false,
        creating: false,
        updating: false,
        deleting: false,
        error: null,
      });
    }
  }, [user, loadTransfers]);

  return {
    transfers: state.transfers,
    activeTransfers: state.activeTransfers,
    expiredTransfers: state.expiredTransfers,
    currentTransfer: state.currentTransfer,
    loading: state.loading,
    creating: state.creating,
    updating: state.updating,
    deleting: state.deleting,
    error: state.error,
    loadTransfers,
    createTransfer: createNewTransfer,
    updateTransfer: updateExistingTransfer,
    deleteTransfer: removeTransfer,
    deactivateTransfer: deactivateExistingTransfer,
    extendTransfer,
    getTransferByCode: getTransfer,
    clearCurrentTransfer,
  };
}
