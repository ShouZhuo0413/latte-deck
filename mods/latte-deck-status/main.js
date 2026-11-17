import { View, div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, agents, theme, run, window, keys } from "herdr";

export default class LatteDeckStatus extends View {
  // The palette key as actually bound, not a hardcoded one; without a
  // binding the hint stays useful ("commands") instead of lying.
  hint(t) {
    const mac = window()?.platform === "macos";
    const mod = { cmd: mac ? "⌘" : "Ctrl+", ctrl: mac ? "⌃" : "Ctrl+", shift: mac ? "⇧" : "Shift+", alt: mac ? "⌥" : "Alt+", option: mac ? "⌥" : "Alt+" };
    const b = keys().find((k) => k.section === "global" && k.action === "app.palette");
    const parts = b && b.keys.endsWith("--") ? [...b.keys.slice(0, -2).split("-"), "-"] : b?.keys.split("-");
    const key = parts && parts.map((p) => mod[p.toLowerCase()] ?? p.toUpperCase()).join("");
    return key ? `${key}  commands` : "commands";
  }

  // An agent waiting on you (blocked) or finished unseen (done), as a chip that shows it.
  chip(t, a) {
    const color = a.status === "blocked" ? t.blocked : t.done;
    const word = a.status === "blocked" ? "needs you" : "done";
    return h_flex().id(`chip-${a.address}`).flex_none().h(20).px(9).rounded(10).gap(5).items_center().cursor_pointer()
      .bg(color + "1f").text_color(color).text_size(11.5).hover((s) => s.bg(color + "33"))
      .on_click(() => run("agent.focus", { terminal: a.address }))
      .child(a.status === "blocked" ? "⏸" : "✓")
      .child(`${a.space_name} › ${a.tab_name} · ${word}`);
  }

  render() {
    const t = theme();
    const space = spaces().find(s => s.active);
    const list = agents();
    const working = list.filter(a => a.status === "working").length;
    // Most urgent first (blocked before done), then most recent.
    const pending = list.filter(a => a.status === "blocked" || a.status === "done")
      .sort((a, b) => (a.status === b.status ? b.seq - a.seq : a.status === "blocked" ? -1 : 1));
    const shown = pending.slice(0, 4);
    const label = (icon, text) => h_flex().gap(6).items_center().child(svg(`mods/workspace-chrome/${icon}.svg`).size(13)).child(text);
    return h_flex().size_full().px(14).gap(16).items_center().bg(t.chrome).border_t(1).border_color(t.border).text_size(11.8).text_color(t.muted)
      .child(label(space?.machine ? "server" : "monitor", space?.machine ?? "This computer"))
      .when(Boolean(space?.branch), el => el.child(label("branch", space.branch)))
      .child(h_flex().gap(6).items_center().child(div().size(6).rounded(3).bg(t.dim)).child(`${list.length} agents`)
        .when(working > 0, el => el.child(div().child(`· ${working} working`))))
      .child(h_flex().gap(8).items_center().min_w(0)
        .children(shown.map((a) => this.chip(t, a)))
        .when(pending.length > shown.length, el => el.child(div().text_color(t.dim).child(`+${pending.length - shown.length}`))))
      .child(div().flex_1())
      .child(div().id("palette").text_color(t.dim).on_click(() => run("app.palette")).child(this.hint(t)));
  }
}
