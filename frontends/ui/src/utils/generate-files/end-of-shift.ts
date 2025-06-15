import { Color, layoutMultilineText, PDFDocument, PDFPageDrawTextOptions, rgb, RGB, StandardFonts, TextAlignment } from 'pdf-lib';

function convertColorToRgb(color: string) {
  // Default to black
  if (!color) return rgb(0, 0, 0);
  
  // Handle named colors
  const colorMap: Record<string, number[]> = {
    black: [0, 0, 0],
    white: [1, 1, 1],
    red: [1, 0, 0],
    green: [0, 1, 0],
    blue: [0, 0, 1],
    yellow: [1, 1, 0],
    cyan: [0, 1, 1],
    magenta: [1, 0, 1],
    gray: [0.5, 0.5, 0.5]
  };
  
  // Check if it's a named color
  if (colorMap[color.toLowerCase()]) {
    const [r, g, b] = colorMap[color.toLowerCase()];
    return rgb(r, g, b);
  }
  
  // Check if it's a hex color
  if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
    let r;
    let g;
    let b;
    
    if (color.length === 7) {
      // #RRGGBB format
      r = parseInt(color.substring(1, 3), 16) / 255;
      g = parseInt(color.substring(3, 5), 16) / 255;
      b = parseInt(color.substring(5, 7), 16) / 255;
    } else {
      // #RGB format
      r = parseInt(color.substring(1, 2) + color.substring(1, 2), 16) / 255;
      g = parseInt(color.substring(2, 3) + color.substring(2, 3), 16) / 255;
      b = parseInt(color.substring(3, 4) + color.substring(3, 4), 16) / 255;
    }
    
    return rgb(r, g, b);
  }
  
  // Return default if unable to parse
  return rgb(0, 0, 0);
}

export const generateFilledPDF = async ({
  data,
  pdfPath,
  openTab = false,
}: {
  pdfPath: string;
  data: Record<string, any>;
  openTab?: boolean;
}) => {
  
  // Default options
  const defaultOptions = {
    useOriginalPdf: true,
    debug: false,
    font: null, // Use default font
    fontSize: null, // Use size from tabs.json
    textColor: null // Use color from tabs.json
  };
  
  // Merge options
  const mergedOptions = { ...defaultOptions };
  
  // Load PDF document
  const stage = /dev-/.test(process.env.REACT_APP_APOLLO_API!) ? 'dev' : 'prod';
  const url = `https://caleo-assets-${stage}.s3.us-west-2.amazonaws.com/${pdfPath}/template.pdf`;
  const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  // Get the first page (or the appropriate page if you need a specific one)
  const pages = pdfDoc.getPages();
  const page = pages[0];
  
  // Load tabs data
  const tabURL = `https://caleo-assets-${stage}.s3.us-west-2.amazonaws.com/${pdfPath}/tabs.json`;
  const tabsData: Record<string, any>[] = await fetch(tabURL).then(res => res.json());
  
  // Draw text at positions defined in tabs.json
  tabsData.forEach(tab => {
    if (tab.tabLabel in data) {
      // Get the field data
      const fieldValue = data[tab.tabLabel] || '';
      
      // Skip empty fields
      if (!fieldValue && !mergedOptions.debug) {
        return;
      }
      
      // Convert coordinates (PDF uses bottom-left as origin)
      let xPosition = parseInt(tab.xPosition, 10) || 50;
      if (parseInt(tab.xPosition, 10)) {
        xPosition += 5;
      }
      const x = xPosition;
      const pageHeight = page.getHeight();
      let yPosition = parseInt(tab.yPosition, 10) || 100;
      if (parseInt(tab.yPosition, 10)) {
        yPosition += 15;
      }
      const y = pageHeight - yPosition; // Convert from top-left to bottom-left origin
      
      // Get text properties
      let fontSize: number | null = mergedOptions.fontSize; // eslint-disable-line prefer-destructuring
      if (!fontSize && tab.fontSize) {
        fontSize = parseInt(tab.fontSize.replace('size', ''), 10);
      }
      fontSize = fontSize || 9; // Default font size
      
      // If in debug mode, show rectangle around text position
      if (mergedOptions.debug) {
        page.drawRectangle({
          x,
          y: y - fontSize,
          width: parseInt(tab.width, 10) || 100,
          height: parseInt(tab.height, 10) || 15,
          borderColor: { red: 1, green: 0, blue: 0 } as Color,
          borderWidth: 1,
          opacity: 0.3
        });
      }
      
      // Process text color if available
      let textColor: RGB | null = mergedOptions.textColor; // eslint-disable-line prefer-destructuring
      if (!textColor && tab.fontColor) {
        // Convert color name or hex to RGB values
        textColor = convertColorToRgb(tab.fontColor);
      }
      
      // Draw the text directly on the page
      const drawOptions: PDFPageDrawTextOptions = {
        x,
        y,
        size: fontSize,
        lineHeight: 17,
        maxWidth: parseInt(tab.width, 10) || 100,
      };
      
      // Only add color if it's defined (pdf-lib is strict about the color format)
      if (textColor) {
        drawOptions.color = textColor;
      }
  
      if (tab.tabLabel === 'automaticDetails') {
        // Use layoutMultilineText for wrapping text in automatic details
        const width = parseInt(tab.width, 10) || 100;
        const fs = drawOptions.size;
        
        // Calculate line height based on font size with some padding
        const lineHeight = 18;
        
        // PDF-lib requires a font for layoutMultilineText
        // Let's use the standard font from the PDF document
        const font = pdfDoc.embedStandardFont(StandardFonts.Helvetica);
        
        // Layout the text to fit within specified width
        const lines = layoutMultilineText(fieldValue, {
          alignment: TextAlignment.Left,
          fontSize: fs,
          font, // Standard font is required for layoutMultilineText
          bounds: {
            width,
          } as any,
        });
        
        // Draw each line of text
        let currentY = y;
        lines.lines.forEach((line) => {
          page.drawText(`${line.text}`, {
            ...drawOptions,
            y: currentY,
            maxWidth: width
          });
          // Move to next line
          currentY -= lineHeight;
        });
      } else {
        page.drawText(`${fieldValue}`, drawOptions);
      }
      
    }
  });
  
  // Open PDF in new tab
  if (openTab) {
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const urlBlob = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlBlob;
    a.target = '_blank';
    a.download = 'filled_template.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(urlBlob);
  }
  return pdfDoc;
};
