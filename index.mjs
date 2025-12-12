import {
  BlockWrapper,
  Decoration,
  EditorView,
  keymap,
  WidgetType,
} from "@codemirror/view";
import {defaultKeymap} from "@codemirror/commands";
import {StateField, RangeSetBuilder} from "@codemirror/state";

const doc = `a widget on a line with other content will not be re-created: {charCounter}

A widget on its own line will:
{charCounter}
`;

class BlankLineWidget extends WidgetType {
  #key;
  #docSize;

  constructor(key, docSize) {
    super();
    this.#key = key.toString();
    this.#docSize = docSize;
  }

  toDOM() {
    console.warn("toDOM");
    const container = document.createElement("span");
    container.style = "color: gray; font-style: italic; font-size: small";
    container.textContent = `${this.#docSize} chars (new)`;
    container.setAttribute("data-key", this.#key);
    return container;
  }

  eq(other) {
    return other.#key === this.#key && other.#docSize === this.#docSize;
  }

  updateDOM(dom) {
    if (dom.getAttribute("data-key") !== this.#key) return false;
    dom.textContent = `${this.#docSize} chars (updated)`;
    return true;
  }
}

function buildBlankLineDecorations(state) {
  const builder = new RangeSetBuilder();

  const words = state.doc.toString().split(/\s/);

  let key = 0;
  let start = 0;
  for (const [i, word] of words.entries()) {
    if (word === "{charCounter}") {
      const decoration = Decoration.widget({
        widget: new BlankLineWidget(key++, state.doc.length),
      });
      builder.add(start, start + word.length, decoration);
    }
    start += word.length + 1;
  }

  return builder.finish();
}

const decorationsPlugin = StateField.define({
  create: buildBlankLineDecorations,
  update: (prev, tr) =>
    tr.docChanged ? buildBlankLineDecorations(tr.state) : prev,
  provide: (field) => EditorView.decorations.from(field),
});

new EditorView({
  doc,
  parent: document.getElementById("editor"),
  extensions: [keymap.of(defaultKeymap), decorationsPlugin],
});
