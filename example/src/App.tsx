import { Text, View, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Safari Extension Example</Text>
      <Text style={styles.subtitle}>
        This app includes a Safari Web Extension configured via
        expo-safari-web-extension plugin
      </Text>
      <Text style={styles.instructions}>
        Build for iOS to test the Safari extension functionality
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    color: '#999',
  },
});
