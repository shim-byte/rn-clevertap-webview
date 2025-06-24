import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewProps } from 'react-native-webview';
import CleverTap from 'clevertap-react-native';

/**
 * @interface WebViewBridgeProps
 * @description Props for the WebViewBridgeComponent.
 * @property {string} webViewUrl - The URL to be loaded in the WebView.
 * @property {string} [cleverTapVariableName="your_variable_name_here"] - The name of the JavaScript variable on the window object in the WebView
 *                                                        that will be used to interface with the CleverTap SDK.
 * @property {object} [style] - Optional custom styles for the WebView component.
 * @property {(error: any) => void} [onError] - Optional callback function to handle errors occurring during message processing.
 * @property {(message: any) => void} [onCustomMessage] - Optional callback function to handle messages from the WebView
 *                                                       that are not intended for CleverTap.
 * @property {WebViewProps} [webViewProps] - Optional additional props to be passed directly to the underlying react-native-webview component.
 */
interface WebViewBridgeProps extends Omit<WebViewProps, 'source' | 'onMessage' | 'injectedJavaScriptBeforeContentLoaded' | 'javaScriptEnabled' | 'domStorageEnabled'> {
  webViewUrl: string;
  cleverTapVariableName?: string;
  // style is already part of WebViewProps, but we can keep it for explicitness or specific typing if needed.
  // For simplicity, we'll rely on webViewProps for style and other WebView specific props.
  onError?: (error: any) => void;
  onCustomMessage?: (message: any) => void;
}

