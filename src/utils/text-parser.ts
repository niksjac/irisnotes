export const parseTextWithColors = (text: string): string => {
  // Convert plain text with comprehensive markup to HTML
  // Supported formats:
  // {color:red}text{/color} or {color:#e74c3c}text{/color}
  // {bold}text{/bold}
  // {italic}text{/italic}
  // {strike}text{/strike}
  // {underline}text{/underline}
  // {size:14px}text{/size} or {size:large}text{/size}
  // {font:Arial}text{/font}
  // {bg:yellow}text{/bg} or {bg:#fff3cd}text{/bg}

  const colorMap: { [key: string]: string } = {
    'red': '#e74c3c',
    'green': '#27ae60',
    'blue': '#3498db',
    'yellow': '#f39c12',
    'orange': '#f39c12',
    'purple': '#9b59b6',
    'cyan': '#1abc9c',
    'gray': '#95a5a6',
    'grey': '#95a5a6',
    'black': '#2c3e50',
    'white': '#ffffff'
  };

  const backgroundColorMap: { [key: string]: string } = {
    'yellow': '#fff3cd',
    'red': '#f8d7da',
    'green': '#d4edda',
    'blue': '#d1ecf1',
    'orange': '#ffeaa7',
    'purple': '#e1bee7',
    'cyan': '#b2dfdb',
    'gray': '#f8f9fa',
    'grey': '#f8f9fa',
    'light-gray': '#f8f9fa',
    'light-grey': '#f8f9fa'
  };

  const sizeMap: { [key: string]: string } = {
    'tiny': '10px',
    'small': '12px',
    'normal': '14px',
    'medium': '16px',
    'large': '18px',
    'huge': '24px',
    'xl': '28px',
    'xxl': '32px'
  };

  let htmlContent = text;

  // Process formatting tags in order of nesting complexity

  // 1. Color markup
  htmlContent = htmlContent.replace(
    /\{color:([^}]+)\}(.*?)\{\/color\}/g,
    (_match, colorName, content) => {
      const color = colorMap[colorName.toLowerCase()] || colorName;
      return `<span style="color: ${color}">${content}</span>`;
    }
  );

  // 2. Background color markup
  htmlContent = htmlContent.replace(
    /\{bg:([^}]+)\}(.*?)\{\/bg\}/g,
    (_match, colorName, content) => {
      const backgroundColor = backgroundColorMap[colorName.toLowerCase()] || colorName;
      return `<span style="background-color: ${backgroundColor}; padding: 2px 4px; border-radius: 3px">${content}</span>`;
    }
  );

  // 3. Font size markup
  htmlContent = htmlContent.replace(
    /\{size:([^}]+)\}(.*?)\{\/size\}/g,
    (_match, sizeName, content) => {
      const fontSize = sizeMap[sizeName.toLowerCase()] || sizeName;
      return `<span style="font-size: ${fontSize}">${content}</span>`;
    }
  );

  // 4. Font family markup
  htmlContent = htmlContent.replace(
    /\{font:([^}]+)\}(.*?)\{\/font\}/g,
    (_match, fontName, content) => {
      // Clean the font name and ensure it's properly quoted
      const cleanFontName = fontName.trim().replace(/['"]/g, '');
      return `<span style="font-family: '${cleanFontName}', sans-serif">${content}</span>`;
    }
  );

  // 5. Simple formatting tags
  // Bold
  htmlContent = htmlContent.replace(
    /\{bold\}(.*?)\{\/bold\}/g,
    '<strong>$1</strong>'
  );

  // Italic
  htmlContent = htmlContent.replace(
    /\{italic\}(.*?)\{\/italic\}/g,
    '<em>$1</em>'
  );

  // Strikethrough
  htmlContent = htmlContent.replace(
    /\{strike\}(.*?)\{\/strike\}/g,
    '<del>$1</del>'
  );

  // Underline
  htmlContent = htmlContent.replace(
    /\{underline\}(.*?)\{\/underline\}/g,
    '<u>$1</u>'
  );

  // Code/monospace
  htmlContent = htmlContent.replace(
    /\{code\}(.*?)\{\/code\}/g,
    '<code>$1</code>'
  );

  // Superscript
  htmlContent = htmlContent.replace(
    /\{sup\}(.*?)\{\/sup\}/g,
    '<sup>$1</sup>'
  );

  // Subscript
  htmlContent = htmlContent.replace(
    /\{sub\}(.*?)\{\/sub\}/g,
    '<sub>$1</sub>'
  );

  // Convert line breaks to paragraphs
  const paragraphs = htmlContent.split('\n')
    .map(line => line.trim() === '' ? '<p></p>' : `<p>${line}</p>`)
    .join('');

  return paragraphs || '<p></p>';
};

