import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import SelectItems from "@/components/SelectItems";
import SelectedItems from "@/components/SelectedItems";
import { useAuth } from "@/providers/AuthProvider";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/Button";
import { useSelectedItems } from "@/providers/SelectedItemsProvider";
import UploadConfiguration from "@/components/internet/send/UploadConfiguration";
import UploadSummary from "@/components/internet/send/UploadSummary";
import ActiveUploads from "@/components/internet/send/ActiveUploads";
import UploadDetailModal from "@/components/internet/send/UploadDetailModal";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";

// Sample active uploads data (in real app, fetch from Supabase)
const MOCK_ACTIVE_UPLOADS = [
  {
    id: "1",
    title: "Project Documents",
    connectionCode: "123456",
    created_at: "2025-04-24T22:30:00Z",
    expires_at: "2025-05-01T22:30:00Z",
    is_active: true,
    is_public: true,
    file_count: 3,
    total_size: 5678945,
    download_count: 2,
  },
  {
    id: "2",
    title: "Vacation Photos",
    connectionCode: "789012",
    created_at: "2025-04-24T20:45:00Z",
    expires_at: "2025-04-29T20:45:00Z",
    is_active: true,
    is_public: false,
    file_count: 12,
    total_size: 24576890,
    download_count: 0,
  },
];

export default function Internet() {
  const { colors } = useTheme();
  const { session, loading, error } = useAuth();
  const { selectedItems } = useSelectedItems();
  const [activeUploads, setActiveUploads] = useState(MOCK_ACTIVE_UPLOADS);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // State to control which step of the sending process we're at
  const [currentStep, setCurrentStep] = useState("select"); // "select", "configure", "summary"
  const [connectionCode, setConnectionCode] = useState("");
  const [uploadDetails, setUploadDetails] = useState(null);

  // Fetch active uploads
  useEffect(() => {
    if (session) {
      fetchActiveUploads();
    }
  }, [session]);

  const fetchActiveUploads = async () => {
    // In a real app, fetch from Supabase
    const { data, error } = await supabase
      .from("transfers")
      .select("*")
      .eq("user_id", session!.user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    // For now, use mock data
    console.log("Active Uploads:", data);
    setActiveUploads(data || []);
  };

  // Step transition handler
  const goToStep = (step: string) => {
    if (step === "configure" && selectedItems.length === 0) {
      // Don't proceed if no items selected
      return;
    }

    setCurrentStep(step);
  };

  const handleUploadComplete = (connectionCode: string, details: any) => {
    setConnectionCode(connectionCode);
    console.log("Details:", details);
    setUploadDetails(details);
    goToStep("summary");
  };

  const handleOpenUploadDetail = (upload: any) => {
    setSelectedUpload(upload);
    setModalVisible(true);
  };

  // Replace these methods in your Internet.tsx component
  const handleUpdateUpload = async (updatedUpload) => {
    try {
      // Only update allowed fields
      const { data, error } = await supabase
        .from("transfers")
        .update({
          title: updatedUpload.title,
          description: updatedUpload.description,
          is_active: updatedUpload.is_active,
          is_public: updatedUpload.is_public,
          expires_at: updatedUpload.expires_at,
        })
        .eq("id", updatedUpload.id)
        .eq("user_id", session.user.id) // Security: ensure user owns this transfer
        .select();

      if (error) {
        throw error;
      }

      // Update the local state with updated data
      setActiveUploads(
        activeUploads.map((u) => (u.id === updatedUpload.id ? data[0] : u))
      );

      // Close the modal
      setModalVisible(false);
    } catch (error) {
      console.error("Error updating upload:", error);
      alert("Failed to update upload. Please try again.");
    }
  };

  const handleDeleteUpload = async (uploadId: string) => {
    try {
      // // Show confirmation dialog
      // const confirmed = confirm(
      //   "Are you sure you want to delete this upload? This will delete all associated files and cannot be undone."
      // );
      // console.log("Confirmed:", confirmed);

      // if (!confirmed) {
      //   return; // User canceled the operation
      // }

      // Delete the transfer - files will be deleted automatically due to CASCADE constraint
      const { error } = await supabase
        .from("transfers")
        .delete()
        .eq("id", uploadId)
        .eq("user_id", session!.user.id); // Security: ensure user owns this transfer

      if (error) {
        throw error;
      }

      // Also delete the files from storage
      const { data: storageFiles, error: storageListError } =
        await supabase.storage
          .from("transfers")
          .list(`${session!.user.id}/${uploadId}`);

      if (!storageListError && storageFiles && storageFiles.length > 0) {
        // Delete all files in the folder
        const filePaths = storageFiles.map(
          (file) => `${session!.user.id}/${uploadId}/${file.name}`
        );

        await supabase.storage.from("transfers").remove(filePaths);
      }

      // Update the local state by removing the deleted transfer
      setActiveUploads(activeUploads.filter((u) => u.id !== uploadId));

      // Close the modal
      setModalVisible(false);
    } catch (error) {
      console.error("Error deleting upload:", error);
      alert("Failed to delete upload. Please try again.");
    }
  };

  // Auth check
  if (loading) return null;
  if (!session) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: colors.text, fontSize: 16 }}>
          You must be logged in to view this page.
        </Text>
        <Button
          style={{ paddingHorizontal: 20 }}
          text="Sign In"
          onPress={() => router.push("/signIn")}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {currentStep === "select" && (
        <>
          {/* Active Uploads Section */}
          {activeUploads.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={{ ...styles.sectionHeading, color: colors.text }}>
                Active Uploads
              </Text>
              <ActiveUploads
                uploads={activeUploads}
                onSelectUpload={handleOpenUploadDetail}
              />
            </View>
          )}

          {/* Select Items Section */}
          <View style={styles.sectionContainer}>
            <Text style={{ ...styles.sectionHeading, color: colors.text }}>
              Pick
            </Text>
            <SelectItems />
          </View>

          {/* Selected Items Section */}
          <View style={styles.sectionContainer}>
            <Text style={{ ...styles.sectionHeading, color: colors.text }}>
              Selected
            </Text>
            <SelectedItems />
          </View>

          {selectedItems.length > 0 && (
            <Button
              text="Continue to Configure"
              onPress={() => goToStep("configure")}
              style={{ marginTop: 10, marginHorizontal: SPACING.md }}
              icon="arrow-forward-outline"
            />
          )}
        </>
      )}

      {currentStep === "configure" && (
        <UploadConfiguration
          onBack={() => goToStep("select")}
          onComplete={handleUploadComplete}
        />
      )}

      {currentStep === "summary" && (
        <UploadSummary
          connectionCode={connectionCode}
          uploadDetails={uploadDetails}
          selectedItems={selectedItems}
          onUploadMore={() => {
            setCurrentStep("select");
          }}
        />
      )}

      {/* Upload Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedUpload && (
          <UploadDetailModal
            upload={selectedUpload}
            onClose={() => setModalVisible(false)}
            onUpdate={handleUpdateUpload}
            onDelete={handleDeleteUpload}
          />
        )}
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
  },
  sectionContainer: {
    marginBottom: 20,
    paddingHorizontal: SPACING.md,
  },
  sectionHeading: {
    fontSize: 16,
    marginBottom: 5,
    marginLeft: 5,
  },
});
