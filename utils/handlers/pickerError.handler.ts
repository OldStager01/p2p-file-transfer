export const handlePickerError = (err: unknown) => {
  if (err instanceof Error) {
    // Alert.alert("Error", err.message);
    console.error("Document Picker Error:", err.message);
  }
};
