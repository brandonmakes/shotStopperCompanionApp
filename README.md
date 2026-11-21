# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Local Android build on a connected device

If your shell cannot find `adb`, export Android SDK paths first:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

Verify your device is connected and authorized:

```bash
adb devices
```

Expected output status should be `device` (not `unauthorized`).

If you see `unauthorized`, unlock your phone and accept the **Allow USB debugging** prompt. If the prompt does not appear, toggle USB debugging off/on and reconnect USB.

Run the local Android build/install:

```bash
npx expo run:android --device
```

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## EAS build and store deployment

Use these steps to create production builds and submit them to App Store Connect and Google Play.

1. Install and authenticate EAS CLI (one-time setup)

   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

2. Build production binaries

   ```bash
   # iOS (.ipa)
   eas build --platform ios --profile production

   # Android (.aab)
   eas build --platform android --profile production
   ```

   To generate an Android APK (for direct install/testing), use:

   ```bash
   eas build --platform android --profile preview-apk
   ```

3. Submit to stores

   ```bash
   # Submit latest iOS production build to App Store Connect
   eas submit --platform ios --profile production

   # Submit latest Android production build to Google Play
   eas submit --platform android --profile production
   ```

4. Complete release in store dashboards

- App Store Connect: finish TestFlight/App Store release metadata and publish.
- Google Play Console: choose track (internal/testing/production), review release notes, and roll out.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
