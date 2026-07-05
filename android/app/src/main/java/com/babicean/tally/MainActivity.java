package com.babicean.tally;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();

        // Tally never shows scrollbars; the overscroll stretch is the
        // only scroll signal.
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);

        // WebView multiplies all web text by the system font-size setting
        // (textZoom). Honor it up to 115%, where the layouts still hold;
        // beyond that, sheets outgrow the screen and the UI breaks apart
        // instead of getting more readable.
        WebSettings settings = webView.getSettings();
        int zoom = settings.getTextZoom();
        settings.setTextZoom(Math.max(100, Math.min(zoom, 115)));
    }
}