const WebViewBridgeComponent: React.FC<WebViewBridgeProps> = ({
  webViewUrl,
  cleverTapVariableName = "CleverTap", // Default variable name for CleverTap on the web side
  style,
  onError,
  onCustomMessage,
  ...webViewProps // Spread remaining props to the WebView
}) => {
  /**
   * @function handleMessage
   * @description Handles messages sent from the WebView.
   * Parses the message and, if it's a CleverTap event, calls the appropriate CleverTap SDK method.
   * If it's a custom message, it calls the onCustomMessage callback.
   * @param {WebViewMessageEvent} event - The message event from the WebView.
   */
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      // Check if the message is intended for CleverTap
      if (message.cleverTapType) {
        console.log('CleverTap WebView Bridge Message:', message); // For debugging

        switch (message.cleverTapType) {
          case 'pushEvent':
            CleverTap.recordEvent(message.eventName, message.properties || null);
            break;
          case 'pushChargedEvent':
            CleverTap.recordChargedEvent(message.chargeDetails, message.items);
            break;
          case 'pushProfile':
            CleverTap.profileSet(message.profileProperties);
            break;
          case 'onUserLogin':
            CleverTap.onUserLogin(message.profileProperties);
            break;
          case 'addMultiValueForKey':
            CleverTap.profileAddMultiValueForKey(message.value, message.key);
            break;
          case 'addMultiValuesForKey':
            CleverTap.profileAddMultiValuesForKey(message.values, message.key);
            break;
          case 'removeMultiValueForKey':
            CleverTap.profileRemoveMultiValueForKey(message.value, message.key);
            break;
          case 'removeMultiValuesForKey':
            CleverTap.profileRemoveMultiValuesForKey(message.values, message.key);
            break;
          case 'removeValueForKey':
            CleverTap.profileRemoveValueForKey(message.key);
            break;
          case 'setMultiValueForKey':
            CleverTap.profileSetMultiValuesForKey(message.values, message.key);
            break;
          case 'incrementValue':
            CleverTap.profileIncrementValueForKey(message.value, message.key);
            break;
          case 'decrementValue':
            CleverTap.profileDecrementValueForKey(message.value, message.key);
            break;
          default:
            console.warn('Unknown CleverTap WebView message type:', message.cleverTapType);
        }
      } else if (onCustomMessage) {
        // Handle custom messages if a handler is provided
        onCustomMessage(message);
      }
    } catch (error) {
      console.error('Error processing WebView message:', error, event.nativeEvent.data);
      if (onError) {
        onError(error); // Call the provided error handler
      }
    }
  };

  /**
   * @function getInjectedJavaScript
   * @description Generates the JavaScript code to be injected into the WebView.
   * This script creates a bridge object on the window (e.g., window.CleverTap)
   * that web content can use to send messages to the React Native app.
   * @param {string} variableName - The name of the global variable to create on the window object in the WebView.
   * @returns {string} The JavaScript code string.
   */
  const getInjectedJavaScript = (variableName: string) => `
    // Create the bridge object on the window
    window.${variableName} = {
      // Event Tracking
      pushEvent: function(eventName, propertiesString) {
        const message = { cleverTapType: 'pushEvent', eventName: eventName };
        if (propertiesString) {
          try { message.properties = JSON.parse(propertiesString); }
          catch (e) { console.error('Error parsing event properties for ${variableName}: ', e, propertiesString); return; }
        }
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      },
      // Charged Event
      pushChargedEvent: function(chargeDetailsString, itemsString) {
        const message = { cleverTapType: 'pushChargedEvent' };
        try {
          message.chargeDetails = JSON.parse(chargeDetailsString);
          message.items = JSON.parse(itemsString);
        } catch (e) { console.error('Error parsing charged event data for ${variableName}: ', e, chargeDetailsString, itemsString); return; }
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      },
      // User Profile: Push
      pushProfile: function(profilePropsString) {
        const message = { cleverTapType: 'pushProfile' };
        try { message.profileProperties = JSON.parse(profilePropsString); }
        catch (e) { console.error('Error parsing profile properties for ${variableName}: ', e, profilePropsString); return; }
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      },
      // User Profile: OnUserLogin
      onUserLogin: function(profilePropsString) {
        const message = { cleverTapType: 'onUserLogin' };
        try { message.profileProperties = JSON.parse(profilePropsString); }
        catch (e) { console.error('Error parsing onUserLogin properties for ${variableName}: ', e, profilePropsString); return; }
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      },
      // User Profile: Add multi-value
      addMultiValueForKey: function(key, value) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ cleverTapType: 'addMultiValueForKey', key: key, value: value }));
      },
      // User Profile: Add multi-values (array)
      addMultiValuesForKey: function(key, valuesString) {
        const message = { cleverTapType: 'addMultiValuesForKey', key: key };
        try { message.values = JSON.parse(valuesString); } // Expects a JSON string array
        catch (e) { console.error('Error parsing multi-values for key for ${variableName}: ', e, valuesString); return; }
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      },
      // User Profile: Remove multi-value
      removeMultiValueForKey: function(key, value) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ cleverTapType: 'removeMultiValueForKey', key: key, value: value }));
      },
      // User Profile: Remove multi-values (array)
      removeMultiValuesForKey: function(key, valuesString) {
        const message = { cleverTapType: 'removeMultiValuesForKey', key: key };
        try { message.values = JSON.parse(valuesString); } // Expects a JSON string array
        catch (e) { console.error('Error parsing multi-values for removal for ${variableName}: ', e, valuesString); return; }
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      },
      // User Profile: Remove value for key
      removeValueForKey: function(key) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ cleverTapType: 'removeValueForKey', key: key }));
      },
      // User Profile: Set multi-values (array)
      setMultiValueForKey: function(key, valuesString) {
        const message = { cleverTapType: 'setMultiValueForKey', key: key };
        try { message.values = JSON.parse(valuesString); } // Expects a JSON string array
        catch (e) { console.error('Error parsing multi-values for set for ${variableName}: ', e, valuesString); return; }
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      },
      // User Profile: Increment value
      incrementValue: function(key, value) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          console.error('Invalid value for incrementValue for ${variableName}, expected a number:', value);
          return;
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({ cleverTapType: 'incrementValue', key: key, value: numValue }));
      },
      // User Profile: Decrement value
      decrementValue: function(key, value) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          console.error('Invalid value for decrementValue for ${variableName}, expected a number:', value);
          return;
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({ cleverTapType: 'decrementValue', key: key, value: numValue }));
      }
    };
    // Must be true for injectedJavaScriptBeforeContentLoaded to work reliably
    true;
  `;

  return (
    <WebView
      source={{ uri: webViewUrl }}
      onMessage={handleMessage}
      // Injects JavaScript code into the WebView when the page starts loading.
      // This is preferred over injectedJavaScript for setting up communication bridges
      // as it runs before the page's own scripts.
      injectedJavaScriptBeforeContentLoaded={getInjectedJavaScript(cleverTapVariableName)}
      javaScriptEnabled={true} // Ensure JavaScript is enabled in the WebView
      domStorageEnabled={true} // Ensure DOM Storage (localStorage, sessionStorage) is enabled
      style={style || styles.webviewDefault} // Apply custom or default styles
      {...webViewProps} // Pass through any other WebView props
    />
  );
};

const styles = StyleSheet.create({
  webviewDefault: {
    flex: 1, // Default style to make WebView fill its container
  }
});

export default WebViewBridgeComponent;