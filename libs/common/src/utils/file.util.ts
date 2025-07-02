import { BadRequestException } from "@nestjs/common";
import * as crypto from "crypto";
import * as path from "path";

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  minDimensions?: { width: number; height: number };
  maxDimensions?: { width: number; height: number };
}

export interface ProcessedFile {
  originalName: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  extension: string;
  hash: string;
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  filename?: string;
  path?: string;
}

export class FileUtil {
  /**
   * Validate uploaded file
   */
  static validateFile(file: MulterFile, options: FileValidationOptions = {}): void {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedMimeTypes = [],
      allowedExtensions = [],
    } = options;

    // Check file size
    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds limit of ${this.formatFileSize(maxSize)}`);
    }

    // Check MIME type
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(", ")}`,
      );
    }

    // Check file extension
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        `File extension ${extension} is not allowed. Allowed extensions: ${allowedExtensions.join(", ")}`,
      );
    }
  }

  /**
   * Generate a unique filename
   */
  static generateUniqueFilename(originalName: string): string {
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString("hex");

    return `${baseName}_${timestamp}_${random}${extension}`;
  }

  /**
   * Generate file hash for deduplication
   */
  static generateFileHash(buffer: Buffer): string {
    return crypto.createHash("md5").update(buffer).digest("hex");
  }

  /**
   * Process uploaded file
   */
  static processFile(
    file: MulterFile,
    uploadPath: string,
    options?: FileValidationOptions,
  ): ProcessedFile {
    // Validate file
    if (options) {
      this.validateFile(file, options);
    }

    const filename = this.generateUniqueFilename(file.originalname);
    const filePath = path.join(uploadPath, filename);
    const extension = path.extname(file.originalname).toLowerCase();
    const hash = this.generateFileHash(file.buffer);

    return {
      originalName: file.originalname,
      filename,
      path: filePath,
      mimetype: file.mimetype,
      size: file.size,
      extension,
      hash,
    };
  }

  /**
   * Format file size to human readable format
   */
  static formatFileSize(bytes: number): string {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Bytes";

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }

  /**
   * Get file extension from MIME type
   */
  static getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
      "application/pdf": ".pdf",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
      "application/vnd.ms-powerpoint": ".ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
      "text/plain": ".txt",
      "text/csv": ".csv",
      "application/json": ".json",
      "application/xml": ".xml",
      "application/zip": ".zip",
      "application/x-rar-compressed": ".rar",
      "application/x-7z-compressed": ".7z",
    };

    return mimeToExt[mimeType] || "";
  }

  /**
   * Check if file is an image
   */
  static isImage(mimeType: string): boolean {
    return mimeType.startsWith("image/");
  }

  /**
   * Check if file is a document
   */
  static isDocument(mimeType: string): boolean {
    const documentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
    ];

    return documentTypes.includes(mimeType);
  }

  /**
   * Check if file is an archive
   */
  static isArchive(mimeType: string): boolean {
    const archiveTypes = [
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      "application/x-tar",
      "application/gzip",
    ];

    return archiveTypes.includes(mimeType);
  }

  /**
   * Generate safe filename by removing unsafe characters
   */
  static sanitizeFilename(filename: string): string {
    // Remove or replace unsafe characters
    return filename
      .replace(/[<>:"/\\|?*]/g, "_") // Replace unsafe chars with underscore
      .replace(/\s+/g, "_") // Replace spaces with underscore
      .replace(/_{2,}/g, "_") // Replace multiple underscores with single
      .replace(/^_|_$/g, "") // Remove leading/trailing underscores
      .toLowerCase();
  }

  /**
   * Create file upload configuration for common file types
   */
  static getFileValidationConfig(type: "image" | "document" | "any"): FileValidationOptions {
    switch (type) {
      case "image":
        return {
          maxSize: 5 * 1024 * 1024, // 5MB
          allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
          allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
        };

      case "document":
        return {
          maxSize: 10 * 1024 * 1024, // 10MB
          allowedMimeTypes: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
            "text/csv",
          ],
          allowedExtensions: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv"],
        };

      default:
        return {
          maxSize: 10 * 1024 * 1024, // 10MB
        };
    }
  }
}
