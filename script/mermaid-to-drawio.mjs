#!/usr/bin/env node
/**
 * scripts/mermaid-to-drawio.mjs
 *
 * Converts a Mermaid class diagram markdown file to a draw.io file
 * and exports a standalone SVG.
 * On subsequent runs it preserves manually-adjusted class positions from the
 * existing .drawio file while adding/removing classes and attributes as needed.
 *
 * Usage:  node scripts/mermaid-to-drawio.mjs [mdPath] [drawioPath] [svgPath]
 * Output: defaults to docs/domain-model.drawio and docs/domain-model.svg,
 *         or derives sibling .drawio/.svg files from mdPath when only mdPath is passed.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function resolveArgPath(filePath, fallback) {
  return filePath ? resolve(ROOT, filePath) : fallback;
}

function replaceExtension(filePath, ext) {
  return filePath.replace(/\.[^.\/]+$/, ext);
}

function resolvePaths() {
  const [mdArg, drawioArg, svgArg] = process.argv.slice(2);

  const mdPath = resolveArgPath(mdArg, resolve(ROOT, 'docs', 'DOMAIN-MODEL.md'));
  const drawioPath = resolveArgPath(
    drawioArg,
    mdArg ? replaceExtension(mdPath, '.drawio') : resolve(ROOT, 'docs', 'domain-model.drawio'),
  );
  const svgPath = resolveArgPath(
    svgArg,
    mdArg ? replaceExtension(mdPath, '.svg') : resolve(ROOT, 'docs', 'domain-model.svg'),
  );

  return { mdPath, drawioPath, svgPath };
}

const { mdPath: MD_PATH, drawioPath: DRAWIO_PATH, svgPath: SVG_PATH } = resolvePaths();

const CFG = {
  minWidth: 200,       // minimum class box width
  charPx: 7.5,        // approximate character width in default font
  pad: 44,            // horizontal padding (icon + margins)
  titleH: 28,         // entity title-bar height
  enumTitleH: 42,     // enum title-bar height (stereotype + name)
  sepH: 8,            // separator line height
  memberH: 22,        // attribute / enum-value row height
  tailPad: 4,         // bottom padding
  cols: 4,            // entities per grid row
  enumCols: 5,        // enums per grid row
  gapX: 60,           // horizontal gap between classes
  gapY: 50,           // vertical gap between rows
  originX: 40,        // first class x
  originY: 40,        // first class y
};

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

/** XML-escape a string for use inside attribute values. */
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/* ═══════════════════════════════════════════════════════════════════════════
   1. Mermaid Parser
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Extract the first ```mermaid fenced block from markdown text.
 */
function extractMermaid(md) {
  const lines = md.split('\n');
  const buf = [];
  let inside = false;
  for (const l of lines) {
    if (!inside && /^\s*```mermaid/.test(l)) { inside = true; continue; }
    if (inside && /^\s*```\s*$/.test(l)) break;
    if (inside) buf.push(l);
  }
  if (!buf.length) throw new Error('No ```mermaid block found in ' + MD_PATH);
  return buf.join('\n');
}

/**
 * Parse a Mermaid classDiagram source into classes and relationships.
 *
 * Returns { classes: MermaidClass[], rels: MermaidRel[] }
 *
 * MermaidClass = { name, isEnum, members: { vis, type, name }[] }
 * MermaidRel   = { source, srcCard, type, tgtCard, target, label }
 */
