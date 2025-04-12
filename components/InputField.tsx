import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

const InputField: React.FC<TextInputProps> = (props) => {
  return <TextInput style={styles.input} {...props} />;
};

const styles = StyleSheet.create({
  input: {
    width: '100%',
    padding: 14,
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
});

export default InputField;
