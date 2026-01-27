-- Development seed data for IrisNotes
-- Test data: multiple books, sections, and notes for comprehensive testing
-- Using fractional indexing (lexicographic strings) for sync-safe ordering
-- Content uses HTML format with paragraph-based structure (no headings)

-- ============================================================
-- ROOT-LEVEL NOTES (testing flexible hierarchy)
-- ============================================================

INSERT INTO items (id, type, title, content, content_plaintext, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-root-1', 'note', 'Welcome to IrisNotes', 
'<p><strong><span style="font-size: 1.5em">Welcome to IrisNotes!</span></strong></p>
<p>This is your <strong>personal note-taking</strong> companion. IrisNotes supports rich text formatting with a powerful ProseMirror-based editor.</p>
<p></p>
<p><strong><span style="font-size: 1.25em">Getting Started</span></strong></p>
<p>Here are some things you can do:</p>
<ul>
<li>Create <strong>Books</strong> to organize related notes</li>
<li>Add <strong>Sections</strong> within books for further organization</li>
<li>Write <strong>Notes</strong> anywhere - at root level, in books, or in sections</li>
</ul>
<p>Press <code>Ctrl+N</code> to create a new note, or <code>Ctrl+Shift+N</code> to choose a location.</p>
<blockquote><p>Tip: Use <code>Ctrl+P</code> for quick search by note name, or <code>Ctrl+Shift+F</code> for full-text search!</p></blockquote>',
'Welcome to IrisNotes! This is your personal note-taking companion. IrisNotes supports rich text formatting with a powerful ProseMirror-based editor. Getting Started Here are some things you can do: Create Books to organize related notes Add Sections within books for further organization Write Notes anywhere - at root level, in books, or in sections Press Ctrl+N to create a new note, or Ctrl+Shift+N to choose a location. Tip: Use Ctrl+P for quick search by note name, or Ctrl+Shift+F for full-text search!',
'html', NULL, 'a0', '{"is_pinned": true}', datetime('now'), datetime('now')),

('note-root-2', 'note', 'Quick Capture', 
'<p>This is a quick note at the root level - perfect for capturing thoughts that don''t belong to any specific book yet.</p>
<p>You can always move notes later by dragging them in the sidebar!</p>',
'This is a quick note at the root level - perfect for capturing thoughts that don''t belong to any specific book yet. You can always move notes later by dragging them in the sidebar!',
'html', NULL, 'a1', '{}', datetime('now'), datetime('now')),

('note-root-3', 'note', 'Shopping List', 
'<p><strong><span style="font-size: 1.25em">Weekly Shopping</span></strong></p>
<ul>
<li>Milk</li>
<li>Bread</li>
<li>Eggs</li>
<li>Coffee beans</li>
<li>Fresh vegetables</li>
</ul>
<p><s>Already bought: butter, cheese</s></p>',
'Weekly Shopping Milk Bread Eggs Coffee beans Fresh vegetables Already bought: butter, cheese',
'html', NULL, 'a2', '{}', datetime('now'), datetime('now'));

-- ============================================================
-- BOOKS
-- ============================================================

