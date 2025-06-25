export const parseTextWithColors = (text: string): string => {
  // Convert plain text with color markup to HTML
  // Format: {color:red}text{/color} or {color:#e74c3c}text{/color}
  const colorMap: { [key: string]: string } = {
    'red': '#e74c3c',
    'green': '#27ae60',
    'blue': '#3498db',
    'yellow': '#f39c12',
    'orange': '#f39c12',
    'purple': '#9b59b6',
    'cyan': '#1abc9c',
    'gray': '#95a5a6',
    'grey': '#95a5a6'
  };

  // Replace color markup with HTML spans
  let htmlContent = text.replace(
    /\{color:([^}]+)\}(.*?)\{\/color\}/g,
    (_match, colorName, content) => {
      const color = colorMap[colorName.toLowerCase()] || colorName;
      return `<span style="color: ${color}">${content}</span>`;
    }
  );

  // Convert line breaks to paragraphs
  const paragraphs = htmlContent.split('\n')
    .map(line => line.trim() === '' ? '<p></p>' : `<p>${line}</p>`)
    .join('');

  return paragraphs || '<p></p>';
};