// Convert HTML back to custom format
export const serializeToCustomFormat = (html: string): string => {
  const colorMap: { [key: string]: string } = {
    '#e74c3c': 'red',
    '#27ae60': 'green',
    '#3498db': 'blue',
    '#f39c12': 'yellow',
    '#9b59b6': 'purple',
    '#1abc9c': 'cyan',
    '#95a5a6': 'gray',
    '#2c3e50': 'black',
    '#ffffff': 'white'
  };

  const backgroundColorMap: { [key: string]: string } = {
    '#fff3cd': 'yellow',
    '#f8d7da': 'red',
    '#d4edda': 'green',
    '#d1ecf1': 'blue',
    '#ffeaa7': 'orange',
    '#e1bee7': 'purple',
    '#b2dfdb': 'cyan',
    '#f8f9fa': 'gray'
  };

  const sizeMap: { [key: string]: string } = {
    '10px': 'tiny',
    '12px': 'small',
    '14px': 'normal',
    '16px': 'medium',
    '18px': 'large',
    '24px': 'huge',
    '28px': 'xl',
    '32px': 'xxl'
  };

  // Remove HTML structure and convert back to custom format
  let customText = html
    // Convert colored spans back to custom format
    .replace(/<span style="color:\s*([^"]+)"[^>]*>(.*?)<\/span>/g, (match, color, content) => {
      const colorKey = colorMap[color.trim()] || color.trim();
      return `{color:${colorKey}}${content}{/color}`;
    })
    // Convert background colored spans back to custom format
    .replace(/<span style="background-color:\s*([^;]+);[^"]*"[^>]*>(.*?)<\/span>/g, (match, backgroundColor, content) => {
      const bgColorKey = backgroundColorMap[backgroundColor.trim()] || backgroundColor.trim();
      return `{bg:${bgColorKey}}${content}{/bg}`;
    })
    // Convert font size spans back to custom format
    .replace(/<span style="font-size:\s*([^"]+)"[^>]*>(.*?)<\/span>/g, (match, fontSize, content) => {
      const sizeKey = sizeMap[fontSize.trim()] || fontSize.trim();
      return `{size:${sizeKey}}${content}{/size}`;
    })
    // Convert font family spans back to custom format
    .replace(/<span style="font-family:\s*'([^']+)'[^"]*"[^>]*>(.*?)<\/span>/g, (match, fontFamily, content) => {
      return `{font:${fontFamily}}${content}{/font}`;
    })
    // Convert simple formatting tags
    .replace(/<strong>(.*?)<\/strong>/g, '{bold}$1{/bold}')
    .replace(/<b>(.*?)<\/b>/g, '{bold}$1{/bold}')
    .replace(/<em>(.*?)<\/em>/g, '{italic}$1{/italic}')
    .replace(/<i>(.*?)<\/i>/g, '{italic}$1{/italic}')
    .replace(/<del>(.*?)<\/del>/g, '{strike}$1{/strike}')
    .replace(/<s>(.*?)<\/s>/g, '{strike}$1{/strike}')
    .replace(/<u>(.*?)<\/u>/g, '{underline}$1{/underline}')
    .replace(/<code>(.*?)<\/code>/g, '{code}$1{/code}')
    .replace(/<sup>(.*?)<\/sup>/g, '{sup}$1{/sup}')
    .replace(/<sub>(.*?)<\/sub>/g, '{sub}$1{/sub}')
    // Remove paragraph tags and convert to line breaks
    .replace(/<\/p><p>/g, '\n')
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '')
    // Remove other HTML tags but keep content
    .replace(/<[^>]+>/g, '')
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return customText;
};

// Extract plain text from custom format for search indexing
export const extractPlainText = (customText: string): string => {
  return customText
    // Remove all markup tags
    .replace(/\{[^}]*\}(.*?)\{\/[^}]*\}/g, '$1')
    .replace(/\{[^}]*\}/g, '')
    .replace(/\{\/[^}]*\}/g, '')
    // Clean up any remaining markup
    .replace(/\{[^}]*\}/g, '')
    .trim();
};

