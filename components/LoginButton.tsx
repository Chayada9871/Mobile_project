import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from 'react-native';

interface Props {
  onPress: (event: GestureResponderEvent) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const LoginButton: React.FC<Props> = ({ onPress, children, disabled }) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  disabled: {
    backgroundColor: '#888',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default LoginButton;
