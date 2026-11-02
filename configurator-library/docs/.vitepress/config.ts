import { defineConfig } from "vitepress";
// 1. Import the generated sidebar JSON
import typedocSidebar from "../api/typedoc-sidebar.json";

export default defineConfig({
  title: "Three Configurator",
  description: "Integration guide and API reference for the three-configurator",

  // 2. Ignore relative link errors inside auto-generated API files
  ignoreDeadLinks: true,

  themeConfig: {
    search: { provider: "local" },
    // 3. Navigation links at the top of the page
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Integration", link: "/guide/integration" },
      { text: "API", link: "/api/" },
    ],

    // 4. Define different sidebars depending on where the user is browsing
    sidebar: {
      // Sidebar for handwritten Guides
      "/guide/": [
        {
          text: "Developer Guide",
          items: [
            { text: "Installation", link: "/guide/installation" },
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Core Concepts", link: "/guide/concepts" },
            {
              text: "API Reference",
              collapsed: false,
              items: [
                { text: "FloorplanManager", link: "/guide/floorplanManager" },
                { text: "ConfiguratorCore", link: "/guide/configuratorCore" },
              ],
            },
            { text: "Interactive Events", link: "/guide/events" },
            { text: "API Event Emitters", link: "/guide/emitters" },
          ],
        },
      ],
      // Sidebar for auto-generated API Reference
      "/api/": typedocSidebar,
    },

    outline: { level: [2, 3] },

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 Prototech Solutions. All rights reserved.",
    },
  }
});
