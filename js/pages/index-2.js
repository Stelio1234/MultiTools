const categories = [
      {
        title: "Common Tools",
        tools: [
          { name: "Timer", link: "Templates/TimeTools/timer.html", desc: "Set a countdown for tasks" },
          { name: "Unit Converter", link: "Templates/CommonTools/UnitConverter.html", desc: "Convert units ( Kinda self explanatory lol )" },
        ],
      },
      {
        title: "Calculators",
        tools: [
          { name: "Tip Calculator", link: "Templates/Calculators/tipcalculator.html", desc: "Calculate tips instantly" },
          
        ],
      },
      {
        title: "Dev Tools",
        tools: [
          { name: "Text Encrypter", link: "Templates/DevTools/encrypted.html", badge: "NEW", desc: "Encrypt and decrypt text" },
          { name: "WebClip Generator", link: "Templates/DevTools/WebClip.html", desc: "Generate webpage previews" },
        ],
      },
      {
        title: "Generators",
        tools: [
          { name: "Gamertag Generator", link: "Templates/Generators/gamertag-gen.html", desc: "Generate cool gamertags" },
          { name: "QR Code Generator", link: "Templates/Generators/qr-code-gen.html", desc: "Generate QR Codes" },
          { name: "Password Generator", link: "Templates/Generators/password-gen.html", desc: "Create passwords" },
          { name: "UUID Generator", link: "Templates/Generators/uuid-generator.html", desc: "Generate UUIDs" },
          { name: "No as a service", link: "Templates/Generators/Naas.html", desc: "An API that returns random rejection reasons"}
        ],
      },
      {
        title: "Site Info",
        tools: [
          { name: "Terms of Service", link: "Templates/Other/TOS.html" },
          { name: "Privacy Policy", link: "Templates/Other/privicypolicy.html" },
          { name: "Patch Notes", link: "Templates/Other/patchnotes.html" },
          { name: "Settings", link: "settings.html" },
          
        ],
      },
    ];

    const ALL_CATEGORIES = "All Categories";
    const POPULAR_LIMIT = 3;
    const EXCLUDE_FROM_POPULAR = new Set(["Site Info"]);

    function flattenTools(cats) {
      return cats.flatMap(cat => cat.tools.map(t => ({ ...t, category: cat.title })));
    }

    function toBase64Url(str) {
      const b64 = btoa(unescape(encodeURIComponent(str)));
      return b64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
    }

    function toolDocId(tool) {
      return toBase64Url(tool.link || tool.name || "unknown");
    }

    async function logToolOpen(tool) {
      if (!SiteConsent.allows('analytics') || !MultiTools.auth.currentUser?.emailVerified) return;

      const id = toolDocId(tool);
      const ref = MultiTools.db.collection("tool_counts").doc(id);

      const payload = {
        toolId: id,
        name: tool.name || "",
        link: tool.link || "",
        category: tool.category || "",
        badge: tool.badge || "",
        desc: tool.desc || "",
        count: firebase.firestore.FieldValue.increment(1),
        lastOpenedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await MultiTools.db.runTransaction(async transaction => {
        const snapshot = await transaction.get(ref);
        if (!SiteConsent.allows('analytics')) return;
        if (snapshot.exists) transaction.update(ref, { count: firebase.firestore.FieldValue.increment(1), lastOpenedAt: firebase.firestore.FieldValue.serverTimestamp() });
        else transaction.set(ref, payload);
      });
    }

    async function logThenNavigate(tool, href, e) {
      const isModifiedClick = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1;

      if (isModifiedClick) {
        logToolOpen(tool).catch(() => {});
        return;
      }

      e.preventDefault();

      const logPromise = logToolOpen(tool).catch(() => {});
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 350));
      await Promise.race([logPromise, timeoutPromise]);

      window.location.href = href;
    }

    function createToolCard(tool, extraClass = "") {
      const a = document.createElement("a");
      a.href = tool.link;
      a.className = `tool-card ${extraClass}`.trim();

      const heading = document.createElement('h3');
      heading.textContent = tool.name;
      if (tool.badge) {
        const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = tool.badge; heading.append(badge);
      }
      a.append(heading);
      for (const [text, className] of [[tool.desc, ''], [tool.category, 'muted tool-meta']]) {
        if (text) { const paragraph = document.createElement('p'); paragraph.className = className; paragraph.textContent = text; a.append(paragraph); }
      }
      a.addEventListener("click", (e) => logThenNavigate(tool, tool.link, e));
      return a;
    }


    function categoryCounts() {
      const counts = new Map();
      for (const cat of categories) counts.set(cat.title, cat.tools.length);
      return counts;
    }

    function renderCategoryFilter() {
      const select = document.getElementById("category-filter");
      select.innerHTML = "";

      const counts = categoryCounts();
      const allCount = flattenTools(categories).length;

      const options = [
        { value: ALL_CATEGORIES, label: `${ALL_CATEGORIES} (${allCount})` },
        ...categories.map(c => ({ value: c.title, label: `${c.title} (${counts.get(c.title) || 0})` })),
      ];

      for (const opt of options) {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        select.appendChild(o);
      }
    }

    function renderTools({ searchTerm, categoryTitle }) {
      const container = document.getElementById("tools-container");
      container.innerHTML = "";

      const term = (searchTerm || "").trim().toLowerCase();
      const categoryFilter = categoryTitle && categoryTitle !== ALL_CATEGORIES ? categoryTitle : null;

      let renderedAny = false;

      for (const cat of categories) {
        if (categoryFilter && cat.title !== categoryFilter) continue;

        const filteredTools = cat.tools
          .map(t => ({ ...t, category: cat.title }))
          .filter(t => {
            if (!term) return true;
            const hay = `${t.name} ${t.desc || ""} ${t.category}`.toLowerCase();
            return hay.includes(term);
          });

        if (filteredTools.length === 0) continue;

        renderedAny = true;

        const section = document.createElement("section");
        const h2 = document.createElement("h2");
        h2.textContent = cat.title;
        section.appendChild(h2);

        const grid = document.createElement("div");
        grid.className = "tool-grid";

        for (const tool of filteredTools) {
          grid.appendChild(createToolCard(tool));
        }

        section.appendChild(grid);
        container.appendChild(section);
      }

      if (!renderedAny) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "No tools match your search/filter. Try a different keyword.";
        container.appendChild(empty);
      }

    }

    function wireControls() {
      const search = document.getElementById("tool-search");
      const filter = document.getElementById("category-filter");

      const rerender = () => renderTools({ searchTerm: search.value, categoryTitle: filter.value });

      search.addEventListener("input", rerender);
      filter.addEventListener("change", rerender);

      rerender();
    }

    function buildToolIndexByLink() {
      const map = new Map();
      for (const t of flattenTools(categories)) map.set(t.link, t);
      return map;
    }

    async function fetchPopularFromDb(limit) {
      if (!SiteConsent.allows('analytics')) return [];
      if (!MultiTools.db) return [];

      const snap = await MultiTools.db
        .collection("tool_counts")
        .orderBy("count", "desc")
        .limit(limit * 2)
        .get();

      const results = [];
      snap.forEach(doc => results.push(doc.data()));
      return results;
    }

    let popularRequest = 0;
    async function renderPopular() {
      const request = ++popularRequest;
      const el = document.getElementById("popular-tools");
      el.innerHTML = "";

      const byLink = buildToolIndexByLink();

      try {
        const raw = await fetchPopularFromDb(POPULAR_LIMIT);
        if (request !== popularRequest) return;
        if (!SiteConsent.allows('analytics')) throw new Error('Optional statistics are disabled');

        const popular = raw
          .map(d => {
            const known = d.link ? byLink.get(d.link) : null;
            if (!known) return null;
            return { tool: known, count: Number.isSafeInteger(d.count) && d.count >= 0 ? d.count : 0 };
          })
          .filter(Boolean)
          .filter(x => x.tool.link && x.tool.link !== "#")
          .filter(x => !EXCLUDE_FROM_POPULAR.has(x.tool.category || x.tool.category))
          .slice(0, POPULAR_LIMIT);

        if (popular.length === 0) throw new Error("No popular tools yet");

        for (const item of popular) {
          const card = createToolCard(
            { ...item.tool, category: "" },
            ""
          );

          const meta = document.createElement("p");
          meta.className = "muted tool-meta";
          meta.textContent = `${item.count} recorded opens`;

          card.appendChild(meta);
          el.appendChild(card);
        }
      } catch {
        if (request !== popularRequest) return;
        const fallback = flattenTools(categories)
          .filter(t => !EXCLUDE_FROM_POPULAR.has(t.category))
          .slice(0, POPULAR_LIMIT);

        if (fallback.length === 0) {
          const empty = document.createElement("div");
          empty.className = "empty-state";
          empty.textContent = "No popular tools configured yet.";
          el.appendChild(empty);
          return;
        }

        for (const t of fallback) {
          el.appendChild(createToolCard({ ...t, category: "" }));
        }
      }

    }

    window.addEventListener("load", () => {
      renderCategoryFilter();
      wireControls();
      renderPopular().catch(() => {});
    });
    window.addEventListener('siteconsentchange', () => renderPopular().catch(() => {}));
