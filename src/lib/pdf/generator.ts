import { PDFDocument, PDFPage, rgb, StandardFonts, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Contract, Signature } from '@/types/contract';
import { formatDate } from '../utils/helpers';

export class PDFGenerator {
  private contract: Contract;
  private includeSignatures: boolean;

  constructor(contract: Contract, includeSignatures: boolean = true) {
    this.contract = contract;
    this.includeSignatures = includeSignatures;
  }

  async generatePDF(): Promise<Uint8Array> {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Register fontkit
    pdfDoc.registerFontkit(fontkit);

    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add metadata
    pdfDoc.setTitle(this.contract.title);
    pdfDoc.setAuthor(this.contract.createdBy);
    pdfDoc.setSubject(`契約書ID: ${this.contract.contractId}`);
    pdfDoc.setKeywords(['電子契約', '契約書', this.contract.type]);
    pdfDoc.setCreationDate(new Date(this.contract.createdAt));
    pdfDoc.setModificationDate(new Date(this.contract.updatedAt));

    // Create first page
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - 50;

    // Header
    page.drawText('電子契約書', {
      x: 50,
      y: yPosition,
      size: 24,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 40;

    // Contract ID and metadata
    page.drawText(`契約書ID: ${this.contract.contractId}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });
    yPosition -= 15;

    page.drawText(`作成日: ${formatDate(this.contract.createdAt)}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });
    yPosition -= 30;

    // Title
    page.drawText(this.contract.title, {
      x: 50,
      y: yPosition,
      size: 18,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 40;

    // Parties information
    page.drawText('契約当事者', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    for (const party of this.contract.parties) {
      const roleText = party.type === 'contractor' ? '甲' : '乙';
      page.drawText(`${roleText}: ${party.name}`, {
        x: 70,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;

      if (party.company) {
        page.drawText(`会社: ${party.company}`, {
          x: 90,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPosition -= 15;
      }

      page.drawText(`メール: ${party.email}`, {
        x: 90,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPosition -= 25;
    }

    // Contract content
    yPosition -= 20;
    page.drawText('契約内容', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    // Split content into lines and handle page breaks
    const contentLines = this.splitTextIntoLines(this.contract.content, 80);
    const lineHeight = 14;

    for (const line of contentLines) {
      if (yPosition < 100) {
        // Add new page if needed
        page = pdfDoc.addPage();
        yPosition = height - 50;
      }

      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }

    // Signatures section
    if (this.includeSignatures && this.contract.signatures.length > 0) {
      yPosition -= 40;
      
      if (yPosition < 200) {
        page = pdfDoc.addPage();
        yPosition = height - 50;
      }

      page.drawText('電子署名', {
        x: 50,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;

      for (const signature of this.contract.signatures) {
        await this.addSignature(page, signature, yPosition);
        yPosition -= 120;
      }
    }

    // Add watermark if draft
    if (this.contract.status === 'draft') {
      await this.addWatermark(pdfDoc);
    }

    // Add QR code for verification
    await this.addVerificationQR(page, width - 150, 50);

    // Footer with legal compliance info
    this.addFooter(page);

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  private splitTextIntoLines(text: string, maxCharsPerLine: number): string[] {
    const lines: string[] = [];
    const paragraphs = text.split('\n');

    for (const paragraph of paragraphs) {
      if (paragraph.length <= maxCharsPerLine) {
        lines.push(paragraph);
      } else {
        const words = paragraph.split(' ');
        let currentLine = '';

        for (const word of words) {
          if ((currentLine + word).length <= maxCharsPerLine) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        }

        if (currentLine) lines.push(currentLine);
      }
    }

    return lines;
  }

  private async addSignature(page: PDFPage, signature: Signature, yPosition: number) {
    const party = this.contract.parties.find(p => p.id === signature.partyId);
    if (!party) return;

    const helveticaFont = await page.doc.embedFont(StandardFonts.Helvetica);

    // Party name
    page.drawText(`${party.name} (${party.role})`, {
      x: 70,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Signature date
    page.drawText(`署名日時: ${formatDate(signature.signedAt, true)}`, {
      x: 70,
      y: yPosition - 20,
      size: 10,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Verification hash
    page.drawText(`検証ハッシュ: ${signature.verificationHash.substring(0, 32)}...`, {
      x: 70,
      y: yPosition - 35,
      size: 8,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // TODO: Add actual signature image if available
    if (signature.signatureImageUrl) {
      // Placeholder for signature image
      page.drawRectangle({
        x: 70,
        y: yPosition - 90,
        width: 150,
        height: 40,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });
    }
  }

  private async addWatermark(pdfDoc: PDFDocument) {
    const pages = pdfDoc.getPages();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawText('下書き', {
        x: width / 2 - 100,
        y: height / 2,
        size: 72,
        font: helveticaFont,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.3,
        rotate: degrees(45),
      });
    }
  }

  private async addVerificationQR(page: PDFPage, x: number, y: number) {
    // TODO: Generate actual QR code
    // For now, add placeholder
    page.drawRectangle({
      x,
      y,
      width: 80,
      height: 80,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    const helveticaFont = await page.doc.embedFont(StandardFonts.Helvetica);
    page.drawText('検証用QR', {
      x: x + 10,
      y: y + 35,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
  }

  private addFooter(page: PDFPage) {
    const { width } = page.getSize();
    const helveticaFont = page.doc.embedStandardFont(StandardFonts.Helvetica);

    // Legal compliance notice
    page.drawText(
      'この契約書は電子帳簿保存法及び電子署名法に準拠して作成されています',
      {
        x: 50,
        y: 30,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      }
    );

    // Page number would go here if multi-page
  }
}