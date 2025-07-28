import { Contract } from '@/types/contract';

// Vercel環境で動作する簡単なPDF生成
export async function generateSimplePDF(contract: Contract): Promise<Buffer> {
  try {
    // jsPDFを動的インポート
    const { jsPDF } = await import('jspdf');
    
    // A4サイズのPDFを作成
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // フォントサイズと位置の設定
    let yPosition = 20;
    const lineHeight = 7;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // タイトル
    doc.setFontSize(20);
    doc.text('Electronic Contract', margin, yPosition);
    yPosition += lineHeight * 2;
    
    // 契約ID
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Contract ID: ${contract.contractId}`, margin, yPosition);
    yPosition += lineHeight;
    
    // 作成日
    doc.text(`Created: ${new Date(contract.createdAt).toLocaleDateString()}`, margin, yPosition);
    yPosition += lineHeight * 2;
    
    // 契約タイトル
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(contract.title, margin, yPosition);
    yPosition += lineHeight * 2;
    
    // 当事者情報
    doc.setFontSize(12);
    doc.text('Contracting Parties:', margin, yPosition);
    yPosition += lineHeight;
    
    doc.setFontSize(10);
    contract.parties.forEach((party) => {
      const role = party.type === 'contractor' ? 'Party A' : 'Party B';
      doc.text(`${role}: ${party.name}`, margin + 5, yPosition);
      yPosition += lineHeight;
      
      if (party.company) {
        doc.setTextColor(100, 100, 100);
        doc.text(`Company: ${party.company}`, margin + 10, yPosition);
        yPosition += lineHeight;
      }
      
      doc.text(`Email: ${party.email}`, margin + 10, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += lineHeight * 1.5;
    });
    
    // 契約内容
    yPosition += lineHeight;
    doc.setFontSize(12);
    doc.text('Contract Details:', margin, yPosition);
    yPosition += lineHeight;
    
    // 内容を行ごとに分割
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(contract.content, pageWidth - margin * 2);
    
    lines.forEach((line: string) => {
      if (yPosition > 270) { // ページの下部に近づいたら新しいページ
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
    
    // 署名情報
    if (contract.signatures && contract.signatures.length > 0) {
      yPosition += lineHeight;
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.text('Electronic Signatures:', margin, yPosition);
      yPosition += lineHeight;
      
      doc.setFontSize(10);
      contract.signatures.forEach((signature) => {
        const party = contract.parties.find(p => p.id === signature.partyId);
        if (party) {
          doc.text(`${party.name} - Signed at: ${new Date(signature.signedAt).toLocaleString()}`, margin + 5, yPosition);
          yPosition += lineHeight;
        }
      });
    }
    
    // フッター
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('This contract is created in compliance with e-Documentation laws', margin, pageHeight - 10);
    
    // PDFを生成
    const pdfData = doc.output('arraybuffer');
    return Buffer.from(pdfData);
    
  } catch (error) {
    console.error('Simple PDF generation error:', error);
    throw error;
  }
}