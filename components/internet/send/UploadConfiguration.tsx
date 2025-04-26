import {
  Text,
  View,
  StyleSheet,
  TextInput,
  Switch,
  TouchableOpacity,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Button from "@/components/Button";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "@/themes";
import { useSelectedItems } from "@/providers/SelectedItemsProvider";
import UploadProcessor from "./UploadProcessor";
import { SelectedItemType } from "@/types";
export default function UploadConfiguration({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: (uploadDetails: any) => void;
}) {
  const { colors } = useTheme();

  // Configuration state
  const [isPublic, setIsPublic] = useState(true);
  const [emails, setEmails] = useState("");
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ); // Default 7 days
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { selectedItems, clearSelection } = useSelectedItems();
  const [showUploadProcessor, setShowUploadProcessor] = useState(false);
  // Calculate total size
  const totalSize = selectedItems.reduce(
    (sum, item) => sum + (item.data?.size || 0),
    0
  );

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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false); // hide the picker on Android after selection or cancel
    }

    if (event.type === "set" && selectedDate) {
      setExpiryDate(selectedDate); // user picked a date
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleEmailChange = (text: string) => {
    setEmails(text);
  };

  const handleUpload = async () => {
    if (selectedItems.length === 0) {
      // Show error - no items selected
      return;
    }

    setShowUploadProcessor(true);
    setIsUploading(true);
  };
  const handleUploadComplete = async () => {
    try {
      // In a real implementation, upload files to Supabase storage
      // and create database records
      // Simulate API delay
      // await new Promise((resolve) => setTimeout(resolve, 2000));

      // Pass upload details to parent for summary
      onComplete({
        isPublic,
        title: title || "File Transfer",
        expiryDate: useExpiry ? expiryDate : null,
        itemCount: selectedItems.length,
        totalSize,
        emails: emails
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e),
        description,
        created_at: new Date().toISOString(),
      });

      clearSelection();
    } catch (error) {
      console.error("Upload error:", error);
      setShowUploadProcessor(false);
      // Show error message
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionHeading, { color: colors.text }]}>
        Upload Configuration
      </Text>

      <View style={[styles.configCard, { backgroundColor: colors.card }]}>
        {/* Title Input */}
        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>
            Title (Optional)
          </Text>
          <TextInput
            style={[
              styles.textInput,
              { color: colors.text, borderColor: colors.border },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Give your transfer a name"
            placeholderTextColor={colors.text + "50"}
          />
        </View>

        {/* Access Control */}
        <View style={styles.configItem}>
          <View style={styles.configHeader}>
            <Text style={[styles.configLabel, { color: colors.text }]}>
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
            style={[styles.configDescription, { color: colors.text + "80" }]}
          >
            {isPublic
              ? "Anyone with the code can access files"
              : "Restrict access to specific emails"}
          </Text>

          {!isPublic && (
            <TextInput
              style={[
                styles.textInput,
                { color: colors.text, borderColor: colors.border },
              ]}
              value={emails}
              onChangeText={handleEmailChange}
              placeholder="Enter emails (comma separated)"
              placeholderTextColor={colors.text + "50"}
              multiline
            />
          )}
        </View>

        {/* Expiry Setting */}
        <View style={styles.configItem}>
          <View style={styles.configHeader}>
            <Text style={[styles.configLabel, { color: colors.text }]}>
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
              style={[styles.datePickerButton, { borderColor: colors.border }]}
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
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Description */}
        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>
            Description (Optional)
          </Text>
          <TextInput
            style={[
              styles.textInput,
              { color: colors.text, borderColor: colors.border, height: 80 },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add a note about these files"
            placeholderTextColor={colors.text + "50"}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* File Size Summary */}
        <View
          style={[
            styles.fileSummary,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.text + "80" }]}>
              Files:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {selectedItems.length}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.text + "80" }]}>
              Total Size:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatSize(totalSize)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          text="Back"
          onPress={onBack}
          style={[
            styles.secondaryButton,
            { borderColor: colors.border, color: colors.text },
          ]}
          icon="arrow-back-outline"
        />
        {showUploadProcessor ? (
          <UploadProcessor
            transferData={{
              title,
              description,
              isPublic,
              expiryDate: useExpiry ? expiryDate : null,
              emails: isPublic
                ? undefined
                : emails
                    .split(",")
                    .map((e) => e.trim())
                    .filter(Boolean),
            }}
            onComplete={handleUploadComplete}
            onCancel={() => setShowUploadProcessor(false)}
          />
        ) : (
          <Button
            text="Generate Code & Upload"
            onPress={handleUpload}
            disabled={selectedItems.length === 0}
            style={styles.primaryButton}
            icon="cloud-upload-outline"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 20,
    paddingHorizontal: SPACING.md,
  },
  sectionHeading: {
    fontSize: 16,
    marginBottom: 10,
    marginLeft: 5,
  },
  configCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  configItem: {
    marginBottom: SPACING.md,
  },
  configHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  configLabel: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.medium,
    marginBottom: 5,
  },
  configDescription: {
    fontSize: FONTS.sizes.caption,
    marginBottom: SPACING.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.body,
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 12,
  },
  fileSummary: {
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: FONTS.sizes.caption,
  },
  summaryValue: {
    fontSize: FONTS.sizes.caption,
    fontWeight: FONTS.weights.medium,
  },
  buttonContainer: {
    flexDirection: "column-reverse",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    flex: 0.7,
  },
  secondaryButton: {
    flex: 0.25,
    backgroundColor: "transparent",
    borderWidth: 1,
  },
});
