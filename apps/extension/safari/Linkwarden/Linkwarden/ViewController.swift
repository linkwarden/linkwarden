//
//  ViewController.swift
//  Linkwarden
//
//  Created by Daniel on 2026-04-23.
//

import Cocoa
import SafariServices
import WebKit

private let safariWebExtensionPointIdentifier = "com.apple.Safari.web-extension"
private let fallbackExtensionBundleIdentifier = "app.linkwarden.extension.safari"

private func resolveExtensionBundleIdentifier() -> String {
    guard let builtInPlugInsURL = Bundle.main.builtInPlugInsURL,
          let pluginURLs = try? FileManager.default.contentsOfDirectory(at: builtInPlugInsURL, includingPropertiesForKeys: nil) else {
        return fallbackExtensionBundleIdentifier
    }

    for pluginURL in pluginURLs where pluginURL.pathExtension == "appex" {
        guard let bundle = Bundle(url: pluginURL),
              let bundleIdentifier = bundle.bundleIdentifier,
              let extensionInfo = bundle.infoDictionary?["NSExtension"] as? [String: Any],
              let extensionPointIdentifier = extensionInfo["NSExtensionPointIdentifier"] as? String,
              extensionPointIdentifier == safariWebExtensionPointIdentifier else {
            continue
        }

        return bundleIdentifier
    }

    return fallbackExtensionBundleIdentifier
}

class ViewController: NSViewController, WKNavigationDelegate, WKScriptMessageHandler {

    @IBOutlet var webView: WKWebView!
    private let extensionBundleIdentifier = resolveExtensionBundleIdentifier()
    private var useSettingsInsteadOfPreferences: Bool {
        if #available(macOS 13, *) {
            return true
        }

        return false
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        self.webView.navigationDelegate = self

        self.webView.configuration.userContentController.add(self, name: "controller")

        self.webView.loadFileURL(Bundle.main.url(forResource: "Main", withExtension: "html")!, allowingReadAccessTo: Bundle.main.resourceURL!)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { (state, error) in
            DispatchQueue.main.async {
                if let state = state, error == nil {
                    webView.evaluateJavaScript("show(\(state.isEnabled), \(self.useSettingsInsteadOfPreferences))")
                } else {
                    NSLog("Failed to get Safari extension state: \(error?.localizedDescription ?? "Unknown error")")
                    webView.evaluateJavaScript("show(null, \(self.useSettingsInsteadOfPreferences))")
                }
            }
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if (message.body as! String != "open-preferences") {
            return;
        }

        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
            DispatchQueue.main.async {
                if let error = error {
                    NSLog("Failed to open Safari extension settings: \(error.localizedDescription)")
                    self.webView.evaluateJavaScript("showPreferencesError()")
                    return
                }

                NSApplication.shared.terminate(nil)
            }
        }
    }

}