INSERT INTO items (id, type, title, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('book-1', 'book', 'Editor Features Demo', NULL, 'a3', '{"description": "Demonstrates all editor formatting features"}', datetime('now'), datetime('now')),
('book-2', 'book', 'Work Projects', NULL, 'a4', '{"description": "Work related projects and notes"}', datetime('now'), datetime('now')),
('book-3', 'book', 'Personal', NULL, 'a5', '{"description": "Personal notes, recipes, and travel plans"}', datetime('now'), datetime('now'));

-- ============================================================
-- SECTIONS
-- ============================================================

-- Sections in Editor Features Demo
INSERT INTO items (id, type, title, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('section-1', 'section', 'Text Formatting', 'book-1', 'a0', '{"description": "Basic and advanced text formatting"}', datetime('now'), datetime('now')),
('section-2', 'section', 'Block Elements', 'book-1', 'a1', '{"description": "Lists, quotes, and code blocks"}', datetime('now'), datetime('now')),
('section-3', 'section', 'Colors & Styling', 'book-1', 'a2', '{"description": "Text colors and highlights"}', datetime('now'), datetime('now'));

-- Sections in Work Projects
INSERT INTO items (id, type, title, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('section-4', 'section', 'Project Alpha', 'book-2', 'a0', '{"description": "Main project documentation"}', datetime('now'), datetime('now')),
('section-5', 'section', 'Project Beta', 'book-2', 'a1', '{"description": "Secondary project"}', datetime('now'), datetime('now'));

-- Sections in Personal
INSERT INTO items (id, type, title, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('section-6', 'section', 'Recipes', 'book-3', 'a0', '{"description": "Favorite recipes"}', datetime('now'), datetime('now')),
('section-7', 'section', 'Travel', 'book-3', 'a1', '{"description": "Travel plans and notes"}', datetime('now'), datetime('now'));

-- ============================================================
-- NOTES: Text Formatting Section (demonstrates inline marks)
-- ============================================================

INSERT INTO items (id, type, title, content, content_plaintext, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-1', 'note', 'Basic Text Styles', 
'<p><strong><span style="font-size: 1.5em">Basic Text Formatting</span></strong></p>
<p>IrisNotes supports all essential text formatting options:</p>
<ul>
<li><strong>Bold text</strong> - Use Ctrl+B or the toolbar</li>
<li><em>Italic text</em> - Use Ctrl+I or the toolbar</li>
<li><u>Underlined text</u> - Available in the toolbar</li>
<li><s>Strikethrough text</s> - For crossing things out</li>
<li><code>Inline code</code> - Use Ctrl+` or the toolbar</li>
</ul>
<p></p>
<p><strong><span style="font-size: 1.25em">Combining Styles</span></strong></p>
<p>You can <strong><em>combine bold and italic</em></strong>, or even <strong><u>bold and underline</u></strong>!</p>
<p>Here''s some <strong><em><u>triple-styled text</u></em></strong> for maximum emphasis.</p>',
'Basic Text Formatting IrisNotes supports all essential text formatting options: Bold text - Use Ctrl+B or the toolbar Italic text - Use Ctrl+I or the toolbar Underlined text - Available in the toolbar Strikethrough text - For crossing things out Inline code - Use Ctrl+` or the toolbar Combining Styles You can combine bold and italic, or even bold and underline! Here''s some triple-styled text for maximum emphasis.',
'html', 'section-1', 'a0', '{}', datetime('now'), datetime('now')),

('note-2', 'note', 'Text Sizes Demo', 
'<p><strong><span style="font-size: 2em">Large Title Style (2em)</span></strong></p>
<p>This demonstrates using font sizes instead of heading tags.</p>
<p></p>
<p><strong><span style="font-size: 1.5em">Section Title (1.5em)</span></strong></p>
<p>Use larger font sizes with bold for section headers.</p>
<p></p>
<p><strong><span style="font-size: 1.25em">Subsection (1.25em)</span></strong></p>
<p>Slightly larger text works great for subsections.</p>
<p></p>
<p><strong>Normal Bold</strong></p>
<p>Regular bold text for inline emphasis.</p>
<p></p>
<p><span style="font-size: 0.85em">Smaller text (0.85em) for notes and fine print.</span></p>
<p><span style="font-size: 0.7em">Even smaller (0.7em) for captions.</span></p>',
'Large Title Style (2em) This demonstrates using font sizes instead of heading tags. Section Title (1.5em) Use larger font sizes with bold for section headers. Subsection (1.25em) Slightly larger text works great for subsections. Normal Bold Regular bold text for inline emphasis. Smaller text (0.85em) for notes and fine print. Even smaller (0.7em) for captions.',
'html', 'section-1', 'a1', '{}', datetime('now'), datetime('now')),

('note-3', 'note', 'Font Sizes', 
'<p><strong><span style="font-size: 1.25em">Font Size Variations</span></strong></p>
<p>You can change the size of text using the font size dropdown:</p>
<p><span style="font-size: 0.7em">This text is smaller (0.7em)</span></p>
<p><span style="font-size: 0.85em">This text is slightly smaller (0.85em)</span></p>
<p>This is normal sized text (1em)</p>
<p><span style="font-size: 1.25em">This text is larger (1.25em)</span></p>
<p><span style="font-size: 1.5em">This text is even larger (1.5em)</span></p>
<p><span style="font-size: 2em">Big text! (2em)</span></p>
<p>Font sizes use <code>em</code> units so they scale with your base font size setting.</p>',
'Font Size Variations You can change the size of text using the font size dropdown: This text is smaller (0.7em) This text is slightly smaller (0.85em) This is normal sized text (1em) This text is larger (1.25em) This text is even larger (1.5em) Big text! (2em) Font sizes use em units so they scale with your base font size setting.',
'html', 'section-1', 'a2', '{}', datetime('now'), datetime('now')),

('note-4', 'note', 'Font Families', 
'<p><strong><span style="font-size: 1.25em">Different Fonts</span></strong></p>
<p>Mix different font families within your notes:</p>
<p><span style="font-family: Arial, Helvetica, sans-serif">This uses Arial (sans-serif)</span></p>
<p><span style="font-family: Georgia, ''Times New Roman'', serif">This uses Georgia (serif)</span></p>
<p><span style="font-family: ''Courier New'', Consolas, monospace">This uses Courier New (monospace)</span></p>
<p><span style="font-family: Inter, system-ui, sans-serif">This uses Inter font</span></p>
<p>Great for <span style="font-family: ''Courier New'', Consolas, monospace">code examples</span> or adding <span style="font-family: Georgia, ''Times New Roman'', serif">elegant quotes</span>.</p>',
'Different Fonts Mix different font families within your notes: This uses Arial (sans-serif) This uses Georgia (serif) This uses Courier New (monospace) This uses Inter font Great for code examples or adding elegant quotes.',
'html', 'section-1', 'a3', '{}', datetime('now'), datetime('now'));

-- ============================================================
-- NOTES: Block Elements Section (lists, quotes, code)
-- ============================================================

INSERT INTO items (id, type, title, content, content_plaintext, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-5', 'note', 'Lists Demo', 
'<p><strong><span style="font-size: 1.25em">Bullet Lists</span></strong></p>
<ul>
<li>First item</li>
<li>Second item with <strong>bold text</strong></li>
<li>Third item with <em>italic text</em></li>
<li>Fourth item with <code>inline code</code></li>
</ul>
<p></p>
<p><strong><span style="font-size: 1.25em">Numbered Lists</span></strong></p>
<ol>
<li>Step one: Open the app</li>
<li>Step two: Create a new note</li>
<li>Step three: Start writing!</li>
<li>Step four: Organize into books and sections</li>
</ol>
<p></p>
<p><strong><span style="font-size: 1.25em">Nested Lists</span></strong></p>
<ul>
<li>Main topic
<ul>
<li>Sub-topic A</li>
<li>Sub-topic B</li>
</ul>
</li>
<li>Another main topic
<ul>
<li>Details here</li>
</ul>
</li>
</ul>',
'Bullet Lists First item Second item with bold text Third item with italic text Fourth item with inline code Numbered Lists Step one: Open the app Step two: Create a new note Step three: Start writing! Step four: Organize into books and sections Nested Lists Main topic Sub-topic A Sub-topic B Another main topic Details here',
'html', 'section-2', 'a0', '{}', datetime('now'), datetime('now')),

('note-6', 'note', 'Blockquotes', 
'<p><strong><span style="font-size: 1.25em">Using Blockquotes</span></strong></p>
<p>Blockquotes are perfect for highlighting important information or citations:</p>
<blockquote>
<p>The best time to plant a tree was 20 years ago. The second best time is now.</p>
</blockquote>
<p>You can also use blockquotes for tips and notes:</p>
<blockquote>
<p><strong>Pro Tip:</strong> Use keyboard shortcuts to speed up your workflow. Press <code>Ctrl+Shift+.</code> to see all available shortcuts!</p>
</blockquote>
<blockquote>
<p><em>Note:</em> Blockquotes can contain <strong>formatted text</strong>, <code>code</code>, and other inline elements.</p>
</blockquote>',
'Using Blockquotes Blockquotes are perfect for highlighting important information or citations: The best time to plant a tree was 20 years ago. The second best time is now. You can also use blockquotes for tips and notes: Pro Tip: Use keyboard shortcuts to speed up your workflow. Press Ctrl+Shift+. to see all available shortcuts! Note: Blockquotes can contain formatted text, code, and other inline elements.',
'html', 'section-2', 'a1', '{}', datetime('now'), datetime('now')),

('note-7', 'note', 'Code Blocks', 
'<p><strong><span style="font-size: 1.25em">Code Blocks</span></strong></p>
<p>For longer code snippets, use code blocks:</p>
<pre data-language="javascript"><code>function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet("World"));</code></pre>
<p>Code blocks preserve whitespace and formatting, making them perfect for:</p>
<ul>
<li>Code snippets</li>
<li>Configuration files</li>
<li>Command-line examples</li>
<li>Any preformatted text</li>
</ul>
<p>Here''s another example with Python:</p>
<pre data-language="python"><code>def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print([fibonacci(i) for i in range(10)])</code></pre>',
'Code Blocks For longer code snippets, use code blocks: function greet(name) { return `Hello, ${name}!`; } console.log(greet("World")); Code blocks preserve whitespace and formatting, making them perfect for: Code snippets Configuration files Command-line examples Any preformatted text Here''s another example with Python: def fibonacci(n): if n <= 1: return n return fibonacci(n-1) + fibonacci(n-2) print([fibonacci(i) for i in range(10)])',
'html', 'section-2', 'a2', '{}', datetime('now'), datetime('now'));

-- ============================================================
-- NOTES: Colors & Styling Section
-- ============================================================

INSERT INTO items (id, type, title, content, content_plaintext, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-8', 'note', 'Text Colors', 
'<p><strong><span style="font-size: 1.25em">Colorful Text</span></strong></p>
<p>Add color to your text to make it stand out:</p>
<p><span style="color: #ef4444">Red text for warnings or important items</span></p>
<p><span style="color: #22c55e">Green text for success or positive notes</span></p>
<p><span style="color: #3b82f6">Blue text for links or references</span></p>
<p><span style="color: #8b5cf6">Purple text for special highlights</span></p>
<p><span style="color: #f97316">Orange text for caution or notes</span></p>
<p></p>
<p><strong>Combining with Other Formatting</strong></p>
<p><strong><span style="color: #ef4444">Bold red text</span></strong> for critical warnings!</p>
<p><em><span style="color: #3b82f6">Italic blue text</span></em> for subtle emphasis.</p>',
'Colorful Text Add color to your text to make it stand out: Red text for warnings or important items Green text for success or positive notes Blue text for links or references Purple text for special highlights Orange text for caution or notes Combining with Other Formatting Bold red text for critical warnings! Italic blue text for subtle emphasis.',
'html', 'section-3', 'a0', '{}', datetime('now'), datetime('now')),

('note-9', 'note', 'Highlights', 
'<p><strong><span style="font-size: 1.25em">Text Highlighting</span></strong></p>
<p>Use highlights to mark important information:</p>
<p><mark style="background-color: #fef08a">Yellow highlight - classic highlighter style</mark></p>
<p><mark style="background-color: #fde047">Bright yellow for maximum visibility</mark></p>
<p><mark style="background-color: #86efac">Green highlight for positive items</mark></p>
<p><mark style="background-color: #fca5a5">Red/pink highlight for warnings</mark></p>
<p><mark style="background-color: #a5b4fc">Blue highlight for notes and references</mark></p>
<p></p>
<p><strong>Use Cases</strong></p>
<ul>
<li>Mark <mark style="background-color: #fef08a">key terms</mark> in study notes</li>
<li>Highlight <mark style="background-color: #86efac">completed tasks</mark> in to-do lists</li>
<li>Draw attention to <mark style="background-color: #fca5a5">deadlines</mark> and important dates</li>
</ul>',
'Text Highlighting Use highlights to mark important information: Yellow highlight - classic highlighter style Bright yellow for maximum visibility Green highlight for positive items Red/pink highlight for warnings Blue highlight for notes and references Use Cases Mark key terms in study notes Highlight completed tasks in to-do lists Draw attention to deadlines and important dates',
'html', 'section-3', 'a1', '{}', datetime('now'), datetime('now')),

('note-10', 'note', 'Complete Formatting Example', 
'<p><strong><span style="font-size: 1.5em">Complete Formatting Showcase</span></strong></p>
<p>This note demonstrates <strong>all formatting features</strong> working together.</p>
<p></p>
<p><strong><span style="font-size: 1.25em">Project Summary</span></strong></p>
<p><mark style="background-color: #fef08a"><strong>Status:</strong></mark> <span style="color: #22c55e">In Progress</span></p>
<p><strong>Priority:</strong> <span style="color: #ef4444">High</span></p>
<p></p>
<p><strong>Key Features</strong></p>
<ol>
<li><strong>Rich Text Editor</strong> - Full formatting support</li>
<li><em>Fast Search</em> - FTS5-powered full-text search</li>
<li><u>Flexible Organization</u> - Books, sections, and notes</li>
</ol>
<blockquote>
<p><span style="color: #8b5cf6"><strong>Remember:</strong></span> Great notes lead to great ideas!</p>
</blockquote>
<p></p>
<p><strong>Code Example</strong></p>
<pre data-language="typescript"><code>interface Note {
  id: string;
  title: string;
  content: string;
}</code></pre>
<p><s>Old feature</s> → <span style="color: #22c55e"><strong>New improved feature!</strong></span></p>',
'Complete Formatting Showcase This note demonstrates all formatting features working together. Project Summary Status: In Progress Priority: High Key Features Rich Text Editor - Full formatting support Fast Search - FTS5-powered full-text search Flexible Organization - Books, sections, and notes Remember: Great notes lead to great ideas! Code Example interface Note { id: string; title: string; content: string; } Old feature → New improved feature!',
'html', 'section-3', 'a2', '{}', datetime('now'), datetime('now'));

-- ============================================================
-- NOTES: Work Projects
-- ============================================================

INSERT INTO items (id, type, title, content, content_plaintext, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-11', 'note', 'Alpha Requirements', 
'<p><strong><span style="font-size: 1.5em">Project Alpha Requirements</span></strong></p>
<p></p>
<p><strong><span style="font-size: 1.25em">Overview</span></strong></p>
<p>Project Alpha is a <strong>high-priority initiative</strong> to modernize our core infrastructure.</p>
<p></p>
<p><strong><span style="font-size: 1.25em">Functional Requirements</span></strong></p>
<ol>
<li><mark style="background-color: #86efac">User authentication system</mark></li>
<li>Data encryption at rest</li>
<li>Real-time sync capabilities</li>
<li>Offline mode support</li>
</ol>
<p></p>
<p><strong><span style="font-size: 1.25em">Technical Specifications</span></strong></p>
<ul>
<li><strong>Backend:</strong> Rust + SQLite</li>
<li><strong>Frontend:</strong> React + TypeScript</li>
<li><strong>Framework:</strong> Tauri v2</li>
</ul>
<blockquote><p><span style="color: #ef4444">Deadline:</span> Q2 2026</p></blockquote>',
'Project Alpha Requirements Overview Project Alpha is a high-priority initiative to modernize our core infrastructure. Functional Requirements User authentication system Data encryption at rest Real-time sync capabilities Offline mode support Technical Specifications Backend: Rust + SQLite Frontend: React + TypeScript Framework: Tauri v2 Deadline: Q2 2026',
'html', 'section-4', 'a0', '{}', datetime('now'), datetime('now')),

('note-12', 'note', 'Alpha Meeting Notes', 
'<p><strong><span style="font-size: 1.25em">Meeting: Alpha Kickoff</span></strong></p>
<p><strong>Date:</strong> January 15, 2026</p>
<p><strong>Attendees:</strong> Team Alpha</p>
<p></p>
<p><strong>Agenda</strong></p>
<ol>
<li>Project overview</li>
<li>Timeline review</li>
<li>Resource allocation</li>
<li>Risk assessment</li>
</ol>
<p></p>
<p><strong>Action Items</strong></p>
<ul>
<li><s>Set up development environment</s> - <span style="color: #22c55e">Done</span></li>
<li>Create initial wireframes - <span style="color: #f97316">In Progress</span></li>
<li>Schedule stakeholder interviews - <span style="color: #ef4444">Pending</span></li>
</ul>',
'Meeting: Alpha Kickoff Date: January 15, 2026 Attendees: Team Alpha Agenda Project overview Timeline review Resource allocation Risk assessment Action Items Set up development environment - Done Create initial wireframes - In Progress Schedule stakeholder interviews - Pending',
'html', 'section-4', 'a1', '{}', datetime('now'), datetime('now')),

('note-13', 'note', 'Beta Research', 
'<p><strong><span style="font-size: 1.25em">Project Beta Research Notes</span></strong></p>
<p>Preliminary research findings for the new feature set.</p>
<p></p>
<p><strong>Competitor Analysis</strong></p>
<ul>
<li><strong>Notion</strong> - Block-based, good for databases</li>
<li><strong>Obsidian</strong> - Markdown-focused, local-first</li>
<li><strong>OneNote</strong> - Freeform canvas, heavy</li>
</ul>
<p></p>
<p><strong>Key Differentiators</strong></p>
<blockquote><p>Our focus: <mark style="background-color: #a5b4fc">Speed, simplicity, and offline-first architecture</mark></p></blockquote>
<p>Target users: Developers and power users who value <span style="color: #22c55e">performance</span> over features.</p>',
'Project Beta Research Notes Preliminary research findings for the new feature set. Competitor Analysis Notion - Block-based, good for databases Obsidian - Markdown-focused, local-first OneNote - Freeform canvas, heavy Key Differentiators Our focus: Speed, simplicity, and offline-first architecture Target users: Developers and power users who value performance over features.',
'html', 'section-5', 'a0', '{}', datetime('now'), datetime('now'));

-- ============================================================
-- NOTES: Personal - Recipes
-- ============================================================

INSERT INTO items (id, type, title, content, content_plaintext, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-14', 'note', 'Pasta Carbonara', 
'<p><strong><span style="font-size: 1.5em">Classic Pasta Carbonara</span></strong></p>
<p><em>A creamy Italian classic without cream!</em></p>
<p></p>
<p><strong><span style="font-size: 1.25em">Ingredients</span></strong></p>
<ul>
<li>400g spaghetti</li>
<li>200g guanciale or pancetta</li>
<li>4 egg yolks + 2 whole eggs</li>
<li>100g Pecorino Romano, grated</li>
<li>Black pepper to taste</li>
</ul>
<p></p>
<p><strong><span style="font-size: 1.25em">Instructions</span></strong></p>
<ol>
<li>Cook pasta in <strong>well-salted</strong> water</li>
<li>Crisp the guanciale in a cold pan, then heat</li>
<li>Mix eggs with cheese and pepper</li>
<li><mark style="background-color: #fef08a">Off heat</mark>, combine pasta with guanciale</li>
<li>Add egg mixture, toss quickly</li>
</ol>
<blockquote><p><span style="color: #ef4444">Important:</span> Never add eggs over heat - they''ll scramble!</p></blockquote>',
'Classic Pasta Carbonara A creamy Italian classic without cream! Ingredients 400g spaghetti 200g guanciale or pancetta 4 egg yolks + 2 whole eggs 100g Pecorino Romano, grated Black pepper to taste Instructions Cook pasta in well-salted water Crisp the guanciale in a cold pan, then heat Mix eggs with cheese and pepper Off heat, combine pasta with guanciale Add egg mixture, toss quickly Important: Never add eggs over heat - they''ll scramble!',
'html', 'section-6', 'a0', '{}', datetime('now'), datetime('now')),

('note-15', 'note', 'Chocolate Cake', 
'<p><strong><span style="font-size: 1.5em">Rich Chocolate Cake</span></strong></p>
<p></p>
<p><strong><span style="font-size: 1.25em">Ingredients</span></strong></p>
<ul>
<li>2 cups flour</li>
<li>2 cups sugar</li>
<li>3/4 cup cocoa powder</li>
<li>2 eggs</li>
<li>1 cup milk</li>
<li>1/2 cup vegetable oil</li>
<li>1 cup hot water</li>
</ul>
<p></p>
<p><strong>Notes</strong></p>
<p>Bake at <strong>350°F (175°C)</strong> for 30-35 minutes.</p>
<p><span style="color: #22c55e">✓ Tested and approved!</span></p>',
'Rich Chocolate Cake Ingredients 2 cups flour 2 cups sugar 3/4 cup cocoa powder 2 eggs 1 cup milk 1/2 cup vegetable oil 1 cup hot water Notes Bake at 350°F (175°C) for 30-35 minutes. ✓ Tested and approved!',
'html', 'section-6', 'a1', '{}', datetime('now'), datetime('now'));

-- ============================================================
-- NOTES: Personal - Travel
-- ============================================================

INSERT INTO items (id, type, title, content, content_plaintext, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-16', 'note', 'Japan Trip Planning', 
'<p><strong><span style="font-size: 1.5em">Japan Trip 2026</span></strong></p>
<p><mark style="background-color: #a5b4fc"><strong>Dates:</strong> March 15-30, 2026</mark></p>
<p></p>
<p><strong><span style="font-size: 1.25em">Itinerary</span></strong></p>
<ol>
<li><strong>Tokyo</strong> (5 days) - Shibuya, Shinjuku, Akihabara</li>
<li><strong>Kyoto</strong> (4 days) - Temples, Geisha district</li>
<li><strong>Osaka</strong> (3 days) - Food tour, Dotonbori</li>
<li><strong>Hiroshima</strong> (2 days) - Peace Memorial, Miyajima</li>
</ol>
<p></p>
<p><strong><span style="font-size: 1.25em">Budget</span></strong></p>
<ul>
<li>Flights: $1,200</li>
<li>JR Pass: $400</li>
<li>Accommodation: $1,500</li>
<li>Food & Activities: $1,000</li>
</ul>
<p><span style="color: #22c55e"><strong>Total:</strong> ~$4,100</span></p>',
'Japan Trip 2026 Dates: March 15-30, 2026 Itinerary Tokyo (5 days) - Shibuya, Shinjuku, Akihabara Kyoto (4 days) - Temples, Geisha district Osaka (3 days) - Food tour, Dotonbori Hiroshima (2 days) - Peace Memorial, Miyajima Budget Flights: $1,200 JR Pass: $400 Accommodation: $1,500 Food & Activities: $1,000 Total: ~$4,100',
'html', 'section-7', 'a0', '{}', datetime('now'), datetime('now')),

('note-17', 'note', 'Packing List', 
'<p><strong><span style="font-size: 1.25em">Travel Packing List</span></strong></p>
<p></p>
<p><strong>Essentials</strong></p>
<ul>
<li><s>Passport</s> ✓</li>
<li><s>Travel insurance docs</s> ✓</li>
<li>Phone + charger</li>
<li>Power adapter (Japan: Type A/B)</li>
</ul>
<p></p>
<p><strong>Clothing</strong></p>
<ul>
<li>5x t-shirts</li>
<li>2x pants</li>
<li>Comfortable walking shoes</li>
<li>Light jacket</li>
</ul>
<p></p>
<p><strong>Tech</strong></p>
<ul>
<li>Camera</li>
<li>Portable battery</li>
<li>Headphones</li>
</ul>
<blockquote><p><span style="color: #f97316">Remember:</span> Pack light - you''ll buy stuff there!</p></blockquote>',
'Travel Packing List Essentials Passport ✓ Travel insurance docs ✓ Phone + charger Power adapter (Japan: Type A/B) Clothing 5x t-shirts 2x pants Comfortable walking shoes Light jacket Tech Camera Portable battery Headphones Remember: Pack light - you''ll buy stuff there!',
'html', 'section-7', 'a1', '{}', datetime('now'), datetime('now'));

-- ============================================================
-- Direct notes under books (not in sections)
-- ============================================================

INSERT INTO items (id, type, title, content, content_plaintext, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-18', 'note', 'Editor Features Overview', 
'<p><strong><span style="font-size: 1.25em">About This Book</span></strong></p>
<p>This book contains examples of <strong>all formatting features</strong> available in IrisNotes.</p>
<p>Browse the sections to see:</p>
<ul>
<li><strong>Text Formatting</strong> - Bold, italic, underline, and more</li>
<li><strong>Block Elements</strong> - Lists, quotes, and code blocks</li>
<li><strong>Colors & Styling</strong> - Text colors and highlights</li>
</ul>
<p>Use these notes as a reference when formatting your own content!</p>',
'About This Book This book contains examples of all formatting features available in IrisNotes. Browse the sections to see: Text Formatting - Bold, italic, underline, and more Block Elements - Lists, quotes, and code blocks Colors & Styling - Text colors and highlights Use these notes as a reference when formatting your own content!',
'html', 'book-1', 'Zz', '{}', datetime('now'), datetime('now')),

('note-19', 'note', 'Work Overview', 
'<p><strong><span style="font-size: 1.25em">Work Projects Hub</span></strong></p>
<p>This book contains notes for various work projects.</p>
<p>Current active projects:</p>
<ul>
<li><strong>Project Alpha</strong> - <span style="color: #22c55e">Active</span></li>
<li><strong>Project Beta</strong> - <span style="color: #3b82f6">Research phase</span></li>
</ul>',
'Work Projects Hub This book contains notes for various work projects. Current active projects: Project Alpha - Active Project Beta - Research phase',
'html', 'book-2', 'Zz', '{}', datetime('now'), datetime('now'));

-- ============================================================
-- TAGS (for future use)
-- ============================================================

INSERT INTO tags (id, name, color, description, created_at, updated_at) VALUES
('tag-1', 'important', '#ef4444', 'High priority items', datetime('now'), datetime('now')),
('tag-2', 'work', '#3b82f6', 'Work-related notes', datetime('now'), datetime('now')),
('tag-3', 'personal', '#22c55e', 'Personal notes', datetime('now'), datetime('now')),
('tag-4', 'idea', '#8b5cf6', 'Ideas and concepts', datetime('now'), datetime('now')),
('tag-5', 'reference', '#f97316', 'Reference material', datetime('now'), datetime('now'));