// Parse custom format and extract metadata
export const parseCustomFormatMetadata = (text: string): {
  plainText: string;
  colors: string[];
  backgrounds: string[];
  fonts: string[];
  sizes: string[];
  formatting: string[];
  wordCount: number;
  characterCount: number;
} => {
  const plainText = extractPlainText(text);

  // Extract colors
  const colors = [...new Set(text.match(/\{color:([^}]+)\}/g)?.map(match =>
    match.replace(/\{color:([^}]+)\}/, '$1')
  ) || [])];

  // Extract background colors
  const backgrounds = [...new Set(text.match(/\{bg:([^}]+)\}/g)?.map(match =>
    match.replace(/\{bg:([^}]+)\}/, '$1')
  ) || [])];

  // Extract fonts
  const fonts = [...new Set(text.match(/\{font:([^}]+)\}/g)?.map(match =>
    match.replace(/\{font:([^}]+)\}/, '$1')
  ) || [])];

  // Extract sizes
  const sizes = [...new Set(text.match(/\{size:([^}]+)\}/g)?.map(match =>
    match.replace(/\{size:([^}]+)\}/, '$1')
  ) || [])];

  // Extract formatting types
  const formattingTags = ['bold', 'italic', 'strike', 'underline', 'code', 'sup', 'sub'];
  const formatting = formattingTags.filter(tag =>
    text.includes(`{${tag}}`) && text.includes(`{/${tag}}`)
  );

  const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
  const characterCount = plainText.length;

  return {
    plainText,
    colors,
    backgrounds,
    fonts,
    sizes,
    formatting,
    wordCount,
    characterCount
  };
};

// Validate custom format syntax
export const validateCustomFormat = (text: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Define all supported tags
  const supportedTags = [
    'color', 'bg', 'size', 'font', 'bold', 'italic', 'strike',
    'underline', 'code', 'sup', 'sub'
  ];

  // Check for unmatched tags
  for (const tag of supportedTags) {
    const openPattern = tag.includes(':') ?
      new RegExp(`\\{${tag}:[^}]+\\}`, 'g') :
      new RegExp(`\\{${tag}\\}`, 'g');
    const closePattern = new RegExp(`\\{\\/${tag}\\}`, 'g');

    const openTags = text.match(openPattern) || [];
    const closeTags = text.match(closePattern) || [];

    if (openTags.length !== closeTags.length) {
      errors.push(`Unmatched ${tag} tags: ${openTags.length} opening tags, ${closeTags.length} closing tags`);
    }
  }

  // Check for invalid tag names
  const allTags = text.match(/\{[^}]+\}/g) || [];
  for (const tag of allTags) {
    const tagName = tag.replace(/\{([^}:]+).*\}/, '$1');
    const closeTagName = tag.replace(/\{\/([^}]+)\}/, '$1');

    if (tag.startsWith('{/')) {
      // Closing tag
      if (!supportedTags.includes(closeTagName)) {
        errors.push(`Unknown closing tag: ${tag}`);
      }
    } else {
      // Opening tag
      const baseName = tagName.split(':')[0];
      if (!supportedTags.includes(baseName)) {
        errors.push(`Unknown tag: ${tag}`);
      }
    }
  }

  // Check for empty parameter values
  const parameterTags = text.match(/\{(color|bg|size|font):[^}]*\}/g) || [];
  for (const tag of parameterTags) {
    const value = tag.replace(/\{[^:]+:([^}]*)\}/, '$1');
    if (!value || value.trim() === '') {
      errors.push(`Empty parameter value in tag: ${tag}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to normalize color values
export const normalizeColor = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    'red': '#e74c3c',
    'green': '#27ae60',
    'blue': '#3498db',
    'yellow': '#f39c12',
    'orange': '#f39c12',
    'purple': '#9b59b6',
    'cyan': '#1abc9c',
    'gray': '#95a5a6',
    'grey': '#95a5a6',
    'black': '#2c3e50',
    'white': '#ffffff'
  };

  const normalized = color.toLowerCase().trim();
  return colorMap[normalized] || color;
};

// Get all available formatting options
export const getAvailableFormattingOptions = () => ({
  colors: [
    'red', 'green', 'blue', 'yellow', 'orange', 'purple',
    'cyan', 'gray', 'black', 'white'
  ],
  backgroundColors: [
    'yellow', 'red', 'green', 'blue', 'orange', 'purple',
    'cyan', 'gray', 'light-gray'
  ],
  sizes: [
    'tiny', 'small', 'normal', 'medium', 'large', 'huge', 'xl', 'xxl'
  ],
  fonts: [
    'Arial', 'Georgia', 'Times New Roman', 'Courier New',
    'Helvetica', 'Verdana', 'Trebuchet MS', 'Comic Sans MS'
  ],
  formatting: [
    'bold', 'italic', 'strike', 'underline', 'code', 'sup', 'sub'
  ]
});