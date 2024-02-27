import { Controller, Post, UploadedFiles, Res, HttpStatus, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as JSZip from 'jszip';
import * as fs from 'fs';
import { Response } from 'express';

@Controller()
export class AppController {
  @Post('convert')
  @UseInterceptors(FilesInterceptor('pdfFiles', 10, {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${file.originalname}`);
      }
    })
  }))
  async convert(@UploadedFiles() pdfFiles: Express.Multer.File[], @Res() res: Response): Promise<void> {
    try {
      if (!pdfFiles || pdfFiles.length === 0) {
        res.status(HttpStatus.BAD_REQUEST).json({ error: "No files uploaded" });
        return;
      }

      const zip = new JSZip();

      for (let index = 0; index < pdfFiles.length; index++) {
        const file = pdfFiles[index];
        const pdfBuffer = fs.readFileSync(file.path);
        zip.file(file.originalname, pdfBuffer);
      }

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

     
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=converted.zip");

      res.send(zipBuffer);
    } catch (error) {
      console.error("Error converting PDFs to ZIP:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }
}
