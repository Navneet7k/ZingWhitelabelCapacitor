package com.zing.whitelabel;

import android.os.Bundle;
import android.webkit.CookieManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Allow session cookies from cross-origin iframes (e.g. points/favorites webview).
        // Android WebView blocks third-party cookies by default.
        CookieManager.getInstance().setAcceptCookie(true);
        getBridge().getWebView().post(() ->
            CookieManager.getInstance().setAcceptThirdPartyCookies(getBridge().getWebView(), true)
        );
    }
}
