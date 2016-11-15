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

(function (mp, se) {

    "use strict";

    // Constructor
    var WebBrowser = function WebBrowser() {
        // Preferences
        this.urlPref = "";
        this.homeUrl = "";
        this.refreshingTime = 0;
        this.httpVerb = "";
        this.useProxy = false;

        // Wiring
        this.url = "";
        this.params = "";

        // Internal status:
        this.layout = new StyledElements.VerticalLayout();
        this.currentUrl = "";
    };

    WebBrowser.prototype.init = function init() {
        // Preferences:
        setPreferences.call(this);
        // Wiring:
        setWiringInputs.call(this);
        // Context:
        setResizeWidget.call(this);
        // User Interface:
        buildDOM.call(this);
    };

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================


    var setPreferences = function setPreferences() {
        this.homeUrl = mp.prefs.get("homeUrl");
        this.refreshingTime = mp.prefs.get("refreshingTime");
        this.httpVerb = mp.prefs.get("httpVerb");
        this.useProxy = mp.prefs.get("useProxy");
        mp.prefs.registerCallback(handlerPreferences.bind(this));
    };

    var setWiringInputs = function setWiringInputs() {
        mp.wiring.registerCallback("urlInput", urlInputHandler.bind(this));
        mp.wiring.registerCallback("paramsInput", paramsInputHandler.bind(this));
    };

    var setResizeWidget = function setResizeWidget() {
        mp.widget.context.registerCallback(function (newValues) {
            if ("heightInPixels" in newValues || "widthInPixels" in newValues) {
                repaint.call(this);
            }
        }.bind(this));
    };

    var buildDOM = function buildDOM() {
        // Build Layout:
        this.layout.insertInto(document.body);

        // North Layout:
        createLink.call(this, goHomeClickHandler, 'home', 'Home');
        createLink.call(this, refreshClickHandler, 'refresh', 'Refresh');

        // Center Layout:
        createIframe.call(this);
        createForm.call(this);

        // Repaint layout:
        repaint.call(this);
    };

    var loadURL = function loadURL(value) {
        var tempUrl = value;

        if (!value) {
            tempUrl = this.currentUrl;
        }

        var frm = document.getElementById('brw_form');
        var url = parseURL.call(this, tempUrl);

        for (var k in url.params) {
            var prm = document.createElement('input');
            prm.setAttribute('type', 'text');
            prm.setAttribute('name', k);
            prm.setAttribute('value', url.params[k]);
            frm.appendChild(prm);
        }

        if (url.source.split('://').length === 1) {
            tempUrl = "http://" + url.source;
        } else {
            tempUrl = url.source;
        }

        if (this.useProxy && this.useProxy === true) {
            var options = {
                method: this.httpVerb
            };
            tempUrl = mp.http.buildProxyURL(tempUrl, options);
        }

        frm.setAttribute('action', tempUrl);
        document.getElementById('browser').src = tempUrl;

        if (frm.firstChild) {
            frm.removeChild(frm.firstChild);
        }

        this.currentUrl = tempUrl;
    };

    var parseURL = function parseURL(url) {
        var a =  document.createElement('a');
        a.href = url;
        return {
            source: url,
            protocol: a.protocol.replace(':', ''),
            host: a.hostname,
            port: a.port,
            query: a.search,
            params: (function () {
                var ret = {},
                seg = a.search.replace(/^\?/, '').split('&'),
                len = seg.length, s;
                for (var i = 0; i < len; i++) {
                    if (!seg[i]) { continue; }
                    s = seg[i].split('=');
                    ret[s[0]] = s[1];
                }
                return ret;
            })(),
            file: (a.pathname.match(/\/([^\/?#]+)$/i) || [''])[1],
            hash: a.hash.replace('#', ''),
            path: a.pathname.replace(/^([^\/])/, '/$1'),
            relative: (a.href.match(/tp:\/\/[^\/]+(.+)/) || [''])[1],
            segments: a.pathname.replace(/^\//, '').split('/')
        };
    };

    // Preferences
    var handlerPreferences = function handlerPreferences(preferences) {
        if (preferences.homeUrl) {
            this.homeUrl = preferences.homeUrl;
        }

        if (preferences.refreshingTime) {
            this.refreshingTime = preferences.refreshingTime;
            setRefreshingTimePreference.call(this);
        }
        if (preferences.httpVerb) {
            this.httpVerb = preferences.httpVerb;
        }
        if (preferences.useProxy === true || preferences.useProxy === false) {
            this.useProxy = preferences.useProxy;
        }

        if (this.currentUrl) {
            loadURL.call(this);
        }
    };

    // Input
    var urlInputHandler = function urlInputHandler(url) {
        loadURL.call(this, url);
    };

    // Input
    var paramsInputHandler = function paramsInputHandler(params) {
        if (this.currentUrl) {
            var url = this.currentUrl + params;
            loadURL.call(this, url);
        }
    };

    // UI
    var goHomeClickHandler = function goHomeClickHandler() {
        loadURL.call(this, this.homeUrl);
    };

    // UI
    var refreshClickHandler = function refreshClickHandler() {
        if (this.currentUrl) {
            loadURL.call(this);
        }
    };

    var repaint = function repaint() {
        if (this.layout) {
            this.layout.repaint();
        }
    };

    var createLink = function createLink(handler, id, text) {
        var div = document.createElement('div');
        var a = document.createElement('a');
        div.addEventListener('click', handler.bind(this), false);
        div.setAttribute('id', id);
        a.textContent = text;
        div.appendChild(a);
        this.layout.getNorthContainer().appendChild(div);
    };

    var createIframe = function createIframe() {
        var iframe = document.createElement('iframe');
        iframe.setAttribute('name', 'browser');
        iframe.setAttribute('id', 'browser');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('width', '100%');
        iframe.setAttribute('height', '95%');
        this.layout.getCenterContainer().appendChild(iframe);
    };

    var createForm = function createForm() {
        var form = document.createElement('form');
        form.setAttribute('id', 'brw_form');
        form.setAttribute('method', 'get');
        form.setAttribute('target', 'browser');
        form.style.display = 'none';
        this.layout.getCenterContainer().appendChild(form);
    };

    var setRefreshingTimePreference = function setRefreshingTimePreference(time) {
        var timeValue = parseInt(time, 10);
        if (timeValue > 0) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = setInterval(loadURL.bind(this), timeValue * 60000);
        }
    };

    window.WebBrowser = WebBrowser;

})(MashupPlatform, StyledElements);
