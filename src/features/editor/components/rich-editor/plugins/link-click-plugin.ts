import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

// State to track link click effects
interface LinkClickState {
  decorations: DecorationSet;
  activeEffect?: {
    from: number;
    to: number;
    timeout: ReturnType<typeof setTimeout>;
  } | undefined;
}

export const linkClickPlugin = new Plugin<LinkClickState>({
  state: {
    init() {
      return {
        decorations: DecorationSet.empty
      };
    },
    apply(tr, value) {
      // Check for link click metadata
      const linkClicked = tr.getMeta('linkClicked');

      if (linkClicked) {
        const { from, to } = linkClicked;

        // Clear existing effect if any
        if (value.activeEffect) {
          clearTimeout(value.activeEffect.timeout);
        }

        // Create new decoration for the clicked link
        const decoration = Decoration.inline(from, to, {
          class: 'link-clicked-effect'
        });

        // Set timeout to remove effect after 300ms
        const timeout = setTimeout(() => {
          // This will be handled by the next transaction
        }, 300);

        return {
          decorations: DecorationSet.create(tr.doc, [decoration]),
          activeEffect: { from, to, timeout }
        };
      }

      // Check for effect removal
      const removeLinkEffect = tr.getMeta('removeLinkEffect');
      if (removeLinkEffect || (value.activeEffect && Date.now() > removeLinkEffect)) {
        if (value.activeEffect) {
          clearTimeout(value.activeEffect.timeout);
        }
        return {
          decorations: DecorationSet.empty,
          activeEffect: undefined
        };
      }

      // Map decorations through the transaction
      return {
        decorations: value.decorations.map(tr.mapping, tr.doc),
        activeEffect: value.activeEffect ? {
          ...value.activeEffect,
          from: tr.mapping.map(value.activeEffect.from),
          to: tr.mapping.map(value.activeEffect.to)
        } : undefined
      };
    }
  },
  props: {
    decorations(state) {
      return this.getState(state)?.decorations;
    }
  }
});

// Helper function to trigger link click effect
export const triggerLinkClickEffect = (view: any, from: number, to: number) => {
  const tr = view.state.tr.setMeta('linkClicked', { from, to });
  view.dispatch(tr);

  // Schedule removal of the effect
  setTimeout(() => {
    const removeTr = view.state.tr.setMeta('removeLinkEffect', true);
    view.dispatch(removeTr);
  }, 300);
};