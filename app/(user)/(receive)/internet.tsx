import { Text, View, StyleSheet, ScrollView } from "react-native";
import React, { useState } from "react";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "@/providers/AuthProvider";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/Button";
import AccessCodeInput from "@/components/internet/receive/AccessCodeInput";
import AccessRequestView from "@/components/internet/receive/AccessRequestView";
import FileViewer from "@/components/internet/receive/FileViewer";
import ConnectionHistory from "@/components/internet/receive/ConnectionHistory";
import { SPACING, RADIUS, FONTS } from "@/themes";

// Sample transfer data for demonstration
const SAMPLE_TRANSFER = {
  id: "123",
  title: "Project Documents",
  created_at: "2025-04-24T12:30:00Z",
  expires_at: "2025-05-24T12:30:00Z",
  is_active: true,
  is_public: true,
  user_id: "someUserId",
  username: "john_doe",
  files: [
    {
      id: "1",
      name: "Project_Report.pdf",
      size: 2456789,
      type: "application/pdf",
    },
    {
      id: "2",
      name: "Budget_Spreadsheet.xlsx",
      size: 1234567,
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    {
      id: "3",
      name: "Presentation.pptx",
      size: 3456789,
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    },
  ],
};

export default function InternetReceive() {
  const { colors } = useTheme();
  const [connectionCode, setConnectionCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [transferFound, setTransferFound] = useState(false);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [transfer, setTransfer] = useState(null);
  const { session, loading: authLoading, error } = useAuth();

  const clearErrors = () => setErrorMessage(null);

  const handleCodeChange = (text) => {
    // Remove any non-numeric characters and limit to 6 digits
    const cleanedText = text.replace(/[^0-9]/g, "").slice(0, 6);
    setConnectionCode(cleanedText);
    clearErrors();
  };

  const handleAccessFiles = async (code = connectionCode) => {
    const codeToUse = code || connectionCode;
    if (codeToUse.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit connection code");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // In a real implementation, fetch from Supabase
      // const { data, error } = await supabase
      //   .from('transfers')
      //   .select('*')
      //   .eq('connection_code', codeToUse)
      //   .single();

      // if (error) throw new Error("Invalid code or transfer not found");

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if transfer exists and is valid
      if (codeToUse === "123456") {
        // Check if transfer is expired
        if (new Date(SAMPLE_TRANSFER.expires_at) < new Date()) {
          setErrorMessage("This transfer has expired");
          setTransferFound(false);
          return;
        }

        // Check if user has access (if not public)
        if (!SAMPLE_TRANSFER.is_public && session) {
          // For non-public transfers, check if user is in allowed_emails
          // This is just a mock - in a real app, check against the allowed_emails array
          const hasAccess = true; // Simulate access check

          if (!hasAccess) {
            setErrorMessage("You don't have access to these files");
            setRequestingAccess(true);
            setTransferFound(true);
            return;
          }
        }

        setTransfer(SAMPLE_TRANSFER);
        setTransferFound(true);
      } else {
        setErrorMessage("Invalid connection code");
        setTransferFound(false);
      }
    } catch (error) {
      console.error("Error accessing files:", error);
      setErrorMessage(error.message || "Failed to access files");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    // In a real implementation, send request to file owner via Supabase
    setErrorMessage("Request sent! You'll be notified when access is granted.");
  };

  const resetView = () => {
    setConnectionCode("");
    setTransferFound(false);
    setRequestingAccess(false);
    setTransfer(null);
  };

  // Auth check
  if (authLoading) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: SPACING.md }}
    >
      {!transferFound ? (
        <>
          <AccessCodeInput
            connectionCode={connectionCode}
            onChangeText={handleCodeChange}
            onSubmit={() => handleAccessFiles()}
            error={errorMessage}
            loading={loading}
            colors={colors}
          />

          {!session && (
            <View
              style={[styles.signInPrompt, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.signInPromptText, { color: colors.text }]}>
                Sign in to access private transfers and keep track of your
                downloads
              </Text>
              <Button
                text="Sign In"
                onPress={() => router.push("/signIn")}
                style={{ marginTop: SPACING.sm }}
              />
            </View>
          )}

          {session && (
            <ConnectionHistory
              onUseCode={(code) => {
                setConnectionCode(code);
                handleAccessFiles(code);
              }}
            />
          )}
        </>
      ) : requestingAccess ? (
        <AccessRequestView
          onRequestAccess={handleRequestAccess}
          onTryAnotherCode={resetView}
          error={errorMessage}
          colors={colors}
        />
      ) : (
        <FileViewer transfer={transfer} colors={colors} onBack={resetView} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  signInPrompt: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  signInPromptText: {
    textAlign: "center",
    marginVertical: SPACING.sm,
    fontSize: FONTS.sizes.body,
  },
});
