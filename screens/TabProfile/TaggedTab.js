import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

const TaggedTab = () => {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");

  return <View style={styles.container}></View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
});

export default TaggedTab;
