import {
  BlockWrapper,
  Decoration,
  EditorView,
  keymap,
  WidgetType,
} from "@codemirror/view";
import {defaultKeymap} from "@codemirror/commands";
import {StateField, RangeSetBuilder} from "@codemirror/state";

const foxImage =
  "https://upload.wikimedia.org/wikipedia/commons/3/30/Vulpes_vulpes_ssp_fulvus.jpg";

const doc = `the quick brown
fox
jumps over the lazy dog`;

class FoxWidget extends WidgetType {
  toDOM() {
    const img = document.createElement("img");
    img.src = foxImage;
    img.style = "height: auto; width: 400px;";
    return img;
  }

  eq(other) {
    return true;
  }

  ignoreEvent() {
    return false;
  }
}

function buildFoxDecorations(doc) {
  const builder = new RangeSetBuilder();

  const words = doc.split(/\s/);

  let start = 0;
  for (const word of words) {
    if (word === "fox") {
      const decoration = Decoration.widget({
        widget: new FoxWidget(),
      });
      decoration.startSide = 1;
      builder.add(start, start + word.length, decoration);
    }
    start += word.length + 1;
  }

  return builder.finish();
}

const decorationsPlugin = StateField.define({
  create: (state) => buildFoxDecorations(state.doc.toString()),
  update: (prev, tr) =>
    tr.docChanged ? buildFoxDecorations(tr.state.doc.toString()) : prev,
  provide: (field) => EditorView.outerDecorations.from(field),
});

new EditorView({
  doc,
  parent: document.getElementById("editor"),
  extensions: [keymap.of(defaultKeymap), decorationsPlugin],
});
