/**
 * B2B Cenik Header Generator
 * 
 * Generates pixel-perfect PNG headers by overlaying version and date text
 * onto base template images at original resolution.
 */

class CenikGenerator {
    constructor() {
        this.templates = [];
        this.currentTemplate = null;
        this.baseImage = null;
        this.fontsLoaded = false;
        
        // DOM Elements
        this.templateSelect = document.getElementById('template');
        this.versionInput = document.getElementById('version');
        this.validFromInput = document.getElementById('validFrom');
        this.downloadBtn = document.getElementById('download-btn');
        this.previewCanvas = document.getElementById('preview-canvas');
        this.renderCanvas = document.getElementById('render-canvas');
        this.previewPlaceholder = document.getElementById('preview-placeholder');
        this.errorMessage = document.getElementById('error-message');
        this.warningMessage = document.getElementById('warning-message');
        this.resolutionInfo = document.getElementById('resolution-info');
        
        this.previewCtx = this.previewCanvas.getContext('2d');
        this.renderCtx = this.renderCanvas.getContext('2d');
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadFonts();
            await this.loadTemplateConfig();
            this.populateTemplateDropdown();
            this.bindEvents();
        } catch (error) {
            this.showError(`Napaka pri inicializaciji: ${error.message}`);
            console.error('Init error:', error);
        }
    }
    
    async loadFonts() {
        // Wait for fonts to be loaded
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
            this.fontsLoaded = true;
        }
    }
    
    async loadTemplateConfig() {
        const response = await fetch('config/templates.json');
        if (!response.ok) {
            throw new Error('Ni mogoče naložiti konfiguracije template-ov');
        }
        const config = await response.json();
        this.templates = config.templates;
    }
    
    populateTemplateDropdown() {
        this.templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            this.templateSelect.appendChild(option);
        });
    }
    
    bindEvents() {
        this.templateSelect.addEventListener('change', () => this.onTemplateChange());
        this.versionInput.addEventListener('input', () => this.debounceRender());
        this.validFromInput.addEventListener('input', () => this.debounceRender());
        this.downloadBtn.addEventListener('click', () => this.downloadPNG());
        
        // Debounce timer
        this.renderTimeout = null;
    }
    
    debounceRender() {
        clearTimeout(this.renderTimeout);
        this.renderTimeout = setTimeout(() => this.renderPreview(), 150);
    }
    
    async onTemplateChange() {
        const templateId = this.templateSelect.value;
        
        if (!templateId) {
            this.currentTemplate = null;
            this.baseImage = null;
            this.hidePreview();
            this.updateDownloadButton();
            return;
        }
        
        this.currentTemplate = this.templates.find(t => t.id === templateId);
        
        try {
            await this.loadBaseImage();
            this.showPreview();
            this.renderPreview();
        } catch (error) {
            this.showError(`Napaka pri nalaganju template-a: ${error.message}`);
            this.hidePreview();
        }
    }
    
    loadBaseImage() {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.baseImage = img;
                
                // Set render canvas to original resolution
                this.renderCanvas.width = this.currentTemplate.width;
                this.renderCanvas.height = this.currentTemplate.height;
                
                // Update resolution info
                this.resolutionInfo.textContent = `${this.currentTemplate.width} × ${this.currentTemplate.height} px`;
                
                resolve();
            };
            img.onerror = () => {
                reject(new Error(`Base template slika ne obstaja: ${this.currentTemplate.baseImage}`));
            };
            img.src = this.currentTemplate.baseImage;
        });
    }
    
    showPreview() {
        this.previewPlaceholder.hidden = true;
        this.previewCanvas.hidden = false;
    }
    
    hidePreview() {
        this.previewPlaceholder.hidden = false;
        this.previewCanvas.hidden = true;
        this.resolutionInfo.textContent = '';
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.hidden = false;
        this.warningMessage.hidden = true;
    }
    
    showWarning(message) {
        this.warningMessage.textContent = message;
        this.warningMessage.hidden = false;
        this.errorMessage.hidden = true;
    }
    
    clearMessages() {
        this.errorMessage.hidden = true;
        this.warningMessage.hidden = true;
    }
    
    validateInputs() {
        const version = this.versionInput.value.trim();
        const validFrom = this.validFromInput.value.trim();
        
        if (!this.currentTemplate) {
            return { valid: false, error: 'Izberi template' };
        }
        
        if (!version) {
            return { valid: false, error: 'Vnesi verzijo' };
        }
        
        if (!validFrom) {
            return { valid: false, error: 'Vnesi datum veljavnosti' };
        }
        
        return { valid: true, version, validFrom };
    }
    
    measureText(ctx, text, config) {
        ctx.font = `${config.fontWeight} ${config.fontSize}px ${config.fontFamily}`;
        return ctx.measureText(text).width;
    }
    
    calculateFontSize(ctx, text, config) {
        let fontSize = config.fontSize;
        const minFontSize = config.minFontSize || config.fontSize * 0.7;
        
        ctx.font = `${config.fontWeight} ${fontSize}px ${config.fontFamily}`;
        let textWidth = ctx.measureText(text).width;
        
        // If text fits, return original size
        if (textWidth <= config.maxWidth) {
            return { fontSize, warning: false };
        }
        
        // Try shrinking font
        while (textWidth > config.maxWidth && fontSize > minFontSize) {
            fontSize -= 1;
            ctx.font = `${config.fontWeight} ${fontSize}px ${config.fontFamily}`;
            textWidth = ctx.measureText(text).width;
        }
        
        // If still doesn't fit at minimum size, return error
        if (textWidth > config.maxWidth) {
            return { fontSize: null, error: true };
        }
        
        return { fontSize, warning: true };
    }
    
    renderPreview() {
        if (!this.currentTemplate || !this.baseImage) {
            this.updateDownloadButton();
            return;
        }
        
        this.clearMessages();
        
        const version = this.versionInput.value.trim();
        const validFrom = this.validFromInput.value.trim();
        
        // Render to offscreen canvas at full resolution
        const result = this.renderToCanvas(this.renderCtx, version, validFrom);
        
        if (result.error) {
            this.showError(result.error);
            this.updateDownloadButton();
            return;
        }
        
        if (result.warning) {
            this.showWarning(result.warning);
        }
        
        // Scale for preview
        this.scalePreview();
        this.updateDownloadButton();
    }
    
    renderToCanvas(ctx, version, validFrom) {
        const template = this.currentTemplate;
        const canvas = ctx.canvas;
        
        // Clear and draw base image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(this.baseImage, 0, 0, template.width, template.height);
        
        let hasWarning = false;
        
        // Render version text
        if (version) {
            const versionText = template.version.prefix + version;
            const versionResult = this.calculateFontSize(ctx, versionText, template.version);
            
            if (versionResult.error) {
                return { error: 'Verzija je predolga. Skrajšaj besedilo.' };
            }
            
            if (versionResult.warning) {
                hasWarning = true;
            }
            
            this.drawText(ctx, versionText, template.version, versionResult.fontSize);
        }
        
        // Render validFrom text
        if (validFrom) {
            const validFromText = template.validFrom.prefix + validFrom;
            const validFromResult = this.calculateFontSize(ctx, validFromText, template.validFrom);
            
            if (validFromResult.error) {
                return { error: 'Datum veljavnosti je predolg. Skrajšaj besedilo.' };
            }
            
            if (validFromResult.warning) {
                hasWarning = true;
            }
            
            this.drawText(ctx, validFromText, template.validFrom, validFromResult.fontSize);
        }
        
        return { 
            success: true, 
            warning: hasWarning ? 'Besedilo je bilo pomanjšano, da ustreza prostoru.' : null 
        };
    }
    
    drawText(ctx, text, config, fontSize) {
        ctx.save();
        
        ctx.font = `${config.fontWeight} ${fontSize}px ${config.fontFamily}`;
        ctx.fillStyle = config.color;
        ctx.textBaseline = 'top';
        
        // Apply letter spacing if specified
        if (config.letterSpacing) {
            this.drawTextWithSpacing(ctx, text, config.x, config.y, config.letterSpacing);
        } else {
            ctx.fillText(text, config.x, config.y);
        }
        
        ctx.restore();
    }
    
    drawTextWithSpacing(ctx, text, x, y, spacing) {
        let currentX = x;
        for (const char of text) {
            ctx.fillText(char, currentX, y);
            currentX += ctx.measureText(char).width + spacing;
        }
    }
    
    scalePreview() {
        const template = this.currentTemplate;
        const container = document.querySelector('.preview-container');
        const maxWidth = container.clientWidth - 48; // padding
        const maxHeight = 600;
        
        // Calculate scale to fit container
        const scaleX = maxWidth / template.width;
        const scaleY = maxHeight / template.height;
        const scale = Math.min(scaleX, scaleY, 1); // Don't upscale
        
        const previewWidth = Math.floor(template.width * scale);
        const previewHeight = Math.floor(template.height * scale);
        
        this.previewCanvas.width = previewWidth;
        this.previewCanvas.height = previewHeight;
        
        // Draw scaled version
        this.previewCtx.drawImage(
            this.renderCanvas, 
            0, 0, template.width, template.height,
            0, 0, previewWidth, previewHeight
        );
    }
    
    updateDownloadButton() {
        const validation = this.validateInputs();
        this.downloadBtn.disabled = !validation.valid;
    }
    
    downloadPNG() {
        const validation = this.validateInputs();
        if (!validation.valid) {
            this.showError(validation.error);
            return;
        }
        
        // Ensure final render
        const result = this.renderToCanvas(this.renderCtx, validation.version, validation.validFrom);
        if (result.error) {
            this.showError(result.error);
            return;
        }
        
        // Generate filename
        const sanitizedVersion = validation.version.replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${this.currentTemplate.id}_${sanitizedVersion}.png`;
        
        // Download
        this.renderCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CenikGenerator();
});
