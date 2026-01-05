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

const doc = `preceding content

fox
fox
fox

intermediate content

fox
fox
fox

succeeding content`;

class FoxWidget extends WidgetType {
  toDOM() {
    const img = document.createElement("img");
    img.src = foxImage;
    img.style = "height: auto; width: 200px;";
    return img;
  }

  eq(other) {
    return true;
  }

  ignoreEvent() {
    return false;
  }
}

/** Replaces each repeating sequence of the word 'fox' with a widget, possibly spanning multiple lines. */
function buildFoxDecorations(doc) {
  const builder = new RangeSetBuilder();

  const words = doc.split(/\s/);

  let start = 0;
  let foxRangeStart = null;
  for (const word of words) {
    if (word === "fox") {
      foxRangeStart ??= start;
    } else if (foxRangeStart !== null) {
      const decoration = Decoration.replace({
        widget: new FoxWidget(),
        block: true
      });
      builder.add(foxRangeStart, start - 1, decoration);
      foxRangeStart = null;
    }

    start += word.length + 1;
  }

  // doesn't handle words at end of document but that's not important for the demo

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
