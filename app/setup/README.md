git@github.com:davidcarboni/template.git

 * npx create-expo-app@latest
 * mv App.js App.tsx
 * npx expo install typescript @types/react --dev
 * npx expo customize tsconfig.json
 * npx expo install ts-node --dev

tsconfig: absolute imports:
 ```
 {
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
 ```


 app.config.js:
 ```
 import 'ts-node/register'; // Add this to import TypeScript files
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'my-app',
  slug: 'my-app',
};

export default config;
```
