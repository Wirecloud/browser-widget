/* globals WebBrowser */

(function () {

    "use strict";

    var webBrowser = new WebBrowser();
    window.addEventListener("DOMContentLoaded", webBrowser.init.bind(webBrowser), false);

})();