function parseMermaid(src) {
  const classes = [];
  const rels = [];
  let m;

  // ── class blocks ──────────────────────────────────────────────────────
  const cRe = /class\s+(\w+)\s*\{([^}]*)\}/g;
  while ((m = cRe.exec(src))) {
    const name = m[1];
    const body = m[2];
    const isEnum = /<<enumeration>>/.test(body);
    const members = [];
    for (const l of body.split('\n')) {
      const t = l.trim();
      if (!t || t === '<<enumeration>>') continue;
      if (isEnum) {
        members.push({ vis: '', type: '', name: t });
      } else {
        const am = t.match(/^([+\-#~])\s*(\S+)\s+(\w+)$/);
        if (am) members.push({ vis: am[1], type: am[2], name: am[3] });
      }
    }
    classes.push({ name, isEnum, members });
  }

  // ── relationships ─────────────────────────────────────────────────────
  //   Source "card" *--|o--|-- "card" Target : label
  const rRe = /^\s*(\w+)\s+"([^"]*)"\s+(\*--|o--|--)\s+"([^"]*)"\s+(\w+)\s*:\s*(.+)$/gm;
  while ((m = rRe.exec(src))) {
    rels.push({
      source: m[1],
      srcCard: m[2],
      type: m[3],       // *-- composition, o-- aggregation, -- association
      tgtCard: m[4],
      target: m[5],
      label: m[6].trim(),
    });
  }

  return { classes, rels };
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. Existing draw.io Position Loader
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Read an existing .drawio file and extract cell geometries and style colors.
 * Handles both uncompressed XML and base64-deflate-encoded diagram content.
 *
 * Returns Map<cellId, { x, y, w, h, fill?, stroke?, fontColor? }>
 */
function loadExisting(path) {
  if (!existsSync(path)) return new Map();
  let xml = readFileSync(path, 'utf8');

  // Decompress if the <diagram> body is base64-deflate encoded
  const dm = xml.match(/<diagram[^>]*>([\s\S]*?)<\/diagram>/);
  if (dm) {
    const inner = dm[1].trim();
    if (inner && !inner.startsWith('<')) {
      try {
        xml = decodeURIComponent(
          inflateRawSync(Buffer.from(inner, 'base64')).toString(),
        );
      } catch {
        /* keep outer xml */
      }
    }
  }

  const pos = new Map();
  // Match non-self-closing <mxCell> elements (those that contain <mxGeometry>)
  const cellRe = /<mxCell\s+([^>]+)>([\s\S]*?)<\/mxCell>/g;
  let m;
  while ((m = cellRe.exec(xml))) {
    const attrs = m[1];
    const inner = m[2];
    const idm = attrs.match(/id="([^"]+)"/);
    if (!idm) continue;

    // Extract geometry (self-closing or with children)
    const gm = inner.match(/<mxGeometry([^>]*?)(?:\/>|>)/);
    if (!gm) continue;

    const ga = gm[1];
    const n = (k) => {
      const v = ga.match(new RegExp(`${k}="([^"]+)"`));
      return v ? parseFloat(v[1]) : 0;
    };

    // Extract style colors from the style attribute
    const entry = { x: n('x'), y: n('y'), w: n('width'), h: n('height') };
    const sm = attrs.match(/style="([^"]*)"/);
    if (sm) {
      const s = sm[1];
      const sp = (k) => { const r = s.match(new RegExp(`${k}=([^;]+)`)); return r ? r[1] : undefined; };
      const fill = sp('fillColor');
      const stroke = sp('strokeColor');
      const font = sp('fontColor');
      if (fill && fill !== 'none') entry.fill = fill;
      if (stroke && stroke !== 'inherit' && stroke !== 'none') entry.stroke = stroke;
      if (font && font !== 'inherit') entry.fontColor = font;
    }
    pos.set(idm[1], entry);
  }

  return pos;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. Layout Engine
   ═══════════════════════════════════════════════════════════════════════════ */

/** Compute pixel width for a class box. */
function classWidth(cls) {
  let longest = cls.name.length + (cls.isEnum ? 16 : 0);
  for (const m of cls.members) {
    const len = cls.isEnum ? m.name.length : `${m.vis} ${m.type} ${m.name}`.length;
    if (len > longest) longest = len;
  }
  return Math.max(CFG.minWidth, Math.round(longest * CFG.charPx + CFG.pad));
}

/** Compute pixel height for a class box. */
function classHeight(cls) {
  const titleH = cls.isEnum ? CFG.enumTitleH : CFG.titleH;
  const sepH = cls.isEnum ? 0 : CFG.sepH;
  return titleH + sepH + cls.members.length * CFG.memberH + CFG.tailPad;
}

/**
 * Compute { x, y, w, h } for every class.
 * Existing positions are preserved; new classes are placed in a grid below.
 */
function computeLayout(classes, existing) {
  const map = new Map();

  // Attach computed sizes
  for (const c of classes) {
    c._w = classWidth(c);
    c._h = classHeight(c);
  }

  // ── Preserve existing positions (update w/h for changed attributes) ───
  let maxBot = 0;
  for (const c of classes) {
    const id = `cls_${c.name}`;
    const g = existing.get(id);
    if (g) {
      map.set(c.name, { x: g.x, y: g.y, w: c._w, h: c._h });
      maxBot = Math.max(maxBot, g.y + c._h);
    }
  }

  // ── Grid-place new (unknown) classes below existing ones ──────────────
  const gridPlace = (list, cols, startY) => {
    let x = CFG.originX;
    let y = startY;
    let col = 0;
    let rowH = 0;

    for (const c of list) {
      if (map.has(c.name)) continue;               // already positioned
      map.set(c.name, { x, y, w: c._w, h: c._h });
      rowH = Math.max(rowH, c._h);
      if (++col >= cols) {
        col = 0;
        x = CFG.originX;
        y += rowH + CFG.gapY;
        rowH = 0;
      } else {
        x += c._w + CFG.gapX;
      }
    }
    return col > 0 ? y + rowH + CFG.gapY : y;
  };

  const entities = classes.filter((c) => !c.isEnum);
  const enums = classes.filter((c) => c.isEnum);

  const entitiesStartY = maxBot > 0 ? maxBot + CFG.gapY : CFG.originY;
  const afterEntities = gridPlace(entities, CFG.cols, entitiesStartY);
  gridPlace(enums, CFG.enumCols, afterEntities + 20);

  return map;
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. Draw.io XML Builder
   ═══════════════════════════════════════════════════════════════════════════ */

function buildXml(classes, rels, positions, cellStyles) {
  const out = [];
  const ln = (s) => out.push(s);

  /** Append fillColor/strokeColor/fontColor from existing drawio styles. */
  function colorSuffix(cellId) {
    const s = cellStyles.get(cellId);
    if (!s) return '';
    let c = '';
    if (s.fill)      c += `fillColor=${s.fill};`;
    if (s.stroke)    c += `strokeColor=${s.stroke};`;
    if (s.fontColor) c += `fontColor=${s.fontColor};`;
    return c;
  }

  // Root cells (required by draw.io)
  ln('    <mxCell id="0"/>');
  ln('    <mxCell id="1" parent="0"/>');

  // ── Class boxes ───────────────────────────────────────────────────────
  for (const cls of classes) {
    const p = positions.get(cls.name);
    if (!p) continue;
    const id = `cls_${cls.name}`;
    const titleH = cls.isEnum ? CFG.enumTitleH : CFG.titleH;

    // Container (swimlane) — preserve user-set colors from existing drawio
    const title = cls.isEnum
      ? `&lt;&lt;enumeration&gt;&gt;&#xa;${cls.name}`
      : cls.name;
    const baseStyle = cls.isEnum
      ? `swimlane;fontStyle=2;align=center;startSize=${titleH};container=1;collapsible=0;fillColor=#F5F5F5;strokeColor=#666666;fontColor=#333333;`
      : `swimlane;fontStyle=1;align=center;startSize=${titleH};container=1;collapsible=0;${colorSuffix(id)}`;

    ln(`    <mxCell id="${id}" value="${title}" style="${baseStyle}" vertex="1" parent="1">`);
    ln(`      <mxGeometry x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" as="geometry"/>`);
    ln('    </mxCell>');

    let yOff = titleH;

    // Separator line (entities only — enums skip)
    if (!cls.isEnum) {
      ln(`    <mxCell id="sep_${cls.name}" value="" style="line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;spacingTop=-1;spacingLeft=3;spacingRight=10;rotatable=0;labelPosition=left;points=[];portConstraint=eastwest;strokeColor=inherit;" vertex="1" parent="${id}">`);
      ln(`      <mxGeometry y="${yOff}" width="${p.w}" height="${CFG.sepH}" as="geometry"/>`);
      ln('    </mxCell>');
      yOff += CFG.sepH;
    }

    // Member rows
    for (const mem of cls.members) {
      const display = cls.isEnum
        ? mem.name
        : `${mem.vis} ${mem.type} ${mem.name}`;
      const attrId = `attr_${cls.name}_${mem.name}`;
      ln(`    <mxCell id="${attrId}" value="${esc(display)}" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[];portConstraint=eastwest;fontColor=inherit;" vertex="1" parent="${id}">`);
      ln(`      <mxGeometry y="${yOff}" width="${p.w}" height="${CFG.memberH}" as="geometry"/>`);
      ln('    </mxCell>');
      yOff += CFG.memberH;
    }
  }

  // ── Relationship edges ────────────────────────────────────────────────
  for (const r of rels) {
    const eid = `rel_${r.source}_${r.target}`;

    // Arrow style based on relationship type
    const arrowStyle =
      r.type === '*--'
        ? 'startArrow=diamondThin;startFill=1;endArrow=none;startSize=14;'
        : r.type === 'o--'
          ? 'startArrow=diamondThin;startFill=0;endArrow=none;startSize=14;'
          : 'startArrow=none;endArrow=open;endFill=0;endSize=14;';
    const style = `${arrowStyle}html=1;rounded=1;${colorSuffix(eid)}`;

    ln(`    <mxCell id="${eid}" value="${esc(r.label)}" style="${style}" edge="1" parent="1" source="cls_${r.source}" target="cls_${r.target}">`);
    ln('      <mxGeometry relative="1" as="geometry"/>');
    ln('    </mxCell>');

    // Source cardinality label (near source end)
    if (r.srcCard) {
      ln(`    <mxCell id="${eid}_sc" value="${esc(r.srcCard)}" style="edgeLabel;html=1;align=left;verticalAlign=bottom;resizable=0;points=[];fontSize=10;" connectable="0" vertex="1" parent="${eid}">`);
      ln('      <mxGeometry x="-0.75" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry>');
      ln('    </mxCell>');
    }

    // Target cardinality label (near target end)
    if (r.tgtCard) {
      ln(`    <mxCell id="${eid}_tc" value="${esc(r.tgtCard)}" style="edgeLabel;html=1;align=right;verticalAlign=bottom;resizable=0;points=[];fontSize=10;" connectable="0" vertex="1" parent="${eid}">`);
      ln('      <mxGeometry x="0.75" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry>');
      ln('    </mxCell>');
    }
  }

  // ── Wrap in mxfile envelope ───────────────────────────────────────────
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="mermaid-to-drawio" modified="${now}" type="device">
  <diagram id="domain-model" name="Domain Model">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
${out.join('\n')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. SVG Builder
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Render classes and relationships to a standalone SVG string.
 * Uses the same position map as the drawio builder so manual layout
 * adjustments in draw.io carry over to the SVG export.
 * Per-cell colors from the drawio file are applied as inline styles.
 */
function buildSvg(classes, rels, positions, cellStyles) {
  const PAD = 20;         // canvas padding
  const FONT = 13;        // base font size
  const SMALL = 11;       // cardinality / edge label font size

  // Default colors (used when no drawio override exists)
  const DEFAULTS = {
    entity:  { fill: '#fff',    stroke: '#000',  font: '#000'  },
    enum:    { fill: '#F5F5F5', stroke: '#666',  font: '#333'  },
    edge:    { stroke: '#333' },
  };

  /** Resolve colors for a class cell from drawio styles or defaults. */
  function colors(cls) {
    const id = `cls_${cls.name}`;
    const s = cellStyles.get(id);
    const d = cls.isEnum ? DEFAULTS.enum : DEFAULTS.entity;
    return {
      fill:   s?.fill      || d.fill,
      stroke: s?.stroke    || d.stroke,
      font:   s?.fontColor || d.font,
    };
  }

  // ── Compute canvas bounds ─────────────────────────────────────────────
  let maxX = 0;
  let maxY = 0;
  for (const [, g] of positions) {
    maxX = Math.max(maxX, g.x + g.w);
    maxY = Math.max(maxY, g.y + g.h);
  }
  const svgW = maxX + PAD * 2;
  const svgH = maxY + PAD * 2;

  const o = [];
  const ln = (s) => o.push(s);

  ln(`<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="${-PAD} ${-PAD} ${svgW} ${svgH}" font-family="Helvetica, Arial, sans-serif" font-size="${FONT}">`);
  ln('<style>');
  ln('  .sep { stroke-width: 1; }');
  ln('  .title { font-weight: bold; text-anchor: middle; }');
  ln('  .enum-title { font-style: italic; text-anchor: middle; }');
  ln('  .stereotype { font-size: 10px; text-anchor: middle; }');
  ln('  .attr { font-size: 12px; }');
  ln('  .edge { fill: none; stroke-width: 1.2; }');
  ln('  .edge-label { font-size: ' + SMALL + 'px; text-anchor: middle; }');
  ln('  .card-label { font-size: ' + SMALL + 'px; }');
  ln('</style>');

  // ── Marker definitions ────────────────────────────────────────────────
  ln('<defs>');
  ln('  <marker id="diamond-filled" markerWidth="12" markerHeight="8" refX="12" refY="4" orient="auto"><path d="M0,4 L6,0 L12,4 L6,8 Z" fill="#333"/></marker>');
  ln('  <marker id="diamond-open" markerWidth="12" markerHeight="8" refX="12" refY="4" orient="auto"><path d="M0,4 L6,0 L12,4 L6,8 Z" fill="#fff" stroke="#333" stroke-width="1"/></marker>');
  ln('  <marker id="arrow-open" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8" fill="none" stroke="#333" stroke-width="1.2"/></marker>');
  ln('</defs>');

  // ── Draw class boxes ──────────────────────────────────────────────────
  for (const cls of classes) {
    const p = positions.get(cls.name);
    if (!p) continue;
    const c = colors(cls);

    ln(`  <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="2" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"/>`);

    if (cls.isEnum) {
      ln(`  <text x="${p.x + p.w / 2}" y="${p.y + 16}" class="stereotype" fill="${c.font}" opacity="0.6">&lt;&lt;enumeration&gt;&gt;</text>`);
      ln(`  <text x="${p.x + p.w / 2}" y="${p.y + 34}" class="enum-title" fill="${c.font}">${esc(cls.name)}</text>`);
      let yOff = CFG.enumTitleH;
      for (const mem of cls.members) {
        ln(`  <text x="${p.x + 8}" y="${p.y + yOff + 16}" class="attr" fill="${c.font}">${esc(mem.name)}</text>`);
        yOff += CFG.memberH;
      }
    } else {
      const titleBarH = CFG.titleH;
      ln(`  <text x="${p.x + p.w / 2}" y="${p.y + titleBarH / 2 + 5}" class="title" fill="${c.font}">${esc(cls.name)}</text>`);
      const sepY = p.y + titleBarH;
      ln(`  <line x1="${p.x}" y1="${sepY}" x2="${p.x + p.w}" y2="${sepY}" class="sep" stroke="${c.stroke}"/>`);
      let yOff = titleBarH + CFG.sepH;
      for (const mem of cls.members) {
        const display = `${mem.vis} ${mem.type} ${mem.name}`;
        ln(`  <text x="${p.x + 8}" y="${p.y + yOff + 16}" class="attr" fill="${c.font}">${esc(display)}</text>`);
        yOff += CFG.memberH;
      }
    }
  }

  // ── Draw edges ────────────────────────────────────────────────────────
  for (const r of rels) {
    const sp = positions.get(r.source);
    const tp = positions.get(r.target);
    if (!sp || !tp) continue;

    // Connect from the closest edges of the two boxes
    const sc = { x: sp.x + sp.w / 2, y: sp.y + sp.h / 2 };
    const tc = { x: tp.x + tp.w / 2, y: tp.y + tp.h / 2 };
    const [sx, sy] = edgePoint(sp, sc, tc);
    const [tx, ty] = edgePoint(tp, tc, sc);

    // Edge color — check drawio style of the relationship cell
    const eid = `rel_${r.source}_${r.target}`;
    const eStyle = cellStyles.get(eid);
    const eColor = eStyle?.stroke || DEFAULTS.edge.stroke;

    // Marker at source end
    const marker =
      r.type === '*--' ? ' marker-start="url(#diamond-filled)"'
        : r.type === 'o--' ? ' marker-start="url(#diamond-open)"'
          : ' marker-end="url(#arrow-open)"';

    ln(`  <line x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}" class="edge" stroke="${eColor}"${marker}/>`);

    // Edge label
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2;
    ln(`  <text x="${mx}" y="${my - 6}" class="edge-label" fill="${eColor}">${esc(r.label)}</text>`);

    // Cardinality labels
    if (r.srcCard) {
      const lx = sx + (tx - sx) * 0.12;
      const ly = sy + (ty - sy) * 0.12;
      ln(`  <text x="${lx}" y="${ly - 6}" class="card-label" fill="${eColor}">${esc(r.srcCard)}</text>`);
    }
    if (r.tgtCard) {
      const lx = tx + (sx - tx) * 0.12;
      const ly = ty + (sy - ty) * 0.12;
      ln(`  <text x="${lx}" y="${ly - 6}" class="card-label" fill="${eColor}">${esc(r.tgtCard)}</text>`);
    }
  }

  ln('</svg>');
  return o.join('\n');
}

/**
 * Compute the intersection point on a box edge given a line from `from` to `to`.
 */
function edgePoint(box, from, to) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (dx === 0 && dy === 0) return [cx, cy];

  // Try each edge
  const hw = box.w / 2;
  const hh = box.h / 2;
  let t = Infinity;

  // Right edge
  if (dx !== 0) { const tt = hw / Math.abs(dx); if (tt < t && Math.abs(dy * tt) <= hh) t = tt; }
  // Left edge
  if (dx !== 0) { const tt = hw / Math.abs(dx); if (tt < t && Math.abs(dy * tt) <= hh) t = tt; }
  // Bottom edge
  if (dy !== 0) { const tt = hh / Math.abs(dy); if (tt < t && Math.abs(dx * tt) <= hw) t = tt; }
  // Top edge
  if (dy !== 0) { const tt = hh / Math.abs(dy); if (tt < t && Math.abs(dx * tt) <= hw) t = tt; }

  return [cx + dx * t, cy + dy * t];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main
   ═══════════════════════════════════════════════════════════════════════════ */

function main() {
  console.log(`Reading ${MD_PATH}`);
  const md = readFileSync(MD_PATH, 'utf8');
  const mermaid = extractMermaid(md);
  const { classes, rels } = parseMermaid(mermaid);

  console.log(`  Parsed ${classes.length} classes, ${rels.length} relationships`);

  const existing = loadExisting(DRAWIO_PATH);
  if (existing.size) {
    console.log(`  Loaded ${existing.size} existing cells (positions + colors)`);
  }

  const positions = computeLayout(classes, existing);
  const xml = buildXml(classes, rels, positions, existing);
  writeFileSync(DRAWIO_PATH, xml, 'utf8');

  const ent = classes.filter((c) => !c.isEnum).length;
  const enm = classes.filter((c) => c.isEnum).length;
  console.log(`Written ${DRAWIO_PATH}`);
  console.log(`  ${ent} entities, ${enm} enumerations, ${rels.length} edges`);

  // ── SVG export (pass drawio cell styles for color fidelity) ───────────
  const svg = buildSvg(classes, rels, positions, existing);
  writeFileSync(SVG_PATH, svg, 'utf8');
  console.log(`Written ${SVG_PATH}`);
}

main();
