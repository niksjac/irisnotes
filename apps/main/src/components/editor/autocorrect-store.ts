export interface AutocorrectRule {
	trigger: string;
	replacement: string;
}

/**
 * Module-level store for autocorrect rules.
 * Updated by use-autocorrect.ts when config changes.
 * Read by the autocorrect ProseMirror plugin in appendTransaction.
 *
 * Rules are kept sorted longest-trigger-first so the plugin
 * always matches the most specific trigger.
 */
let rules: AutocorrectRule[] = [];

export const autocorrectStore = {
	get(): AutocorrectRule[] {
		return rules;
	},
	set(newRules: AutocorrectRule[]) {
		// Sort longest trigger first for greedy matching
		rules = [...newRules].sort((a, b) => b.trigger.length - a.trigger.length);
	},
};
