import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/Button";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";
import Clipboard from "@react-native-clipboard/clipboard";

export default function UploadDetailModal({
  upload,
  onClose,
  onUpdate,
  onDelete,
}: any) {
  const { colors } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(upload.title);
  const [isPublic, setIsPublic] = useState(upload.is_public);
  const [useExpiry, setUseExpiry] = useState(!!upload.expires_at);
  const [expiryDate, setExpiryDate] = useState(
    upload.expires_at
      ? new Date(upload.expires_at)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [emails, setEmails] = useState(""); // In a real app, fetch from Supabase

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDateChange = (event: any, selectedDate: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setExpiryDate(selectedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleCopyCode = () => {
    Clipboard.setString(upload.connectionCode);
    Alert.alert("Copied", "Connection code copied to clipboard");
  };

  const handleUpdate = () => {
    // Update the upload with new values
    onUpdate({
      ...upload,
      title,
      is_public: isPublic,
      expires_at: useExpiry ? expiryDate.toISOString() : null,
    });
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete Upload",
      "Are you sure you want to delete this upload? This will revoke access to all shared files.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(upload.id),
        },
      ]
    );
  };

  return (
    <View style={styles.modalOverlay}>
      <View
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
      >
        <ScrollView>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isEditing ? "Edit Upload" : "Upload Details"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={styles.editSection}>
              {/* Title Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Title
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { color: colors.text, borderColor: colors.border },
                  ]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter transfer title"
                  placeholderTextColor={colors.text + "50"}
                />
              </View>

              {/* Access Control */}
              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Public Access
                  </Text>
                  <Switch
                    value={isPublic}
                    onValueChange={setIsPublic}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.background}
                  />
                </View>
                <Text
                  style={[styles.description, { color: colors.text + "80" }]}
                >
                  {isPublic
                    ? "Anyone with code can access files"
                    : "Only specific emails can access"}
                </Text>

                {!isPublic && (
                  <TextInput
                    style={[
                      styles.textInput,
                      { color: colors.text, borderColor: colors.border },
                    ]}
                    value={emails}
                    onChangeText={setEmails}
                    placeholder="Enter emails (comma separated)"
                    placeholderTextColor={colors.text + "50"}
                    multiline
                  />
                )}
              </View>

              {/* Expiry Setting */}
              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Set Expiry
                  </Text>
                  <Switch
                    value={useExpiry}
                    onValueChange={setUseExpiry}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.background}
                  />
                </View>

                {useExpiry && (
                  <TouchableOpacity
                    style={[styles.dateButton, { borderColor: colors.border }]}
                    onPress={showDatepicker}
                  >
                    <Text style={{ color: colors.text }}>
                      {formatDate(expiryDate)}
                    </Text>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                )}

                {showDatePicker && (
                  <DateTimePicker
                    value={expiryDate}
                    mode="datetime"
                    display="default"
                    onChange={handleDateChange as any}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              <View style={styles.buttonGroup}>
                <Button
                  text="Cancel"
                  onPress={() => setIsEditing(false)}
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  textStyle={{ color: colors.text }}
                />
                <Button
                  text="Save Changes"
                  onPress={handleUpdate}
                  style={styles.saveButton}
                />
              </View>
            </View>
          ) : (
            <>
              <View
                style={[styles.codeSection, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.codeSectionTitle, { color: colors.text }]}>
                  Connection Code
                </Text>
                <View style={styles.codeDisplay}>
                  <Text style={[styles.codeText, { color: colors.text }]}>
                    {upload.connection_code}
                  </Text>
                  <TouchableOpacity
                    onPress={handleCopyCode}
                    style={styles.copyButton}
                  >
                    <Ionicons
                      name="copy-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={[
                  styles.detailsSection,
                  { backgroundColor: colors.card },
                ]}
              >
                <View style={styles.detailRow}>
                  <Ionicons
                    name="text-outline"
                    size={20}
                    color={colors.text + "80"}
                  />
                  <Text
                    style={[styles.detailLabel, { color: colors.text + "80" }]}
                  >
                    Title:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {upload.title}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={colors.text + "80"}
                  />
                  <Text
                    style={[styles.detailLabel, { color: colors.text + "80" }]}
                  >
                    Created:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDate(new Date(upload.created_at))}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.text + "80"}
                  />
                  <Text
                    style={[styles.detailLabel, { color: colors.text + "80" }]}
                  >
                    Expires:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {upload.expires_at
                      ? formatDate(new Date(upload.expires_at))
                      : "No expiry"}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name={
                      upload.is_public ? "globe-outline" : "lock-closed-outline"
                    }
                    size={20}
                    color={colors.text + "80"}
                  />
                  <Text
                    style={[styles.detailLabel, { color: colors.text + "80" }]}
                  >
                    Access:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {upload.is_public
                      ? "Public - Anyone with code"
                      : "Private - Restricted"}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name="document-outline"
                    size={20}
                    color={colors.text + "80"}
                  />
                  <Text
                    style={[styles.detailLabel, { color: colors.text + "80" }]}
                  >
                    Files:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {upload.file_count} ({formatSize(upload.total_size)})
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name="download-outline"
                    size={20}
                    color={colors.text + "80"}
                  />
                  <Text
                    style={[styles.detailLabel, { color: colors.text + "80" }]}
                  >
                    Downloads:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {upload.download_count}
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <Button
                  text="Edit"
                  onPress={() => setIsEditing(true)}
                  icon="create-outline"
                  style={styles.editButton}
                />
                <Button
                  text="Delete"
                  onPress={confirmDelete}
                  icon="trash-outline"
                  style={styles.deleteButton}
                  textStyle={{ color: "#fff" }}
                />
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingBottom: 40, // Safe area padding
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.1)",
  },
  modalTitle: {
    fontSize: FONTS.sizes.title,
    fontWeight: FONTS.weights.bold,
  },
  closeButton: {
    padding: 5,
  },
  codeSection: {
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: "center",
    ...SHADOWS.small,
  },
  codeSectionTitle: {
    fontSize: FONTS.sizes.caption,
    marginBottom: 5,
  },
  codeDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  codeText: {
    fontSize: 28,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 5,
  },
  copyButton: {
    padding: 5,
    marginLeft: 10,
  },
  detailsSection: {
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    ...SHADOWS.small,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    marginLeft: 10,
    width: 70,
    fontSize: FONTS.sizes.body,
  },
  detailValue: {
    flex: 1,
    fontSize: FONTS.sizes.body,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: SPACING.md,
    marginTop: 0,
  },
  editButton: {
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: "#F44771",
  },
  editSection: {
    padding: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.medium,
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.body,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  description: {
    fontSize: FONTS.sizes.caption,
    marginBottom: 10,
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 12,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.md,
  },
  cancelButton: {
    flex: 0.48,
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  saveButton: {
    flex: 0.48,
  },
});
