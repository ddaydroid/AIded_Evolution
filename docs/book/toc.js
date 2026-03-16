// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded affix "><a href="introduction.html">Introduction</a></li><li class="chapter-item expanded affix "><li class="part-title">Getting Started</li><li class="chapter-item expanded "><a href="getting-started/installation.html"><strong aria-hidden="true">1.</strong> Installation</a></li><li class="chapter-item expanded "><a href="getting-started/quick-start.html"><strong aria-hidden="true">2.</strong> Quick Start</a></li><li class="chapter-item expanded affix "><li class="part-title">Usage</li><li class="chapter-item expanded "><a href="usage/repl.html"><strong aria-hidden="true">3.</strong> Interactive Mode (REPL)</a></li><li class="chapter-item expanded "><a href="usage/single-prompt.html"><strong aria-hidden="true">4.</strong> Single-Prompt Mode</a></li><li class="chapter-item expanded "><a href="usage/piped-mode.html"><strong aria-hidden="true">5.</strong> Piped Mode</a></li><li class="chapter-item expanded "><a href="usage/commands.html"><strong aria-hidden="true">6.</strong> REPL Commands</a></li><li class="chapter-item expanded "><a href="usage/multi-line.html"><strong aria-hidden="true">7.</strong> Multi-Line Input</a></li><li class="chapter-item expanded affix "><li class="part-title">Configuration</li><li class="chapter-item expanded "><a href="configuration/models.html"><strong aria-hidden="true">8.</strong> Models</a></li><li class="chapter-item expanded "><a href="configuration/system-prompts.html"><strong aria-hidden="true">9.</strong> System Prompts</a></li><li class="chapter-item expanded "><a href="configuration/thinking.html"><strong aria-hidden="true">10.</strong> Extended Thinking</a></li><li class="chapter-item expanded "><a href="configuration/skills.html"><strong aria-hidden="true">11.</strong> Skills</a></li><li class="chapter-item expanded "><a href="configuration/permissions.html"><strong aria-hidden="true">12.</strong> Permissions &amp; Safety</a></li><li class="chapter-item expanded affix "><li class="part-title">Features</li><li class="chapter-item expanded "><a href="features/sessions.html"><strong aria-hidden="true">13.</strong> Session Persistence</a></li><li class="chapter-item expanded "><a href="features/context.html"><strong aria-hidden="true">14.</strong> Context Management</a></li><li class="chapter-item expanded "><a href="features/git.html"><strong aria-hidden="true">15.</strong> Git Integration</a></li><li class="chapter-item expanded "><a href="features/cost-tracking.html"><strong aria-hidden="true">16.</strong> Cost Tracking</a></li><li class="chapter-item expanded affix "><li class="part-title">Contributing</li><li class="chapter-item expanded "><a href="contributing/mutation-testing.html"><strong aria-hidden="true">17.</strong> Mutation Testing</a></li><li class="chapter-item expanded affix "><li class="part-title">Troubleshooting</li><li class="chapter-item expanded "><a href="troubleshooting/common-issues.html"><strong aria-hidden="true">18.</strong> Common Issues</a></li><li class="chapter-item expanded "><a href="troubleshooting/safety.html"><strong aria-hidden="true">19.</strong> Safety &amp; Anti-Crash Guarantees</a></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0];
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
