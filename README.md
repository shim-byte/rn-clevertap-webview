# React Native CleverTap WebView Bridge

> **🚀 Enabling CleverTap WebView functionality for React Native**
> 
> CleverTap's native WebView integration is only supported for native Android and iOS SDKs, **not for React Native**. This component bridges that gap by providing a React Native solution that enables web content within WebViews to communicate with the native CleverTap SDK.

This document provides instructions and guidelines for using the `WebViewBridgeComponent` to enable communication between a web page loaded in a React Native WebView and the native CleverTap SDK. This allows CleverTap events and profile updates to be triggered from the web content but recorded natively by the app.

## Table of Contents

1.  [Purpose](#purpose)
2.  [Why This Component Exists](#why-this-component-exists)
3.  [Features](#features)
4.  [Prerequisites](#prerequisites)
5.  [Installation](#installation)
6.  [Usage](#usage)
    *   [Component Props](#component-props)
    *   [Example Implementation (React Native)](#example-implementation-react-native)
7.  [Web Page Setup](#web-page-setup)
    *   [Accessing the Bridge](#accessing-the-bridge)
    *   [Calling Bridge Methods](#calling-bridge-methods)
    *   [Important Notes for Web Developers](#important-notes-for-web-developers)
8.  [Supported CleverTap Methods](#supported-clevertap-methods)
9.  [Testing Your Implementation](#testing-your-implementation)
10. [Handling Custom Messages](#handling-custom-messages)
11. [Error Handling](#error-handling)
12. [Security Considerations](#security-considerations)
13. [Contributing](#contributing)

## Purpose

The `WebViewBridgeComponent` facilitates communication between web content (HTML/JavaScript within a `react-native-webview`) and the native CleverTap SDK in your React Native app. Its primary purpose is to enable web content to trigger CleverTap events and profile updates that are then processed and recorded by the native SDK on the app side. This approach ensures:

*   **Consistent Tracking**: All CleverTap data, whether originating from native app interactions or web content within the app, is managed centrally by the native SDK.
*   **Single Source of Truth**: The native CleverTap SDK remains the definitive source for user analytics and engagement data.

This component is ideal for scenarios where you embed existing web pages or web-based user flows into your mobile app and need to maintain cohesive CleverTap tracking through the native application layer.

## Why This Component Exists

CleverTap's native WebView integration is only supported for native Android and iOS SDKs, **not for React Native**. This creates challenges for React Native apps that embed web content and require unified CleverTap analytics and engagement.

### Case: Unified User Analytics and Profile Management

- Your React Native app uses the CleverTap React Native SDK.
- Your embedded web pages may use the CleverTap Web SDK or have no CleverTap integration.
- **Problem:** If you use the CleverTap Web SDK inside a WebView, CleverTap treats the web and native app as separate sources. This results in two different user profiles for the same person, fragmenting your analytics and making it difficult to get a complete view of the user journey.
- **Note:** To merge these profiles when using the Web SDK, you must explicitly call the `onUserLogin` method from your web content. If you do not, CleverTap will create two separate profiles for the same user.
- **With This Bridge:** When you use this bridge, all events and profile updates from the web content are routed through the native CleverTap SDK. This means you do **not** need to call `onUserLogin` separately from the web side—the bridge ensures all tracking is unified under a single user profile automatically.

### Case: In-App Campaigns in WebView Content

- **Problem:** If your web pages use the CleverTap Web SDK, you cannot run CleverTap In-App campaigns inside WebViews, as these campaigns are only supported via the native SDK.
- **Solution:** By routing all events and profile updates through the native SDK using this bridge, you can trigger and display CleverTap In-App campaigns within your WebView content, just like you would in native screens.

### The Solution: Unified Analytics Bridge

This `WebViewBridgeComponent` solves these problems by creating a seamless communication channel between your web content and the native CleverTap React Native SDK:

✅ **Single User Identity:** All CleverTap events, whether from native interactions or web content, are attributed to the same user profile  
✅ **Complete User Journey:** Track user behavior across native screens and embedded web content as one continuous experience  
✅ **Centralized Analytics:** All tracking data flows through your React Native app's CleverTap SDK, ensuring consistency  
✅ **In-App Campaign Support:** Enables CleverTap In-App campaigns to work inside WebViews  
✅ **Cross-Platform Compatibility:** Works seamlessly on both iOS and Android without platform-specific implementations  
✅ **Drop-in Integration:** Uses the exact same JavaScript API as CleverTap's native WebView implementation

### Technical Implementation

Unlike native Android apps that can use `addJavascriptInterface()` to expose CleverTap methods to WebViews, React Native requires a different approach:

```java
// Native Android approach (NOT available in React Native)
webView.addJavascriptInterface(new CTWebInterface(CleverTapAPI.getDefaultInstance(this)), "CleverTap");
```

This component recreates that functionality using React Native's WebView message passing system, providing the same JavaScript interface and method signatures that CleverTap's official documentation describes.

**Platform Note:** While iOS WebKit provides built-in JavaScript-to-native communication capabilities, React Native's WebView implementation abstracts these platform differences. This bridge provides a unified solution that works consistently across both platforms without requiring separate iOS and Android implementations.

## Features

*   **Drop-in replacement** for CleverTap's native WebView integration in React Native
*   **Same JavaScript API** as CleverTap's native WebView interface
*   Supports a wide range of CleverTap SDK methods for event tracking and user profile management
*   Customizable JavaScript variable name for the web-side bridge (just like the native implementation)
*   Optional error handling callbacks
*   Optional callback for handling non-CleverTap custom messages from the WebView
*   Allows passing through additional props to the underlying `react-native-webview` component

## Prerequisites

Before using this component, ensure you have the following installed and configured in your React Native project:

1.  **React Native**: Your project should be set up with React Native.
2.  **`react-native-webview`**: This component relies on `react-native-webview`.
    ```bash
    npm install react-native-webview
    # or
    yarn add react-native-webview
    ```
    Follow the installation instructions for `react-native-webview` for your specific platform (iOS/Android).
3.  **`clevertap-react-native`**: The CleverTap React Native SDK must be installed and initialized.
    ```bash
    npm install clevertap-react-native
    # or
    yarn add clevertap-react-native
    ```
    Follow the CleverTap SDK integration guide for React Native.

## Installation

1.  Copy the `WebViewBridgeComponent.tsx` file into your project (e.g., in a `components` directory).
    ```
    /YourReactNativeProject
    |-- /components
    |   |-- WebViewBridgeComponent.tsx
    |-- /screens
    |   |-- YourScreen.tsx
    ...
    ```
2.  Ensure all dependencies mentioned in [Prerequisites](#prerequisites) are installed and linked correctly.

## Usage

Import and use the `WebViewBridgeComponent` in your React Native screens or components where you need to display web content that interacts with CleverTap.

### Component Props

| Prop                    | Type                                     | Required/Optional | Default     | Description                                                                                                                               |
| :---------------------- | :--------------------------------------- | :---------------- | :---------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| `webViewUrl`            | `string`                                 | **Required**      | -           | The URL of the web page to load in the WebView.                                                                                           |
| `cleverTapVariableName` | `string`                                 | Optional          | `CleverTap` | The name of the JavaScript variable exposed on the `window` object in the WebView for interacting with the bridge.                        |
| `style`                 | `object`                                 | Optional          | `flex: 1`   | Optional styles to apply to the WebView component. If not provided, a default style (`flex: 1`) is used.                                |
| `onError`               | `(error: any) => void`                   | Optional          | `undefined` | Optional callback function invoked if an error occurs while parsing or processing messages from the WebView. This handles JavaScript parsing errors, not CleverTap-specific errors. |
| `onCustomMessage`       | `(message: any) => void`                 | Optional          | `undefined` | Optional callback for messages from the WebView that are not CleverTap-related (i.e., do not have a `cleverTapType` property).          |
| `...webViewProps`       | `WebViewProps`                           | Optional          | `undefined` | Any other valid props for the `react-native-webview` component (e.g., `onLoad`, `onLoadEnd`, `userAgent`). These will be passed through. |

### Example Implementation (React Native)

```tsx
// filepath: /screens/MyWebViewScreen.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar } from 'react-native-paper'; // Example: using react-native-paper for UI
import WebViewBridgeComponent from '../components/WebViewBridgeComponent'; // Adjust path as needed

const MyWebViewScreen = ({ navigation }: { navigation: any }) => {
  const webPageUrl = "https://your-web-content-url.com";
  const cleverTapBridgeObjectName = "NativeCleverTap"; // Custom name for the bridge object

  const handleWebViewError = (error: any) => {
    console.error("Error in WebViewBridgeComponent:", error);
    // Implement custom error display or logging
  };

  const handleCustomWebMessage = (message: any) => {
    console.log("Received custom message from web:", message);
    // Process custom messages not related to CleverTap
    if (message.action === 'closeWebView') {
      navigation.goBack();
    }
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Web Content" />
      </Appbar.Header>
      <View style={styles.container}>
        <WebViewBridgeComponent
          webViewUrl={webPageUrl}
          cleverTapVariableName={cleverTapBridgeObjectName}
          style={styles.webview}
          onError={handleWebViewError}
          onCustomMessage={handleCustomWebMessage}
          // You can pass other react-native-webview props here
          // userAgent="MyCustomUserAgent/1.0"
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default MyWebViewScreen;
```

## Web Page Setup

For your web page to communicate with the React Native app via this bridge, you need to use the JavaScript object injected into its `window` context. **The API is designed to match CleverTap's native WebView implementation exactly.**

### Accessing the Bridge

The component injects a JavaScript object into the `window` of the loaded web page. By default, this object is named `window.CleverTap`. You can customize this name using the `cleverTapVariableName` prop, just like CleverTap's native implementation.

### Calling Bridge Methods

From your web page's JavaScript, you can call methods on this bridge object using **the exact same patterns** as CleverTap's native WebView integration. All the examples from CleverTap's documentation work directly with this bridge:

**Event Tracking:**

```javascript
//An example of recording a User Event called Product Viewed in the Webview JS
if (window.your_variable_name_here) {
  // Call Android interface             
 your_variable_name_here.pushEvent("Product Viewed");          
}

//An example of recording a User Event called Product Viewed with properties, in the Webview JS
var props = {foo: 'xyz', lang: 'French'};

if (window.your_variable_name_here) {
  // Call Android interface             
 your_variable_name_here.pushEvent("Product Viewed",JSON.stringify(props));
            
}

//An example of recording a CHARGED Event with charge details and items, in the Webview JS
var chargeDetails = {Amount: 300, Payment: 'Card'};
var items = [{Category: 'Books', Name: 'Book name', Quantity: 1},{Category: 'Clothes', Name: 'Cloth name', Quantity: 1},{Category: 'Food', Name: 'Food name', Quantity: 1}]

if (window.your_variable_name_here) {
  // Call Android interface             
your_variable_name_here.pushChargedEvent(JSON.stringify(chargeDetails),JSON.stringify(items))
            
}
```

**User Profile Management:**

```javascript
//An example of updating profile properties of the User in the Webview JS
var props = {foo: 'xyz', lang: 'French'};
if (window.your_variable_name_here) {
  // Call Android interface             
 your_variable_name_here.pushProfile(JSON.stringify(props));          
}

//Calling onUserLogin 
var props = {Identity: '12434', Email: 'xyz@xyz.com'};
if (window.your_variable_name_here) {
  // Call Android interface 
your_variable_name_here.onUserLogin(JSON.stringify(props));
}
```

**Multi-Value Profile Properties:**

```javascript
//An example of adding user property for the User in the Webview JS
if (window.your_variable_name_here) {
  // Call Android interface 
your_variable_name_here.addMultiValueForKey('membership', 'gold');
}

//An example of adding multiple user properties for the User in the Webview JS
var cars = ['Saab', 'Volvo', 'BMW', 'Kia'];
if (window.your_variable_name_here) {
  // Call Android interface 
your_variable_name_here.addMultiValuesForKey('Cars', JSON.stringify(cars));
}

//An example of removing a user property for a specific key in the Webview JS
if (window.your_variable_name_here) {
// Call Android interface 
your_variable_name_here.removeMultiValueForKey('Cars', 'Saab');
}

//An example of removing multiple user properties for a specific key in the Webview JS
var cars = ['BMW', 'Kia'];
if (window.your_variable_name_here) {
  // Call Android interface 
your_variable_name_here.removeMultiValuesForKey('Cars', JSON.stringify(cars));
}

//An example of removing a user property by specifying a key in the Webview JS
if (window.your_variable_name_here) {
  // Call Android interface 
your_variable_name_here.removeValueForKey('Cars');
}

//An example of setting a user property by specifying the key in the Webview JS
var values = ['Mercedes','Bentley']
if (window.your_variable_name_here) {
  // Call Android interface 
your_variable_name_here.setMultiValueForKey('Cars', JSON.stringify(values));
}
```

**Increment/Decrement Values:**

```javascript
// Increment user property value by specifying the key in JS enabled custom In-Apps
if (window.your_variable_name_here) {
  // Call Android interface 
your_variable_name_here.incrementValue('Cars',2);
}

// Decrement user property value by specifying the key in JS enabled custom In-Apps
if (window.your_variable_name_here) {
  // Call Android interface 
your_variable_name_here.decrementValue('Cars',2)
}
```

### Important Notes for Web Developers

*   **Bridge Availability**: The bridge object (`window.CleverTap` or your custom name) is injected using `injectedJavaScriptBeforeContentLoaded`. It should be available early, but it's good practice to check for its existence before calling its methods, as shown in the examples above.
*   **JSON Stringification**: Always `JSON.stringify()` complex objects or arrays before passing them as arguments to the bridge methods that expect stringified JSON (e.g., `properties`, `profileProperties`, `chargeDetails`, `items`, `values`).
*   **Method Signatures**: All method signatures match CleverTap's native WebView implementation exactly - you can copy JavaScript code from CleverTap's documentation and it will work with this bridge.

## Supported CleverTap Methods

The following CleverTap SDK methods are supported via the web bridge. **These match the exact method signatures from CleverTap's native WebView implementation**:

**Event Tracking:**
*   `pushEvent(eventName: string, propertiesString?: string)` - Same as native CleverTap WebView
*   `pushChargedEvent(chargeDetailsString: string, itemsString: string)` - Same as native CleverTap WebView

**User Profile Management:**
*   `pushProfile(profilePropsString: string)` - Same as native CleverTap WebView
*   `onUserLogin(profilePropsString: string)` - Same as native CleverTap WebView
*   `addMultiValueForKey(key: string, value: string)` - Same as native CleverTap WebView
*   `addMultiValuesForKey(key: string, valuesString: string)` - Same as native CleverTap WebView
*   `removeMultiValueForKey(key: string, value: string)` - Same as native CleverTap WebView
*   `removeMultiValuesForKey(key: string, valuesString: string)` - Same as native CleverTap WebView
*   `removeValueForKey(key: string)` - Same as native CleverTap WebView
*   `setMultiValueForKey(key: string, valuesString: string)` - Same as native CleverTap WebView
*   `incrementValue(key: string, value: number | string)` - Same as native CleverTap WebView
*   `decrementValue(key: string, value: number | string)` - Same as native CleverTap WebView

For more examples of how to use each method, refer to [CleverTap's WebView documentation](https://developer.clevertap.com/docs/webview#android). The JavaScript code examples there will work directly with this React Native bridge.

## Testing Your Implementation

### Online Testing Tool

You can test your WebView bridge implementation using our online testing tool:

**🔗 [CleverTap WebView Tester](https://shim-byte.github.io/ct-webview-tester/)**

This web page contains test buttons for all supported CleverTap methods and can be loaded directly in your `WebViewBridgeComponent` for testing purposes.

### Using the Test Page

1. **Quick Test**: Load the test page directly in your component:
   ```tsx
   <WebViewBridgeComponent
     webViewUrl="https://shim-byte.github.io/ct-webview-tester/"
     cleverTapVariableName="CleverTap" // or your custom name
     onError={(error) => console.error('Bridge Error:', error)}
   />
   ```

2. **Check the Bridge Variable**: The test page automatically detects common bridge variable names (`CleverTap`, `NativeCleverTap`, etc.)

3. **Test All Methods**: Use the buttons on the test page to verify each CleverTap method is working correctly

4. **Monitor Logs**: Watch your React Native console for CleverTap method calls and any errors

### Custom Test Implementation

You can also create your own test page following the patterns in the test site. The key is to:

- Check for the bridge object availability
- Use the exact same method signatures as CleverTap's native WebView API
- Stringify complex objects before passing them to the bridge methods

## Handling Custom Messages

If your web page needs to send messages to the React Native app that are not related to CleverTap, you can do so by:

1.  From the web page, use `window.ReactNativeWebView.postMessage(JSON.stringify(yourCustomMessageObject));`
2.  Ensure `yourCustomMessageObject` does **not** have a `cleverTapType` property.
3.  Provide an `onCustomMessage` callback prop to the `WebViewBridgeComponent`. This callback will receive the parsed `yourCustomMessageObject`.

Example:
Web: `window.ReactNativeWebView.postMessage(JSON.stringify({ action: "closeWebView", reason: "user_clicked_done_button" }));`
React Native (`onCustomMessage` prop):
```javascript
(message) => {
  if (message.action === 'closeWebView') {
    console.log('Web wants to close with reason:', message.reason);
    // Perform navigation or other actions, e.g., navigation.goBack();
  }
}
```

## Error Handling

*   **Web Page Errors**: Errors parsing JSON strings within the injected JavaScript on the web page are handled gracefully with console error messages
*   **Native Side Errors**: If an error occurs on the React Native side while processing a message, it will be logged to the React Native console
*   **`onError` Prop**: You can provide an `onError` callback prop to `WebViewBridgeComponent` to handle errors in your application logic
*   **Testing**: Use the [CleverTap WebView Tester](https://shim-byte.github.io/ct-webview-tester/) to identify and debug integration issues

## Security Considerations

*   **Message Source**: The `onMessage` handler in the WebView receives data from the web content. Be mindful of the source of your web content (`webViewUrl`)
*   **Trusted Content**: This bridge provides the same level of access as CleverTap's native WebView integration - ensure you only load trusted web content
*   **Data Validation**: The bridge validates message structure and JSON parsing, similar to the native implementation
*   **Testing Security**: The test page at https://shim-byte.github.io/ct-webview-tester/ is safe for testing but should not be used in production apps
*   **`injectedJavaScriptBeforeContentLoaded`**: This method is powerful. The injected script has access to the web page's context. Ensure the script itself is secure and doesn't inadvertently create vulnerabilities.

## Contributing

If you find issues or have suggestions for improvements, please feel free to open an issue or submit a pull request to the repository where this component is hosted.

When contributing:
1. Ensure compatibility with CleverTap's native WebView API
2. Test thoroughly using the [CleverTap WebView Tester](https://shim-byte.github.io/ct-webview-tester/)
3. Update documentation accordingly
4. Consider potential security implications
5. Test on both iOS and Android