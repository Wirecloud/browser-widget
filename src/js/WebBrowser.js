/*
 * Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* globals StyledElements */

(function (se) {

    "use strict";

    // Constructor
    var WebBrowser = function WebBrowser() {

        this.currentUrl = null;
    };

    WebBrowser.prototype.init = function init() {
        // Preferences:
        setPreferences.call(this);
        // Wiring:
        setWiringInputs.call(this);
        // User Interface:
        buildDOM.call(this);

        // Load initial page
        goHomeClickHandler.call(this);
    };

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================


    var setPreferences = function setPreferences() {
        this.refreshingTime = MashupPlatform.prefs.get("refreshingTime");
        MashupPlatform.prefs.registerCallback(handlerPreferences.bind(this));
    };

    var setWiringInputs = function setWiringInputs() {
        MashupPlatform.wiring.registerCallback("urlInput", urlInputHandler.bind(this));
    };

    var buildDOM = function buildDOM() {
        // Build Layout
        this.layout = new se.VerticalLayout();
        this.layout.insertInto(document.body);

        // North Layout
        createLink.call(this, goHomeClickHandler, 'home', 'Home');
        createLink.call(this, refreshClickHandler, 'refresh', 'Refresh');

        // Center Layout
        createIframe.call(this);
    };

    var loadURL = function loadURL(value) {
        var url = value;

        if (!value) {
            url = this.currentUrl;
        }

        // Check the URL provides a protocol
        // If not, use http by default
        if (url.split('://').length === 1) {
            url = "http://" + url;
        }

        this.currentUrl = url;

        var finalurl = MashupPlatform.http.buildProxyURL(url, {
            supportsAccessControl: true,
            forceProxy: MashupPlatform.prefs.get("useProxy")
        });

        document.getElementById('browser').src = finalurl;
    };

    // Preferences
    var handlerPreferences = function handlerPreferences(preferences) {
        if (preferences.refreshingTime) {
            this.refreshingTime = preferences.refreshingTime;
            setRefreshingTimePreference.call(this);
        }
    };

    // Input
    var urlInputHandler = function urlInputHandler(url) {
        loadURL.call(this, url);
    };

    // UI
    var goHomeClickHandler = function goHomeClickHandler() {
        loadURL.call(this, MashupPlatform.prefs.get('homeUrl'));
    };

    // UI
    var refreshClickHandler = function refreshClickHandler() {
        if (this.currentUrl) {
            loadURL.call(this);
        }
    };

    var createLink = function createLink(handler, id, text) {
        var div = document.createElement('div');
        var a = document.createElement('a');
        div.addEventListener('click', handler.bind(this), false);
        div.setAttribute('id', id);
        a.textContent = text;
        div.appendChild(a);
        this.layout.north.appendChild(div);
    };

    var createIframe = function createIframe() {
        var iframe = document.createElement('iframe');
        iframe.setAttribute('name', 'browser');
        iframe.setAttribute('id', 'browser');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('width', '100%');
        iframe.setAttribute('height', '95%');
        this.layout.center.appendChild(iframe);
    };

    var setRefreshingTimePreference = function setRefreshingTimePreference(time) {
        var timeValue = parseInt(time, 10);
        if (timeValue > 0) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = setInterval(loadURL.bind(this), timeValue * 60000);
        }
    };

    window.WebBrowser = WebBrowser;

})(StyledElements);
