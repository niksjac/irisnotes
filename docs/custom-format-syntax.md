# Custom Format Syntax Guide

IrisNotes supports a custom text formatting syntax that allows you to add visual styling while keeping the source text readable and portable.

## Overview

The custom format uses curly brace tags similar to BBCode or markup languages:

- Simple tags: `{bold}text{/bold}`
- Parameter tags: `{color:red}text{/color}`

## Text Formatting

### Basic Formatting

```
{bold}Bold text{/bold}
{italic}Italic text{/italic}
{strike}Strikethrough text{/strike}
{underline}Underlined text{/underline}
{code}Code/monospace text{/code}
```

### Scientific Notation

```
H{sup}2{/sup}O (water molecule)
CO{sub}2{/sub} (carbon dioxide)
```

## Colors

### Text Colors

```
{color:red}Red text{/color}
{color:green}Green text{/color}
{color:blue}Blue text{/color}
{color:yellow}Yellow text{/color}
{color:purple}Purple text{/color}
{color:cyan}Cyan text{/color}
{color:gray}Gray text{/color}
{color:black}Black text{/color}
{color:white}White text{/color}
```

### Hex Colors

```
{color:#e74c3c}Custom red{/color}
{color:#27ae60}Custom green{/color}
{color:#3498db}Custom blue{/color}
```

### Background Colors

```
{bg:yellow}Highlighted text{/bg}
{bg:red}Important warning{/bg}
{bg:green}Success message{/bg}
{bg:blue}Information note{/bg}
{bg:gray}Neutral highlight{/bg}
```

## Font Styling

### Font Sizes

```
{size:tiny}Tiny text{/size}
{size:small}Small text{/size}
{size:normal}Normal text{/size}
{size:medium}Medium text{/size}
{size:large}Large text{/size}
{size:huge}Huge text{/size}
{size:xl}Extra large{/size}
{size:xxl}Double XL{/size}
```

### Custom Pixel Sizes

```
{size:10px}10 pixel text{/size}
{size:16px}16 pixel text{/size}
{size:24px}24 pixel text{/size}
```

### Font Families

```
{font:Arial}Arial text{/font}
{font:Georgia}Georgia text{/font}
{font:Times New Roman}Times New Roman{/font}
{font:Courier New}Courier New text{/font}
{font:Helvetica}Helvetica text{/font}
{font:Verdana}Verdana text{/font}
```

## Combining Formats

You can nest and combine multiple formatting tags:

```
{color:red}{bold}Bold red text{/bold}{/color}
{bg:yellow}{italic}Italic highlighted text{/italic}{/bg}
{size:large}{color:blue}{bold}Large bold blue heading{/bold}{/color}{/size}
{font:Arial}{color:green}{bg:light-gray}Formatted paragraph{/bg}{/color}{/font}
```

## Examples

### Document Structure

```
{size:xl}{bold}Main Heading{/bold}{/size}

{size:large}{color:blue}Section Title{/color}{/size}

Regular paragraph text with {bold}important{/bold} words and {italic}emphasis{/italic}.

{bg:yellow}Important note{/bg} or {color:red}warning{/color}.
```

### Code Documentation

```
{bold}Function:{/bold} {code}calculateTotal(){/code}

{bold}Parameters:{/bold}
- {code}amount{/code}: {color:blue}Number{/color}
- {code}tax{/code}: {color:blue}Number{/color}

{bold}Returns:{/bold} {color:green}Number{/color}
```

### Scientific Notes

```
{bold}Chemical Formula:{/bold} H{sub}2{/sub}SO{sub}4{/sub}

{bold}Temperature:{/bold} 25°C (298K)

{bold}Reaction:{/bold}
2H{sub}2{/sub} + O{sub}2{/sub} → 2H{sub}2{/sub}O
```

## Best Practices

1. **Keep it readable**: The format should be readable even without rendering
2. **Use semantic markup**: Choose formatting that conveys meaning
3. **Be consistent**: Establish formatting patterns and stick to them
4. **Don't over-format**: Use formatting sparingly for maximum impact
5. **Test combinations**: Ensure nested tags work as expected

## Validation

The system validates syntax and will warn about:

- Unmatched opening/closing tags
- Unknown tag names
- Empty parameter values
- Invalid nesting patterns

## Export Compatibility

Notes in custom format can be:

- Exported as `.txt` files preserving the markup
- Converted to HTML for web display
- Parsed to plain text for search indexing
- Backed up with full fidelity

## Technical Implementation

The custom format is processed in this order:

1. Color markup (`{color:...}`)
2. Background colors (`{bg:...}`)
3. Font sizes (`{size:...}`)
4. Font families (`{font:...}`)
5. Simple formatting (`{bold}`, `{italic}`, etc.)

This ensures proper nesting and consistent rendering across different contexts.
