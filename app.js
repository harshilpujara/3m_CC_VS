(function () {
  "use strict";

  var SERIES = [
    { key: "actual", label: "Actual", color: "#26355c", dash: "" },
    { key: "op", label: "OP", color: "#6a3fd1", dash: "6 3" },
    { key: "estimate", label: "Estimate", color: "#9b7de0", dash: "2 3" },
    { key: "lastYr", label: "Last Yr.", color: "#2fc0d6", dash: "" }
  ];

  var PERIOD_LABELS = [
    ["20", "Feb '26"],
    ["27", "Feb '26"],
    ["06", "Mar '26"],
    ["13", "Mar '26"],
    ["20*", "Mar '26"]
  ];

  var DIMENSION_BG_TEMPLATE = [
    { name: "SIBG", owner: "Jack F." },
    { name: "TEBG", owner: "James D." },
    { name: "CBG", owner: "Jeff T." }
  ];

  var DIMENSION_AREA_TEMPLATE = [
    { name: "North America", pct: 0.34, owner: "Priya Nair" },
    { name: "EMEA", pct: 0.22, owner: "Arjun Mehta" },
    { name: "Industrial", pct: 0.19, owner: "T. Osei" },
    { name: "Adhesives", pct: 0.15, owner: "Elena Popova" },
    { name: "Plant 12 – Austin", pct: 0.10, owner: "R. Chen" }
  ];

  var DRIVER_TEMPLATE = [
    { name: "Supplier Delays", pct: 0.32, trend: "up", owner: "M. Alvarez", status: "active" },
    { name: "Inventory Shortages", pct: 0.24, trend: "up", owner: "R. Chen", status: "monitoring" },
    { name: "Quality Holds", pct: 0.18, trend: "down", owner: "T. Osei", status: "monitoring" },
    { name: "Late Customer Approvals", pct: 0.12, trend: "down", owner: "J. Farrell", status: "resolved" }
  ];

  function seededSeries(seed, base, spread, trendUp) {
    var out = [];
    for (var i = 0; i < 5; i++) {
      var wave = Math.sin(seed * 1.7 + i * 1.15) * spread;
      var drift = trendUp ? i * (spread * 0.18) : -i * (spread * 0.12);
      out.push(Math.round(base + wave + drift));
    }
    return out;
  }

  function buildCard(cfg) {
    var value = cfg.value;
    var target = cfg.target;
    var varianceUp = cfg.varianceDir === "up";
    var spread = Math.abs(value - target);
    var seed = cfg.id;

    var actualBase = varianceUp ? 78 : 88;
    var chart = {
      actual: seededSeries(seed, actualBase, 6, varianceUp),
      op: seededSeries(seed + 1, actualBase + 6, 5, varianceUp),
      estimate: seededSeries(seed + 2, actualBase + 3, 5, varianceUp),
      lastYr: seededSeries(seed + 3, actualBase - 10, 5, false),
      labels: PERIOD_LABELS
    };

    var drivers = DRIVER_TEMPLATE.map(function (d) {
      return {
        name: d.name,
        impact: Math.round(spread * d.pct) || 1,
        trend: d.trend,
        owner: d.owner,
        status: d.status
      };
    });

    // Every business-group row mirrors the card's own value/target in this
    // mock (the source design shows identical figures across SIBG/TEBG/CBG),
    // varying only by owner. Area rows instead split the value out by
    // pct-of-whole, same as the KPI card's own breakdown used to.
    var dimBg = DIMENSION_BG_TEMPLATE.map(function (b) {
      return {
        name: b.name, owner: b.owner, value: value, target: target,
        varianceDisplay: (varianceUp ? "▲ $" : "▼ $") + spread + "M", varianceDir: cfg.varianceDir
      };
    });
    var dimArea = DIMENSION_AREA_TEMPLATE.map(function (a) {
      var areaValue = Math.round(value * a.pct);
      var areaTarget = Math.round(target * a.pct);
      var areaSpread = Math.abs(areaValue - areaTarget);
      return {
        name: a.name, owner: a.owner, value: areaValue, target: areaTarget,
        varianceDisplay: (varianceUp ? "▲ $" : "▼ $") + areaSpread + "M", varianceDir: cfg.varianceDir
      };
    });
    var dimensions = { bg: dimBg, area: dimArea, both: dimBg.concat(dimArea) };

    return {
      id: cfg.id,
      title: "Aged Backlog",
      value: value,
      valueDisplay: "$" + value + "M",
      valueClass: varianceUp ? "" : "dark",
      badge: cfg.badge,
      owner: cfg.owner,
      target: "$" + target + "M",
      varianceDisplay: (varianceUp ? "▲ $" : "▼ $") + spread + "M",
      varianceDir: cfg.varianceDir,
      chart: chart,
      dimensions: dimensions,
      drivers: drivers,
      hasRecoveryPlan: cfg.hasRecoveryPlan
    };
  }

  var CARD_CONFIG = [
    { id: 1, value: 120, target: 80, varianceDir: "up", badge: "Escalated", owner: "Nick Skwiat", hasRecoveryPlan: true, weeklyChange: "$5M" },
    { id: 2, value: 120, target: 80, varianceDir: "up", badge: "Status", owner: "John Doe", hasRecoveryPlan: true, weeklyChange: "$5M" },
    { id: 3, value: 120, target: 80, varianceDir: "up", badge: "Escalated", owner: "John Doe", hasRecoveryPlan: true, weeklyChange: "$5M" },
    { id: 4, value: 70, target: 80, varianceDir: "down", badge: null, owner: "Nick Skwiat", hasRecoveryPlan: false, weeklyChange: "$5M" },
    { id: 5, value: 70, target: 80, varianceDir: "down", badge: null, owner: "Nick Skwiat", hasRecoveryPlan: false, weeklyChange: "$5M" },
    { id: 6, value: 70, target: 80, varianceDir: "down", badge: null, owner: "Nick Skwiat", hasRecoveryPlan: false, weeklyChange: "$5M" },
    { id: 7, value: 70, target: 80, varianceDir: "down", badge: null, owner: "Nick Skwiat", hasRecoveryPlan: false, weeklyChange: "$5M" }
  ];

  var CARDS = {};
  CARD_CONFIG.forEach(function (cfg) {
    CARDS[cfg.id] = buildCard(cfg);
  });

  var grid = document.querySelector(".grid");
  var panel = document.getElementById("detailsPanel");
  var closeBtn = document.getElementById("dpClose");
  var activeId = null;

  function el(tag, className, html) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function svgEl(tag, attrs) {
    var e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Manual rAF interpolation: CSS transitions on SVG geometry attributes
  // (width/x/etc set via setAttribute) don't reliably animate across
  // browsers, so the chart sweep-reveal drives the attribute directly.
  function animateAttr(node, attr, from, to, duration) {
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      var value = from + (to - from) * easeOutCubic(t);
      node.setAttribute(attr, value);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function animateStyleWidth(node, toPct, duration) {
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      node.style.width = (toPct * easeOutCubic(t)) + "%";
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function renderLegend(data) {
    var wrap = document.getElementById("chartLegend");
    wrap.innerHTML = "";
    SERIES.forEach(function (s) {
      var item = el("div", "legend-item");
      var swatch = el("span", "legend-swatch");
      swatch.style.background = s.color;
      item.appendChild(swatch);
      item.appendChild(document.createTextNode(s.label));
      wrap.appendChild(item);
    });
  }

  function renderChart(data) {
    var svg = document.getElementById("trendChart");
    var tooltip = document.getElementById("chartTooltip");
    svg.innerHTML = "";

    var x0 = 34, x1 = 372, y0 = 14, y1 = 152;
    var yMin = 60, yMax = 100;
    var n = data.labels.length;
    var xStep = (x1 - x0) / (n - 1);

    function xAt(i) { return x0 + i * xStep; }
    function yAt(v) { return y1 - ((v - yMin) / (yMax - yMin)) * (y1 - y0); }

    var clipId = "chartClip" + Math.random().toString(36).slice(2, 8);
    var defs = svgEl("defs", {});
    var clipRect = svgEl("rect", { x: x0, y: 0, width: 0, height: 190, class: "chart-reveal" });
    var clipPath = svgEl("clipPath", { id: clipId });
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);
    svg.appendChild(defs);

    var fadeGroup = svgEl("g", { class: "chart-fade" });
    var revealGroup = svgEl("g", {});
    revealGroup.setAttribute("clip-path", "url(#" + clipId + ")");

    // gridlines + y labels
    for (var gv = yMin; gv <= yMax; gv += 10) {
      var gy = yAt(gv);
      fadeGroup.appendChild(svgEl("line", {
        x1: x0, x2: x1, y1: gy, y2: gy,
        stroke: "#ececf1", "stroke-width": "1"
      }));
      var label = svgEl("text", { x: x0 - 8, y: gy + 3, "text-anchor": "end", "font-size": "9", fill: "#a0a0a8" });
      label.textContent = gv + "%";
      fadeGroup.appendChild(label);
    }

    // x labels
    for (var i = 0; i < n; i++) {
      var lx = xAt(i);
      var t1 = svgEl("text", { x: lx, y: y1 + 15, "text-anchor": "middle", "font-size": "9", "font-weight": "700", fill: "#75757e" });
      t1.textContent = data.labels[i][0];
      fadeGroup.appendChild(t1);
      var t2 = svgEl("text", { x: lx, y: y1 + 26, "text-anchor": "middle", "font-size": "8", fill: "#a0a0a8" });
      t2.textContent = data.labels[i][1];
      fadeGroup.appendChild(t2);
    }

    SERIES.forEach(function (s) {
      var values = data[s.key];
      var points = values.map(function (v, i) { return xAt(i) + "," + yAt(v); }).join(" ");
      var line = svgEl("polyline", {
        points: points,
        fill: "none",
        stroke: s.color,
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      });
      if (s.dash) line.setAttribute("stroke-dasharray", s.dash);
      revealGroup.appendChild(line);

      values.forEach(function (v, i) {
        var cx = xAt(i), cy = yAt(v);
        var circle = svgEl("circle", { cx: cx, cy: cy, r: "3", fill: s.color, class: "chart-point" });
        circle.addEventListener("mouseenter", function () {
          var rect = svg.getBoundingClientRect();
          var px = (cx / 380) * rect.width;
          var py = (cy / 190) * rect.height;
          tooltip.textContent = s.label + " · " + data.labels[i].join(" ") + " · " + v + "%";
          tooltip.style.left = px + "px";
          tooltip.style.top = py + "px";
          tooltip.classList.add("visible");
        });
        circle.addEventListener("mouseleave", function () {
          tooltip.classList.remove("visible");
        });
        revealGroup.appendChild(circle);
      });
    });

    svg.appendChild(fadeGroup);
    svg.appendChild(revealGroup);

    // Kick the entrance animation off on the next frame so the browser
    // paints the zero-width / zero-opacity state first.
    requestAnimationFrame(function () {
      animateAttr(clipRect, "width", 0, x1 - x0, 900);
      fadeGroup.classList.add("shown");
    });
  }

  function stagger(node, index) {
    node.classList.add("enter-stagger");
    node.style.animationDelay = (index * 55) + "ms";
    // The fill-mode-both entrance animation holds opacity/transform at their
    // finished values with animation-level priority, which would otherwise
    // block later plain CSS state classes (e.g. dismiss animations) from
    // taking effect on the same properties. Drop it once it has played.
    node.addEventListener("animationend", function handler() {
      node.classList.remove("enter-stagger");
      node.removeEventListener("animationend", handler);
    }, { once: true });
    return node;
  }

  function icon(name, extraClass) {
    return '<span class="material-symbols-outlined' + (extraClass ? " " + extraClass : "") + '">' + name + "</span>";
  }

  /* ---------- Shared sortable-table helpers (Tasks, Drafts, Inform Flags/Archive) ---------- */

  // Display dates in this app are all "Mon D, YYYY" strings (e.g. "Jul 31,
  // 2026"), which Date.parse handles natively — this just guards blanks.
  function parseDisplayDate(s) {
    if (!s) return 0;
    var t = Date.parse(s);
    return isNaN(t) ? 0 : t;
  }

  function buildSortableTh(label, key, sortState, onSort) {
    var th = document.createElement("th");
    th.className = "sortable-th";
    var active = sortState.key === key;
    var arrowIcon = active ? (sortState.dir === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more";
    th.innerHTML = label + ' <span class="material-symbols-outlined sort-arrow' + (active ? " active" : "") + '">' + arrowIcon + "</span>";
    th.addEventListener("click", function () {
      if (sortState.key === key) sortState.dir = sortState.dir === "asc" ? "desc" : "asc";
      else { sortState.key = key; sortState.dir = "asc"; }
      onSort();
    });
    return th;
  }

  function sortRows(rows, sortState, comparators) {
    var cmp = sortState.key && comparators[sortState.key];
    if (!cmp) return rows;
    var sorted = rows.slice().sort(cmp);
    if (sortState.dir === "desc") sorted.reverse();
    return sorted;
  }

  var TREND_ICON = { up: "arrow_upward", down: "arrow_downward" };
  var DRIVER_ICON = { active: "priority_high", monitoring: "visibility", resolved: "check_circle" };

  function renderDrivers(list) {
    var wrap = document.getElementById("driverList");
    wrap.innerHTML = "";
    list.forEach(function (d, idx) {
      var card = el("div", "driver-card");
      var top = el("div", "driver-top");
      top.appendChild(el("span", "driver-name", d.name));
      top.appendChild(el("span", "driver-impact", "$" + d.impact + "M"));
      card.appendChild(top);

      var meta = el("div", "driver-meta");
      var trendCls = d.trend === "up" ? "trend-up" : "trend-down";
      meta.appendChild(el("span", "driver-owner", d.owner + " · " + icon(TREND_ICON[d.trend], "trend-icon " + trendCls) + " trending " + d.trend));
      meta.appendChild(el("span", "driver-status " + d.status, icon(DRIVER_ICON[d.status], "status-icon") + d.status.charAt(0).toUpperCase() + d.status.slice(1)));
      card.appendChild(meta);
      wrap.appendChild(stagger(card, idx));
    });
  }

  var STATUS_LABEL = { "on-track": "On Track", "at-risk": "At Risk", "blocked": "Blocked" };
  var ACTION_ICON = { recovery: "add_circle", action: "bolt", decision: "chat_bubble", inform: "mic", recognition: "star" };

  /* ---------- Dimensions tab (BG / Area / Both) ---------- */

  function renderDimensions(id) {
    var data = CARDS[id];
    var rows = data.dimensions[dimensionMode];
    var wrap = document.getElementById("dimensionList");
    wrap.innerHTML = "";
    rows.forEach(function (d, idx) {
      var row = el("div", "dim-row");
      row.appendChild(el("span", "dim-name", d.name));
      row.appendChild(el("span", "dim-value", "$" + d.value + "M"));
      row.appendChild(el("span", "dim-target", "Target <b>$" + d.target + "M</b>"));
      row.appendChild(el("span", "change dim-variance " + d.varianceDir, d.varianceDisplay));
      row.appendChild(el("span", "dim-owner", d.owner));
      wrap.appendChild(stagger(row, idx));
    });
  }

  /* ---------- Tasks / Recovery Plan tabs (ticket lists) ---------- */

  // "Today" for bucketing ticket due dates into Past Due / Due Soon /
  // In Progress — kept fixed so the mock data reads consistently.
  var REFERENCE_TODAY = new Date(2026, 7, 4);
  var TICKET_BADGE = {
    "past-due": { label: "Past Due", icon: "priority_high" },
    "due-soon": { label: "Due Soon", icon: "schedule" },
    "in-progress": { label: "In Progress", icon: "north_east" }
  };

  function dueBucket(dateObj) {
    var diffDays = Math.round((dateObj - REFERENCE_TODAY) / 86400000);
    if (diffDays < 0) return "past-due";
    if (diffDays <= 14) return "due-soon";
    return "in-progress";
  }

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  function formatDueNumeric(dateObj) {
    return pad2(dateObj.getMonth() + 1) + "-" + pad2(dateObj.getDate()) + "-" + dateObj.getFullYear();
  }

  var TICKET_TITLE_TEMPLATES = {
    recovery: ["Execute recovery plan", "Escalate recovery timeline review", "Validate recovery action closure", "Recovery plan check-in", "Confirm root-cause remediation", "Close out recovery milestone"],
    action: ["Increase recruitment at site", "Expedite vendor payment approval", "Resolve backlog ticket queue", "Update staffing allocation plan", "Reassign overdue work orders", "Clear quality hold backlog"],
    decision: ["Approve budget reallocation", "Select vendor renewal option", "Confirm headcount freeze exception", "Ratify pricing adjustment", "Choose logistics provider", "Sign off on scope change"],
    inform: ["Share weekly ops summary", "Circulate compliance update", "Publish backlog status note", "Broadcast policy change", "Send stakeholder briefing", "Distribute forecast revision"],
    recognition: ["Recognize Austin team performance", "Nominate Plant 12 shift lead", "Acknowledge vendor partnership", "Celebrate quality milestone", "Highlight top contributor", "Commend safety record"]
  };

  var CARD_CATEGORY_TICKETS = {};

  function getCategoryTickets(cardId, category, count) {
    var key = cardId + "::" + category;
    if (!CARD_CATEGORY_TICKETS[key]) {
      var titles = TICKET_TITLE_TEMPLATES[category];
      var people = ["Jeff Welsh", "Priya Nair", "Arjun Mehta", "T. Osei", "Elena Popova", "R. Chen"];
      var roles = ["Site Operations", "VP Marketing", "Legal Counsel", "Quality Director", "FP&A Analyst", "Commercial Ops"];
      var statuses = ["on-track", "at-risk", "blocked"];
      var list = [];
      for (var i = 0; i < count; i++) {
        var ticketNum = 5560 + ((cardId * 7 + i * 13) % 400);
        var due = new Date(2026, 7, 1 + i * 4);
        list.push({
          id: key + "_" + i,
          title: ticketNum + " – " + titles[i % titles.length],
          direction: i % 2 === 0 ? "incoming" : "outgoing",
          person: people[i % people.length],
          role: roles[i % roles.length],
          due: due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          dueNumeric: formatDueNumeric(due),
          dueBucket: dueBucket(due),
          critical: i % 4 === 0,
          escalated: i % 3 === 0,
          status: statuses[i % statuses.length],
          progress: 20 + ((i * 17) % 80),
          description: "Placeholder " + category + " item generated for this KPI card.",
          updates: []
        });
      }
      CARD_CATEGORY_TICKETS[key] = list;
    }
    return CARD_CATEGORY_TICKETS[key];
  }

  function renderTicketStatRow(containerId, tickets) {
    var wrap = document.getElementById(containerId);
    wrap.innerHTML = "";
    var stats = [
      { label: "Critical", value: tickets.filter(function (t) { return t.critical; }).length, cls: "critical" },
      { label: "Escalated", value: tickets.filter(function (t) { return t.escalated; }).length, cls: "escalated" },
      { label: "Due Soon", value: tickets.filter(function (t) { return t.dueBucket === "due-soon"; }).length, cls: "due-soon" },
      { label: "Past Due", value: tickets.filter(function (t) { return t.dueBucket === "past-due"; }).length, cls: "past-due" }
    ];
    stats.forEach(function (s) {
      var tile = el("div", "ticket-stat");
      tile.appendChild(el("span", "ticket-stat-label", s.label));
      tile.appendChild(el("span", "ticket-stat-value " + s.cls, String(s.value)));
      wrap.appendChild(tile);
    });
  }

  function renderTicketList(containerId, tickets) {
    var wrap = document.getElementById(containerId);
    wrap.innerHTML = "";
    tickets.forEach(function (t, idx) {
      var badge = TICKET_BADGE[t.dueBucket];
      var row = el("div", "ticket-row");
      row.appendChild(el("span", "ticket-row-icon " + t.dueBucket + " material-symbols-outlined", badge.icon));

      var main = el("div", "ticket-row-main");
      var top = el("div", "ticket-row-top");
      top.appendChild(el("span", "ticket-row-title", t.title));
      top.appendChild(el("span", "ticket-badge " + t.dueBucket, badge.label));
      main.appendChild(top);

      var meta = el("div", "ticket-row-meta");
      meta.appendChild(el("span", "ticket-row-owner", t.person));
      meta.appendChild(el("span", "ticket-row-due", "Due Date: " + t.dueNumeric));
      main.appendChild(meta);

      row.appendChild(main);
      row.addEventListener("click", function () { openActionTicket(t); });
      wrap.appendChild(stagger(row, idx));
    });
  }

  function renderTaskCategory(id) {
    var tickets = getCategoryTickets(id, taskCategoryMode, 8);
    renderTicketStatRow("taskStatRow", tickets);
    renderTicketList("taskTicketList", tickets);
  }

  function renderRecoveryPlan(id) {
    var tickets = getCategoryTickets(id, "recovery", 6);
    renderTicketStatRow("recoveryStatRow", tickets);
    renderTicketList("recoveryTicketList", tickets);
  }

  /* ---------- Dimensions / Tasks segmented toggles + subtab nav ---------- */

  var dimensionMode = "bg";
  var taskCategoryMode = "action";

  document.getElementById("dimensionToggle").addEventListener("click", function (evt) {
    var btn = evt.target.closest(".seg-btn");
    if (!btn || !activeId) return;
    dimensionMode = btn.getAttribute("data-mode");
    this.querySelectorAll(".seg-btn").forEach(function (b) { b.classList.toggle("active", b === btn); });
    renderDimensions(activeId);
  });

  document.getElementById("taskCategoryToggle").addEventListener("click", function (evt) {
    var btn = evt.target.closest(".seg-btn");
    if (!btn || !activeId) return;
    taskCategoryMode = btn.getAttribute("data-mode");
    this.querySelectorAll(".seg-btn").forEach(function (b) { b.classList.toggle("active", b === btn); });
    renderTaskCategory(activeId);
  });

  document.getElementById("dpSubtabs").addEventListener("click", function (evt) {
    var btn = evt.target.closest(".dp-subtab");
    if (!btn) return;
    var target = btn.getAttribute("data-subtab");
    this.querySelectorAll(".dp-subtab").forEach(function (b) {
      var on = b === btn;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".dp-subtab-panel").forEach(function (p) {
      p.hidden = p.getAttribute("data-subtab-panel") !== target;
    });
  });

  var kpiOverviewContent = document.getElementById("kpiOverviewContent");
  var taskTypePanelContent = document.getElementById("taskTypePanelContent");
  var activeTaskKey = null;

  function openDetails(id) {
    var data = CARDS[id];
    if (!data) return;

    activeId = id;
    activeTaskKey = null;
    kpiOverviewContent.hidden = false;
    taskTypePanelContent.hidden = true;

    document.getElementById("dpTitle").textContent = data.title;
    var dpValue = document.getElementById("dpValue");
    dpValue.textContent = data.valueDisplay;
    dpValue.className = "dp-value" + (data.valueClass ? " " + data.valueClass : "");

    var dpBadge = document.getElementById("dpBadge");
    if (data.badge) {
      dpBadge.style.display = "";
      document.getElementById("dpBadgeText").textContent = data.badge;
    } else {
      dpBadge.style.display = "none";
    }

    document.getElementById("dpTarget").textContent = data.target;
    var dpVariance = document.getElementById("dpVariance");
    dpVariance.textContent = data.varianceDisplay;
    dpVariance.className = "change " + data.varianceDir;

    renderLegend(data.chart);
    renderChart(data.chart);
    renderDrivers(data.drivers);

    // Every card opens back on Dimensions / BG / Actions, regardless of
    // which subtab or segment was left active on the previously viewed card.
    dimensionMode = "bg";
    taskCategoryMode = "action";
    document.querySelectorAll(".dp-subtab").forEach(function (b, idx) {
      b.classList.toggle("active", idx === 0);
      b.setAttribute("aria-selected", idx === 0 ? "true" : "false");
    });
    document.querySelectorAll(".dp-subtab-panel").forEach(function (p, idx) {
      p.hidden = idx !== 0;
    });
    document.querySelectorAll("#dimensionToggle .seg-btn").forEach(function (b, idx) {
      b.classList.toggle("active", idx === 0);
    });
    document.querySelectorAll("#taskCategoryToggle .seg-btn").forEach(function (b, idx) {
      b.classList.toggle("active", idx === 0);
    });
    renderDimensions(id);
    renderTaskCategory(id);
    renderRecoveryPlan(id);

    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    grid.classList.add("has-selection");
    document.querySelectorAll(".card-unit").forEach(function (c) {
      c.classList.toggle("selected", c.getAttribute("data-card-id") === String(id));
    });
  }

  function closeDetails() {
    activeId = null;
    activeTaskKey = null;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    grid.classList.remove("has-selection");
    document.querySelectorAll(".card-unit").forEach(function (c) {
      c.classList.remove("selected");
    });
  }

  document.querySelectorAll(".card-unit").forEach(function (card) {
    card.addEventListener("click", function () {
      var id = card.getAttribute("data-card-id");
      if (String(activeId) === id) {
        closeDetails();
      } else {
        openDetails(id);
      }
    });
    card.addEventListener("keydown", function (evt) {
      if (evt.key === "Enter" || evt.key === " ") {
        evt.preventDefault();
        card.click();
      }
    });
  });

  document.querySelectorAll(".assignee-chip").forEach(function (btn) {
    btn.addEventListener("click", function (evt) { evt.stopPropagation(); });
  });
  document.querySelectorAll(".plus-btn").forEach(function (btn) {
    btn.addEventListener("click", function (evt) {
      evt.stopPropagation();
      var row = btn.closest(".panel-row");
      var cardEl = btn.closest(".card-unit");
      var label = row ? row.querySelector(".label-text") : null;
      openCreateTaskModal(cardEl ? cardEl.getAttribute("data-card-id") : null, label ? label.textContent : "Action");
    });
  });

  // Row label click: drill into the list of items for that task type on
  // that specific card, in the same sliding side panel used for the whole
  // KPI overview — a different action from the "+" button, which creates
  // a brand-new item instead of listing the existing ones.
  var CARD_TYPE_TASKS = {};

  function getCardTypeTasks(cardId, typeKey, count) {
    var key = cardId + "::" + typeKey;
    if (!CARD_TYPE_TASKS[key]) {
      var statuses = ["on-track", "at-risk", "blocked"];
      var people = ["Priya Nair", "Arjun Mehta", "T. Osei", "Elena Popova", "R. Chen"];
      var roles = ["VP Marketing", "Legal Counsel", "Quality Director", "FP&A Analyst", "Commercial Ops"];
      var cardTitle = (CARDS[cardId] && CARDS[cardId].title) || "Aged Backlog";
      var list = [];
      for (var i = 0; i < count; i++) {
        list.push({
          id: key + "_" + i,
          title: typeKey + " " + (i + 1) + " — " + cardTitle,
          direction: i % 2 === 0 ? "incoming" : "outgoing",
          person: people[i % people.length],
          role: roles[i % roles.length],
          due: "Aug " + (1 + i) + ", 2026",
          status: statuses[i % statuses.length],
          progress: 20 + ((i * 17) % 80),
          description: "Placeholder " + typeKey.toLowerCase() + " item generated for this KPI card.",
          updates: []
        });
      }
      CARD_TYPE_TASKS[key] = list;
    }
    return CARD_TYPE_TASKS[key];
  }

  function renderTaskTypePanel(cardId, typeKey, count) {
    taskTypePanelContent.innerHTML = "";
    var tasks = getCardTypeTasks(cardId, typeKey, count);
    var cardTitle = (CARDS[cardId] && CARDS[cardId].title) || "Aged Backlog";

    var headerTop = el("div", "dp-header-top");
    headerTop.appendChild(el("span", "dp-title", typeKey + " (" + tasks.length + ")"));
    var closeBtn2 = el("button", "dp-close", icon("close"));
    closeBtn2.type = "button";
    closeBtn2.setAttribute("aria-label", "Close details panel");
    closeBtn2.addEventListener("click", closeDetails);
    headerTop.appendChild(closeBtn2);
    taskTypePanelContent.appendChild(headerTop);

    taskTypePanelContent.appendChild(el("p", "decision-desc", "All " + typeKey + " items for " + cardTitle + "."));

    var addBtn = el("button", "briefing-btn briefing-btn-ack", icon("add_circle") + "Add " + typeKey);
    addBtn.type = "button";
    addBtn.style.marginBottom = "16px";
    addBtn.addEventListener("click", function () { openCreateTaskModal(cardId, typeKey); });
    taskTypePanelContent.appendChild(addBtn);

    var list = el("div", "action-list");
    var fills = [];
    tasks.forEach(function (t, idx) {
      var card = el("div", "action-card");
      card.style.cursor = "pointer";

      var top = el("div", "action-top");
      top.appendChild(el("span", "action-name", t.title));
      top.appendChild(el("span", "action-direction " + t.direction, (t.direction === "incoming" ? "From " : "To ") + t.person));
      card.appendChild(top);

      var meta = el("div", "action-meta");
      meta.appendChild(el("span", "", t.role));
      meta.appendChild(el("span", "", "Due: " + t.due));
      meta.appendChild(el("span", "action-status " + t.status, PLANNER_STATUS_LABEL[t.status]));
      card.appendChild(meta);

      var track = el("div", "action-progress-track");
      var fill = el("div", "action-progress-fill");
      if (t.status === "blocked") fill.style.background = "#b20e18";
      else if (t.status === "at-risk") fill.style.background = "#c95100";
      track.appendChild(fill);
      card.appendChild(track);
      fills.push({ el: fill, progress: t.progress });

      card.addEventListener("click", function () {
        openActionTicket(t);
      });

      list.appendChild(stagger(card, idx));
    });
    taskTypePanelContent.appendChild(list);
    requestAnimationFrame(function () {
      fills.forEach(function (f) { animateStyleWidth(f.el, f.progress, 700); });
    });
  }

  function openTaskTypePanel(cardId, typeKey, count) {
    activeId = null;
    activeTaskKey = cardId + "::" + typeKey;
    kpiOverviewContent.hidden = true;
    taskTypePanelContent.hidden = false;
    renderTaskTypePanel(cardId, typeKey, count);

    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    grid.classList.add("has-selection");
    document.querySelectorAll(".card-unit").forEach(function (c) {
      c.classList.toggle("selected", c.getAttribute("data-card-id") === String(cardId));
    });
  }

  document.querySelectorAll(".panel-row .left").forEach(function (leftEl) {
    leftEl.style.cursor = "pointer";
    leftEl.addEventListener("click", function (evt) {
      evt.stopPropagation();
      var row = leftEl.closest(".panel-row");
      var cardEl = leftEl.closest(".card-unit");
      var label = row.querySelector(".label-text");
      var countEl = row.querySelector(".count");
      var count = (countEl && countEl.firstChild) ? (parseInt(countEl.firstChild.nodeValue, 10) || 0) : 0;
      var cardId = cardEl.getAttribute("data-card-id");
      var typeKey = label ? label.textContent : "Action";
      var key = cardId + "::" + typeKey;
      if (activeTaskKey === key) {
        closeDetails();
      } else {
        openTaskTypePanel(cardId, typeKey, count);
      }
    });
  });

  closeBtn.addEventListener("click", closeDetails);
  document.addEventListener("keydown", function (evt) {
    if (evt.key === "Escape") closeDetails();
  });

  // Once the page-load entrance animation finishes, drop the class that
  // drives it so later opacity changes (dim/select on card click) are
  // plain cascade rules again, not fighting a finished keyframe fill.
  document.querySelectorAll(".card-unit.enter").forEach(function (card) {
    card.addEventListener("animationend", function () {
      card.classList.remove("enter");
    }, { once: true });
  });

  // Give each weekly-record bar a native tooltip describing that week,
  // so the hover state on the grid (not just the details panel) carries
  // real information instead of being purely decorative.
  var WEEK_LABELS = ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7", "Wk 8 (current)"];
  document.querySelectorAll(".bars").forEach(function (barsEl) {
    barsEl.querySelectorAll(".bar").forEach(function (bar, i) {
      var status = bar.classList.contains("green") ? "Within target" : "Above target";
      bar.title = WEEK_LABELS[i] + " · " + status;
    });
  });

  /* =====================================================================
     Daily Planner — Today's Briefings
     ===================================================================== */

  var scorecardView = document.getElementById("scorecardView");
  var plannerView = document.getElementById("plannerView");

  // Daily Planner used to be one long stacked scroll (Briefings, Decisions,
  // Actions, Drafts one after another); it's now split into tabs so only one
  // section is on screen at a time. Each section's render is deferred until
  // its tab is actually shown — charts built while a panel is display:none
  // measure a clientWidth of 0 (elements inside a hidden subtree have no
  // real layout box) and render stretched, so rendering only happens once
  // the panel holding them is visible.
  var activePlannerTab = "inform";
  var plannerTabRendered = { inform: false, decisions: false, tasks: false, drafts: false };
  var draftsUnseen = 0;

  function updateDraftsTabDot() {
    var tab = document.querySelector('.planner-tab[data-planner-tab="drafts"]');
    if (!tab) return;
    var dot = tab.querySelector(".notify-dot");
    if (draftsUnseen > 0) {
      if (!dot) tab.appendChild(el("span", "notify-dot"));
    } else if (dot) {
      dot.remove();
    }
  }

  function renderPlannerTab(tabName) {
    if (plannerTabRendered[tabName]) return;
    plannerTabRendered[tabName] = true;
    if (tabName === "inform") { renderActiveVersion(); renderInformArchiveTable(); }
    else if (tabName === "decisions") renderDecisions();
    else if (tabName === "tasks") renderPlannerActions();
    else if (tabName === "drafts") renderDraftsStage();
  }

  // A divider sitting right against a highlighted (active or hovered) tab
  // reads as clutter, so it's hidden on whichever side has one. Driven from
  // JS rather than a CSS :has() selector so it doesn't depend on selector
  // support in whatever's rendering the page.
  function updatePlannerTabDividers() {
    document.querySelectorAll(".planner-tab-divider").forEach(function (div) {
      var prev = div.previousElementSibling;
      var next = div.nextElementSibling;
      function isHighlighted(el) {
        return !!el && (el.classList.contains("active") || el.classList.contains("tab-hovering"));
      }
      div.classList.toggle("divider-hidden", isHighlighted(prev) || isHighlighted(next));
    });
  }

  document.querySelectorAll(".planner-tab").forEach(function (btn) {
    btn.addEventListener("mouseenter", function () {
      btn.classList.add("tab-hovering");
      updatePlannerTabDividers();
    });
    btn.addEventListener("mouseleave", function () {
      btn.classList.remove("tab-hovering");
      updatePlannerTabDividers();
    });
    btn.addEventListener("click", function () {
      var tabName = btn.getAttribute("data-planner-tab");
      if (tabName === "drafts" && draftsUnseen > 0) {
        draftsUnseen = 0;
        updateDraftsTabDot();
      }
      if (tabName === activePlannerTab) return;
      document.querySelectorAll(".planner-tab").forEach(function (t) {
        var on = t === btn;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      document.querySelectorAll(".planner-panel").forEach(function (p) {
        var on = p.getAttribute("data-planner-panel") === tabName;
        p.hidden = !on;
        if (on) p.classList.add("enter");
      });
      activePlannerTab = tabName;
      renderPlannerTab(tabName);
      updatePlannerTabDividers();
    });
  });

  updatePlannerTabDividers();

  document.querySelectorAll(".tab[data-view]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var view = tab.getAttribute("data-view");
      document.querySelectorAll(".tab[data-view]").forEach(function (t) {
        t.classList.toggle("active", t === tab);
      });
      if (view === "planner") {
        scorecardView.hidden = true;
        plannerView.hidden = false;
        closeDetails();
        renderPlannerTab(activePlannerTab);
        maybeNotifyInformUpdate();
      } else {
        scorecardView.hidden = false;
        plannerView.hidden = true;
      }
    });
  });

  var CATEGORY_COLOR = {
    "Product": { text: "#3850b7", bg: "#eef0ff" },
    "Supply Chain": { text: "#c95100", bg: "#fef2c9" },
    "Manufacturing": { text: "#6a3fd1", bg: "#f1ecfc" },
    "Quality": { text: "#1a9c5c", bg: "#e2f7ea" },
    "Commercial": { text: "#0f8fa3", bg: "#e3f6f9" },
    "People": { text: "#58585f", bg: "#f0f0f3" },
    "Procurement": { text: "#26355c", bg: "#e6e9f2" },
    "Finance": { text: "#9c6b00", bg: "#fbf0d9" },
    "Technology": { text: "#a3145c", bg: "#fbe4ef" }
  };

  var BRIEFINGS = [
    {
      id: "b1", category: "Product",
      headline: "Checkout redesign shipped to 20% of users",
      timestamp: "8:30 AM", date: "Aug 5, 2026", kpiLinked: "Checkout Conversion Rate", impactLevel: "Low", kpiCardId: 1,
      node: "D&AA", expectedImpact: "+0.4% conversion",
      contributor: { initials: "KS", name: "Kabir Shah", role: "Product Lead, Growth" },
      description: "The redesigned checkout flow is live for 20% of users. Early signals are neutral to slightly positive, and a full rollout decision is scheduled for next week's product review — nothing needed from you until then."
    },
    {
      id: "b2", category: "Supply Chain",
      headline: "Key adhesive vendor delay pushes 3 SKUs behind schedule",
      timestamp: "6:05 AM", date: "Aug 5, 2026", kpiLinked: "Aged Backlog", impactLevel: "High", kpiCardId: 2,
      node: "Chem Ops", expectedImpact: "$140K",
      contributor: { initials: "MA", name: "M. Alvarez", role: "Supply Chain Lead" },
      description: "This is the second missed shipment from this vendor in 30 days. Three SKUs are now behind the production schedule, feeding directly into this week's Aged Backlog variance.",
      files: [{ name: "Vendor_Delay_Notice.pdf", meta: "1 page · 180 KB" }],
      updated: true,
      changes: [
        { field: "Severity", from: "Medium", to: "High" },
        { field: "Expected Impact", from: "$85K", to: "$140K" }
      ]
    },
    {
      id: "b3", category: "Quality",
      headline: "Customer quality escapes down 18% this month",
      timestamp: "7:15 AM", date: "Aug 5, 2026", kpiLinked: "Quality Holds", impactLevel: "Low", kpiCardId: 3,
      node: "EHS", expectedImpact: "-18% escapes",
      contributor: { initials: "TO", name: "T. Osei", role: "Quality Director" },
      description: "Fourth consecutive week of improvement, driven primarily by Plant 12's corrective actions. Recommend recognizing the site team this cycle."
    },
    {
      id: "b4", category: "Commercial",
      headline: "APAC distributor renewal at risk of slipping past quarter-end",
      timestamp: "5:50 AM", date: "Aug 5, 2026", kpiLinked: "Aged Backlog", impactLevel: "Medium", kpiCardId: 4,
      node: "SIBG", expectedImpact: "$220K at risk",
      contributor: { initials: "RC", name: "R. Chen", role: "Commercial Ops" },
      description: "Legal review has stalled for a second consecutive week and no blocker has been escalated yet. Flagging for awareness ahead of next week's commercial review.",
      files: [{ name: "APAC_Renewal_Terms.pdf", meta: "4 pages · 340 KB" }]
    },
    {
      id: "b5", category: "Manufacturing",
      headline: "Plant 4 completed its scheduled line changeover on time",
      timestamp: "4:20 AM", date: "Aug 5, 2026", kpiLinked: "Aged Backlog", impactLevel: "Low", kpiCardId: 5,
      node: "Op Ex", expectedImpact: "+0.5 shift capacity",
      contributor: { initials: "JF", name: "J. Farrell", role: "Plant Manager, Plant 4" },
      description: "The changeover finished 0.8 hours under the planned window, restoring capacity a half-shift ahead of schedule. No downstream impact expected."
    },
    {
      id: "b6", category: "People",
      headline: "New safety training completion crossed 90% ahead of deadline",
      timestamp: "8:05 AM", date: "Aug 5, 2026", kpiLinked: null, impactLevel: "Low", kpiCardId: 6,
      node: "HR", expectedImpact: "91% complete",
      contributor: { initials: "NS", name: "Nick Skwiat", role: "Ops Lead" },
      description: "Completion reached 91%, above the 90% target, clearing a week ahead of the compliance deadline. No further follow-up required."
    }
  ];

  // Past-days informs that exist only to seed Flags & Archive with a
  // realistic amount of history (enough to demonstrate pagination) —
  // they're marked resolved below rather than "pending", so they never
  // show up in today's live carousel above.
  var HISTORICAL_BRIEFINGS = [
    { id: "h1", category: "Supply Chain", headline: "Freight carrier renegotiation closed 4% under budget" },
    { id: "h2", category: "Quality", headline: "Plant 4 quality hold cleared after root-cause fix" },
    { id: "h3", category: "Commercial", headline: "EMEA distributor renewal signed two weeks early" },
    { id: "h4", category: "Manufacturing", headline: "Austin Site line changeover completed ahead of schedule" },
    { id: "h5", category: "People", headline: "Q2 engagement survey results shared with leadership" },
    { id: "h6", category: "Finance", headline: "Vendor payment terms renegotiated for 3 accounts" },
    { id: "h7", category: "Product", headline: "Mobile checkout A/B test concluded with a clear winner" },
    { id: "h8", category: "Procurement", headline: "Backup adhesive supplier onboarding completed" },
    { id: "h9", category: "Technology", headline: "Scorecard data pipeline migrated with no downtime" },
    { id: "h10", category: "Quality", headline: "Plant 12 corrective action plan closed out" }
  ];
  BRIEFINGS = BRIEFINGS.concat(HISTORICAL_BRIEFINGS);

  var queueState = {};
  BRIEFINGS.forEach(function (b) { queueState[b.id] = "pending"; });
  var ackCountToday = 0;
  var activeVersion = "a";

  // Flags are an independent "remember this" bookmark — orthogonal to
  // ack/defer/pending — so a briefing can be flagged whether it's still
  // pending or already acted on. The interaction log instead records what
  // the user has already acted on (ack/defer), so acknowledging something
  // doesn't just make it disappear — it moves to the Archive tab below.
  var flaggedState = {};
  var flaggedAt = {};
  BRIEFINGS.forEach(function (b) { flaggedState[b.id] = false; });
  var interactionLog = [];
  var informArchiveMode = "flags";

  (function seedInformHistory() {
    var now = Date.now();
    var day = 24 * 60 * 60 * 1000;
    HISTORICAL_BRIEFINGS.forEach(function (b, i) {
      // Always "ack", never "deferred" — the live Deferred queue below
      // today's carousel reads queueState directly, and these are meant
      // to be purely historical, not mixed into today's review-later list.
      queueState[b.id] = "ack";
      interactionLog.push({ id: b.id, action: i % 3 === 0 ? "defer" : "ack", at: new Date(now - (i + 2) * day) });
    });
    ["b3", "b5", "h1", "h3", "h5", "h7", "h9"].forEach(function (id, i) {
      flaggedState[id] = true;
      flaggedAt[id] = new Date(now - (i + 1) * day * 2);
    });
  })();

  function sparkColor(sentiment) {
    return sentiment === "positive" ? "#1a9c5c" : sentiment === "negative" ? "#b20e18" : "#75757e";
  }

  // Small inline sparkline: same sweep-reveal clip-path technique as the
  // details-panel trend chart, reused for the briefing/decision cards'
  // mini KPI graph.
  // Builds into an already-mounted container rather than returning a node:
  // the previous version guessed a fixed viewBox width (e.g. 340) that
  // rarely matched the actual fluid grid-cell width, so preserveAspectRatio
  // "none" scaled x and y by different factors and every circle rendered
  // as an ellipse. Measuring the real clientWidth one frame after mount
  // (once the card is laid out) makes viewBox units equal real pixels, so
  // "none" is a no-op and nothing stretches.
  function mountSparkline(container, values, opts) {
    opts = opts || {};
    var h = opts.h || 32;
    container.style.height = h + "px";
    requestAnimationFrame(function () {
      var w = container.clientWidth || opts.w || 100;
      var pad = 4;
      var all = opts.target != null ? values.concat([opts.target]) : values;
      var min = Math.min.apply(null, all);
      var max = Math.max.apply(null, all);
      if (min === max) { min -= 1; max += 1; }
      var range = max - min;
      var n = values.length;
      var xStep = (w - pad * 2) / (n - 1);
      function xAt(i) { return pad + i * xStep; }
      function yAt(v) { return h - pad - ((v - min) / range) * (h - pad * 2); }

      var svg = svgEl("svg", { viewBox: "0 0 " + w + " " + h, preserveAspectRatio: "none" });
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.style.display = "block";
      var color = sparkColor(opts.sentiment);

      if (opts.target != null) {
        var ty = yAt(opts.target);
        svg.appendChild(svgEl("line", {
          x1: pad, x2: w - pad, y1: ty, y2: ty,
          stroke: "#c9ccd6", "stroke-width": "1", "stroke-dasharray": "2 3"
        }));
      }

      var clipId = "spClip" + Math.random().toString(36).slice(2, 8);
      var defs = svgEl("defs", {});
      var clipRect = svgEl("rect", { x: pad, y: 0, width: 0, height: h });
      var clipPath = svgEl("clipPath", { id: clipId });
      clipPath.appendChild(clipRect);
      defs.appendChild(clipPath);
      svg.appendChild(defs);

      var g = svgEl("g", { "clip-path": "url(#" + clipId + ")" });
      var points = values.map(function (v, i) { return xAt(i) + "," + yAt(v); }).join(" ");
      g.appendChild(svgEl("polyline", {
        points: points, fill: "none", stroke: color, "stroke-width": "2",
        "stroke-linecap": "round", "stroke-linejoin": "round"
      }));
      values.forEach(function (v, i) {
        var isLast = i === n - 1;
        g.appendChild(svgEl("circle", {
          cx: xAt(i), cy: yAt(v), r: isLast ? "3.5" : "2.2",
          fill: color, class: "spark-point"
        }));
      });
      svg.appendChild(g);
      container.appendChild(svg);

      requestAnimationFrame(function () {
        animateAttr(clipRect, "width", 0, w - pad * 2, 900);
      });
    });
  }

  // Dedicated inline SVG icons for the primary CTAs (rather than the icon
  // font) so the acknowledge tick can draw itself in via stroke-dashoffset
  // and the review-later clock hand can tick over via rotate — neither is
  // achievable animating a text glyph.
  function buildTickIcon() {
    var svg = svgEl("svg", { viewBox: "0 0 24 24", width: "16", height: "16", class: "cta-icon cta-check" });
    svg.appendChild(svgEl("path", {
      d: "M4 12.5 L9.5 18 L20 6", fill: "none", stroke: "currentColor", "stroke-width": "2.5",
      "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": "30", "stroke-dashoffset": "0"
    }));
    return svg;
  }

  function buildClockIcon() {
    var svg = svgEl("svg", { viewBox: "0 0 24 24", width: "16", height: "16", class: "cta-icon cta-clock" });
    svg.appendChild(svgEl("circle", { cx: 12, cy: 12, r: 9, fill: "none", stroke: "currentColor", "stroke-width": "2" }));
    svg.appendChild(svgEl("line", {
      x1: 12, y1: 12, x2: 12, y2: 6, stroke: "currentColor", "stroke-width": "2",
      "stroke-linecap": "round", class: "clock-hand"
    }));
    return svg;
  }

  function triggerTickPulse(btnEl) {
    var path = btnEl.querySelector(".cta-check path");
    if (!path) return;
    // The tick renders fully drawn at rest (so the button never looks
    // blank); clicking briefly erases and redraws it as confirmation. Like
    // the trend chart's sweep-reveal, a CSS transition on an SVG-specific
    // property (stroke-dashoffset) doesn't reliably engage here, so this
    // is driven manually via the same rAF interpolation as animateAttr.
    path.setAttribute("stroke-dashoffset", "30");
    requestAnimationFrame(function () {
      animateAttr(path, "stroke-dashoffset", 30, 0, 280);
    });
  }

  function triggerClockPulse(btnEl) {
    var hand = btnEl.querySelector(".clock-hand");
    if (hand) requestAnimationFrame(function () { hand.classList.add("tick"); });
  }

  // Create Task used to sit in this same row as Acknowledge/Review Later,
  // which crowded three unrelated actions together; it now lives in the
  // KPI pane instead (see buildCardA), so this row is just the two calls
  // that dispose of the briefing itself.
  function buildActionsRow(b) {
    var row = el("div", "briefing-actions");
    var ackBtn = el("button", "briefing-btn briefing-btn-ack");
    ackBtn.type = "button";
    ackBtn.appendChild(buildTickIcon());
    ackBtn.appendChild(document.createTextNode("Acknowledge"));
    ackBtn.addEventListener("click", function (e) { e.stopPropagation(); handleAck(b.id, ackBtn); });
    var laterBtn = el("button", "briefing-btn briefing-btn-later");
    laterBtn.type = "button";
    laterBtn.appendChild(buildClockIcon());
    laterBtn.appendChild(document.createTextNode("Review Later"));
    laterBtn.addEventListener("click", function (e) { e.stopPropagation(); handleDefer(b.id, laterBtn); });
    row.appendChild(ackBtn);
    row.appendChild(laterBtn);
    return row;
  }

  var FLAG_LABEL = { on: "Flagged", off: "Flag" };

  function buildFlagButton(b) {
    var btn = el("button", "flag-btn" + (flaggedState[b.id] ? " flagged" : ""),
      icon("flag") + (flaggedState[b.id] ? FLAG_LABEL.on : FLAG_LABEL.off));
    btn.type = "button";
    btn.setAttribute("aria-pressed", flaggedState[b.id] ? "true" : "false");
    btn.title = flaggedState[b.id] ? "Flagged — click to unflag" : "Flag this for later";
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      flaggedState[b.id] = !flaggedState[b.id];
      if (flaggedState[b.id]) flaggedAt[b.id] = new Date();
      btn.classList.toggle("flagged", flaggedState[b.id]);
      btn.setAttribute("aria-pressed", flaggedState[b.id] ? "true" : "false");
      btn.title = flaggedState[b.id] ? "Flagged — click to unflag" : "Flag this for later";
      btn.innerHTML = icon("flag") + (flaggedState[b.id] ? FLAG_LABEL.on : FLAG_LABEL.off);
      if (informArchiveMode === "flags") renderInformArchiveTable();
    });
    return btn;
  }

  function buildCategoryTag(category) {
    var cat = CATEGORY_COLOR[category] || { text: "#58585f", bg: "#f0f0f3" };
    var tag = el("span", "category-tag", '<span class="dot"></span>' + category);
    tag.style.background = cat.bg;
    tag.style.color = cat.text;
    return tag;
  }

  // The mini KPI card is a scaled-down version of a real scorecard card —
  // same CARDS data, same trend series — so "Dive Deeper" opens the exact
  // details panel a click on the full-size card would.
  // No background/shadow of its own — sitting inside the tinted KPI pane,
  // a second white card here read as a card-in-a-card. "Dive Deeper" is a
  // separate explicit button (see buildDiveDeeperButton) rather than a
  // hover affordance on this block.
  function buildMiniKpiCard(cardId) {
    var data = CARDS[cardId];
    var mini = el("div", "mini-kpi-card");
    if (!data) return mini;

    var head = el("div", "mini-kpi-head");
    head.appendChild(el("span", "mini-kpi-name", data.title));
    head.appendChild(el("span", "mini-kpi-owner", icon("account_tree") + data.owner));
    mini.appendChild(head);

    var valueRow = el("div", "mini-kpi-value-row");
    valueRow.appendChild(el("span", "mini-kpi-value" + (data.varianceDir === "up" ? "" : " dark"), data.valueDisplay));
    valueRow.appendChild(el("span", "change " + data.varianceDir, data.varianceDisplay));
    mini.appendChild(valueRow);

    var sparkWrap = el("div", "mini-kpi-spark");
    mini.appendChild(sparkWrap);
    mountSparkline(sparkWrap, data.chart.actual, { h: 46, sentiment: data.varianceDir === "up" ? "negative" : "positive" });

    return mini;
  }

  function buildDiveDeeperButton(cardId) {
    var btn = el("button", "briefing-btn briefing-btn-dive card-a-kpi-action", "Dive Deeper" + icon("arrow_forward"));
    btn.type = "button";
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      openDetails(cardId);
    });
    return btn;
  }

  // Compact "what changed" callout for an updated briefing: each changed
  // field gets its own row (old value struck through, new value bold)
  // rather than threading strikethroughs through the description prose —
  // that reads fine for one change but turns to noise once several fields
  // change at once, so every field gets its own line no matter how many
  // there are.
  function buildChangeLog(changes) {
    var wrap = el("div", "change-log");
    changes.forEach(function (c) {
      var row = el("div", "change-row");
      row.appendChild(el("span", "change-field", c.field));
      var diff = el("span", "change-diff");
      diff.appendChild(el("span", "change-from", c.from));
      diff.appendChild(el("span", "material-symbols-outlined change-arrow", "arrow_forward"));
      diff.appendChild(el("span", "change-to", c.to));
      row.appendChild(diff);
      wrap.appendChild(row);
    });
    return wrap;
  }

  function buildStatItem(label, value, severityLevel) {
    var item = el("div", "card-a-stat");
    item.appendChild(el("span", "card-a-stat-label", label));
    if (severityLevel) item.appendChild(el("span", "impact-level-badge " + severityLevel.toLowerCase(), severityLevel));
    else item.appendChild(el("span", "card-a-stat-value", value || "—"));
    return item;
  }

  function buildCardA(b) {
    var card = el("div", "briefing-card");
    card.setAttribute("data-briefing-id", b.id);
    var inner = el("div", "card-a split-card");

    var body = el("div", "card-a-body");

    // Left pane: read-only context — title, the story in prose, when and
    // who it's from, and anything attached. Right pane carries all the
    // structured data (metric, node, severity, impact) plus the one
    // action that spins out of this update.
    var left = el("div", "card-a-content");

    var titleRow = el("div", "card-a-title-row");
    if (b.updated) titleRow.appendChild(el("span", "badge badge-amber", icon("update") + "Updated"));
    titleRow.appendChild(el("h3", "card-a-headline", b.headline));
    titleRow.appendChild(buildFlagButton(b));
    left.appendChild(titleRow);

    left.appendChild(el("div", "card-a-timestamp", b.date + " · " + b.timestamp));

    if (b.changes && b.changes.length) left.appendChild(buildChangeLog(b.changes));

    left.appendChild(el("p", "decision-desc", b.description));

    (b.files || []).forEach(function (file) {
      var docBtn = el("button", "decision-doc");
      docBtn.type = "button";
      docBtn.appendChild(el("span", "decision-doc-icon", icon("description")));
      var textWrap = document.createElement("span");
      textWrap.style.display = "flex";
      textWrap.style.flexDirection = "column";
      textWrap.appendChild(el("span", "decision-doc-name", file.name));
      textWrap.appendChild(el("span", "decision-doc-meta", file.meta));
      docBtn.appendChild(textWrap);
      docBtn.appendChild(el("span", "material-symbols-outlined decision-doc-chevron", "chevron_right"));
      docBtn.addEventListener("click", function (e) { e.stopPropagation(); openDocPreview(file); });
      left.appendChild(docBtn);
    });

    var contributor = el("div", "card-a-contributor");
    contributor.appendChild(el("div", "contributor-avatar", b.contributor.initials));
    var names = el("div", "");
    names.appendChild(el("div", "contributor-name", b.contributor.name));
    names.appendChild(el("div", "contributor-role", b.contributor.role));
    contributor.appendChild(names);
    left.appendChild(contributor);

    body.appendChild(left);

    // Right pane: a compact live readout of the KPI this update is linked
    // to, tinted to read as a visually distinct "base" the content sits
    // on top of, rather than a second copy of the same white card.
    var right = el("div", "card-a-kpi-pane");
    var kpiInfo = el("div", "card-a-kpi-info");
    kpiInfo.appendChild(buildMiniKpiCard(b.kpiCardId));

    var stats = el("div", "card-a-stat-grid");
    stats.appendChild(buildStatItem("Node", b.node));
    stats.appendChild(buildStatItem("Severity", null, b.impactLevel));
    stats.appendChild(buildStatItem("Expected Impact", b.expectedImpact));
    kpiInfo.appendChild(stats);
    right.appendChild(kpiInfo);

    var kpiActions = el("div", "card-a-kpi-actions");
    kpiActions.appendChild(buildDiveDeeperButton(b.kpiCardId));
    var createBtn = el("button", "briefing-btn briefing-btn-create card-a-kpi-action", icon("add_circle") + "Create Task");
    createBtn.type = "button";
    createBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      openActivityTypeModal(function (typeKey) { openCreateTaskModal(b.kpiCardId, typeKey); });
    });
    kpiActions.appendChild(createBtn);
    right.appendChild(kpiActions);

    body.appendChild(right);

    inner.appendChild(body);
    inner.appendChild(buildActionsRow(b));
    card.appendChild(inner);
    return card;
  }

  function appendEmptyAndDeferred(wrap, pendingCount) {
    var deferredItems = BRIEFINGS.filter(function (b) { return queueState[b.id] === "deferred"; });

    if (pendingCount === 0) {
      var empty = el("div", "planner-empty");
      empty.innerHTML =
        '<div class="planner-empty-icon">' + icon("check_circle") + "</div>" +
        '<div class="planner-empty-title">You’re caught up</div>' +
        '<p class="planner-empty-sub">Nothing requires your attention right now.</p>' +
        (ackCountToday > 0
          ? '<span class="planner-empty-count">' + ackCountToday + " briefing" + (ackCountToday === 1 ? "" : "s") + " reviewed today</span>"
          : "");
      wrap.appendChild(stagger(empty, 0));
    }

    if (deferredItems.length) {
      var dq = el("div", "deferred-queue");
      dq.appendChild(el("div", "deferred-title", "Deferred (" + deferredItems.length + ")"));
      deferredItems.forEach(function (b) {
        var row = el("div", "deferred-row");
        row.appendChild(buildCategoryTag(b.category));
        row.appendChild(el("span", "deferred-headline", b.headline));
        var actions = el("div", "deferred-row-actions");
        var restoreBtn = el("button", "icon-action-btn later", icon("undo"));
        restoreBtn.type = "button";
        restoreBtn.title = "Bring back to today";
        restoreBtn.addEventListener("click", function () { handleRestore(b.id); });
        var ackBtn = el("button", "icon-action-btn ack", icon("check_circle"));
        ackBtn.type = "button";
        ackBtn.title = "Acknowledge";
        ackBtn.addEventListener("click", function () { handleAck(b.id); });
        actions.appendChild(restoreBtn);
        actions.appendChild(ackBtn);
        row.appendChild(actions);
        dq.appendChild(row);
      });
      wrap.appendChild(dq);
    }
  }

  var CARD_BUILDER = { a: buildCardA };
  var carouselIndex = { a: 0 };

  function orderedPending() {
    return BRIEFINGS.filter(function (b) { return queueState[b.id] === "pending"; });
  }

  function updateBriefingCount() {
    var pendingCount = BRIEFINGS.filter(function (b) { return queueState[b.id] === "pending"; }).length;
    var countEl = document.getElementById("briefingCount");
    countEl.textContent = pendingCount > 0 ? pendingCount + " new" : "";
    countEl.style.display = pendingCount > 0 ? "" : "none";
  }

  function updateCarouselChrome(version, total, idx) {
    var wrap = document.getElementById("version" + version.toUpperCase());
    var pos = wrap.querySelector(".briefing-position");
    if (pos) pos.textContent = (idx + 1) + " / " + total;
    wrap.querySelectorAll(".briefing-seg").forEach(function (seg, i) {
      seg.classList.toggle("done", i <= idx);
      seg.classList.toggle("current", i === idx);
    });
    var prevBtn = wrap.querySelector(".carousel-arrow.prev");
    var nextBtn = wrap.querySelector(".carousel-arrow.next");
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === total - 1;
  }

  // Single-card carousel stage: renders exactly one briefing at a time
  // (position indicator + segmented progress + prev/next arrows) instead
  // of a long scroll of stacked cards.
  function renderCarousel(version) {
    var wrap = document.getElementById("version" + version.toUpperCase());
    wrap.innerHTML = "";
    var items = orderedPending();

    if (carouselIndex[version] >= items.length) {
      carouselIndex[version] = Math.max(0, items.length - 1);
    }

    if (!items.length) {
      appendEmptyAndDeferred(wrap, 0);
      return;
    }

    var idx = carouselIndex[version];
    var builder = CARD_BUILDER[version];

    var carousel = el("div", "briefing-carousel");
    carousel.appendChild(el("div", "briefing-position", (idx + 1) + " / " + items.length));

    var segRow = el("div", "briefing-segments");
    items.forEach(function (_, i) {
      segRow.appendChild(el("span", "briefing-seg" + (i <= idx ? " done" : "") + (i === idx ? " current" : "")));
    });
    carousel.appendChild(segRow);

    var stageRow = el("div", "briefing-stage-row");
    var prevBtn = el("button", "carousel-arrow prev", icon("chevron_left"));
    prevBtn.type = "button";
    prevBtn.disabled = idx === 0;
    prevBtn.setAttribute("aria-label", "Previous briefing");
    prevBtn.addEventListener("click", function () { navigate(version, -1); });

    var nextBtn = el("button", "carousel-arrow next", icon("chevron_right"));
    nextBtn.type = "button";
    nextBtn.disabled = idx === items.length - 1;
    nextBtn.setAttribute("aria-label", "Next briefing");
    nextBtn.addEventListener("click", function () { navigate(version, 1); });

    var viewport = el("div", "briefing-stage-viewport");
    viewport.id = "briefingViewport" + version;
    viewport.appendChild(builder(items[idx]));

    stageRow.appendChild(prevBtn);
    stageRow.appendChild(viewport);
    stageRow.appendChild(nextBtn);
    carousel.appendChild(stageRow);

    wrap.appendChild(carousel);
    appendEmptyAndDeferred(wrap, items.length);
  }

  function renderActiveVersion() {
    renderCarousel(activeVersion);
    updateBriefingCount();
  }

  // Slides the current card out (right for ack/prev, left for defer/next)
  // and mounts the next one sliding in from the opposite side, filling the
  // vacated center — same motion as a standard carousel/swipe transition.
  function transitionCarousel(version, targetIndex, direction) {
    var viewport = document.getElementById("briefingViewport" + version);
    if (!viewport) { renderCarousel(version); updateBriefingCount(); return; }
    var current = viewport.querySelector(".briefing-card");
    var exitClass = (direction === "ack" || direction === "prev") ? "slide-exit-right" : "slide-exit-left";
    var enterClass = (direction === "ack" || direction === "prev") ? "slide-enter-from-left" : "slide-enter-from-right";

    function mountNext() {
      var items = orderedPending();
      if (!items.length) { renderCarousel(version); updateBriefingCount(); return; }
      var idx = Math.min(Math.max(targetIndex, 0), items.length - 1);
      carouselIndex[version] = idx;

      viewport.innerHTML = "";
      var node = CARD_BUILDER[version](items[idx]);
      node.classList.add(enterClass);
      viewport.appendChild(node);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { node.classList.remove(enterClass); });
      });

      updateCarouselChrome(version, items.length, idx);
      updateBriefingCount();

      // The deferred queue below the stage can change independently of the
      // sliding card, so refresh just that region in place.
      var wrap = document.getElementById("version" + version.toUpperCase());
      var oldDeferred = wrap.querySelector(".deferred-queue");
      if (oldDeferred) oldDeferred.remove();
      appendEmptyAndDeferred(wrap, items.length);
    }

    if (current) {
      current.classList.add(exitClass);
      setTimeout(mountNext, 300);
    } else {
      mountNext();
    }
  }

  function navigate(version, delta) {
    var items = orderedPending();
    var newIndex = carouselIndex[version] + delta;
    if (newIndex < 0 || newIndex >= items.length) return;
    transitionCarousel(version, newIndex, delta > 0 ? "next" : "prev");
  }

  function logInteraction(id, action) {
    interactionLog.unshift({ id: id, action: action, at: new Date() });
    renderInformArchiveTable();
  }

  function handleAck(id, btnEl) {
    queueState[id] = "ack";
    ackCountToday++;
    if (btnEl) triggerTickPulse(btnEl);
    transitionCarousel(activeVersion, carouselIndex[activeVersion], "ack");
    logInteraction(id, "ack");
  }

  function handleDefer(id, btnEl) {
    queueState[id] = "deferred";
    if (btnEl) triggerClockPulse(btnEl);
    transitionCarousel(activeVersion, carouselIndex[activeVersion], "defer");
    logInteraction(id, "defer");
  }

  function handleRestore(id) {
    queueState[id] = "pending";
    renderActiveVersion();
  }

  var INTERACTION_LABEL = { ack: "Acknowledged", defer: "Reviewed Later" };

  function informRowLookup(id) {
    for (var i = 0; i < BRIEFINGS.length; i++) {
      if (BRIEFINGS[i].id === id) return BRIEFINGS[i];
    }
    return null;
  }

  function formatArchiveTime(d) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  function buildArchiveEmptyRow(colspan, text) {
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    td.colSpan = colspan;
    td.className = "table-empty";
    td.textContent = text;
    tr.appendChild(td);
    return tr;
  }

  // Paginate rather than an ever-growing scroll: the table wrapper also
  // caps its own height (see .inform-archive-section .data-table-wrap)
  // so a single page never has to grow the whole section. Page size is
  // shared across both Flags and Archive sub-views; page position is
  // tracked per view (below) since they hold different data.
  var archivePageSize = 5;
  var archivePage = { flags: 0, archive: 0 };
  var PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

  function buildPaginationBar(page, totalItems, onPageChange, onPageSizeChange) {
    var totalPages = Math.max(1, Math.ceil(totalItems / archivePageSize));
    if (page > totalPages - 1) page = totalPages - 1;
    if (page < 0) page = 0;

    var bar = el("div", "table-pagination");

    var sizeWrap = el("div", "pagination-size");
    sizeWrap.appendChild(el("span", "pagination-size-label", "Rows per page"));
    var sizeSelect = buildSelect(
      "pagination-size-select",
      PAGE_SIZE_OPTIONS.map(function (n) { return [String(n), String(n)]; }),
      String(archivePageSize),
      function (v) { onPageSizeChange(parseInt(v, 10)); }
    );
    sizeWrap.appendChild(sizeSelect);
    bar.appendChild(sizeWrap);

    var rangeWrap = el("div", "pagination-range");
    var start = totalItems === 0 ? 0 : page * archivePageSize + 1;
    var end = Math.min(totalItems, (page + 1) * archivePageSize);
    rangeWrap.appendChild(el("span", "pagination-range-label", start + "-" + end + " of " + totalItems));

    function navBtn(glyph, label, disabled, targetPage) {
      var btn = el("button", "pagination-btn", icon(glyph));
      btn.type = "button";
      btn.disabled = disabled;
      btn.setAttribute("aria-label", label);
      btn.addEventListener("click", function () { onPageChange(targetPage); });
      return btn;
    }

    rangeWrap.appendChild(navBtn("first_page", "First page", page <= 0, 0));
    rangeWrap.appendChild(navBtn("chevron_left", "Previous page", page <= 0, page - 1));
    rangeWrap.appendChild(navBtn("chevron_right", "Next page", page >= totalPages - 1, page + 1));
    rangeWrap.appendChild(navBtn("last_page", "Last page", page >= totalPages - 1, totalPages - 1));
    bar.appendChild(rangeWrap);

    return bar;
  }

  // Default to most-recent-first, same as before sorting was clickable;
  // clicking a header still starts a fresh ascending sort from there.
  var informFlagsSortState = { key: "flaggedAt", dir: "desc" };
  var informArchiveSortState = { key: "at", dir: "desc" };
  var INFORM_FLAGS_COMPARATORS = {
    headline: function (a, b) { return a.headline.localeCompare(b.headline); },
    category: function (a, b) { return a.category.localeCompare(b.category); },
    flaggedAt: function (a, b) { return flaggedAt[a.id] - flaggedAt[b.id]; }
  };
  var INFORM_ARCHIVE_COMPARATORS = {
    headline: function (a, b) { return informRowLookup(a.id).headline.localeCompare(informRowLookup(b.id).headline); },
    category: function (a, b) { return informRowLookup(a.id).category.localeCompare(informRowLookup(b.id).category); },
    action: function (a, b) { return INTERACTION_LABEL[a.action].localeCompare(INTERACTION_LABEL[b.action]); },
    at: function (a, b) { return a.at - b.at; }
  };

  function renderInformArchiveTable() {
    var table = document.getElementById("informArchiveTable");
    var paginationWrap = document.getElementById("informArchivePagination");
    table.innerHTML = "";
    paginationWrap.innerHTML = "";
    var thead = document.createElement("thead");
    var tbody = document.createElement("tbody");

    if (informArchiveMode === "flags") {
      var flagsHeadRow = document.createElement("tr");
      flagsHeadRow.appendChild(buildSortableTh("Briefing", "headline", informFlagsSortState, renderInformArchiveTable));
      flagsHeadRow.appendChild(buildSortableTh("Category", "category", informFlagsSortState, renderInformArchiveTable));
      flagsHeadRow.appendChild(buildSortableTh("Flagged", "flaggedAt", informFlagsSortState, renderInformArchiveTable));
      thead.appendChild(flagsHeadRow);
      var flagged = sortRows(
        BRIEFINGS.filter(function (b) { return flaggedState[b.id]; }),
        informFlagsSortState,
        INFORM_FLAGS_COMPARATORS
      );
      var flagsMaxPage = Math.max(0, Math.ceil(flagged.length / archivePageSize) - 1);
      if (archivePage.flags > flagsMaxPage) archivePage.flags = flagsMaxPage;
      if (!flagged.length) {
        tbody.appendChild(buildArchiveEmptyRow(3, "No flagged briefings yet — use the flag icon on any card to bookmark it here."));
      } else {
        var flagsStart = archivePage.flags * archivePageSize;
        flagged.slice(flagsStart, flagsStart + archivePageSize).forEach(function (b) {
          var tr = document.createElement("tr");
          var tdTitle = document.createElement("td");
          tdTitle.appendChild(el("span", "action-name", b.headline));
          tr.appendChild(tdTitle);
          var tdCat = document.createElement("td");
          tdCat.appendChild(buildCategoryTag(b.category));
          tr.appendChild(tdCat);
          var tdWhen = document.createElement("td");
          tdWhen.textContent = formatArchiveTime(flaggedAt[b.id]);
          tr.appendChild(tdWhen);
          tbody.appendChild(tr);
        });
        paginationWrap.appendChild(buildPaginationBar(archivePage.flags, flagged.length, function (page) {
          archivePage.flags = page;
          renderInformArchiveTable();
        }, function (size) {
          archivePageSize = size;
          archivePage.flags = 0;
          renderInformArchiveTable();
        }));
      }
    } else {
      var archiveHeadRow = document.createElement("tr");
      archiveHeadRow.appendChild(buildSortableTh("Briefing", "headline", informArchiveSortState, renderInformArchiveTable));
      archiveHeadRow.appendChild(buildSortableTh("Category", "category", informArchiveSortState, renderInformArchiveTable));
      archiveHeadRow.appendChild(buildSortableTh("Action", "action", informArchiveSortState, renderInformArchiveTable));
      archiveHeadRow.appendChild(buildSortableTh("When", "at", informArchiveSortState, renderInformArchiveTable));
      thead.appendChild(archiveHeadRow);
      var sortedLog = sortRows(interactionLog, informArchiveSortState, INFORM_ARCHIVE_COMPARATORS);
      var archiveMaxPage = Math.max(0, Math.ceil(sortedLog.length / archivePageSize) - 1);
      if (archivePage.archive > archiveMaxPage) archivePage.archive = archiveMaxPage;
      if (!sortedLog.length) {
        tbody.appendChild(buildArchiveEmptyRow(4, "Nothing acted on yet — acknowledged and deferred briefings archive here instead of disappearing."));
      } else {
        var archiveStart = archivePage.archive * archivePageSize;
        sortedLog.slice(archiveStart, archiveStart + archivePageSize).forEach(function (entry) {
          var b = informRowLookup(entry.id);
          if (!b) return;
          var tr = document.createElement("tr");
          var tdTitle = document.createElement("td");
          tdTitle.appendChild(el("span", "action-name", b.headline));
          tr.appendChild(tdTitle);
          var tdCat = document.createElement("td");
          tdCat.appendChild(buildCategoryTag(b.category));
          tr.appendChild(tdCat);
          var tdAction = document.createElement("td");
          tdAction.textContent = INTERACTION_LABEL[entry.action];
          tr.appendChild(tdAction);
          var tdWhen = document.createElement("td");
          tdWhen.textContent = formatArchiveTime(entry.at);
          tr.appendChild(tdWhen);
          tbody.appendChild(tr);
        });
        paginationWrap.appendChild(buildPaginationBar(archivePage.archive, sortedLog.length, function (page) {
          archivePage.archive = page;
          renderInformArchiveTable();
        }, function (size) {
          archivePageSize = size;
          archivePage.archive = 0;
          renderInformArchiveTable();
        }));
      }
    }

    table.appendChild(thead);
    table.appendChild(tbody);
  }

  document.getElementById("informArchiveToggle").addEventListener("click", function (evt) {
    var btn = evt.target.closest(".seg-btn");
    if (!btn) return;
    informArchiveMode = btn.getAttribute("data-mode");
    this.querySelectorAll(".seg-btn").forEach(function (b) { b.classList.toggle("active", b === btn); });
    renderInformArchiveTable();
  });

  renderCarousel("a");
  updateBriefingCount();

  /* =====================================================================
     Shared modal (document viewer / draft editor)
     ===================================================================== */

  var modalOverlay = document.getElementById("modalOverlay");
  var modalBox = document.getElementById("modalBox");
  var modalTitle = document.getElementById("modalTitle");
  var modalBody = document.getElementById("modalBody");
  var modalFooter = document.getElementById("modalFooter");

  function openModal(title, bodyNode, opts) {
    opts = opts || {};
    modalTitle.textContent = title;
    modalBody.innerHTML = "";
    modalBody.appendChild(bodyNode);
    modalFooter.innerHTML = "";
    if (opts.footer) {
      modalFooter.appendChild(opts.footer);
      modalFooter.hidden = false;
    } else {
      modalFooter.hidden = true;
    }
    modalBox.classList.toggle("wide", !!opts.wide);
    modalBox.classList.toggle("celebratory", !!opts.celebratory);
    modalOverlay.hidden = false;
  }

  function closeModal() {
    modalOverlay.hidden = true;
    modalBody.innerHTML = "";
    modalFooter.innerHTML = "";
  }

  document.getElementById("modalClose").addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modalOverlay.hidden) closeModal();
  });

  /* =====================================================================
     Create Task (opened from any KPI card's "+" button)
     ===================================================================== */

  var TASK_TYPE_KEYS = ["Action", "Decision", "Inform", "Recognition"];
  var METRIC_OPTIONS = ["Aged Backlog", "Quality Holds", "Checkout Conversion Rate", "Vendor Fill Rate", "Commercial Revenue"];
  var PROGRAM_OPTIONS = ["ESC Recovery Program", "Q3 Growth Initiative", "Vendor Risk Program", "Plant Modernization"];
  var NODE_OPTIONS = ["EHS", "D&AA", "SIBG", "BSC", "Chem Ops", "Op Ex", "Planning", "HR"];
  var NODE_FUNCTION_MULTI_OPTIONS = ["EHS", "D&AA", "SIBG", "BSC", "Chem Ops", "Op Ex", "Planning", "HR"];
  var CRITICALITY_OPTIONS = ["Critical", "High", "Medium", "Low"];
  var IMPACT_UOM_OPTIONS = ["$", "%", "Units", "Days", "Hours"];
  var OWNER_OPTIONS = ["Nick Skwiat", "John Doe", "Priya Nair", "Arjun Mehta", "T. Osei", "Sanjay Kulkarni", "Elena Popova", "Rita Mathews"];
  var LINK_RELATION_OPTIONS = ["Related to", "Dependent on", "Originates from"];
  var WEEKS_RED_LOOKUP = { "Aged Backlog": "6 weeks red", "Quality Holds": "3 weeks red", "Checkout Conversion Rate": "1 week red", "Vendor Fill Rate": "4 weeks red", "Commercial Revenue": "2 weeks red" };

  // Broadcast/Request Inform are two entry points into the same "Inform"
  // task type further down the funnel — the form itself doesn't branch on
  // which one was picked, only which of the five underlying types it is.
  var ACTIVITY_TYPES = [
    { key: "Action", label: "Action Task" },
    { key: "Inform", label: "Broadcast Inform" },
    { key: "Inform", label: "Request Inform" },
    { key: "Decision", label: "Decision Task" },
    { key: "Recognition", label: "Recognition Task" }
  ];

  // Shown before the task form itself opens, on every Daily Planner
  // "create a task" entry point — picking a type here is what the V2 task
  // type field (inside the form) treats as already-decided and locks.
  function openActivityTypeModal(onPick) {
    var body = el("div", "activity-type-modal-body");
    body.appendChild(el("div", "activity-type-modal-hint", "Choose an Activity Type"));
    var grid = el("div", "activity-type-grid");
    ACTIVITY_TYPES.forEach(function (a) {
      var btn = el("button", "activity-type-btn", a.label);
      btn.type = "button";
      btn.addEventListener("click", function () {
        closeModal();
        onPick(a.key);
      });
      grid.appendChild(btn);
    });
    body.appendChild(grid);
    openModal("Activity Type", body);
  }

  function bumpCardCount(cardId, typeKey) {
    var cardEl = document.querySelector('.card-unit[data-card-id="' + cardId + '"]');
    if (!cardEl) return;
    cardEl.querySelectorAll(".panel-row").forEach(function (row) {
      var label = row.querySelector(".label-text");
      if (!label || label.textContent !== typeKey) return;
      var countEl = row.querySelector(".count");
      if (countEl && countEl.firstChild && countEl.firstChild.nodeType === Node.TEXT_NODE) {
        var n = parseInt(countEl.firstChild.nodeValue, 10) || 0;
        countEl.firstChild.nodeValue = String(n + 1);
      }
    });
  }

  function formField(labelText, inputEl, opts) {
    opts = opts || {};
    var f = el("div", "form-field");
    var label = el("label", "form-label" + (opts.required ? " required" : ""), labelText);
    if (opts.required) label.appendChild(el("span", "form-required-mark", " *"));
    f.appendChild(label);
    if (opts.hint) f.appendChild(el("div", "form-hint", opts.hint));
    f.appendChild(inputEl);
    return f;
  }

  // -- reusable field-type builders for the task creation form --

  var searchableDatalistSeq = 0;
  function buildSearchableInput(options, defaultValue) {
    var id = "form-datalist-" + (searchableDatalistSeq++);
    var input = document.createElement("input");
    input.className = "form-input";
    input.type = "text";
    input.setAttribute("list", id);
    input.placeholder = "Search or type a name...";
    input.value = defaultValue || "";
    var datalist = document.createElement("datalist");
    datalist.id = id;
    options.forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o;
      datalist.appendChild(opt);
    });
    input.setAttribute("autocomplete", "off");
    var wrap = el("div", "searchable-input-wrap");
    wrap.appendChild(input);
    wrap.appendChild(datalist);
    return { node: wrap, input: input };
  }

  function buildBulletListInput(initialItems) {
    var items = (initialItems || []).slice();
    var wrap = el("div", "bullet-input");
    var list = el("ul", "bullet-input-list");
    var input = document.createElement("input");
    input.className = "form-input";
    input.type = "text";
    input.placeholder = "Type a criterion and press Enter";
    var addBtn = el("button", "bullet-input-add", icon("add"));
    addBtn.type = "button";

    function renderList() {
      list.innerHTML = "";
      items.forEach(function (text, i) {
        var li = el("li", "bullet-input-item");
        li.appendChild(el("span", "", text));
        var rm = el("button", "bullet-input-remove", icon("close"));
        rm.type = "button";
        rm.addEventListener("click", function () { items.splice(i, 1); renderList(); });
        li.appendChild(rm);
        list.appendChild(li);
      });
    }

    function addCurrent() {
      var v = input.value.trim();
      if (!v) return;
      items.push(v);
      input.value = "";
      renderList();
      input.focus();
    }

    addBtn.addEventListener("click", addCurrent);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); addCurrent(); }
    });

    var inputRow = el("div", "bullet-input-row");
    inputRow.appendChild(input);
    inputRow.appendChild(addBtn);
    wrap.appendChild(list);
    wrap.appendChild(inputRow);
    renderList();

    return { node: wrap, getValue: function () { return items.slice(); } };
  }

  function buildChipMultiSelect(options, selectedDefault) {
    var selected = (selectedDefault || []).slice();
    var wrap = el("div", "chip-select");
    options.forEach(function (opt) {
      var btn = el("button", "chip-select-btn" + (selected.indexOf(opt) > -1 ? " selected" : ""), opt);
      btn.type = "button";
      btn.addEventListener("click", function () {
        var idx = selected.indexOf(opt);
        if (idx > -1) { selected.splice(idx, 1); btn.classList.remove("selected"); }
        else { selected.push(opt); btn.classList.add("selected"); }
        wrap.classList.remove("field-invalid");
      });
      wrap.appendChild(btn);
    });
    return { node: wrap, getValue: function () { return selected.slice(); } };
  }

  function buildChipMultiAdd(options, initialItems, onChange) {
    var items = (initialItems || []).slice();
    var wrap = el("div", "chip-add");
    var chipsRow = el("div", "chip-add-list");
    var searchable = buildSearchableInput(options, "");
    var addBtn = el("button", "bullet-input-add", icon("add"));
    addBtn.type = "button";

    function renderChips() {
      chipsRow.innerHTML = "";
      items.forEach(function (name, i) {
        var chip = el("span", "chip-add-item", name);
        var rm = el("button", "chip-add-remove", icon("close"));
        rm.type = "button";
        rm.addEventListener("click", function () { items.splice(i, 1); renderChips(); if (onChange) onChange(items.slice()); });
        chip.appendChild(rm);
        chipsRow.appendChild(chip);
      });
    }

    function addCurrent() {
      var v = searchable.input.value.trim();
      if (!v || items.indexOf(v) > -1) return;
      items.push(v);
      searchable.input.value = "";
      renderChips();
      if (onChange) onChange(items.slice());
    }

    addBtn.addEventListener("click", addCurrent);
    searchable.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); addCurrent(); }
    });

    var inputRow = el("div", "bullet-input-row");
    inputRow.appendChild(searchable.node);
    inputRow.appendChild(addBtn);
    wrap.appendChild(chipsRow);
    wrap.appendChild(inputRow);
    renderChips();

    return { node: wrap, getValue: function () { return items.slice(); } };
  }

  function buildNumberWithUnit(unitOptions, defaultValue, defaultUnit) {
    var row = el("div", "number-unit-row");
    var num = document.createElement("input");
    num.className = "form-input";
    num.type = "number";
    num.placeholder = "0";
    if (defaultValue) num.value = defaultValue;
    var unit = buildSelect("form-select number-unit-select", unitOptions.map(function (u) { return [u, u]; }), defaultUnit || unitOptions[0], function () {});
    row.appendChild(num);
    row.appendChild(unit);
    return { node: row, getValue: function () { return { value: num.value, unit: unit.value }; } };
  }

  function buildFileUpload(initialFiles) {
    var files = (initialFiles || []).slice();
    var wrap = el("div", "file-upload");
    var list = el("div", "chip-add-list");
    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.hidden = true;
    var addBtn = el("button", "btn-secondary file-upload-btn", icon("attach_file") + "Add File");
    addBtn.type = "button";
    addBtn.addEventListener("click", function () { fileInput.click(); });
    fileInput.addEventListener("change", function () {
      Array.prototype.forEach.call(fileInput.files, function (f) { files.push(f.name); });
      fileInput.value = "";
      renderList();
    });
    function renderList() {
      list.innerHTML = "";
      files.forEach(function (name, i) {
        var chip = el("span", "chip-add-item", icon("description", "picon") + name);
        var rm = el("button", "chip-add-remove", icon("close"));
        rm.type = "button";
        rm.addEventListener("click", function () { files.splice(i, 1); renderList(); });
        chip.appendChild(rm);
        list.appendChild(chip);
      });
    }
    wrap.appendChild(addBtn);
    wrap.appendChild(fileInput);
    wrap.appendChild(list);
    renderList();
    return { node: wrap, getValue: function () { return files.slice(); } };
  }

  function buildToggle(defaultOn, onLabel, offLabel) {
    var on = !!defaultOn;
    var btn = el("button", "toggle-switch" + (on ? " on" : ""), "");
    btn.type = "button";
    btn.setAttribute("role", "switch");
    btn.setAttribute("aria-checked", String(on));
    var track = el("span", "toggle-track");
    track.appendChild(el("span", "toggle-thumb"));
    btn.appendChild(track);
    var text = el("span", "toggle-text", on ? (onLabel || "Unlocked") : (offLabel || "Locked"));
    btn.appendChild(text);
    btn.addEventListener("click", function () {
      on = !on;
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-checked", String(on));
      text.textContent = on ? (onLabel || "Unlocked") : (offLabel || "Locked");
    });
    return { node: btn, getValue: function () { return on; } };
  }

  function buildCheckboxRow(labelText, defaultChecked) {
    var label = el("label", "form-checkbox-row");
    var input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!defaultChecked;
    label.appendChild(input);
    label.appendChild(document.createTextNode(labelText));
    return { node: label, getValue: function () { return input.checked; } };
  }

  function buildLinkTaskList(taskOptions, initialLinks) {
    var links = (initialLinks || []).map(function (l) { return { relation: l.relation, task: l.task }; });
    var wrap = el("div", "link-task-list");
    var rows = el("div", "link-task-rows");
    var addBtn = el("button", "btn-secondary link-task-add", icon("add_link") + "Link Task");
    addBtn.type = "button";

    function renderRows() {
      rows.innerHTML = "";
      links.forEach(function (link, i) {
        var row = el("div", "link-task-row");
        row.appendChild(buildSelect("form-select link-relation-select", LINK_RELATION_OPTIONS.map(function (r) { return [r, r]; }), link.relation, function (v) { link.relation = v; }));
        var taskSearch = buildSearchableInput(taskOptions, link.task);
        taskSearch.input.addEventListener("input", function () { link.task = taskSearch.input.value; });
        row.appendChild(taskSearch.node);
        var rm = el("button", "icon-action-btn danger", icon("delete"));
        rm.type = "button";
        rm.addEventListener("click", function () { links.splice(i, 1); renderRows(); });
        row.appendChild(rm);
        rows.appendChild(row);
      });
    }

    addBtn.addEventListener("click", function () {
      links.push({ relation: LINK_RELATION_OPTIONS[0], task: "" });
      renderRows();
    });

    wrap.appendChild(rows);
    wrap.appendChild(addBtn);
    renderRows();

    return { node: wrap, getValue: function () { return links.filter(function (l) { return l.task && l.task.trim(); }); } };
  }

  function flagRequired(inputEl) {
    inputEl.classList.add("field-invalid");
    var clear = function () {
      inputEl.classList.remove("field-invalid");
      inputEl.removeEventListener("input", clear);
      inputEl.removeEventListener("change", clear);
      inputEl.removeEventListener("click", clear);
    };
    inputEl.addEventListener("input", clear);
    inputEl.addEventListener("change", clear);
    inputEl.addEventListener("click", clear);
  }

  function nowTimestamp() {
    var d = new Date();
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  // Bigger, standalone version of the Acknowledge button's tick: the
  // circle pops in via CSS, then the check itself draws in a beat later
  // via the same stroke-dashoffset technique as buildTickIcon/
  // triggerTickPulse, since a CSS transition on SVG stroke properties
  // doesn't reliably engage.
  function buildSuccessCheckmark() {
    var circle = el("div", "success-tick-circle");
    var svg = svgEl("svg", { viewBox: "0 0 24 24", width: "36", height: "36" });
    var path = svgEl("path", {
      d: "M4 12.5 L9.5 18 L20 6", fill: "none", stroke: "#ffffff", "stroke-width": "2.5",
      "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": "30", "stroke-dashoffset": "30"
    });
    svg.appendChild(path);
    circle.appendChild(svg);
    setTimeout(function () { animateAttr(path, "stroke-dashoffset", 30, 0, 450); }, 200);
    return circle;
  }

  // Shown after "Create Task" (not "Save as Draft") finalizes a task —
  // a full celebratory screen rather than a snackbar, matching the
  // reference design. "Review Task Details" goes to Drafts, since that's
  // where every created task actually lives in this prototype's data
  // model (see the Create Task handler below); "Home" returns to the
  // Scorecard Overview.
  function openTaskCreatedModal(typeKey) {
    var body = el("div", "task-created-modal-body");
    body.appendChild(el("h2", "task-created-title", typeKey + " Task Created Successfully"));
    body.appendChild(buildSuccessCheckmark());
    body.appendChild(el("p", "task-created-sub", "Assignee and Collaborators have been notified"));

    var footer = el("div", "task-created-modal-footer");
    var reviewBtn = el("button", "btn-secondary", "Review Task Details");
    reviewBtn.type = "button";
    reviewBtn.addEventListener("click", function () {
      closeModal();
      goToDraftsTab();
    });
    var homeBtn = el("button", "btn-primary", "Home");
    homeBtn.type = "button";
    homeBtn.addEventListener("click", function () {
      closeModal();
      var scorecardTab = document.querySelector('.tab[data-view="scorecard"]');
      if (scorecardTab && !scorecardTab.classList.contains("active")) scorecardTab.click();
    });
    footer.appendChild(reviewBtn);
    footer.appendChild(homeBtn);

    openModal("", body, { footer: footer, celebratory: true });
  }

  function openCreateTaskModal(cardId, defaultType, existingDraft) {
    var main = el("div", "task-form-main");
    var nav = el("div", "task-form-nav");

    // V1/V2 is a form-level experiment on just the Task Type field: V1 is
    // today's free radio row; V2 shows the type the user already picked
    // (in the Activity Type popup, or whatever was passed in) as a locked
    // chip that takes a deliberate second click — the dropdown toggle —
    // before it can be changed, to cut down on picking the wrong type by
    // accident. Both write to the same underlying radios, so nothing else
    // in the form needs to know which version is showing.
    var versionToggle = el("div", "seg-toggle form-version-toggle");
    var v1Btn = el("button", "seg-btn active", "V1");
    v1Btn.type = "button";
    var v2Btn = el("button", "seg-btn", "V2");
    v2Btn.type = "button";
    versionToggle.appendChild(v1Btn);
    versionToggle.appendChild(v2Btn);
    nav.appendChild(versionToggle);

    nav.appendChild(el("div", "task-form-nav-label", "Section Navigator"));

    function section(title) {
      var sec = el("div", "task-form-section");
      sec.appendChild(el("div", "task-form-section-title", title));
      var sbody = el("div", "task-form-section-body");
      sec.appendChild(sbody);
      main.appendChild(sec);
      var navItem = el("button", "task-form-nav-item" + (main.children.length === 1 ? " active" : ""), title);
      navItem.type = "button";
      navItem.addEventListener("click", function () {
        sec.scrollIntoView({ behavior: "smooth", block: "start" });
        nav.querySelectorAll(".task-form-nav-item").forEach(function (b) { b.classList.remove("active"); });
        navItem.classList.add("active");
      });
      nav.appendChild(navItem);
      return sbody;
    }

    var d = existingDraft || {};
    var taskOptions = ACTIONS_LIST.map(function (a) { return a.title; }).concat(DRAFTS.map(function (dr) { return dr.title; }));

    /* ---------------- Task Details ---------------- */
    var detailsBody = section("Task Details");

    var typeField = el("div", "form-field");
    typeField.appendChild(el("label", "form-label", "Task Type"));
    var typeOptions = el("div", "task-type-options");
    var typeRadios = [];
    TASK_TYPE_KEYS.forEach(function (t) {
      var label = document.createElement("label");
      label.className = "task-type-option";
      var input = document.createElement("input");
      input.type = "radio";
      input.name = "taskType";
      input.value = t;
      if (t === (d.taskType || defaultType)) input.checked = true;
      typeRadios.push(input);
      label.appendChild(input);
      label.appendChild(document.createTextNode(t));
      typeOptions.appendChild(label);
    });
    typeField.appendChild(typeOptions);

    var typeV2Wrap = el("div", "task-type-v2");
    typeV2Wrap.hidden = true;
    var currentType = d.taskType || defaultType || TASK_TYPE_KEYS[0];
    var typeSelect = buildSelect("form-select task-type-select", TASK_TYPE_KEYS.map(function (t) { return [t, t]; }), currentType, function (v) {
      typeRadios.forEach(function (r) { r.checked = (r.value === v); });
      lockedPill.innerHTML = icon("lock") + v + icon("expand_more", "chip-caret");
      typeSelect.hidden = true;
      lockedPill.hidden = false;
    });
    typeSelect.hidden = true;
    var lockedPill = el("button", "task-type-locked-chip", icon("lock") + currentType + icon("expand_more", "chip-caret"));
    lockedPill.type = "button";
    lockedPill.title = "Change task type";
    lockedPill.addEventListener("click", function () {
      typeSelect.hidden = false;
      lockedPill.hidden = true;
      typeSelect.focus();
    });
    typeV2Wrap.appendChild(lockedPill);
    typeV2Wrap.appendChild(typeSelect);
    typeField.appendChild(typeV2Wrap);

    detailsBody.appendChild(typeField);

    function setFormVersion(v) {
      v1Btn.classList.toggle("active", v === "v1");
      v2Btn.classList.toggle("active", v === "v2");
      typeOptions.hidden = v !== "v1";
      typeV2Wrap.hidden = v !== "v2";
    }
    v1Btn.addEventListener("click", function () { setFormVersion("v1"); });
    v2Btn.addEventListener("click", function () { setFormVersion("v2"); });

    var titleInput = document.createElement("input");
    titleInput.className = "form-input";
    titleInput.type = "text";
    titleInput.placeholder = "e.g. Increase recruitment at Site 12";
    titleInput.value = d.title || "";
    detailsBody.appendChild(formField("Task Title", titleInput, { required: true }));

    var summaryInput = document.createElement("textarea");
    summaryInput.className = "form-input";
    summaryInput.rows = 2;
    summaryInput.placeholder = "What's happening, and what needs to change?";
    summaryInput.value = d.summary || "";
    detailsBody.appendChild(formField("Task Summary", summaryInput, { hint: "Prompt text to help" }));

    var rootCauseInput = document.createElement("textarea");
    rootCauseInput.className = "form-input";
    rootCauseInput.rows = 2;
    rootCauseInput.placeholder = "Why is this happening?";
    rootCauseInput.value = d.rootCause || "";
    detailsBody.appendChild(formField("Predicted Root Cause — Why?", rootCauseInput));

    var acceptanceCriteria = buildBulletListInput(d.acceptanceCriteria);
    detailsBody.appendChild(formField("Acceptance Criteria", acceptanceCriteria.node));

    var impactedNodeFn = buildChipMultiSelect(NODE_FUNCTION_MULTI_OPTIONS, d.impactedNodeFunction);
    detailsBody.appendChild(formField("Impacted Node-Function", impactedNodeFn.node));

    var descInput = document.createElement("textarea");
    descInput.className = "form-input";
    descInput.rows = 3;
    descInput.maxLength = 280;
    descInput.placeholder = "Optional — add any further context";
    descInput.value = d.description || "";
    var descField = formField("Description", descInput);
    var charCount = el("div", "char-count", descInput.value.length + "/280");
    descInput.addEventListener("input", function () { charCount.textContent = descInput.value.length + "/280"; });
    descField.appendChild(charCount);
    detailsBody.appendChild(descField);

    var dateRow = el("div", "form-row");
    var startDateInput = document.createElement("input");
    startDateInput.className = "form-input";
    startDateInput.type = "date";
    startDateInput.value = d.startDate || "";
    dateRow.appendChild(formField("Start Date", startDateInput));
    var dueDateInput = document.createElement("input");
    dueDateInput.className = "form-input";
    dueDateInput.type = "date";
    dueDateInput.value = d.plannedDate || "";
    dateRow.appendChild(formField("Due Date", dueDateInput));
    detailsBody.appendChild(dateRow);

    var criticalitySelect = buildSelect("form-select", [["", "Select criticality"]].concat(CRITICALITY_OPTIONS.map(function (c) { return [c, c]; })), d.criticality || "", function () {});
    detailsBody.appendChild(formField("Criticality", criticalitySelect));

    /* ---------------- Ownership Detail ---------------- */
    var ownerBody = section("Ownership Detail");
    var ownerRow = el("div", "form-row");
    var creatorInput = document.createElement("input");
    creatorInput.className = "form-input";
    creatorInput.type = "text";
    creatorInput.value = d.creator || "Nick Skwiat";
    creatorInput.disabled = true;
    ownerRow.appendChild(formField("Creator Name", creatorInput, { hint: "Auto-filled" }));
    var createdInput = document.createElement("input");
    createdInput.className = "form-input";
    createdInput.type = "text";
    createdInput.value = d.createdDate || nowTimestamp();
    createdInput.disabled = true;
    ownerRow.appendChild(formField("Created Date · Time Stamp", createdInput, { hint: "Auto-filled" }));
    ownerBody.appendChild(ownerRow);

    var ownerSearch = buildSearchableInput(OWNER_OPTIONS, d.owner || "");
    ownerBody.appendChild(formField("Assigned To (Owner)", ownerSearch.node));

    var ownerMirror = el("div", "form-readonly-note", ownerSearch.input.value || "—");
    ownerSearch.input.addEventListener("input", function () { ownerMirror.textContent = ownerSearch.input.value || "—"; });

    var collabMirror = el("div", "form-readonly-note", (d.collaborators && d.collaborators.length) ? d.collaborators.join(", ") : "—");
    var collaborators = buildChipMultiAdd(OWNER_OPTIONS, d.collaborators, function (list) {
      collabMirror.textContent = list.length ? list.join(", ") : "—";
    });
    ownerBody.appendChild(formField("Collaborator", collaborators.node));

    /* ---------------- Access and Visibility ---------------- */
    var accessBody = section("Access and Visibility");
    var recapRow = el("div", "form-row");
    recapRow.appendChild(formField("Creator", el("div", "form-readonly-note", creatorInput.value)));
    recapRow.appendChild(formField("Assigned To (Owner)", ownerMirror));
    accessBody.appendChild(recapRow);
    accessBody.appendChild(formField("Collaborator", collabMirror));

    var nodesMultiSelect = buildChipMultiSelect(NODE_OPTIONS, d.nodes);
    accessBody.appendChild(formField("Added Nodes", nodesMultiSelect.node, { hint: "Single or multiple" }));

    var lockToggle = buildToggle(d.locked === undefined ? true : !d.locked, "Unlocked", "Locked");
    accessBody.appendChild(formField("Lock / Unlock", lockToggle.node));

    /* ---------------- Impact Metric Data ---------------- */
    var metricBody = section("Impact Metric Data");
    var metricRow = el("div", "form-row");
    var defaultMetric = d.impactMetric || (cardId && CARDS[cardId] && CARDS[cardId].title) || METRIC_OPTIONS[0];
    var weeksRedValue = document.createElement("input");
    weeksRedValue.className = "form-input";
    weeksRedValue.type = "text";
    weeksRedValue.value = d.weeksRed || WEEKS_RED_LOOKUP[defaultMetric] || "—";
    weeksRedValue.disabled = true;
    var metricSelect = buildSelect("form-select", [["", "Select a metric"]].concat(METRIC_OPTIONS.map(function (m) { return [m, m]; })), defaultMetric, function (v) {
      weeksRedValue.value = WEEKS_RED_LOOKUP[v] || "—";
    });
    metricRow.appendChild(formField("Linked Metric", metricSelect));
    metricRow.appendChild(formField("Metric Condition (Weeks Red)", weeksRedValue, { hint: "Auto-filled" }));
    metricBody.appendChild(metricRow);

    var impactRow = el("div", "form-row");
    var expectedImpact = buildNumberWithUnit(IMPACT_UOM_OPTIONS, d.expectedImpact && d.expectedImpact.value, d.expectedImpact && d.expectedImpact.unit);
    impactRow.appendChild(formField("Expected Impact", expectedImpact.node, { hint: "Can be a range · UOM impacted" }));
    var severitySelect = buildSelect("form-select", [["", "Select a level"], ["High", "High"], ["Medium", "Medium"], ["Low", "Low"]], d.impactLevel || "", function () {});
    impactRow.appendChild(formField("Impact Severity Level", severitySelect));
    metricBody.appendChild(impactRow);

    /* ---------------- Linkage ---------------- */
    var linkageBody = section("Linkage");
    var linkedTasks = buildLinkTaskList(taskOptions, d.linkedTasks);
    linkageBody.appendChild(formField("Linked Tasks", linkedTasks.node, { hint: "Related to, dependent on, or originates from another task" }));

    var programSelect = buildSelect("form-select", PROGRAM_OPTIONS.map(function (p) { return [p, p]; }), d.linkedProgram || PROGRAM_OPTIONS[0], function () {});
    linkageBody.appendChild(formField("Linked Program", programSelect, { hint: "Child task of" }));

    var fileUpload = buildFileUpload(d.files);
    linkageBody.appendChild(formField("Add Files / References", fileUpload.node));

    /* ---------------- Communication ---------------- */
    var commBody = section("Communication");
    var notifyCheckbox = buildCheckboxRow("Notify creator and owner when this task is created", d.notifyOnCreate === undefined ? true : d.notifyOnCreate);
    commBody.appendChild(formField("Notification", notifyCheckbox.node));
    var weeklySummaryCheckbox = buildCheckboxRow("Include collaborators and impacted nodes in the weekly summary", d.weeklySummary === undefined ? true : d.weeklySummary);
    commBody.appendChild(formField("Weekly Summary", weeklySummaryCheckbox.node));

    var shell = el("div", "task-form-shell");
    shell.appendChild(main);
    shell.appendChild(nav);

    function currentTypeValue() {
      var checked = typeRadios.filter(function (r) { return r.checked; })[0];
      return checked ? checked.value : defaultType;
    }

    function collectFields(typeVal) {
      return {
        taskType: typeVal,
        title: titleInput.value.trim() || ("Untitled " + typeVal),
        summary: summaryInput.value.trim(),
        rootCause: rootCauseInput.value.trim(),
        acceptanceCriteria: acceptanceCriteria.getValue(),
        impactedNodeFunction: impactedNodeFn.getValue(),
        description: descInput.value.trim(),
        startDate: startDateInput.value,
        plannedDate: dueDateInput.value,
        criticality: criticalitySelect.value,
        creator: creatorInput.value,
        createdDate: createdInput.value,
        owner: ownerSearch.input.value.trim(),
        collaborators: collaborators.getValue(),
        nodes: nodesMultiSelect.getValue(),
        locked: !lockToggle.getValue(),
        impactMetric: metricSelect.value,
        weeksRed: weeksRedValue.value,
        expectedImpact: expectedImpact.getValue(),
        impactLevel: severitySelect.value,
        linkedTasks: linkedTasks.getValue(),
        linkedProgram: programSelect.value,
        files: fileUpload.getValue(),
        notifyOnCreate: notifyCheckbox.getValue(),
        weeklySummary: weeklySummaryCheckbox.getValue()
      };
    }

    var footer = el("div", "");
    footer.style.display = "flex";
    footer.style.gap = "10px";
    function saveAsDraft() {
      var fields = collectFields(currentTypeValue());
      if (existingDraft) {
        Object.assign(existingDraft, fields);
        existingDraft.edited = todayEdited();
        closeModal();
        renderDraftsStage();
        showSnackbar("Draft updated.", null, "success");
      } else {
        fields.id = "t" + Date.now();
        fields.edited = todayEdited();
        DRAFTS.unshift(fields);
        draftsUnseen++;
        updateDraftsTabDot();
        closeModal();
        renderDraftsStage();
        showSnackbar("Draft saved.", goToDraftsTab, "success");
      }
    }

    var draftBtn = el("button", "btn-secondary", existingDraft ? "Update Draft" : "Save as Draft");
    draftBtn.type = "button";
    draftBtn.addEventListener("click", saveAsDraft);

    var discardBtn = el("button", "btn-tertiary", "Discard");
    discardBtn.type = "button";
    discardBtn.addEventListener("click", function () {
      var body = el("div", "discard-confirm-body");
      body.appendChild(el("p", "discard-confirm-text", "You will lose all progress on this task creation."));

      var confirmFooter = el("div", "");
      confirmFooter.style.display = "flex";
      confirmFooter.style.gap = "10px";
      var saveDraftBtn = el("button", "btn-secondary", "Save as Draft");
      saveDraftBtn.type = "button";
      saveDraftBtn.addEventListener("click", saveAsDraft);
      var discardCloseBtn = el("button", "btn-danger", icon("delete") + "Discard & Close");
      discardCloseBtn.type = "button";
      discardCloseBtn.addEventListener("click", closeModal);
      confirmFooter.appendChild(saveDraftBtn);
      confirmFooter.appendChild(discardCloseBtn);

      openModal("Are you sure you want to Discard?", body, { footer: confirmFooter });
    });

    var createBtn = el("button", "btn-primary", "Create Task");
    createBtn.type = "button";
    createBtn.addEventListener("click", function () {
      if (!titleInput.value.trim()) {
        flagRequired(titleInput);
        nav.querySelectorAll(".task-form-nav-item")[0].click();
        titleInput.focus();
        showSnackbar("Please add a task title.", null);
        return;
      }

      var typeVal = currentTypeValue();
      if (cardId) bumpCardCount(cardId, typeVal);
      var fields = collectFields(typeVal);
      if (existingDraft) {
        var idx = DRAFTS.indexOf(existingDraft);
        if (idx > -1) DRAFTS.splice(idx, 1);
        renderDraftsStage();
      } else {
        fields.id = "t" + Date.now();
        fields.edited = todayEdited();
        DRAFTS.unshift(fields);
        draftsUnseen++;
        updateDraftsTabDot();
        renderDraftsStage();
      }
      closeModal();
      openTaskCreatedModal(typeVal);
    });
    discardBtn.style.marginRight = "auto";
    footer.appendChild(discardBtn);
    footer.appendChild(draftBtn);
    footer.appendChild(createBtn);

    var modalTitle = existingDraft ? "Edit Draft" : "Create " + (defaultType || "Action") + " Task";
    openModal(modalTitle, shell, { wide: true, footer: footer });
  }

  /* =====================================================================
     Decisions to Approve
     ===================================================================== */

  var DECISIONS = [
    {
      id: "dec1", category: "Procurement", timestamp: "10:20 AM", kpiCardId: 1,
      node: "Chem Ops", impactLevel: "Medium", expectedImpact: "$180K/yr",
      headline: "Renew logistics vendor contract?",
      desc: "Current terms expire in 18 days. Vendor has held pricing flat and offered a 2-year lock-in with an 8% discount.",
      requester: { initials: "SK", name: "Sanjay Kulkarni", role: "Procurement Lead" },
      doc: { name: "Vendor_Contract_2027.pdf", meta: "3 pages · 410 KB" },
      options: [
        { label: "1-year renewal, current terms", sub: "No material change expected" },
        { label: "2-year renewal, 8% discount", sub: "Locked carrier capacity reduces delays", suggested: true },
        { label: "Don't renew — open to RFP", sub: "Risk during vendor transition window" }
      ]
    },
    {
      id: "dec2", category: "Finance", timestamp: "9:05 AM", kpiCardId: 2,
      node: "D&AA", impactLevel: "High", expectedImpact: "$2M",
      headline: "Approve Q3 marketing budget increase?",
      desc: "Growth team is requesting an additional $2M to extend the checkout campaign that's already tracking ahead of plan.",
      requester: { initials: "EP", name: "Elena Popova", role: "FP&A Analyst" },
      doc: { name: "Q3_Budget_Request.pdf", meta: "5 pages · 620 KB" },
      options: [
        { label: "Approve full $2M increase", sub: "Extends campaign through Q4 at current ROI", suggested: true },
        { label: "Approve $1M, reassess in 4 weeks", sub: "Caps exposure if ROI regresses" },
        { label: "Hold at current budget", sub: "Campaign likely tapers before quarter-end" }
      ]
    },
    {
      id: "dec3", category: "People", timestamp: "8:40 AM", kpiCardId: 3,
      node: "HR", impactLevel: "Medium", expectedImpact: "Policy change",
      headline: "Approve updated remote-work policy?",
      desc: "HR proposes moving from 2 to 3 required in-office days starting next quarter, following the engagement survey results.",
      requester: { initials: "RM", name: "Rita Mathews", role: "HR Business Partner" },
      doc: { name: "Remote_Work_Policy_v3.pdf", meta: "6 pages · 280 KB" },
      options: [
        { label: "Adopt 3-day policy as proposed", sub: "Aligns with peer sites, risks engagement dip" },
        { label: "Phase in over 2 quarters", sub: "Softer transition, delays alignment", suggested: true },
        { label: "Keep current 2-day policy", sub: "No disruption, diverges from peer sites" }
      ]
    },
    {
      id: "dec4", category: "Technology", timestamp: "7:55 AM", kpiCardId: 4,
      node: "BSC", impactLevel: "High", expectedImpact: "$0.7M/yr",
      headline: "Migrate CRM to new vendor?",
      desc: "Current CRM contract renews in 60 days. IT has evaluated a replacement that cuts license cost by 30% but requires a 6-week migration.",
      requester: { initials: "AK", name: "Aditya Kapoor", role: "IT Director" },
      doc: { name: "CRM_Migration_Plan.pdf", meta: "8 pages · 1.1 MB" },
      options: [
        { label: "Approve migration now", sub: "6-week disruption, $0.7M annual savings after", suggested: true },
        { label: "Renew current CRM 1 more year", sub: "No disruption, budget stays over target" },
        { label: "Renegotiate current vendor", sub: "Uncertain savings, no migration risk" }
      ]
    },
    {
      id: "dec5", category: "Commercial", timestamp: "6:30 AM", kpiCardId: 5,
      node: "SIBG", impactLevel: "High", expectedImpact: "$1.4M ARR",
      headline: "Approve enterprise discount for Acme Corp?",
      desc: "Acme is requesting a 12% volume discount to expand from 2 to 5 plants. Deal would be our largest commercial account.",
      requester: { initials: "RC", name: "R. Chen", role: "Commercial Ops" },
      doc: { name: "Acme_Deal_Terms.pdf", meta: "4 pages · 350 KB" },
      options: [
        { label: "Approve 12% discount", sub: "Closes the gap to target this quarter", suggested: true },
        { label: "Counter at 8% discount", sub: "Slower close, preserves more margin" },
        { label: "Decline — hold list price", sub: "Risk losing the expansion entirely" }
      ]
    }
  ];

  var decisionState = {};
  DECISIONS.forEach(function (d) { decisionState[d.id] = "pending"; });
  var decisionIndex = 0;
  var decisionsDecidedToday = 0;

  function orderedDecisions() {
    return DECISIONS.filter(function (d) { return decisionState[d.id] === "pending"; });
  }

  function openDocPreview(doc) {
    var body = el("div", "");
    var preview = el("div", "doc-preview");
    preview.appendChild(el("div", "doc-preview-icon", icon("description")));
    preview.appendChild(el("div", "doc-preview-name", doc.name));
    preview.appendChild(el("div", "doc-preview-meta", doc.meta));
    preview.appendChild(el("div", "doc-preview-note", "Document preview isn't available in this prototype — this is a placeholder for the real viewer."));
    body.appendChild(preview);
    openModal(doc.name, body);
  }

  // Same split-pane shape as the Inform card: left is all info/text
  // (question, options, description, requester, doc), right is a live
  // mini KPI card. No projected-impact chart or per-option forecast —
  // there's no engine behind it, so it isn't shown as if there were.
  var DECLINE_REASONS = [
    "Missing information to decide",
    "Need more time to review",
    "Not the right approver for this",
    "Conflicts with a higher priority right now",
    "Other"
  ];

  function handleDeclineDecision(d) {
    decisionState[d.id] = "declined";
    var card = document.getElementById("decisionCard");
    if (card) {
      card.classList.add("leaving");
      setTimeout(renderDecisions, 220);
    } else {
      renderDecisions();
    }
    showSnackbar("Decline sent to " + d.requester.name + ".", null, "success");
  }

  // Reason -> textarea -> Send, in a popup rather than inline so picking a
  // reason doesn't elongate the card underneath it.
  function openDeclineModal(d) {
    var body = el("div", "decline-modal-body");
    body.appendChild(el("div", "decline-panel-title", "What's blocking this decision?"));

    var reasonsRow = el("div", "decline-reasons");
    var noteWrap = el("div", "decline-note-wrap");
    noteWrap.hidden = true;
    var textarea = document.createElement("textarea");
    textarea.className = "form-input";
    textarea.rows = 3;
    textarea.placeholder = "Add context...";
    var selectedReason = null;

    DECLINE_REASONS.forEach(function (reason) {
      var btn = el("button", "decline-reason-btn", reason);
      btn.type = "button";
      btn.addEventListener("click", function () {
        selectedReason = reason;
        reasonsRow.querySelectorAll(".decline-reason-btn").forEach(function (b) { b.classList.toggle("selected", b === btn); });
        noteWrap.hidden = false;
        textarea.placeholder = "Add context for " + d.requester.name + "...";
        textarea.focus();
      });
      reasonsRow.appendChild(btn);
    });
    body.appendChild(reasonsRow);

    noteWrap.appendChild(textarea);
    body.appendChild(noteWrap);

    var footer = el("div", "decline-modal-footer");
    var sendBtn = el("button", "btn-primary", "Send");
    sendBtn.type = "button";
    sendBtn.addEventListener("click", function () {
      if (!selectedReason) return;
      closeModal();
      handleDeclineDecision(d);
    });
    footer.appendChild(sendBtn);

    openModal("Decline decision", body, { footer: footer });
  }

  function buildDecisionCard(d) {
    var card = el("div", "card-a split-card decision-fade");
    card.id = "decisionCard";

    var body = el("div", "card-a-body");

    var left = el("div", "card-a-content");

    left.appendChild(el("h3", "card-a-headline", d.headline));
    left.appendChild(el("div", "card-a-timestamp", d.timestamp));

    var optionsRow = el("div", "decision-options");
    d.options.forEach(function (opt) {
      var btn = el("button", "decision-option" + (opt.suggested ? " suggested" : ""));
      btn.type = "button";
      if (opt.suggested) btn.appendChild(el("span", "decision-option-badge", "Suggested"));
      btn.appendChild(el("span", "decision-option-label", opt.label));
      if (opt.sub) btn.appendChild(el("span", "decision-option-sub", opt.sub));
      btn.addEventListener("click", function () { handleDecide(d.id); });
      optionsRow.appendChild(btn);
    });
    left.appendChild(optionsRow);
    left.appendChild(el("div", "decision-hint", "Click an option to decide"));

    left.appendChild(el("p", "decision-desc", d.desc));

    if (d.doc) {
      var docBtn = el("button", "decision-doc");
      docBtn.type = "button";
      docBtn.appendChild(el("span", "decision-doc-icon", icon("description")));
      var textWrap = document.createElement("span");
      textWrap.style.display = "flex";
      textWrap.style.flexDirection = "column";
      textWrap.appendChild(el("span", "decision-doc-name", d.doc.name));
      textWrap.appendChild(el("span", "decision-doc-meta", d.doc.meta));
      docBtn.appendChild(textWrap);
      docBtn.appendChild(el("span", "material-symbols-outlined decision-doc-chevron", "chevron_right"));
      docBtn.addEventListener("click", function () { openDocPreview(d.doc); });
      left.appendChild(docBtn);
    }

    var req = el("div", "decision-requester");
    req.appendChild(el("div", "contributor-avatar", d.requester.initials));
    var names = el("div", "");
    names.appendChild(el("div", "contributor-name", d.requester.name));
    names.appendChild(el("div", "contributor-role", d.requester.role));
    req.appendChild(names);
    left.appendChild(req);

    body.appendChild(left);

    // Right pane matches the Inform card's info density — the KPI graph
    // plus the same Node/Severity/Expected Impact readout — rather than
    // showing only the graph.
    var right = el("div", "card-a-kpi-pane");
    var kpiInfo = el("div", "card-a-kpi-info");
    kpiInfo.appendChild(buildMiniKpiCard(d.kpiCardId));

    var stats = el("div", "card-a-stat-grid");
    stats.appendChild(buildStatItem("Node", d.node));
    stats.appendChild(buildStatItem("Severity", null, d.impactLevel));
    stats.appendChild(buildStatItem("Expected Impact", d.expectedImpact));
    kpiInfo.appendChild(stats);
    right.appendChild(kpiInfo);

    var kpiActions = el("div", "card-a-kpi-actions");
    kpiActions.appendChild(buildDiveDeeperButton(d.kpiCardId));
    var createBtn = el("button", "briefing-btn briefing-btn-create card-a-kpi-action", icon("add_circle") + "Create Task");
    createBtn.type = "button";
    createBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      openActivityTypeModal(function (typeKey) { openCreateTaskModal(d.kpiCardId, typeKey); });
    });
    kpiActions.appendChild(createBtn);
    right.appendChild(kpiActions);

    body.appendChild(right);

    card.appendChild(body);

    var actions = el("div", "briefing-actions");
    var declineBtn = el("button", "briefing-btn briefing-btn-decline", icon("block") + "Decline");
    declineBtn.type = "button";
    declineBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      openDeclineModal(d);
    });
    actions.appendChild(declineBtn);
    card.appendChild(actions);

    return card;
  }

  function updateDecisionCount() {
    var n = orderedDecisions().length;
    var countEl = document.getElementById("decisionCount");
    countEl.textContent = n > 0 ? n + " pending" : "";
    countEl.style.display = n > 0 ? "" : "none";
  }

  function renderDecisions() {
    var wrap = document.getElementById("decisionStage");
    wrap.innerHTML = "";
    var items = orderedDecisions();
    if (decisionIndex >= items.length) decisionIndex = Math.max(0, items.length - 1);
    updateDecisionCount();

    if (!items.length) {
      var empty = el("div", "planner-empty");
      empty.innerHTML =
        '<div class="planner-empty-icon">' + icon("check_circle") + "</div>" +
        '<div class="planner-empty-title">All decisions handled</div>' +
        '<p class="planner-empty-sub">Nothing pending your approval right now.</p>' +
        (decisionsDecidedToday > 0
          ? '<span class="planner-empty-count">' + decisionsDecidedToday + " decision" + (decisionsDecidedToday === 1 ? "" : "s") + " made today</span>"
          : "");
      wrap.appendChild(empty);
      return;
    }

    var idx = decisionIndex;
    var d = items[idx];

    var carousel = el("div", "briefing-carousel");
    carousel.appendChild(el("div", "briefing-position", (idx + 1) + " / " + items.length));
    var segRow = el("div", "briefing-segments");
    for (var i = 0; i < items.length; i++) {
      segRow.appendChild(el("span", "briefing-seg" + (i <= idx ? " done" : "") + (i === idx ? " current" : "")));
    }
    carousel.appendChild(segRow);

    var stageRow = el("div", "briefing-stage-row");
    var prevBtn = el("button", "carousel-arrow prev", icon("chevron_left"));
    prevBtn.type = "button";
    prevBtn.disabled = idx === 0;
    prevBtn.setAttribute("aria-label", "Previous decision");
    prevBtn.addEventListener("click", function () { decisionIndex = idx - 1; renderDecisions(); });

    var nextBtn = el("button", "carousel-arrow next", icon("chevron_right"));
    nextBtn.type = "button";
    nextBtn.disabled = idx === items.length - 1;
    nextBtn.setAttribute("aria-label", "Next decision");
    nextBtn.addEventListener("click", function () { decisionIndex = idx + 1; renderDecisions(); });

    var viewport = el("div", "briefing-stage-viewport");
    viewport.appendChild(buildDecisionCard(d));

    stageRow.appendChild(prevBtn);
    stageRow.appendChild(viewport);
    stageRow.appendChild(nextBtn);
    carousel.appendChild(stageRow);
    wrap.appendChild(carousel);
  }

  function handleDecide(id) {
    decisionState[id] = "decided";
    decisionsDecidedToday++;
    var card = document.getElementById("decisionCard");
    if (card) {
      card.classList.add("leaving");
      setTimeout(renderDecisions, 220);
    } else {
      renderDecisions();
    }
  }

  renderDecisions();

  /* =====================================================================
     Actions to Perform
     ===================================================================== */

  var ACTION_STATUS_ORDER = ["on-track", "at-risk", "blocked", "done"];
  var PLANNER_STATUS_LABEL = { "on-track": "On Track", "at-risk": "At Risk", "blocked": "Blocked", "done": "Done" };

  var ACTIONS_LIST = [
    { id: "a1", title: "Finalize Q3 marketing budget deck", direction: "incoming", person: "Priya Nair", role: "VP Marketing", due: "Jul 31, 2026", status: "at-risk", impactLevel: "High",
      description: "Pull together final creative spend, projected ROI, and headcount asks into the board-ready deck.",
      updates: [
        { author: "Priya Nair", time: "Jul 26, 9:10 AM", text: "Please include the Q2 actuals comparison this time." },
        { author: "You", time: "Jul 27, 2:45 PM", text: "Added Q2 actuals. Still waiting on final creative spend numbers from the agency." }
      ] },
    { id: "a2", title: "Review vendor SLA redlines", direction: "outgoing", person: "Arjun Mehta", role: "Legal Counsel", due: "Aug 2, 2026", status: "on-track", impactLevel: "Medium",
      description: "Confirm the redlined uptime and penalty clauses match what Procurement negotiated before signature.",
      updates: [
        { author: "You", time: "Jul 24, 11:00 AM", text: "Sent the redline with two open clauses flagged for legal review." }
      ] },
    { id: "a3", title: "Approve headcount request — Plant 4", direction: "incoming", person: "Nick Skwiat", role: "Ops Lead", due: "Jul 29, 2026", status: "blocked", impactLevel: "High",
      description: "Two additional line operators requested to cover the new shift pattern starting next month.",
      updates: [
        { author: "Nick Skwiat", time: "Jul 22, 8:30 AM", text: "Blocked on FY27 budget sign-off from Finance before I can approve this." }
      ] },
    { id: "a4", title: "Send updated forecast to finance", direction: "outgoing", person: "Elena Popova", role: "FP&A Analyst", due: "Aug 5, 2026", status: "on-track", impactLevel: "Medium",
      description: "Refresh the rolling forecast with July actuals and share ahead of the monthly close.",
      updates: [] },
    { id: "a5", title: "Sign off on safety audit report", direction: "incoming", person: "T. Osei", role: "Quality Director", due: "Jul 30, 2026", status: "on-track", impactLevel: "Low",
      description: "Final review of the Plant 12 safety audit findings before it's filed with corrective actions attached.",
      updates: [
        { author: "T. Osei", time: "Jul 25, 4:15 PM", text: "Report's ready for your sign-off — no open findings this cycle." }
      ] },
    { id: "a6", title: "Coordinate customer escalation call", direction: "outgoing", person: "R. Chen", role: "Commercial Ops", due: "Aug 1, 2026", status: "at-risk", impactLevel: "Medium",
      description: "Get Acme's account team, ours, and the plant lead on one call to walk through the delivery delay.",
      updates: [
        { author: "You", time: "Jul 26, 3:00 PM", text: "Acme's team can only do Thursday — checking if our plant lead is free." }
      ] }
  ];

  function openActionTicket(a) {
    var body = document.createElement("div");

    var top = el("div", "ticket-top");
    top.appendChild(el("span", "action-direction " + a.direction, (a.direction === "incoming" ? "From " : "To ") + a.person + " · " + a.role));
    top.appendChild(el("span", "action-status " + a.status, PLANNER_STATUS_LABEL[a.status]));
    body.appendChild(top);

    body.appendChild(el("p", "decision-desc", a.description));

    var metaGrid = el("div", "dp-summary-grid");
    var dueItem = el("div", "dp-summary-item");
    dueItem.appendChild(el("span", "dp-label", "Due"));
    dueItem.appendChild(el("span", "dp-value-sm", a.due));
    metaGrid.appendChild(dueItem);
    if (a.impactLevel) {
      var impactItem = el("div", "dp-summary-item");
      impactItem.appendChild(el("span", "dp-label", "Impact Level"));
      impactItem.appendChild(el("span", "impact-level-badge " + a.impactLevel.toLowerCase(), a.impactLevel));
      metaGrid.appendChild(impactItem);
    }
    body.appendChild(metaGrid);

    body.appendChild(el("div", "card-a-context-title", "Status"));
    var statusRow = el("div", "ticket-status-row");
    ACTION_STATUS_ORDER.forEach(function (s) {
      var btn = el("button", "action-status ticket-status-btn " + s + (a.status === s ? " active" : ""), PLANNER_STATUS_LABEL[s]);
      btn.type = "button";
      btn.addEventListener("click", function () {
        a.status = s;
        renderPlannerActions();
        openActionTicket(a);
      });
      statusRow.appendChild(btn);
    });
    body.appendChild(statusRow);

    body.appendChild(el("div", "card-a-context-title", "Updates"));
    var thread = el("div", "ticket-thread");
    if (!a.updates.length) {
      thread.appendChild(el("div", "contributor-role", "No updates yet."));
    } else {
      a.updates.forEach(function (u) {
        var item = el("div", "ticket-update");
        item.appendChild(el("div", "ticket-update-head", "<b>" + u.author + "</b> · " + u.time));
        item.appendChild(el("div", "ticket-update-text", u.text));
        thread.appendChild(item);
      });
    }
    body.appendChild(thread);

    var addRow = el("div", "ticket-add-row");
    var textarea = document.createElement("textarea");
    textarea.className = "form-input";
    textarea.rows = 2;
    textarea.placeholder = "Add an update...";
    var postBtn = el("button", "btn-primary", "Post Update");
    postBtn.type = "button";
    postBtn.addEventListener("click", function () {
      var text = textarea.value.trim();
      if (!text) return;
      a.updates.push({ author: "You", time: "Just now", text: text });
      openActionTicket(a);
    });
    addRow.appendChild(textarea);
    addRow.appendChild(postBtn);
    body.appendChild(addRow);

    openModal(a.title, body);
  }

  var actionsSortState = { key: null, dir: "asc" };
  var IMPACT_LEVEL_RANK = { High: 3, Medium: 2, Low: 1 };
  var ACTIONS_COMPARATORS = {
    title: function (a, b) { return a.title.localeCompare(b.title); },
    person: function (a, b) { return a.person.localeCompare(b.person); },
    impactLevel: function (a, b) { return (IMPACT_LEVEL_RANK[a.impactLevel] || 0) - (IMPACT_LEVEL_RANK[b.impactLevel] || 0); },
    due: function (a, b) { return parseDisplayDate(a.due) - parseDisplayDate(b.due); },
    status: function (a, b) { return ACTION_STATUS_ORDER.indexOf(a.status) - ACTION_STATUS_ORDER.indexOf(b.status); }
  };

  function buildStatusSelect(a) {
    var select = document.createElement("select");
    select.className = "action-status-select " + a.status;
    ACTION_STATUS_ORDER.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s;
      opt.textContent = PLANNER_STATUS_LABEL[s];
      if (s === a.status) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("click", function (e) { e.stopPropagation(); });
    select.addEventListener("change", function () {
      a.status = select.value;
      select.className = "action-status-select " + a.status;
    });
    return select;
  }

  // Quick comment popup for a Tasks-table row, kept separate from the full
  // ticket modal so it doesn't affect the table's row height.
  function openRowCommentModal(a) {
    var body = el("div", "row-comment-modal-body");
    var textarea = document.createElement("textarea");
    textarea.className = "form-input";
    textarea.rows = 3;
    textarea.placeholder = "Add a quick comment...";
    body.appendChild(textarea);

    var footer = el("div", "row-comment-modal-footer");
    var postBtn = el("button", "btn-primary", "Post");
    postBtn.type = "button";
    postBtn.addEventListener("click", function () {
      var text = textarea.value.trim();
      if (!text) return;
      a.updates.push({ author: "You", time: "Just now", text: text });
      closeModal();
    });
    footer.appendChild(postBtn);

    openModal("Comment on “" + a.title + "”", body, { footer: footer });
    textarea.focus();
  }

  function renderPlannerActions() {
    var wrap = document.getElementById("actionsStage");
    wrap.innerHTML = "";
    var openCount = ACTIONS_LIST.filter(function (a) { return a.status !== "done"; }).length;
    var countEl = document.getElementById("actionsCount");
    countEl.textContent = openCount > 0 ? openCount + " open" : "";
    countEl.style.display = openCount > 0 ? "" : "none";

    var tableWrap = el("div", "data-table-wrap");
    var table = document.createElement("table");
    table.className = "data-table";
    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    headRow.appendChild(buildSortableTh("Task", "title", actionsSortState, renderPlannerActions));
    headRow.appendChild(buildSortableTh("Task From", "person", actionsSortState, renderPlannerActions));
    headRow.appendChild(buildSortableTh("Impact Level", "impactLevel", actionsSortState, renderPlannerActions));
    headRow.appendChild(buildSortableTh("Due Date", "due", actionsSortState, renderPlannerActions));
    headRow.appendChild(buildSortableTh("Status", "status", actionsSortState, renderPlannerActions));
    headRow.appendChild(document.createElement("th"));
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    var rows = sortRows(ACTIONS_LIST, actionsSortState, ACTIONS_COMPARATORS);
    rows.forEach(function (a) {
      var tr = document.createElement("tr");
      tr.className = "clickable";
      tr.addEventListener("click", function () { openActionTicket(a); });

      var tdTitle = document.createElement("td");
      tdTitle.appendChild(el("span", "action-name", icon(a.direction === "incoming" ? "call_received" : "call_made", "picon") + a.title));
      tr.appendChild(tdTitle);

      var tdFrom = document.createElement("td");
      tdFrom.appendChild(el("span", "action-direction " + a.direction, (a.direction === "incoming" ? "From " : "To ") + a.person));
      tr.appendChild(tdFrom);

      var tdImpact = document.createElement("td");
      tdImpact.appendChild(el("span", "impact-level-badge " + a.impactLevel.toLowerCase(), a.impactLevel));
      tr.appendChild(tdImpact);

      var tdDue = document.createElement("td");
      tdDue.textContent = a.due;
      tr.appendChild(tdDue);

      var tdStatus = document.createElement("td");
      tdStatus.appendChild(buildStatusSelect(a));
      tr.appendChild(tdStatus);

      var tdActions = document.createElement("td");
      var commentBtn = el("button", "row-comment-btn", icon("chat_bubble_outline"));
      commentBtn.type = "button";
      commentBtn.title = "Add a comment";
      commentBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        openRowCommentModal(a);
      });
      tdActions.appendChild(commentBtn);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    wrap.appendChild(tableWrap);
  }

  renderPlannerActions();

  /* =====================================================================
     Pending Draft Tasks
     ===================================================================== */

  var TASK_TYPE_ICON = { "Action": "bolt", "Decision": "chat_bubble", "Inform": "mic", "Recognition": "star" };

  var DRAFTS = [
    { id: "t1", taskType: "Action", title: "Follow up with EMEA distributor on Q4 pricing", description: "", impactMetric: "Aged Backlog", impactLevel: "High", assignationType: "Delegate", plannedDate: "", edited: "Jul 28, 2026" },
    { id: "t2", taskType: "Action", title: "Quality corrective action — Plant 12 hold", description: "Corrective actions for repeat quality escape.", impactMetric: "Quality Holds", impactLevel: "", assignationType: "Escalate", plannedDate: "Aug 10, 2026", edited: "Jul 27, 2026" },
    { id: "t3", taskType: "Recognition", title: "Recognition note for Austin team", description: "", impactMetric: "", impactLevel: "Low", assignationType: "Delegate", plannedDate: "", edited: "Jul 26, 2026" },
    { id: "t4", taskType: "Decision", title: "Vendor renewal decision memo", description: "Summarize 3 renewal options for leadership sign-off.", impactMetric: "Aged Backlog", impactLevel: "High", assignationType: "Escalate", plannedDate: "Aug 3, 2026", edited: "Jul 25, 2026" },
    { id: "t5", taskType: "Inform", title: "Weekly ops update for leadership", description: "", impactMetric: "", impactLevel: "Medium", assignationType: "Delegate", plannedDate: "Jul 31, 2026", edited: "Jul 24, 2026" },
    { id: "t6", taskType: "Action", title: "Escalation summary — Plant 12 quality hold", description: "", impactMetric: "Quality Holds", impactLevel: "", assignationType: "Escalate", plannedDate: "", edited: "Jul 23, 2026" }
  ];

  var draftsSortState = { key: null, dir: "asc" };
  var DRAFTS_COMPARATORS = {
    title: function (a, b) { return a.title.localeCompare(b.title); },
    taskType: function (a, b) { return a.taskType.localeCompare(b.taskType); },
    impactLevel: function (a, b) { return (IMPACT_LEVEL_RANK[a.impactLevel] || 0) - (IMPACT_LEVEL_RANK[b.impactLevel] || 0); },
    edited: function (a, b) { return parseDisplayDate(a.edited) - parseDisplayDate(b.edited); }
  };

  /* ---------- Snackbar (drafts auto-created from decisions/inform) ---------- */

  var snackbarEl = document.getElementById("snackbar");
  var snackbarText = document.getElementById("snackbarText");
  var snackbarAction = document.getElementById("snackbarAction");
  var snackbarCloseBtn = document.getElementById("snackbarClose");
  var snackbarTimer = null;

  function hideSnackbar() {
    clearTimeout(snackbarTimer);
    snackbarEl.classList.remove("shown");
    setTimeout(function () { snackbarEl.hidden = true; }, 220);
  }

  // variant: "info" (default, dark) or "success" (green). onAction is
  // optional — when omitted the action link is hidden, for confirmations
  // that don't need a destination (e.g. a task sent immediately rather
  // than saved as a draft). actionLabel defaults to the generic review
  // link text; pass a specific one (e.g. "View Task") when the CTA points
  // somewhere more precise than "review what you just did".
  function showSnackbar(message, onAction, variant, actionLabel) {
    clearTimeout(snackbarTimer);
    snackbarEl.hidden = false;
    snackbarEl.classList.toggle("success", variant === "success");
    snackbarText.textContent = message;
    snackbarAction.hidden = !onAction;
    snackbarAction.textContent = actionLabel || "Click here to review";
    requestAnimationFrame(function () { snackbarEl.classList.add("shown"); });
    if (onAction) {
      snackbarAction.onclick = function () {
        hideSnackbar();
        onAction();
      };
    }
    snackbarTimer = setTimeout(hideSnackbar, 6000);
  }

  snackbarCloseBtn.addEventListener("click", hideSnackbar);

  function goToDraftsTab() {
    var plannerOuterTab = document.querySelector('.tab[data-view="planner"]');
    if (plannerOuterTab && !plannerOuterTab.classList.contains("active")) plannerOuterTab.click();
    var draftsInnerTab = document.querySelector('.planner-tab[data-planner-tab="drafts"]');
    if (draftsInnerTab) draftsInnerTab.click();
  }

  // Brings a specific briefing to the front of the Inform carousel — used
  // by the "updated task" notice below so its CTA (or a direct visit to
  // Inform) lands on that card instead of whatever the carousel happened
  // to be showing.
  function goToInformBriefing(id) {
    var plannerOuterTab = document.querySelector('.tab[data-view="planner"]');
    if (plannerOuterTab && !plannerOuterTab.classList.contains("active")) plannerOuterTab.click();
    var informInnerTab = document.querySelector('.planner-tab[data-planner-tab="inform"]');
    if (informInnerTab && !informInnerTab.classList.contains("active")) informInnerTab.click();
    var idx = orderedPending().findIndex(function (b) { return b.id === id; });
    if (idx > -1) {
      carouselIndex.a = idx;
      renderActiveVersion();
    }
  }

  // Fires once per session, 5 seconds after the user first opens Daily
  // Planner: a heads-up that an Inform task assigned to them changed,
  // pointing at the one BRIEFINGS entry marked `updated` (see b2). That
  // entry is already part of today's queue regardless of this notice, so
  // navigating to Inform directly surfaces it too.
  var informUpdateNoticeShown = false;
  function maybeNotifyInformUpdate() {
    if (informUpdateNoticeShown) return;
    informUpdateNoticeShown = true;
    setTimeout(function () {
      showSnackbar("An Inform task assigned to you was updated.", function () {
        goToInformBriefing("b2");
      }, null, "View Task");
    }, 5000);
  }

  function todayEdited() {
    return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function draftMissingFields(d) {
    var missing = [];
    if (!d.description) missing.push("Description");
    if (!d.impactLevel) missing.push("Impact Level");
    if (!d.plannedDate) missing.push("Resolution Date");
    return missing;
  }

  function buildSelect(className, options, current, onChange) {
    var select = document.createElement("select");
    select.className = className;
    options.forEach(function (pair) {
      var o = document.createElement("option");
      o.value = pair[0];
      o.textContent = pair[1];
      select.appendChild(o);
    });
    select.value = current;
    select.addEventListener("change", function () { onChange(select.value); });
    return select;
  }

  function buildMissingChip(missing) {
    if (!missing.length) return el("span", "", "—");
    return el("span", "draft-missing", icon("error") + missing.join(", "));
  }

  function deleteDraft(id) {
    if (!window.confirm("Delete this draft? This can't be undone.")) return;
    var idx = DRAFTS.findIndex(function (d) { return d.id === id; });
    if (idx > -1) DRAFTS.splice(idx, 1);
    renderDraftsStage();
  }

  function buildDraftRowActions(d) {
    var wrap = el("div", "draft-row-actions");
    var editBtn = el("button", "icon-action-btn later", icon("edit"));
    editBtn.type = "button";
    editBtn.title = "Edit";
    editBtn.addEventListener("click", function () { openCreateTaskModal(null, d.taskType, d); });
    var delBtn = el("button", "icon-action-btn danger", icon("delete"));
    delBtn.type = "button";
    delBtn.title = "Delete";
    delBtn.addEventListener("click", function () { deleteDraft(d.id); });
    wrap.appendChild(editBtn);
    wrap.appendChild(delBtn);
    return wrap;
  }

  function renderDraftsStage() {
    var wrap = document.getElementById("draftsStage");
    wrap.innerHTML = "";
    var items = DRAFTS;
    var countEl = document.getElementById("draftsCount");
    countEl.textContent = DRAFTS.length > 0 ? DRAFTS.length + " drafts" : "";
    countEl.style.display = DRAFTS.length > 0 ? "" : "none";

    if (!items.length) {
      var empty = el("div", "planner-empty");
      empty.innerHTML =
        '<div class="planner-empty-icon">' + icon("drafts") + "</div>" +
        '<div class="planner-empty-title">No drafts yet</div>' +
        '<p class="planner-empty-sub">Tasks you save as drafts will show up here.</p>';
      wrap.appendChild(empty);
      return;
    }

    var tableWrap = el("div", "data-table-wrap");
    var table = document.createElement("table");
    table.className = "data-table";
    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    headRow.appendChild(buildSortableTh("Title", "title", draftsSortState, renderDraftsStage));
    headRow.appendChild(buildSortableTh("Type", "taskType", draftsSortState, renderDraftsStage));
    headRow.appendChild(buildSortableTh("Impact", "impactLevel", draftsSortState, renderDraftsStage));
    headRow.appendChild(document.createElement("th"));
    headRow.appendChild(buildSortableTh("Last Edited", "edited", draftsSortState, renderDraftsStage));
    headRow.appendChild(document.createElement("th"));
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    items = sortRows(items, draftsSortState, DRAFTS_COMPARATORS);
    items.forEach(function (d) {
      var tr = document.createElement("tr");
      var tdTitle = document.createElement("td");
      tdTitle.textContent = d.title;
      tr.appendChild(tdTitle);

      var tdType = document.createElement("td");
      tdType.appendChild(el("span", "draft-type-tag", icon(TASK_TYPE_ICON[d.taskType], "picon") + d.taskType));
      tr.appendChild(tdType);

      var tdImpact = document.createElement("td");
      tdImpact.appendChild(d.impactLevel ? el("span", "impact-level-badge " + d.impactLevel.toLowerCase(), d.impactLevel) : el("span", "", "—"));
      tr.appendChild(tdImpact);

      var tdMissing = document.createElement("td");
      tdMissing.appendChild(buildMissingChip(draftMissingFields(d)));
      tr.appendChild(tdMissing);

      var tdEdited = document.createElement("td");
      tdEdited.textContent = d.edited;
      tr.appendChild(tdEdited);

      var tdActions = document.createElement("td");
      tdActions.appendChild(buildDraftRowActions(d));
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    wrap.appendChild(tableWrap);
  }

  renderDraftsStage();
})();
