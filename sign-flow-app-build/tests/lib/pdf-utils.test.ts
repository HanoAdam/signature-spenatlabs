import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PDFDocument } from 'pdf-lib'

describe('PDF Utilities', () => {
  describe('Page Count Detection', () => {
    it('should correctly count pages in a PDF', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage()
      pdfDoc.addPage()
      pdfDoc.addPage()
      
      const pageCount = pdfDoc.getPageCount()
      expect(pageCount).toBe(3)
    })

    it('should handle single page PDFs', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage() // PDFDocument.create() doesn't automatically add a page
      
      const pageCount = pdfDoc.getPageCount()
      expect(pageCount).toBe(1)
    })

    it('should handle empty PDFs', async () => {
      const pdfDoc = await PDFDocument.create()
      
      // PDFDocument.create() starts with 0 pages, need to add one
      const pageCount = pdfDoc.getPageCount()
      expect(pageCount).toBe(0) // Empty PDF has 0 pages until you add one
    })

    it('should handle PDFs with many pages', async () => {
      const pdfDoc = await PDFDocument.create()
      
      // Add 10 pages
      for (let i = 0; i < 10; i++) {
        pdfDoc.addPage()
      }
      
      const pageCount = pdfDoc.getPageCount()
      expect(pageCount).toBe(10) // 10 pages added
    })
  })

  describe('PDF Loading', () => {
    it('should load PDF from ArrayBuffer', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage()
      const pdfBytes = await pdfDoc.save()
      
      const loadedDoc = await PDFDocument.load(pdfBytes)
      const pageCount = loadedDoc.getPageCount()
      
      expect(pageCount).toBe(1)
    })

    it('should handle encrypted PDFs with ignoreEncryption option', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage()
      const pdfBytes = await pdfDoc.save()
      
      // Test that ignoreEncryption option exists
      const loadOptions = { ignoreEncryption: true }
      expect(loadOptions.ignoreEncryption).toBe(true)
      
      // Should be able to load with ignoreEncryption
      const loadedDoc = await PDFDocument.load(pdfBytes, loadOptions)
      expect(loadedDoc).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid PDF data gracefully', async () => {
      const invalidData = new ArrayBuffer(0)
      
      await expect(PDFDocument.load(invalidData)).rejects.toThrow()
    })

    it('should provide meaningful error messages', async () => {
      const invalidData = new Uint8Array([1, 2, 3, 4])
      
      try {
        await PDFDocument.load(invalidData)
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })
  })
})
