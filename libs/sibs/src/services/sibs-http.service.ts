import { SibsLogService } from '@lib/audit/log/sibs-log.service';
import { ConfigUtil } from '@lib/common';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { catchError, firstValueFrom, map } from 'rxjs';
import {
  SibsApiException,
  SibsConfigurationException,
} from '../exceptions/sibs.exception';

@Injectable()
export class SibsHttpService {
  private readonly logger = new Logger(SibsHttpService.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly clientId: string;

  constructor(
    private readonly _httpService: HttpService,
    private readonly _configService: ConfigService,
    private readonly _sibsLogService: SibsLogService,
  ) {
    this.baseUrl = ConfigUtil.getRequiredConfig(
      this._configService,
      'sibs.baseUrl',
    );
    this.token = ConfigUtil.getRequiredConfig(
      this._configService,
      'sibs.token',
    );
    this.clientId = ConfigUtil.getRequiredConfig(
      this._configService,
      'sibs.clientId',
    );

    if (!this.baseUrl || !this.token || !this.clientId) {
      throw new SibsConfigurationException(
        'SIBS configuration is incomplete. Please check SIBS_BASE_URL, SIBS_TOKEN, and SIBS_CLIENT_ID',
      );
    }
  }

  private getDefaultHeaders(
    transactionSignature?: string,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-IBM-Client-Id': this.clientId,
    };

    if (transactionSignature) {
      headers['Authorization'] = `Digest ${transactionSignature}`;
    } else {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async post<T>(
    endpoint: string,
    data: any,
    transactionSignature?: string,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: AxiosRequestConfig = {
      headers: this.getDefaultHeaders(transactionSignature),
    };

    this.logger.debug(`POST ${url}`, { data, headers: config.headers });

    const sibsLog = await this._sibsLogService.create({
      request: data,
    });

    try {
      const response = await firstValueFrom(
        this._httpService.post<T>(url, data, config).pipe(
          map((response: AxiosResponse<T>) => {
            if (sibsLog?._id)
              this._sibsLogService.update(sibsLog._id, {
                response: response.data,
                isError: false,
              });
            return response.data;
          }),
          catchError(error => {
            if (sibsLog?._id)
              this._sibsLogService.update(sibsLog._id, {
                response: error.response?.data,
                isError: true,
              });
            this.handleHttpError(error);
            throw error;
          }),
        ),
      );

      this.logger.debug(`POST ${url} - Success`, { response });
      return response;
    } catch (error) {
      this.logger.error(`POST ${url} - Error`, { error });
      throw error;
    }
  }

  async get<T>(endpoint: string, transactionSignature?: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: AxiosRequestConfig = {
      headers: this.getDefaultHeaders(transactionSignature),
    };

    this.logger.debug(`GET ${url}`, { headers: config.headers });

    const sibsLog = await this._sibsLogService.create({
      request: endpoint,
    });

    try {
      const response = await firstValueFrom(
        this._httpService.get<T>(url, config).pipe(
          map((response: AxiosResponse<T>) => {
            if (sibsLog?._id)
              this._sibsLogService.update(sibsLog._id, {
                response: response.data,
                isError: false,
              });
            return response.data;
          }),
          catchError(error => {
            if (sibsLog?._id)
              this._sibsLogService.update(sibsLog._id, {
                response: error.response?.data,
                isError: true,
              });
            this.handleHttpError(error);
            throw error;
          }),
        ),
      );

      this.logger.debug(`GET ${url} - Success`, { response });
      return response;
    } catch (error) {
      this.logger.error(`GET ${url} - Error`, { error });
      throw error;
    }
  }

  private handleHttpError(error: any): void {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const message =
        data?.message || data?.statusDescription || 'SIBS API Error';
      const sibsErrorCode = data?.statusCode || data?.returnStatus?.statusCode;

      throw new SibsApiException(message, status, sibsErrorCode);
    } else if (error.request) {
      throw new SibsApiException('Network error when calling SIBS API', 503);
    } else {
      throw new SibsApiException('Unknown error when calling SIBS API', 500);
    }
  }
}
