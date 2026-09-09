// @ts-check

import {
  BlockWrapper,
  Decoration,
  EditorView,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder, StateEffect, StateField} from "@codemirror/state";

const image =
  "https://upload.wikimedia.org/wikipedia/commons/3/30/Vulpes_vulpes_ssp_fulvus.jpg";

const doc = `before

${image}

after`;

class ImageWidget extends WidgetType {
  toDOM() {
    console.count("toDOM")
    const img = document.createElement("img");
    img.src = image;
    img.style = "height: auto; width: 400px;";
    return img;
  }

  eq() {
    return true; // always eq - should never re-trigger `toDOM`
  }
}

function build(doc) {
  const decorations = new RangeSetBuilder();
  const wrappers = new RangeSetBuilder();

  const start = doc.indexOf(image);
  const end = start + image.length;

  // First line and image range are wrapped in block wrappers (doesn't repro without these)
  wrappers.add(0, doc.indexOf("\n"), BlockWrapper.create({tagName: "span"}));
  wrappers.add(start, end, BlockWrapper.create({tagName: "div"}));

  // Image range is replaced with a widget
  decorations.add(start, end, Decoration.replace({
    widget: new ImageWidget(),
  }));

  return {
    decorations: decorations.finish(),
    wrappers: wrappers.finish(),
  };
}

const rebuild = StateEffect.define();

const field = StateField.define({
  create: (state) => build(state.doc.toString()),
  update: (value, transaction) => {
    // If we uncomment this to build decorations as a synchronous (blocking) step, the bug doesn't repro
    // return build(transaction.state.doc.toString());

    if (transaction.effects.some((effect) => effect.is(rebuild))) {
      return build(transaction.state.doc.toString());
    }

    // Mapping here to make it more realistic, but the bug still repros if we just `return value` without mapping
    return transaction.docChanged
      ? {
          decorations: value.decorations.map(transaction.changes),
          wrappers: value.wrappers.map(transaction.changes),
        }
      : value;
  },
  provide: (field) => [
    EditorView.outerDecorations.from(field, (value) => value.decorations),
    EditorView.blockWrappers.from(field, (value) => value.wrappers),
  ],
});

// Asynchronously rebuild decorations (simulates a non-blocking decoration builder step). Bug only repros if this is async,
// but the timing doesn't seem particularly important - if you change it to only rebuild on a button press, it still repros.
const asyncRebuild = EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    setTimeout(() => {
      update.view.dispatch({effects: rebuild.of(null)});
    });
  }
});

new EditorView({
  doc,
  parent: document.getElementById("editor"),
  extensions: [field, asyncRebuild],
});