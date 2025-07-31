import { Schema } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { colorMark } from './plugins/color-plugin';
import {
	backgroundColorMark,
	fontFamilyMark,
	fontSizeMark,
	strikethroughMark,
	subscriptMark,
	superscriptMark,
	underlineMark,
} from './plugins/formatting-marks';

// Create extended schema with lists and all formatting marks
export const editorSchema = new Schema({
	nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
	marks: schema.spec.marks
		.addToEnd('color', colorMark)
		.addToEnd('backgroundColor', backgroundColorMark)
		.addToEnd('fontSize', fontSizeMark)
		.addToEnd('fontFamily', fontFamilyMark)
		.addToEnd('superscript', superscriptMark)
		.addToEnd('subscript', subscriptMark)
		.addToEnd('underline', underlineMark)
		.addToEnd('strikethrough', strikethroughMark),
});
